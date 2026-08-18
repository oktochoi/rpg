import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { applyEvents } from '../../core/reducer';
import { ENCOUNTER_ID } from '../../combat/encounters/encounter-definitions';
import { flagForClearedEncounter, canonicalEncounterId } from '../combat/encounters/encounter-progress';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from '../../quests/quest-definitions';
import { QUEST_STATUS } from '../../quests/quest-types';
import { CHAPTER_ID } from '../../story/chapters/chapter-types';
import { canCompleteChapter, eventsForChapterComplete } from '../../story/chapters/chapter-rules';
import { eventsForCombatRewards, eventsForQuestRewards, questExpAmount } from '../../economy/reward-resolver';
import { WORLD_FLAG } from '../../world/locations/location-definitions';
import { EXP_REWARD, LEVEL_CAP, LEVEL_GROWTH, expRequiredForLevel } from './level-config';
import type { ExpSourceKind } from './progression-types';

function growthFor(classId: string) {
  if (classId in LEVEL_GROWTH) {
    return LEVEL_GROWTH[classId as keyof typeof LEVEL_GROWTH];
  }
  return LEVEL_GROWTH.adventurer;
}

export function eventsForExpGrant(
  state: Readonly<GameState>,
  amount: number,
  sourceEventId: string,
  reason: ExpSourceKind
): GameEvent[] {
  if (amount <= 0) {
    return [];
  }
  if ((state.processedExpSourceIds ?? []).includes(sourceEventId)) {
    return [];
  }
  const events: GameEvent[] = [{ type: 'PLAYER_EXP_GAINED', amount, sourceEventId, reason }];
  let level = state.player.level ?? 1;
  let exp = (state.player.exp ?? 0) + amount;
  let maxHp = state.player.maxHp;
  let maxMp = state.player.maxMp;
  let attackPower = state.player.attackPower ?? 10;
  const growth = growthFor(state.player.classId);

  while (level < LEVEL_CAP) {
    const needed = expRequiredForLevel(level);
    if (needed <= 0 || exp < needed) {
      break;
    }
    exp -= needed;
    const fromLevel = level;
    level += 1;
    maxHp += growth.hp;
    maxMp += growth.mp;
    attackPower += growth.attack;
    events.push({
      type: 'PLAYER_LEVEL_UP',
      fromLevel,
      toLevel: level,
      hpDelta: growth.hp,
      mpDelta: growth.mp,
      attackDelta: growth.attack,
    });
    events.push({
      type: 'HISTORY_RECORDED',
      entry: {
        id: `history_level_${fromLevel}_${level}_${sourceEventId}`,
        day: state.world.day ?? 1,
        locationId: state.world.currentLocationId,
        summary: `레벨이 ${fromLevel}에서 ${level}(으)로 올랐다.`,
        kind: 'LEVEL',
      },
    });
  }

  void maxHp;
  void maxMp;
  void attackPower;
  return events;
}

export function eventsForProgression(state: Readonly<GameState>, incoming: readonly GameEvent[]): GameEvent[] {
  if (incoming.length === 0) {
    return [];
  }

  let simulated = applyEvents(state, incoming);
  const outgoing: GameEvent[] = [];

  const push = (events: readonly GameEvent[]) => {
    for (const event of events) {
      outgoing.push(event);
      simulated = applyEvents(simulated, [event]);
    }
  };

  for (const event of incoming) {
    if (event.type === 'COMBAT_WON') {
      const boss = event.combatId === ENCOUNTER_ID.RUINS_BOSS_01;
      push(
        eventsForExpGrant(
          simulated,
          boss ? EXP_REWARD.BOSS : EXP_REWARD.ENCOUNTER,
          `exp:combat_won:${event.combatId}:${simulated.world.turn}`,
          boss ? 'BOSS' : 'ENCOUNTER'
        )
      );
      push(eventsForCombatRewards(simulated, event.combatId));
      const clearedId = canonicalEncounterId(event.combatId);
      push([{ type: 'ENCOUNTER_CLEARED', encounterId: clearedId }]);
      const flagId = flagForClearedEncounter(event.combatId);
      if (flagId) {
        push([{ type: 'WORLD_FLAG_SET', flagId, value: true }]);
      }
      if (clearedId === ENCOUNTER_ID.CH1_RUINS_GATE) {
        push([{ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_GATE_CLEARED, value: true }]);
      }
      push([
        {
          type: 'HISTORY_RECORDED',
          entry: {
            id: `history_combat_${event.combatId}_${simulated.world.turn}`,
            day: simulated.world.day ?? 1,
            locationId: simulated.world.currentLocationId,
            summary: boss ? '고대 수호자를 물리쳤다.' : '전투에서 승리했다.',
            kind: 'COMBAT',
          },
        },
      ]);
    }
    if (event.type === 'QUEST_COMPLETED') {
      push(eventsForExpGrant(simulated, questExpAmount(event.questId), `exp:quest:${event.questId}`, 'QUEST'));
      push(eventsForQuestRewards(simulated, event.questId));
      const title =
        event.questId === QUEST_ID.RUINS_MYSTERY ? '폐허 조사 의뢰를 마쳤다.' : '의뢰를 완료했다.';
      push([
        {
          type: 'HISTORY_RECORDED',
          entry: {
            id: `history_quest_${event.questId}`,
            day: simulated.world.day ?? 1,
            locationId: simulated.world.currentLocationId,
            summary: title,
            kind: 'QUEST',
          },
        },
      ]);
    }
    if (event.type === 'PLAYER_LEARNED_FACT' && event.factId === RUINS_SEAL_FACT_ID) {
      push(eventsForExpGrant(simulated, EXP_REWARD.DISCOVERY, `exp:fact:${event.factId}`, 'DISCOVERY'));
      push([
        {
          type: 'HISTORY_RECORDED',
          entry: {
            id: `history_fact_${event.factId}`,
            day: simulated.world.day ?? 1,
            locationId: simulated.world.currentLocationId,
            summary: '왕실 문장이 새겨진 마법석을 발견했다.',
            kind: 'DISCOVERY',
          },
        },
      ]);
    }
    if (event.type === 'WORLD_FLAG_SET' && event.flagId === WORLD_FLAG.GUILD_RECOGNITION_DONE && event.value) {
      push(eventsForExpGrant(simulated, EXP_REWARD.GUILD_RECOGNITION, 'exp:guild_recognition', 'QUEST'));
    }
    if (event.type === 'QUEST_STARTED' && event.questId === QUEST_ID.RUINS_MYSTERY) {
      push([
        {
          type: 'HISTORY_RECORDED',
          entry: {
            id: `history_quest_start_${event.questId}`,
            day: simulated.world.day ?? 1,
            locationId: simulated.world.currentLocationId,
            summary: '폐허 조사 의뢰를 받았다.',
            kind: 'QUEST',
          },
        },
      ]);
    }
  }

  if (canCompleteChapter(simulated, CHAPTER_ID.CHAPTER_1_LUEN_RUINS)) {
    const chapterEvents = eventsForChapterComplete(simulated, CHAPTER_ID.CHAPTER_1_LUEN_RUINS);
    push(chapterEvents);
    if (chapterEvents.some((item) => item.type === 'CHAPTER_COMPLETED')) {
      push(eventsForExpGrant(simulated, EXP_REWARD.CHAPTER, `exp:chapter:${CHAPTER_ID.CHAPTER_1_LUEN_RUINS}`, 'CHAPTER'));
    }
  }

  return outgoing;
}

export { growthFor };
