import type { GameState } from '../core/game-state';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { isEncounterCleared } from '../combat/encounters/encounter-progress';
import { doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { CHAPTER_FACT_ID } from '../knowledge/chapter-1-facts';
import { QUEST_ID, RUINS_SEAL_FACT_ID } from '../quests/quest-definitions';
import { isRuinsKeyHuntActive, playerHasRuinsKey } from '../quests/ruins-key-hunt';
import { QUEST_STATUS } from '../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { EXPLORATION_POINT_ID } from '../world/exploration/exploration-definitions';
import {
  CHOICE_FIGHT_FOREST_GOBLIN,
  CHOICE_INVESTIGATE_ALTAR,
  CHOICE_MOVE_RUINS,
  CHOICE_MOVE_VILLAGE,
} from '../world/locations/location-story-choices';
import { worldFlag } from '../world/locations/location-selectors';
import { validateMoveToLocation } from '../world/locations/location-rules';
import { adventureReadyToEnd } from './game-phase';
import type { StoryChoiceDefinition } from './story-scene-types';

const CHOICE_FIGHT_GUARDIAN = 'fight_ruins_guardian';

/** Synthetic choice id prefix for dynamic adventure combat. */
export const CHOICE_ADVENTURE_PROGRESS = 'adventure_progress';

const KEY_HUNT_ROTATION = [
  ENCOUNTER_ID.CH1_FOREST_AMBUSH,
  ENCOUNTER_ID.CH1_FOREST_DEEP,
  ENCOUNTER_ID.CH1_GOBLIN_CAMP,
] as const;

/**
 * Next mission-advancing choice outside the village.
 * Used when authored scene choices are empty or only dead-ends (LOOK_AROUND / locked ruins).
 */
export function villageRetreatChoice(): StoryChoiceDefinition {
  return {
    id: CHOICE_MOVE_VILLAGE,
    text: '마을로 돌아간다',
    action: { type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE },
    choicePurpose: 'ROLEPLAY',
  };
}

export function nextAdventureProgressChoice(state: Readonly<GameState>): StoryChoiceDefinition | null {
  if (adventureReadyToEnd(state)) {
    const villageOk = validateMoveToLocation(state, LOCATION_ID.LUEN_VILLAGE, {
      fromStoryChoice: true,
    }).allowed;
    if (villageOk) {
      return {
        id: CHOICE_MOVE_VILLAGE,
        text: '마을로 돌아간다',
        action: { type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.LUEN_VILLAGE },
        choicePurpose: 'PROGRESSION',
      };
    }
  }

  const locationId = state.world.currentLocationId;

  if (locationId === LOCATION_ID.FOREST_ROAD) {
    const herbQuest = state.quests[QUEST_ID.FOREST_HERB_GATHER];
    if (
      herbQuest?.status === QUEST_STATUS.ACTIVE &&
      !doesPlayerKnowFact(state, CHAPTER_FACT_ID.FOREST_HERBS)
    ) {
      return {
        id: 'investigate_forest_herbs',
        text: '길가의 약초를 확인한다',
        action: { type: 'INVESTIGATE', targetId: EXPLORATION_POINT_ID.FOREST_HERBS },
        choicePurpose: 'PROGRESSION',
      };
    }

    const forest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR];
    if (
      (forest?.status === QUEST_STATUS.ACTIVE || forest?.status === QUEST_STATUS.AVAILABLE) &&
      !isEncounterCleared(state, ENCOUNTER_ID.CH1_FOREST_SCOUTS)
    ) {
      return {
        id: CHOICE_FIGHT_FOREST_GOBLIN,
        text: '수풀 속 기척을 확인한다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS },
        choicePurpose: 'PROGRESSION',
      };
    }

    if (isRuinsKeyHuntActive(state)) {
      const combatId = nextKeyHuntEncounterId(state);
      if (combatId) {
        return {
          id: `${CHOICE_ADVENTURE_PROGRESS}_${combatId}`,
          text: keyHuntFightLabel(combatId),
          action: { type: 'START_COMBAT', combatId },
          choicePurpose: 'PROGRESSION',
        };
      }
    }

    if (
      playerHasRuinsKey(state) &&
      state.quests[QUEST_ID.RUINS_MYSTERY]?.status === QUEST_STATUS.ACTIVE
    ) {
      return {
        id: CHOICE_MOVE_RUINS,
        text: '폐허 입구로 향한다',
        action: { type: 'MOVE_TO_LOCATION', locationId: LOCATION_ID.ANCIENT_RUINS },
        choicePurpose: 'PROGRESSION',
      };
    }
  }

  if (locationId === LOCATION_ID.ANCIENT_RUINS) {
    if (!isEncounterCleared(state, ENCOUNTER_ID.CH1_RUINS_GATE)) {
      return {
        id: 'fight_ruins_mixed',
        text: '입구의 고블린들과 싸운다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.CH1_RUINS_GATE },
        choicePurpose: 'PROGRESSION',
      };
    }
    if (!worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
      if (!doesPlayerKnowFact(state, RUINS_SEAL_FACT_ID)) {
        return {
          id: CHOICE_INVESTIGATE_ALTAR,
          text: '제단을 조사한다',
          action: { type: 'INVESTIGATE', targetId: EXPLORATION_POINT_ID.ROYAL_MAGIC_STONE },
          choicePurpose: 'PROGRESSION',
        };
      }
      return {
        id: CHOICE_FIGHT_GUARDIAN,
        text: '수호자에게 도전한다',
        action: { type: 'START_COMBAT', combatId: ENCOUNTER_ID.RUINS_BOSS_01 },
        choicePurpose: 'PROGRESSION',
      };
    }
  }

  return null;
}

export function isAdventureDeadEndChoice(
  choice: StoryChoiceDefinition,
  state: Readonly<GameState>
): boolean {
  if (choice.action.type === 'LOOK_AROUND') {
    return true;
  }
  if (
    choice.action.type === 'MOVE_TO_LOCATION' &&
    choice.action.locationId === LOCATION_ID.ANCIENT_RUINS &&
    !playerHasRuinsKey(state)
  ) {
    return true;
  }
  return false;
}

function nextKeyHuntEncounterId(state: Readonly<GameState>): string | null {
  for (const id of KEY_HUNT_ROTATION) {
    if (!isEncounterCleared(state, id)) {
      return id;
    }
  }
  return ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER;
}

function keyHuntFightLabel(combatId: string): string {
  if (combatId === ENCOUNTER_ID.CH1_FOREST_AMBUSH) {
    return '매복한 무리를 상대한다';
  }
  if (combatId === ENCOUNTER_ID.CH1_FOREST_DEEP) {
    return '깊은 숲으로 들어간다';
  }
  if (combatId === ENCOUNTER_ID.CH1_GOBLIN_CAMP) {
    return '고블린 야영지를 정리한다';
  }
  if (combatId === ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER) {
    return '열쇠를 쥔 고블린을 쓰러뜨린다';
  }
  return '숲 안쪽을 더 살핀다';
}
