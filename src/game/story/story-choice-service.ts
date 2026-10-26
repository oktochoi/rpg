import type { Choice } from './choice';
import type { GameState } from '../core/game-state';
import {
  storyChoicesForLocation,
  locationChoiceDestination,
  CHOICE_MOVE_VILLAGE,
  CHOICE_MOVE_RUINS,
  CHOICE_LOOK_AROUND,
  CHOICE_OPEN_SHOP,
} from '../world/locations/location-story-choices';
import { isHubLocation, worldFlag } from '../world/locations/location-selectors';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { isRuinsKeyHuntActive, playerHasRuinsKey } from '../quests/ruins-key-hunt';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { validateMoveToLocation } from '../world/locations/location-rules';
import { getExplorationPoint } from '../world/exploration/exploration-definitions';
import { isExplorationPointCompleted } from '../world/exploration/exploration-service';
import { evaluateStoryCondition } from './story-conditions';
import { getStorySceneDefinition } from './story-scene-definitions';
import type { StoryChoiceDefinition } from './story-scene-types';
import { canUseFreeTravel, isStoryLocked } from './sequences';
import { adventureReadyToEnd, getGamePhase, GAME_PHASE } from './game-phase';
import {
  isAdventureDeadEndChoice,
  nextAdventureProgressChoice,
  villageRetreatChoice,
} from './adventure-progress';

/** Keep the panel focused — hub travel uses HubLocationNav. */
const MAX_STORY_CHOICES = 3;

/** A scene of only clues still keeps the current hunt fight in the first slot. */
function prependProgressFight(
  state: Readonly<GameState>,
  choices: readonly StoryChoiceDefinition[]
): StoryChoiceDefinition[] {
  if (choices.some((choice) => choice.action.type === 'START_COMBAT')) {
    return [...choices];
  }
  const next = nextAdventureProgressChoice(state);
  if (!next || next.action.type !== 'START_COMBAT' || choices.some((choice) => choice.id === next.id)) {
    return [...choices];
  }
  return [next, ...choices];
}

/** Combat stays, and one investigation stays beside it instead of being cut by the cap. */
function preferCombatAndClue(choices: readonly StoryChoiceDefinition[]): StoryChoiceDefinition[] {
  const combat = choices.find((choice) => choice.action.type === 'START_COMBAT');
  const clue = choices.find((choice) => choice.action.type === 'INVESTIGATE');
  const rest = choices.filter((choice) => choice !== combat && choice !== clue);
  return [combat, clue, ...rest].filter((choice): choice is StoryChoiceDefinition => Boolean(choice));
}

function asChoices(choices: readonly Choice[]): readonly Choice[] {
  return choices.slice(0, MAX_STORY_CHOICES);
}

function isTravelChoice(choice: Choice): boolean {
  return locationChoiceDestination(choice.id) !== null || choice.id.startsWith('move_');
}

function isLookAroundChoice(choice: { id: string }): boolean {
  return choice.id === CHOICE_LOOK_AROUND || choice.id.includes('look_around') || choice.id === 'look_around';
}

function toChoice(definition: StoryChoiceDefinition): Choice {
  return {
    id: definition.id,
    label: definition.text,
    candidateId: definition.id,
    questStep: definition.choicePurpose === 'PROGRESSION' || definition.action.type === 'CHOOSE_CLASS_PATH',
  };
}

function isMeaningfulAdventureChoice(choice: StoryChoiceDefinition): boolean {
  const action = choice.action;
  if (action.type === 'LOOK_AROUND' || action.type === 'TALK' || action.type === 'CONTINUE') {
    return false;
  }
  if (action.type === 'START_COMBAT' || action.type === 'INVESTIGATE' || action.type === 'ENTER_SCENE') {
    return true;
  }
  if (action.type === 'MOVE_TO_LOCATION') {
    return (
      action.locationId === LOCATION_ID.ANCIENT_RUINS ||
      action.locationId === LOCATION_ID.FOREST_ROAD ||
      action.locationId === LOCATION_ID.LUEN_VILLAGE
    );
  }
  if (choice.choicePurpose === 'PROGRESSION' || choice.choicePurpose === 'DECISION') {
    return true;
  }
  return action.type === 'ACCEPT_QUEST' || action.type === 'CHOOSE_CLASS_PATH' || action.type === 'LEARN_FACT';
}

export function getAvailableChoiceDefinitions(
  state: Readonly<GameState>,
  sceneId: string = state.story.currentSceneId
): StoryChoiceDefinition[] {
  const scene = getStorySceneDefinition(sceneId);
  if (!scene) {
    return [];
  }
  const phase = getGamePhase(state);
  const purposeRank = (choice: StoryChoiceDefinition) => {
    if (choice.action.type === 'START_COMBAT') {
      return 0;
    }
    if (choice.action.type === 'CHOOSE_CLASS_PATH') {
      return 0;
    }
    if (choice.choicePurpose === 'PROGRESSION') {
      return 1;
    }
    if (choice.choicePurpose === 'DECISION') {
      return 2;
    }
    if (choice.action.type === 'INVESTIGATE') {
      return 3;
    }
    if (choice.action.type === 'OPEN_SHOP') {
      return 2;
    }
    return 4;
  };
  return scene.choices
    .filter((choice) => evaluateStoryCondition(state, choice.conditions))
    .filter((choice) => {
      if (choice.action.type !== 'INVESTIGATE' || !choice.action.targetId) {
        return true;
      }
      const point = getExplorationPoint(choice.action.targetId);
      return !point?.oneTime || !isExplorationPointCompleted(state, point.id);
    })
    .filter((choice) => {
      if (phase !== GAME_PHASE.ADVENTURE) {
        return true;
      }
      const action = choice.action;
      if (action.type === 'OPEN_SHOP' || action.type === 'REST') {
        return false;
      }
      if (action.type === 'LOOK_AROUND' || action.type === 'TALK') {
        return false;
      }
      if (action.type === 'MOVE_TO_LOCATION') {
        const dest = action.locationId;
        if (
          dest === LOCATION_ID.BLUE_MOON_INN ||
          dest === LOCATION_ID.LUEN_GENERAL_STORE ||
          dest === LOCATION_ID.LUEN_ADVENTURERS_GUILD
        ) {
          return false;
        }
        if (dest === LOCATION_ID.LUEN_VILLAGE) {
          return Boolean(adventureReadyToEnd(state));
        }
        if (isHubLocation(dest) && !adventureReadyToEnd(state)) {
          return false;
        }
      }
      return true;
    })
    .filter((choice) => {
      if (choice.action.type !== 'MOVE_TO_LOCATION') {
        return true;
      }
      return validateMoveToLocation(state, choice.action.locationId, { fromStoryChoice: true }).allowed;
    })
    .slice()
    .sort((a, b) => purposeRank(a) - purposeRank(b));
}

/** Forest gate: the key hunt and the door after it only show the next step. */
function forestGateChoices(state: Readonly<GameState>): readonly Choice[] | null {
  if (state.world.currentLocationId !== LOCATION_ID.FOREST_ROAD) {
    return null;
  }
  if (isRuinsKeyHuntActive(state)) {
    const fight = nextAdventureProgressChoice(state);
    const choices: Choice[] = [];
    if (fight) {
      choices.push(toChoice(fight));
    }
    const clue = getAvailableChoiceDefinitions(state).find((choice) => choice.action.type === 'INVESTIGATE');
    if (clue) {
      choices.push(toChoice(clue));
    }
    choices.push(toChoice(villageRetreatChoice()));
    return choices.slice(0, MAX_STORY_CHOICES);
  }
  const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];
  if (
    playerHasRuinsKey(state) &&
    ruins?.status === QUEST_STATUS.ACTIVE &&
    !worldFlag(state, WORLD_FLAG.RUINS_GATE_CLEARED) &&
    !worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)
  ) {
    return [
      {
        id: CHOICE_MOVE_RUINS,
        label: '폐허 입구로 향한다',
        candidateId: CHOICE_MOVE_RUINS,
        questStep: true,
      },
    ];
  }
  return null;
}

export function getAvailableChoices(
  state: Readonly<GameState>,
  sceneId: string = state.story.currentSceneId
): readonly Choice[] {
  const gate = forestGateChoices(state);
  if (gate) {
    return gate;
  }
  const scene = getStorySceneDefinition(sceneId);
  const phase = getGamePhase(state);
  const fromScene = getAvailableChoiceDefinitions(state, sceneId).map(toChoice);

  if (scene?.autoContinue && fromScene.some((choice) => choice.id === 'intro_continue' || choice.candidateId === 'story_continue')) {
    const cont =
      fromScene.find((choice) => choice.id === 'intro_continue') ??
      toChoice({
        id: 'story_continue',
        text: '앞으로 움직인다',
        action: { type: 'CONTINUE' },
      });
    return [cont];
  }

  if (phase === GAME_PHASE.ADVENTURE || (isStoryLocked(state) && !canUseFreeTravel(state))) {
    const ranked = getAvailableChoiceDefinitions(state, sceneId)
      .filter((choice) => !isAdventureDeadEndChoice(choice, state))
      .filter((choice) => isMeaningfulAdventureChoice(choice));

    const withOptionalRetreat = (choices: Choice[]): Choice[] => {
      if (!adventureReadyToEnd(state)) {
        return choices;
      }
      if (choices.some((choice) => choice.id === CHOICE_MOVE_VILLAGE || choice.id.includes('luen_village'))) {
        return choices;
      }
      return [...choices, toChoice(villageRetreatChoice())];
    };

    if (ranked.length > 0) {
      return asChoices(withOptionalRetreat(preferCombatAndClue(prependProgressFight(state, ranked)).map(toChoice)));
    }
    const next = nextAdventureProgressChoice(state);
    if (next) {
      return asChoices(withOptionalRetreat([toChoice(next)]));
    }
    if (adventureReadyToEnd(state)) {
      return [toChoice(villageRetreatChoice())];
    }
    return [
      {
        id: 'story_continue',
        label: '앞으로 움직인다',
        candidateId: 'story_continue',
      },
    ];
  }

  const atHub = isHubLocation(state.world.currentLocationId);
  const merged: Choice[] = [];
  const pushUnique = (choice: Choice) => {
    if (merged.length >= MAX_STORY_CHOICES) {
      return;
    }
    if (isLookAroundChoice(choice) && merged.length > 0) {
      return;
    }
    if (!merged.some((item) => item.id === choice.id)) {
      merged.push(choice);
    }
  };

  for (const choice of fromScene) {
    pushUnique(choice);
  }

  // At the shop: always surface open-shop if authored choices are thin.
  if (state.world.currentLocationId === LOCATION_ID.LUEN_GENERAL_STORE) {
    if (!merged.some((choice) => choice.id === CHOICE_OPEN_SHOP)) {
      pushUnique({ id: CHOICE_OPEN_SHOP, label: '물건을 살펴본다', candidateId: CHOICE_OPEN_SHOP });
    }
  }

  if (!atHub || fromScene.length === 0) {
    for (const choice of storyChoicesForLocation(state)) {
      if (atHub && isTravelChoice(choice)) {
        continue;
      }
      if (isLookAroundChoice(choice) && merged.length > 0) {
        continue;
      }
      pushUnique({ ...choice, candidateId: choice.id });
    }
  } else {
    for (const choice of storyChoicesForLocation(state)) {
      if (isTravelChoice(choice) || isLookAroundChoice(choice)) {
        continue;
      }
      pushUnique({ ...choice, candidateId: choice.id });
    }
  }

  if (merged.length === 0) {
    merged.push({ id: CHOICE_LOOK_AROUND, label: '잠시 주변을 살핀다', candidateId: CHOICE_LOOK_AROUND });
  }
  return withBuildingExit(state, merged);
}

/** Town interiors must always offer a way back to the square, even when the scene already fills the choice cap. */
function withBuildingExit(state: Readonly<GameState>, choices: readonly Choice[]): readonly Choice[] {
  const capped = asChoices(choices);
  const here = state.world.currentLocationId;
  if (here === LOCATION_ID.LUEN_VILLAGE || !isHubLocation(here) || getGamePhase(state) !== GAME_PHASE.VILLAGE) {
    return capped;
  }
  const existing = capped.find((choice) => choice.id === CHOICE_MOVE_VILLAGE);
  const exit: Choice = existing ?? {
    id: CHOICE_MOVE_VILLAGE,
    label: '마을로 나간다',
    candidateId: CHOICE_MOVE_VILLAGE,
  };
  const rest = capped.filter((choice) => choice.id !== CHOICE_MOVE_VILLAGE);
  return [exit, ...rest].slice(0, MAX_STORY_CHOICES);
}

export function findAvailableChoiceDefinition(
  state: Readonly<GameState>,
  choiceId: string
): StoryChoiceDefinition | null {
  const fromScene = getAvailableChoiceDefinitions(state).find((choice) => choice.id === choiceId);
  if (fromScene) {
    return fromScene;
  }
  const progress = nextAdventureProgressChoice(state);
  if (progress && progress.id === choiceId) {
    return progress;
  }
  if (choiceId === CHOICE_MOVE_VILLAGE) {
    return villageRetreatChoice();
  }
  if (choiceId === CHOICE_OPEN_SHOP) {
    return { id: CHOICE_OPEN_SHOP, text: '물건을 살펴본다', action: { type: 'OPEN_SHOP' } };
  }
  return null;
}
