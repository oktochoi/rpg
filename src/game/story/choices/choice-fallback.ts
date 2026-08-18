import type { GameState } from '../../core/game-state';
import { validateAction } from '../../actions/action-validator';
import type { ParsedAction } from '../../actions/action-types';
import { CHOICE_INTENT, CHOICE_SOURCE, type ChoiceCandidate } from './choice-types';
import { CHOICE_TEXT } from './choice-templates';
import { CHOICE_PRIORITY } from './choice-priority';
import { getMainObjectiveText } from '../chapters/main-objective';
import { LOCATION_ID } from '../../world/locations/location-definitions';
import { validateMoveDestination } from '../../world/locations/location-rules';
import { isNpcAtCurrentLocation } from '../../world/locations/location-selectors';
import { QUEST_STATUS } from '../../quests/quest-types';
import { canChooseFirstAdvancement } from '../../player/classes/first-advancement';
import { getLocationDefinition } from '../../world/locations/location-definitions';

export function createFallbackCandidates(state?: Readonly<GameState>): ChoiceCandidate[] {
  const general: ChoiceCandidate = {
    id: 'fallback_look',
    actionType: 'WAIT',
    intent: CHOICE_INTENT.INVESTIGATE,
    source: CHOICE_SOURCE.GENERAL,
    basePriority: CHOICE_PRIORITY.GENERAL,
    textTemplate: CHOICE_TEXT.lookAround,
    semanticKey: 'LOOK',
    metadata: { storyAction: { type: 'LOOK_AROUND' }, semanticKey: 'LOOK' },
  };
  if (!state) {
    return [general];
  }
  const extras = [...mainStoryFallbackCandidates(state), ...locationFallbackCandidates(state)];
  return extras.length > 0 ? [...extras, general] : [general];
}

export function mainStoryFallbackCandidates(state: Readonly<GameState>): ChoiceCandidate[] {
  const objective = getMainObjectiveText(state);
  const candidates: ChoiceCandidate[] = [];
  if (canChooseFirstAdvancement(state) || objective.includes('첫 번째 직업') || objective.includes('길을 정')) {
    if (isNpcAtCurrentLocation(state, 'guildmaster_doran')) {
      candidates.push({
        id: 'fallback_talk_doran_advance',
        actionType: 'TALK',
        targetId: 'guildmaster_doran',
        intent: CHOICE_INTENT.PROGRESS_STORY,
        source: CHOICE_SOURCE.STORY,
        basePriority: CHOICE_PRIORITY.STORY_CRITICAL,
        textTemplate: '도란과 함께 첫 직업을 정한다.',
        semanticKey: 'TALK:DORAN:ADVANCEMENT',
        metadata: { storyAction: { type: 'TALK', promptId: 'talk_doran_here' }, promptId: 'talk_doran_here' },
        critical: true,
      });
    } else if (validateMoveDestination(state, LOCATION_ID.LUEN_ADVENTURERS_GUILD).allowed) {
      candidates.push(moveCandidate('fallback_move_guild', LOCATION_ID.LUEN_ADVENTURERS_GUILD, '모험가 길드로 향한다.', true));
    }
  }
  if (objective.includes('길드') && !canChooseFirstAdvancement(state)) {
    if (isNpcAtCurrentLocation(state, 'guildmaster_doran')) {
      candidates.push({
        id: 'fallback_talk_doran',
        actionType: 'TALK',
        targetId: 'guildmaster_doran',
        intent: CHOICE_INTENT.TALK,
        source: CHOICE_SOURCE.STORY,
        basePriority: CHOICE_PRIORITY.STORY,
        textTemplate: '도란에게 말을 건다.',
        semanticKey: 'TALK:DORAN:GENERIC',
        metadata: { storyAction: { type: 'TALK', promptId: 'talk_doran_here' }, promptId: 'talk_doran_here' },
        critical: true,
      });
    } else if (validateMoveDestination(state, LOCATION_ID.LUEN_ADVENTURERS_GUILD).allowed) {
      candidates.push(moveCandidate('fallback_move_guild', LOCATION_ID.LUEN_ADVENTURERS_GUILD, '모험가 길드로 향한다.', true));
    }
  }
  if (objective.includes('세리아') && isNpcAtCurrentLocation(state, 'seria')) {
    candidates.push({
      id: 'fallback_talk_seria',
      actionType: 'TALK',
      targetId: 'seria',
      intent: CHOICE_INTENT.TALK,
      source: CHOICE_SOURCE.QUEST,
      basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
      textTemplate: '세리아에게 말을 건다.',
      semanticKey: 'TALK:SERIA:GENERIC',
      metadata: { storyAction: { type: 'TALK', promptId: 'talk_seria_here' }, promptId: 'talk_seria_here' },
      critical: true,
    });
  }
  if (objective.includes('레온') && isNpcAtCurrentLocation(state, 'leon')) {
    candidates.push({
      id: 'fallback_talk_leon',
      actionType: 'TALK',
      targetId: 'leon',
      intent: CHOICE_INTENT.TALK,
      source: CHOICE_SOURCE.QUEST,
      basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
      textTemplate: '레온에게 말을 건다.',
      semanticKey: 'TALK:LEON:GENERIC',
      metadata: { storyAction: { type: 'TALK', promptId: 'talk_leon_here' }, promptId: 'talk_leon_here' },
      critical: true,
    });
  }
  const ruinsQuest = state.quests.ruins_mystery;
  if (ruinsQuest?.status === QUEST_STATUS.ACTIVE && state.world.currentLocationId !== LOCATION_ID.ANCIENT_RUINS) {
    const hop =
      validateMoveDestination(state, LOCATION_ID.ANCIENT_RUINS).allowed
        ? LOCATION_ID.ANCIENT_RUINS
        : validateMoveDestination(state, LOCATION_ID.FOREST_ROAD).allowed
          ? LOCATION_ID.FOREST_ROAD
          : null;
    if (hop) {
      candidates.push(
        moveCandidate(
          `fallback_move_${hop}`,
          hop,
          hop === LOCATION_ID.ANCIENT_RUINS ? '고대 폐허로 향한다.' : '숲길로 향한다.',
          true
        )
      );
    }
  }
  if (objective.includes('북문') && validateMoveDestination(state, LOCATION_ID.NORTHERN_GATE).allowed) {
    candidates.push(moveCandidate('fallback_move_gate', LOCATION_ID.NORTHERN_GATE, '북문으로 향한다.', false));
  }
  return candidates;
}

function locationFallbackCandidates(state: Readonly<GameState>): ChoiceCandidate[] {
  const locationId = state.world.currentLocationId;
  const candidates: ChoiceCandidate[] = [];
  if (locationId === LOCATION_ID.LUEN_VILLAGE) {
    pushMove(candidates, state, LOCATION_ID.LUEN_GENERAL_STORE, '상점으로 간다.');
    pushMove(candidates, state, LOCATION_ID.LUEN_ADVENTURERS_GUILD, '길드로 간다.');
    pushMove(candidates, state, LOCATION_ID.BLUE_MOON_INN, '여관으로 간다.');
    pushMove(candidates, state, LOCATION_ID.FOREST_ROAD, '숲길로 간다.');
  }
  if (locationId === LOCATION_ID.LUEN_ADVENTURERS_GUILD) {
    pushMove(candidates, state, LOCATION_ID.LUEN_VILLAGE, '마을로 돌아간다.');
  }
  if (locationId === LOCATION_ID.BLUE_MOON_INN) {
    candidates.push({
      id: 'fallback_rest',
      actionType: 'REST',
      intent: CHOICE_INTENT.REST,
      source: CHOICE_SOURCE.GENERAL,
      basePriority: CHOICE_PRIORITY.GENERAL + 4,
      textTemplate: '하루를 쉬어간다.',
      semanticKey: 'REST',
      metadata: { storyAction: { type: 'REST' }, semanticKey: 'REST' },
    });
    pushMove(candidates, state, LOCATION_ID.LUEN_VILLAGE, '마을로 돌아간다.');
  }
  if (locationId === LOCATION_ID.ANCIENT_RUINS) {
    pushMove(candidates, state, LOCATION_ID.FOREST_ROAD, '폐허를 빠져나간다.');
  }
  if (locationId === LOCATION_ID.FOREST_ROAD) {
    pushMove(candidates, state, LOCATION_ID.LUEN_VILLAGE, '마을로 돌아간다.');
  }
  return candidates;
}

function pushMove(candidates: ChoiceCandidate[], state: Readonly<GameState>, locationId: string, text: string): void {
  if (!validateMoveDestination(state, locationId).allowed) {
    return;
  }
  candidates.push(moveCandidate(`fallback_loc_${locationId}`, locationId, text, false));
}

function moveCandidate(id: string, locationId: string, text: string, critical: boolean): ChoiceCandidate {
  const dest = getLocationDefinition(locationId);
  return {
    id,
    actionType: 'MOVE',
    targetId: locationId,
    intent: critical ? CHOICE_INTENT.PROGRESS_STORY : CHOICE_INTENT.MOVE,
    source: critical ? CHOICE_SOURCE.STORY : CHOICE_SOURCE.MOVE,
    basePriority: critical ? CHOICE_PRIORITY.STORY_CRITICAL : CHOICE_PRIORITY.MOVE,
    textTemplate: text || ` ${dest?.name ?? locationId}으로 간다.`,
    semanticKey: `MOVE:${locationId}`,
    metadata: { storyAction: { type: 'MOVE_TO_LOCATION', locationId }, locationId, semanticKey: `MOVE:${locationId}` },
    critical,
  };
}

export function fallbackParsedAction(text = CHOICE_TEXT.lookAround): ParsedAction {
  return {
    actionType: 'WAIT',
    rawInput: text,
    confidence: 1,
  };
}

export function fallbackIsValid(state: Readonly<GameState>): boolean {
  return validateAction(fallbackParsedAction(), state).valid;
}
