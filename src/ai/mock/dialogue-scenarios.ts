import { createNpcDialogueService } from '../service';
import { applyEvents } from '../../game/core/reducer';
import { createInitialGameState } from '../../game/core/initial-state';
import type { GameState } from '../../game/core/game-state';
import { eventsForGrantFact, eventsForRecordedFact, eventsForShareFact } from '../../game/knowledge/knowledge-service';
import { createRelationship } from '../../game/npc/relationship';
import type { WorldFact } from '../../game/world/facts/world-fact';

const GOBLIN_FACT: WorldFact = {
  id: 'fact_enemy_defeated_goblin_01_t1',
  type: 'ENEMY_DEFEATED',
  occurredAtTurn: 1,
  locationId: 'ancient_ruins',
  actorIds: ['player'],
  targetIds: ['goblin_01'],
  witnessIds: ['player', 'seria'],
  tags: ['combat', 'goblin', 'ruins'],
  publicLevel: 'PRIVATE',
  payload: {
    combatId: 'combat_goblin_ruins_01',
    enemyId: 'goblin_01',
  },
};

function withGoblinFact(state: GameState): GameState {
  return applyEvents(state, eventsForRecordedFact(GOBLIN_FACT));
}

export async function runStep14DialogueScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const unknownState = createInitialGameState();
  const unknownService = createNpcDialogueService(() => unknownState);
  const unknown = await unknownService.respond('nobody', '누구야?');
  if (unknown.dialogue.includes('대화할 수 없는 대상입니다') && unknown.usedFactIds.length === 0) {
    pass('unknown-npc', unknown.dialogue);
  } else {
    fail('unknown-npc', unknown.dialogue);
  }

  let stateA = withGoblinFact(createInitialGameState());
  const serviceA = createNpcDialogueService(() => stateA);
  const seria = await serviceA.respond('seria', '고블린 일 기억해?');
  if (seria.usedFactIds.includes(GOBLIN_FACT.id) && /고블린을 쓰러뜨렸/.test(seria.dialogue)) {
    pass('A-seria-witnessed', `${seria.dialogue} usedFactIds=${seria.usedFactIds.join(',')}`);
  } else {
    fail('A-seria-witnessed', `${seria.dialogue} usedFactIds=${seria.usedFactIds.join(',')}`);
  }

  const leonUnknown = await serviceA.respond('leon', '고블린 죽인 거 알고 있어?');
  const leaked = /쓰러뜨렸|잡았다고|고블린을 잡/.test(leonUnknown.dialogue);
  if (leonUnknown.usedFactIds.length === 0 && /처음 듣는/.test(leonUnknown.dialogue) && !leaked) {
    pass('B-leon-unknown', leonUnknown.dialogue);
  } else {
    fail('B-leon-unknown', `${leonUnknown.dialogue} used=${leonUnknown.usedFactIds.join(',')} leaked=${leaked}`);
  }

  stateA = applyEvents(
    stateA,
    eventsForShareFact(stateA, { factId: GOBLIN_FACT.id, fromId: 'seria', toId: 'leon' })
  );
  const leonHeard = await serviceA.respond('leon', '고블린 죽인 거 알고 있어?');
  if (leonHeard.usedFactIds.includes(GOBLIN_FACT.id) && /세리아에게 이야기는 들었네/.test(leonHeard.dialogue)) {
    pass('C-leon-shared', leonHeard.dialogue);
  } else {
    fail('C-leon-shared', `${leonHeard.dialogue} used=${leonHeard.usedFactIds.join(',')}`);
  }

  let stateD = withGoblinFact(createInitialGameState());
  for (const npcId of ['leon', 'innkeeper'] as const) {
    stateD = applyEvents(stateD, eventsForGrantFact(stateD, npcId, GOBLIN_FACT.id));
  }
  const serviceD = createNpcDialogueService(() => stateD);
  const question = '내가 고블린을 쓰러뜨린 거 어떻게 생각해?';
  const seriaOpinion = await serviceD.respond('seria', question);
  const leonOpinion = await serviceD.respond('leon', question);
  const martaOpinion = await serviceD.respond('innkeeper', question);
  const distinct = new Set([seriaOpinion.dialogue, leonOpinion.dialogue, martaOpinion.dialogue]).size === 3;
  if (distinct && /실력/.test(seriaOpinion.dialogue) && /위협/.test(leonOpinion.dialogue) && /세상에/.test(martaOpinion.dialogue)) {
    pass('D-personality', `Seria=${seriaOpinion.dialogue} | Leon=${leonOpinion.dialogue} | Marta=${martaOpinion.dialogue}`);
  } else {
    fail('D-personality', `Seria=${seriaOpinion.dialogue} | Leon=${leonOpinion.dialogue} | Marta=${martaOpinion.dialogue}`);
  }

  let highTrust = withGoblinFact(createInitialGameState());
  highTrust = {
    ...highTrust,
    relationships: {
      ...highTrust.relationships,
      seria: createRelationship({ trust: 70 }),
    },
  };
  let lowTrust = withGoblinFact(createInitialGameState());
  lowTrust = {
    ...lowTrust,
    relationships: {
      ...lowTrust.relationships,
      seria: createRelationship({ trust: -50 }),
    },
  };
  const highLine = (await createNpcDialogueService(() => highTrust).respond('seria', '폐허에 대해 알고 있는 게 있어?')).dialogue;
  const lowLine = (await createNpcDialogueService(() => lowTrust).respond('seria', '폐허에 대해 알고 있는 게 있어?')).dialogue;
  if (highLine !== lowLine && /말해도 되겠지/.test(highLine) && /왜 네게 말해야/.test(lowLine)) {
    pass('E-relationship', `high=${highLine} | low=${lowLine}`);
  } else {
    fail('E-relationship', `high=${highLine} | low=${lowLine}`);
  }

  return lines;
}
