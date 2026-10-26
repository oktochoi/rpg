import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { PLAYER_CLASS_ID } from '../player/classes';
import { QUEST_ID } from '../quests/quest-definitions';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import {
  CHOICE_FIGHT_FOREST_GOBLIN,
  CHOICE_MOVE_VILLAGE,
} from '../world/locations/location-story-choices';
import { setRuinsKeyDropRng, resetRuinsKeyDropRng, playerHasRuinsKey } from '../quests/ruins-key-hunt';
import { getGamePhase, GAME_PHASE } from './game-phase';
import { getAvailableChoices } from './story-choice-service';
import { STORY_SEQUENCE_ID } from './sequences/chapter1-sequences';

function victory(combatId: string, enemies: string[]) {
  return {
    combatId,
    outcome: 'VICTORY' as const,
    player: { remainingHp: 70, remainingMp: 40 },
    defeatedEnemyIds: enemies,
    defeatedEnemyTypes: enemies.map(() => 'goblin'),
  };
}

export async function runGamePhaseScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const orch = createGameOrchestrator(createInitialGameState());
  await orch.dispatch({ type: 'NEW_GAME', name: '페이즈' });
  if (getGamePhase(orch.getState()) === GAME_PHASE.VILLAGE) {
    pass('A-village-start', getGamePhase(orch.getState()));
  } else {
    fail('A-village-start', getGamePhase(orch.getState()));
  }

  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: 'register_adventurer' });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });

  const afterDepart = orch.getState();
  if (
    getGamePhase(afterDepart) === GAME_PHASE.ADVENTURE &&
    afterDepart.story.currentSequenceId === STORY_SEQUENCE_ID.FOREST_SCOUT
  ) {
    pass('B-adventure-start', afterDepart.story.currentSequenceId ?? 'none');
  } else {
    fail(
      'B-adventure-start',
      JSON.stringify({ phase: getGamePhase(afterDepart), seq: afterDepart.story.currentSequenceId })
    );
  }

  const scoutChoices = getAvailableChoices(afterDepart);
  const scoutLabels = scoutChoices.map((choice) => choice.label);
  const hasScoutFight = scoutChoices.some(
    (choice) => choice.id === CHOICE_FIGHT_FOREST_GOBLIN || choice.id.startsWith(`${CHOICE_FIGHT_FOREST_GOBLIN}_`)
  );
  const onlyBareContinue =
    scoutChoices.length === 1 && (scoutChoices[0]?.label === '계속' || scoutChoices[0]?.id === 'story_continue');
  if (hasScoutFight && !onlyBareContinue) {
    pass('B2-scout-progress-choice', scoutLabels.join(' | '));
  } else {
    fail('B2-scout-progress-choice', scoutLabels.join(' | ') || '(empty)');
  }

  // Cannot return to village freely during adventure.
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  if (orch.getState().world.currentLocationId === LOCATION_ID.FOREST_ROAD) {
    pass('C-block-village-return', 'still in forest');
  } else {
    fail('C-block-village-return', orch.getState().world.currentLocationId);
  }

  await orch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS });
  if (getGamePhase(orch.getState()) === GAME_PHASE.COMBAT) {
    pass('D-combat-phase', 'COMBAT');
  } else {
    fail('D-combat-phase', getGamePhase(orch.getState()));
  }

  await orch.dispatch({
    type: 'RESOLVE_COMBAT',
    result: victory(ENCOUNTER_ID.CH1_FOREST_SCOUTS, ['scout_goblin_001', 'scout_goblin_002']),
  });
  const afterCombat = orch.getState();
  // Combat may resolve into aftermath + auto village return in one turn.
  if (getGamePhase(afterCombat) === GAME_PHASE.ADVENTURE) {
    pass('E-back-to-adventure', 'after combat');
  } else if (
    getGamePhase(afterCombat) === GAME_PHASE.VILLAGE &&
    afterCombat.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE
  ) {
    pass('E-back-to-adventure', 'combat→aftermath auto-return');
  } else {
    fail('E-back-to-adventure', getGamePhase(afterCombat));
  }

  if (afterCombat.world.currentLocationId !== LOCATION_ID.LUEN_VILLAGE) {
    await orch.dispatch({ type: 'SELECT_CHOICE', choiceId: CHOICE_MOVE_VILLAGE });
  }
  const afterReturn = orch.getState();
  if (
    getGamePhase(afterReturn) === GAME_PHASE.VILLAGE &&
    afterReturn.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE
  ) {
    pass('F-mission-complete-village', 'auto/story return');
  } else {
    fail(
      'F-mission-complete-village',
      JSON.stringify({
        phase: getGamePhase(afterReturn),
        loc: afterReturn.world.currentLocationId,
        flow: afterReturn.story.flowMode,
      })
    );
  }

  // Prep between adventures, then key-hunt departure.
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD });
  await orch.dispatch({ type: 'START_DIALOGUE', npcId: 'guildmaster_doran' });
  if (orch.getState().player.level >= 2) {
    await orch.dispatch({ type: 'CHOOSE_CLASS_PATH', classId: PLAYER_CLASS_ID.WARRIOR });
  }
  await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE });
  await orch.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.RUINS_MYSTERY });
  const keyOrch = createGameOrchestrator(
    applyEvents(orch.getState(), [{ type: 'LOCATION_DISCOVERED', locationId: LOCATION_ID.ANCIENT_RUINS }])
  );
  await keyOrch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.FOREST_ROAD });
  if (getGamePhase(keyOrch.getState()) !== GAME_PHASE.ADVENTURE) {
    fail('G-key-auto-return', `not adventure: ${getGamePhase(keyOrch.getState())}`);
  } else {
    const keyChoices = getAvailableChoices(keyOrch.getState());
    const keyLabels = keyChoices.map((choice) => choice.label);
    const hasProgressFight = keyChoices.some(
      (choice) =>
        choice.id.includes('fight') ||
        choice.id.includes('ambush') ||
        choice.id.startsWith('adventure_progress_')
    );
    const keyOnlyContinue =
      keyChoices.length === 1 && (keyChoices[0]?.label === '계속' || keyChoices[0]?.id === 'story_continue');
    if (hasProgressFight && !keyOnlyContinue) {
      pass('G0-key-hunt-progress-choice', keyLabels.join(' | '));
    } else {
      fail('G0-key-hunt-progress-choice', keyLabels.join(' | ') || '(empty)');
    }

    setRuinsKeyDropRng(() => 0);
    await keyOrch.dispatch({ type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_AMBUSH });
    if (keyOrch.getState().mode === 'COMBAT') {
      await keyOrch.dispatch({
        type: 'RESOLVE_COMBAT',
        result: victory(ENCOUNTER_ID.CH1_FOREST_AMBUSH, ['ambush_goblin_001', 'ambush_archer_001']),
      });
    }
    resetRuinsKeyDropRng();
    const afterKey = keyOrch.getState();
    if (
      playerHasRuinsKey(afterKey) &&
      getGamePhase(afterKey) === GAME_PHASE.VILLAGE &&
      afterKey.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE
    ) {
      pass('G-key-auto-return', 'key → village');
    } else {
      fail(
        'G-key-auto-return',
        JSON.stringify({
          key: playerHasRuinsKey(afterKey),
          phase: getGamePhase(afterKey),
          loc: afterKey.world.currentLocationId,
          ruins: afterKey.quests[QUEST_ID.RUINS_MYSTERY]?.status,
          flag: afterKey.world.flags[WORLD_FLAG.RUINS_KEY_ACQUIRED],
        })
      );
    }
  }

  return lines;
}
