import type { GameEvent } from '../../core/event';
import type { GameState } from '../../core/game-state';
import { applyEvents } from '../../core/reducer';
import { ENCOUNTER_ID } from '../../combat/encounters/encounter-definitions';
import {
  flagForClearedEncounter,
  canonicalEncounterId,
  isEncounterCleared,
} from '../../combat/encounters/encounter-progress';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from '../../quests/quest-definitions';
import { CHAPTER_FACT_ID } from '../../knowledge/chapter-1-facts';
import { withEuro } from '../../text/korean-josa';
import { QUEST_STATUS } from '../../quests/quest-types';
import { CHAPTER_ID } from '../../story/chapters/chapter-types';
import { canCompleteChapter, eventsForChapterComplete } from '../../story/chapters/chapter-rules';
import { eventsForCombatRewards, eventsForQuestRewards, questExpAmount, combatRewardSummary } from '../../economy/reward-resolver';
import { eventsForGoldGained } from '../../economy/gold-rules';
import {
  eventsForRuinsKeyHuntOnCombatWon,
  playerHasRuinsKey,
  RUINS_KEY_MISSION_EXP,
  RUINS_KEY_MISSION_GOLD,
} from '../../quests/ruins-key-hunt';
import { ITEM_ID } from '../../inventory/item-definitions';
import { playerHasItem } from '../../player/player-state';
import { WORLD_FLAG } from '../../world/locations/location-definitions';
import { EXP_REWARD, LEVEL_CAP, LEVEL_GROWTH, expRequiredForLevel } from './level-config';
import type { ExpSourceKind } from './progression-types';
import { worldFlag } from '../../world/locations/location-selectors';
import { eventsForAdventureEnded } from '../../story/game-phase';
import { STORY_SEQUENCE_ID } from '../../story/sequences/chapter1-sequences';

/** Story milestones: first learn grants MILESTONE EXP (once via processedExpSourceIds). */
const MILESTONE_FACT_EXP: Readonly<Record<string, number>> = {
  [RUINS_SEAL_FACT_ID]: EXP_REWARD.DISCOVERY,
  [CHAPTER_FACT_ID.CAMP_BLUE_GLOW]: EXP_REWARD.MILESTONE,
  [CHAPTER_FACT_ID.GOBLIN_MOVEMENT_TRACES]: EXP_REWARD.MILESTONE,
  [CHAPTER_FACT_ID.GOBLINS_MOVING_NEAR_RUINS]: EXP_REWARD.MILESTONE,
  [CHAPTER_FACT_ID.NORTHERN_BLUE_LIGHT]: EXP_REWARD.MILESTONE,
  [CHAPTER_FACT_ID.SERIA_BLUE_PULSE]: Math.floor(EXP_REWARD.MILESTONE * 0.6),
  [CHAPTER_FACT_ID.GUARDIAN_NOT_OUR_FAULT]: EXP_REWARD.DISCOVERY,
  [CHAPTER_FACT_ID.BROKEN_SEAL_DETAIL]: EXP_REWARD.DISCOVERY,
};

const MILESTONE_FACT_SUMMARY: Readonly<Record<string, string>> = {
  [RUINS_SEAL_FACT_ID]: '왕실 문장이 새겨진 마법석을 발견했다.',
  [CHAPTER_FACT_ID.CAMP_BLUE_GLOW]: '숲에서 푸른 흔적을 발견했다.',
  [CHAPTER_FACT_ID.GOBLIN_MOVEMENT_TRACES]: '고블린이 숲 깊은 곳에서 밀려난 흔적을 확인했다.',
  [CHAPTER_FACT_ID.GOBLINS_MOVING_NEAR_RUINS]: '고블린이 폐허 쪽으로 이동한 단서를 얻었다.',
  [CHAPTER_FACT_ID.NORTHERN_BLUE_LIGHT]: '북쪽에서도 같은 푸른 현상을 목격했다.',
  [CHAPTER_FACT_ID.SERIA_BLUE_PULSE]: '세리아가 같은 계열의 푸른 파동을 관측 중임을 알았다.',
  [CHAPTER_FACT_ID.GUARDIAN_NOT_OUR_FAULT]: '봉인은 이미 훼손되어 있었음을 확인했다.',
  [CHAPTER_FACT_ID.BROKEN_SEAL_DETAIL]: '훼손된 봉인의 세부 흔적을 기록했다.',
};

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
      statPointsGranted: 1,
    });
    events.push({
      type: 'HISTORY_RECORDED',
      entry: {
        id: `history_level_${fromLevel}_${level}_${sourceEventId}`,
        day: state.world.day ?? 1,
        locationId: state.world.currentLocationId,
        summary: `레벨이 ${fromLevel}에서 ${withEuro(String(level))} 올랐다.`,
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
      // Evaluate against pre-win state so first/repeat is correct.
      const firstClear = !isEncounterCleared(state, event.combatId);
      const clearedId = canonicalEncounterId(event.combatId);
      const boss = clearedId === ENCOUNTER_ID.RUINS_BOSS_01;
      const training = clearedId === ENCOUNTER_ID.TRAINING_GROUNDS;
      if (!training) {
        if (firstClear) {
          push(
            eventsForExpGrant(
              simulated,
              boss ? EXP_REWARD.BOSS : EXP_REWARD.ENCOUNTER,
              `exp:combat:first:${clearedId}`,
              boss ? 'BOSS' : 'ENCOUNTER'
            )
          );
        } else {
          // Repeat clears still grant a smaller grindable chunk so combat remains the growth path.
          push(
            eventsForExpGrant(
              simulated,
              boss ? Math.floor(EXP_REWARD.BOSS / 4) : Math.floor(EXP_REWARD.ENCOUNTER / 3),
              `exp:combat:repeat:${clearedId}:${state.world.turn}`,
              boss ? 'BOSS' : 'ENCOUNTER'
            )
          );
        }
      }
      push(eventsForCombatRewards(simulated, event.combatId, { firstClear }));
      push([{ type: 'ENCOUNTER_CLEARED', encounterId: clearedId }]);
      const flagId = flagForClearedEncounter(event.combatId);
      if (flagId && firstClear) {
        push([{ type: 'WORLD_FLAG_SET', flagId, value: true }]);
      }
      if (firstClear && clearedId === ENCOUNTER_ID.CH1_RUINS_GATE) {
        push([{ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_GATE_CLEARED, value: true }]);
      }
      // Key hunt: one roll per encounter clear (repeat clears still roll until key acquired).
      const hadKey = playerHasRuinsKey(state);
      push(eventsForRuinsKeyHuntOnCombatWon(simulated, event.combatId));
      // Mission reward once when key is newly acquired this turn → auto return to village.
      if (!hadKey && playerHasRuinsKey(simulated)) {
        if (!worldFlag(simulated, WORLD_FLAG.RUINS_KEY_MISSION_REWARD_DONE)) {
          push([{ type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.RUINS_KEY_MISSION_REWARD_DONE, value: true }]);
          push(eventsForGoldGained(simulated, RUINS_KEY_MISSION_GOLD, 'QUEST', 'reward:mission:ruins_key:gold'));
          push(eventsForExpGrant(simulated, RUINS_KEY_MISSION_EXP, 'reward:mission:ruins_key:exp', 'QUEST'));
        }
        push(eventsForAdventureEnded(simulated, STORY_SEQUENCE_ID.RUINS_KEY_HUNT, { returnToVillage: true }));
      }
      if (firstClear && boss && !playerHasItem(simulated.player, ITEM_ID.GUARDIAN_CORE_FRAGMENT)) {
        push([
          {
            type: 'ITEM_OBTAINED',
            itemId: ITEM_ID.GUARDIAN_CORE_FRAGMENT,
            quantity: 1,
            sourceEventId: `reward:combat:first:${clearedId}:guardian_fragment`,
          },
        ]);
      }
      push([
        {
          type: 'HISTORY_RECORDED',
          entry: {
            id: `history_combat_${clearedId}_${firstClear ? 'first' : `repeat_${state.world.turn}`}`,
            day: simulated.world.day ?? 1,
            locationId: simulated.world.currentLocationId,
            summary: combatRewardSummary(event.combatId, firstClear),
            kind: 'COMBAT',
          },
        },
      ]);
    }
    // Aftermath stays in the ruins. The walk home is forest return, then the village.
    // Teleporting here skipped those scenes and made the chapter feel cut apart.
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
    if (event.type === 'PLAYER_LEARNED_FACT') {
      const milestoneExp = MILESTONE_FACT_EXP[event.factId];
      if (milestoneExp) {
        push(eventsForExpGrant(simulated, milestoneExp, `exp:milestone:${event.factId}`, 'DISCOVERY'));
        const summary = MILESTONE_FACT_SUMMARY[event.factId];
        if (summary) {
          push([
            {
              type: 'HISTORY_RECORDED',
              entry: {
                id: `history_fact_${event.factId}`,
                day: simulated.world.day ?? 1,
                locationId: simulated.world.currentLocationId,
                summary,
                kind: 'DISCOVERY',
              },
            },
          ]);
        }
      }
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

  void QUEST_STATUS;
  return outgoing;
}

export function eventsForLateProgression(state: Readonly<GameState>, incoming: readonly GameEvent[]): GameEvent[] {
  if (incoming.length === 0) {
    return [];
  }
  const simulated = applyEvents(state, incoming);
  const outgoing: GameEvent[] = [];
  const granted = (sourceEventId: string) =>
    (simulated.processedExpSourceIds ?? []).includes(sourceEventId) ||
    incoming.some((event) => event.type === 'PLAYER_EXP_GAINED' && event.sourceEventId === sourceEventId);

  if (
    incoming.some((event) => event.type === 'WORLD_FLAG_SET' && event.flagId === WORLD_FLAG.GUILD_RECOGNITION_DONE && event.value) &&
    !granted('exp:guild_recognition')
  ) {
    outgoing.push(...eventsForExpGrant(simulated, EXP_REWARD.GUILD_RECOGNITION, 'exp:guild_recognition', 'QUEST'));
  }

  // Story onEnter flags arrive after the main progression pass — close adventures here.
  const alreadyEnded = incoming.some((event) => event.type === 'ADVENTURE_ENDED');
  if (
    !alreadyEnded &&
    state.story.currentSequenceId === STORY_SEQUENCE_ID.FOREST_SCOUT &&
    !state.knowledge.knownFactIds.includes(CHAPTER_FACT_ID.CAMP_BLUE_GLOW) &&
    simulated.knowledge.knownFactIds.includes(CHAPTER_FACT_ID.CAMP_BLUE_GLOW)
  ) {
    outgoing.push(...eventsForAdventureEnded(simulated, STORY_SEQUENCE_ID.FOREST_SCOUT, { returnToVillage: true }));
  }

  if (canCompleteChapter(applyEvents(simulated, outgoing), CHAPTER_ID.CHAPTER_1_LUEN_RUINS)) {
    const afterAdventure = applyEvents(simulated, outgoing);
    const chapterEvents = eventsForChapterComplete(afterAdventure, CHAPTER_ID.CHAPTER_1_LUEN_RUINS);
    outgoing.push(...chapterEvents);
    const chapterExpId = `exp:chapter:${CHAPTER_ID.CHAPTER_1_LUEN_RUINS}`;
    if (chapterEvents.some((item) => item.type === 'CHAPTER_COMPLETED') && !granted(chapterExpId)) {
      outgoing.push(
        ...eventsForExpGrant(applyEvents(afterAdventure, chapterEvents), EXP_REWARD.CHAPTER, chapterExpId, 'CHAPTER')
      );
    }
  }
  return outgoing;
}

export { growthFor, MILESTONE_FACT_EXP };
