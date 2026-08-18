import type { ActionType } from '../../actions/action-types';
import type { GameState } from '../../core/game-state';
import { ENCOUNTER_ID } from '../../combat/encounters/encounter-definitions';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../../knowledge/knowledge-selectors';
import { getTalkPrompt } from '../../npc/talk-choices';
import { getNpcProfile } from '../../npc/npc-profiles';
import { PLAYER_CLASS_ID } from '../../player/classes';
import { getQuestDefinition } from '../../quests/quest-definitions';
import { currentObjective } from '../../quests/quest-selectors';
import { QUEST_OBJECTIVE_TYPE, QUEST_STATUS } from '../../quests/quest-types';
import { getExplorationPoint, explorationPointsAt } from '../../world/exploration/exploration-definitions';
import { isExplorationPointCompleted } from '../../world/exploration/exploration-service';
import { getLocationDefinition, LOCATION_ID, WORLD_FLAG } from '../../world/locations/location-definitions';
import { validateMoveDestination } from '../../world/locations/location-rules';
import { isNpcAtCurrentLocation, reachableLocationIds, worldFlag } from '../../world/locations/location-selectors';
import { getAvailableChoiceDefinitions } from '../story-choice-service';
import { getStorySceneDefinition, STORY_SCENE_ID } from '../story-scene-definitions';
import type { StoryChoiceAction, StoryChoiceDefinition } from '../story-scene-types';
import type { StoryDirectorContext } from '../../../ai/director/director-types';
import { CHOICE_PRIORITY } from './choice-priority';
import { CHOICE_INTENT, CHOICE_SOURCE, candidateActionKey, type ChoiceCandidate } from './choice-types';
import { CHOICE_TEXT, fillTemplate, playerFacingFactTopic, sanitizeChoiceText } from './choice-templates';
import { activeEncounterIdsForLocation } from '../../combat/encounters/encounter-progress';
import { canChooseFirstAdvancement } from '../../player/classes/first-advancement';
import { isTopicAvailable, shouldSuppressSemanticKey } from '../../dialogue/dialogue-topic-state';
import { topicsForNpc } from '../../dialogue/dialogue-topics';
import { createFallbackCandidates } from './choice-fallback';
import { shopUnlocked } from '../../economy/shop-rules';
import { canEnhanceHere } from '../../inventory/enhancement-rules';

export interface CandidateBuildOptions {
  forceEmpty?: boolean;
  includeGeneral?: boolean;
}

const ENCOUNTER_NAMES: Readonly<Record<string, string>> = {
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: '고블린 정찰대',
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: '고블린 정찰대',
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: '숲 매복',
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: '고블린 야영지',
  [ENCOUNTER_ID.CH1_RUINS_GATE]: '폐허 입구의 적',
  [ENCOUNTER_ID.RUINS_MIXED_01]: '폐허 입구의 적',
  [ENCOUNTER_ID.RUINS_BOSS_01]: '고대 수호자',
  [ENCOUNTER_ID.RUINS_EASY_01]: '고블린',
};

export function buildChoiceCandidates(
  state: Readonly<GameState>,
  context: StoryDirectorContext,
  options: CandidateBuildOptions = {}
): ChoiceCandidate[] {
  if (state.mode === 'COMBAT' || options.forceEmpty) {
    return [];
  }

  const raw: ChoiceCandidate[] = [
    ...storyCandidates(state),
    ...questCandidates(state, context),
    ...npcCandidates(state, context),
    ...knowledgeCandidates(state, context),
    ...relationshipCandidates(context),
    ...memoryCandidates(context),
    ...explorationCandidates(state),
    ...combatCandidates(state, context),
    ...moveCandidates(state),
    ...classCandidates(state),
    ...utilityCandidates(state),
  ];

  if (options.includeGeneral !== false) {
    raw.push(...generalCandidates(state));
  }

  raw.push(...createFallbackCandidates(state));

  const cleaned = dedupeCandidates(raw)
    .filter((candidate) => {
      const key = candidate.semanticKey ?? candidate.metadata?.semanticKey;
      return !key || !shouldSuppressSemanticKey(state, key);
    })
    .map((candidate) => ({
      ...candidate,
      textTemplate: sanitizeChoiceText(candidate.textTemplate),
    }));

  return cleaned.length > 0 ? cleaned : createFallbackCandidates(state);
}

export function hasActionableQuestCandidate(candidates: readonly ChoiceCandidate[]): boolean {
  return candidates.some((candidate) => candidate.source === CHOICE_SOURCE.QUEST);
}

export function hasMainProgressCandidate(candidates: readonly ChoiceCandidate[]): boolean {
  return candidates.some(
    (candidate) =>
      candidate.critical === true ||
      candidate.intent === CHOICE_INTENT.PROGRESS_STORY ||
      candidate.source === CHOICE_SOURCE.QUEST
  );
}

function storyCandidates(state: Readonly<GameState>): ChoiceCandidate[] {
  return getAvailableChoiceDefinitions(state)
    .filter((choice) => !isConsumedStoryTalk(state, choice))
    .map((choice) => storyChoiceToCandidate(choice, state));
}

function matchingStoryTalkTopic(state: Readonly<GameState>, choice: StoryChoiceDefinition) {
  if (choice.action.type !== 'TALK') {
    return null;
  }
  const promptId = choice.action.promptId ?? choice.id;
  const npcId = npcIdFromTalkChoice(choice.id, promptId) ?? getStorySceneDefinition(state.story.currentSceneId)?.npcId;
  if (!npcId) {
    return null;
  }
  return topicsForNpc(state, npcId).find((topic) => topic.promptId === promptId || topic.topicId === promptId) ?? null;
}

function isConsumedStoryTalk(state: Readonly<GameState>, choice: StoryChoiceDefinition): boolean {
  const topic = matchingStoryTalkTopic(state, choice);
  return Boolean(topic && !isTopicAvailable(state, topic));
}

function storyChoiceToCandidate(choice: StoryChoiceDefinition, state: Readonly<GameState>): ChoiceCandidate {
  const mapped = mapStoryAction(choice.action, choice);
  const sceneNpc = getStorySceneDefinition(state.story.currentSceneId)?.npcId;
  const bossScene =
    state.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AWAKENS ||
    state.story.currentSceneId === STORY_SCENE_ID.RUINS_GUARDIAN_AFTER_DEFEAT;
  const actionType = choice.action.type;
  const critical =
    actionType === 'START_COMBAT' ||
    actionType === 'ACCEPT_QUEST' ||
    actionType === 'SHARE_FACT' ||
    actionType === 'CHOOSE_CLASS_PATH' ||
    (bossScene && actionType === 'MOVE_TO_LOCATION');
  const talkTopic = matchingStoryTalkTopic(state, choice);
  const semanticKey = talkTopic?.semanticKey ?? semanticKeyForStoryChoice(choice);
  return {
    id: `story_${choice.id}`,
    actionType: mapped.actionType,
    targetId: mapped.targetId ?? (mapped.actionType === 'TALK' || mapped.actionType === 'ASK' ? sceneNpc : undefined),
    secondaryTargetId: mapped.secondaryTargetId,
    intent: mapped.intent,
    source: CHOICE_SOURCE.STORY,
    basePriority: critical ? CHOICE_PRIORITY.STORY_CRITICAL : CHOICE_PRIORITY.STORY,
    textTemplate: choice.text,
    semanticKey,
    metadata: {
      storyChoiceId: choice.id,
      storyAction: choice.action,
      encounterId: choice.action.type === 'START_COMBAT' ? choice.action.combatId : undefined,
      locationId: choice.action.type === 'MOVE_TO_LOCATION' ? choice.action.locationId : undefined,
      factId: choice.action.type === 'SHARE_FACT' ? choice.action.factId : undefined,
      promptId: choice.action.type === 'TALK' ? choice.action.promptId ?? choice.id : undefined,
      explorationPointId: choice.action.type === 'INVESTIGATE' ? choice.action.targetId : undefined,
      semanticKey,
    },
    critical,
  };
}

function mapStoryAction(
  action: StoryChoiceAction,
  choice: StoryChoiceDefinition
): { actionType: ActionType; targetId?: string; secondaryTargetId?: string; intent: ChoiceCandidate['intent'] } {
  switch (action.type) {
    case 'MOVE_TO_LOCATION':
      return {
        actionType: 'MOVE',
        targetId: action.locationId,
        intent: choice.text.includes('물러') ? CHOICE_INTENT.AVOID : CHOICE_INTENT.MOVE,
      };
    case 'START_COMBAT':
      return { actionType: 'ATTACK', targetId: action.combatId, intent: CHOICE_INTENT.FIGHT };
    case 'SHARE_FACT':
      return {
        actionType: 'TALK',
        targetId: action.toId,
        secondaryTargetId: action.factId,
        intent: CHOICE_INTENT.SHARE_INFORMATION,
      };
    case 'ACCEPT_QUEST':
      return { actionType: 'HELP', targetId: action.questId, intent: CHOICE_INTENT.HELP };
    case 'INVESTIGATE':
      return { actionType: 'INVESTIGATE', targetId: action.targetId, intent: CHOICE_INTENT.INVESTIGATE };
    case 'TALK': {
      const prompt = getTalkPrompt(action.promptId ?? choice.id) ?? '';
      const ask = /묻/.test(choice.text) || /물어/.test(prompt);
      return {
        actionType: ask ? 'ASK' : 'TALK',
        targetId: npcIdFromTalkChoice(choice.id, action.promptId),
        intent: ask ? CHOICE_INTENT.ASK : CHOICE_INTENT.TALK,
      };
    }
    case 'LOOK_AROUND':
      return { actionType: 'WAIT', intent: CHOICE_INTENT.INVESTIGATE };
    case 'REST':
      return { actionType: 'REST', intent: CHOICE_INTENT.REST };
    case 'PASS_GATE':
      return { actionType: 'MOVE', targetId: LOCATION_ID.NORTHERN_GATE, intent: CHOICE_INTENT.MOVE };
    case 'ENTER_SCENE':
      return { actionType: 'INVESTIGATE', targetId: action.sceneId, intent: CHOICE_INTENT.USE_CLASS_ABILITY };
    case 'OPEN_SHOP':
      return { actionType: 'WAIT', intent: CHOICE_INTENT.GENERAL };
    case 'CHOOSE_CLASS_PATH':
      return { actionType: 'USE_SKILL', intent: CHOICE_INTENT.USE_CLASS_ABILITY };
    default:
      return { actionType: 'WAIT', intent: CHOICE_INTENT.GENERAL };
  }
}

function questCandidates(state: Readonly<GameState>, context: StoryDirectorContext): ChoiceCandidate[] {
  const candidates: ChoiceCandidate[] = [];
  for (const quest of context.relevantQuests) {
    const runtime = state.quests[quest.questId];
    const definition = getQuestDefinition(quest.questId);
    if (!runtime || !definition) {
      continue;
    }
    if (runtime.status === QUEST_STATUS.AVAILABLE && definition.requesterNpcId) {
      if (isNpcAtCurrentLocation(state, definition.requesterNpcId)) {
        candidates.push({
          id: `quest_accept_${quest.questId}`,
          actionType: 'HELP',
          targetId: quest.questId,
          intent: CHOICE_INTENT.HELP,
          source: CHOICE_SOURCE.QUEST,
          basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
          textTemplate: `${definition.title} 조사를 맡겠다고 한다.`,
          metadata: { questId: quest.questId, storyAction: { type: 'ACCEPT_QUEST', questId: quest.questId } },
          critical: true,
        });
      }
      continue;
    }
    if (runtime.status !== QUEST_STATUS.ACTIVE) {
      continue;
    }
    const objective = currentObjective(runtime, definition.objectives);
    if (!objective) {
      continue;
    }
    const built = questObjectiveCandidate(state, quest.questId, objective);
    if (built) {
      candidates.push(built);
    }
  }
  return candidates;
}

function questObjectiveCandidate(
  state: Readonly<GameState>,
  questId: string,
  objective: { id: string; type: string; description: string; targetId?: string }
): ChoiceCandidate | null {
  if (objective.type === QUEST_OBJECTIVE_TYPE.VISIT_LOCATION && objective.targetId) {
    const hop = nextHopToward(state, objective.targetId);
    if (!hop) {
      return null;
    }
    const dest = getLocationDefinition(hop);
    return {
      id: `quest_visit_${objective.id}`,
      actionType: 'MOVE',
      targetId: hop,
      intent: CHOICE_INTENT.PROGRESS_STORY,
      source: CHOICE_SOURCE.QUEST,
      basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
      textTemplate: fillTemplate(CHOICE_TEXT.moveTo, { locationName: dest?.name ?? hop }),
      metadata: { questId, locationId: hop, storyAction: { type: 'MOVE_TO_LOCATION', locationId: hop } },
      critical: true,
    };
  }
  if (objective.type === QUEST_OBJECTIVE_TYPE.TALK_TO_NPC && objective.targetId) {
    if (isNpcAtCurrentLocation(state, objective.targetId)) {
      const name = getNpcProfile(objective.targetId)?.name ?? objective.targetId;
      return {
        id: `quest_talk_${objective.id}`,
        actionType: 'TALK',
        targetId: objective.targetId,
        intent: CHOICE_INTENT.TALK,
        source: CHOICE_SOURCE.QUEST,
        basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
        textTemplate: fillTemplate(CHOICE_TEXT.talkNpc, { npcName: name }),
        metadata: { questId, promptId: objective.targetId === 'seria' ? 'talk_seria_here' : undefined },
        critical: true,
      };
    }
    const npc = state.npcs[objective.targetId];
    const hop = npc ? nextHopToward(state, npc.locationId) : null;
    if (!hop) {
      return null;
    }
    const dest = getLocationDefinition(hop);
    return {
      id: `quest_approach_${objective.id}`,
      actionType: 'MOVE',
      targetId: hop,
      intent: CHOICE_INTENT.PROGRESS_STORY,
      source: CHOICE_SOURCE.QUEST,
      basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
      textTemplate: fillTemplate(CHOICE_TEXT.moveTo, { locationName: dest?.name ?? hop }),
      metadata: { questId, locationId: hop, storyAction: { type: 'MOVE_TO_LOCATION', locationId: hop } },
      critical: true,
    };
  }
  if (objective.type === QUEST_OBJECTIVE_TYPE.INVESTIGATE) {
    const points = explorationPointsAt(state.world.currentLocationId).filter(
      (point) => !isExplorationPointCompleted(state, point.id)
    );
    if (points.length === 0) {
      const hop = objective.targetId ? nextHopToward(state, objective.targetId) : null;
      if (!hop) {
        return null;
      }
      const dest = getLocationDefinition(hop);
      return {
        id: `quest_invest_move_${objective.id}`,
        actionType: 'MOVE',
        targetId: hop,
        intent: CHOICE_INTENT.PROGRESS_STORY,
        source: CHOICE_SOURCE.QUEST,
        basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
        textTemplate: fillTemplate(CHOICE_TEXT.moveTo, { locationName: dest?.name ?? hop }),
        metadata: { questId, locationId: hop, storyAction: { type: 'MOVE_TO_LOCATION', locationId: hop } },
        critical: true,
      };
    }
    const point = points[0];
    return {
      id: `quest_invest_${objective.id}`,
      actionType: 'INVESTIGATE',
      targetId: point.id,
      intent: CHOICE_INTENT.INVESTIGATE,
      source: CHOICE_SOURCE.QUEST,
      basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
      textTemplate: fillTemplate(CHOICE_TEXT.investigate, { targetName: point.name }),
      metadata: { questId, explorationPointId: point.id, storyAction: { type: 'INVESTIGATE', targetId: point.id } },
      critical: true,
    };
  }
  if (objective.type === QUEST_OBJECTIVE_TYPE.WIN_ENCOUNTER && objective.targetId) {
    const encounterLocation = locationForEncounter(objective.targetId);
    if (!activeEncounterIdsForLocation(state).includes(objective.targetId) && !activeEncounterIdsForLocation(state).includes(canonicalFightId(objective.targetId))) {
      const hop = nextHopToward(state, encounterLocation);
      if (!hop) {
        return null;
      }
      const dest = getLocationDefinition(hop);
      return {
        id: `quest_fight_move_${objective.id}`,
        actionType: 'MOVE',
        targetId: hop,
        intent: CHOICE_INTENT.PROGRESS_STORY,
        source: CHOICE_SOURCE.QUEST,
        basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
        textTemplate: fillTemplate(CHOICE_TEXT.moveTo, { locationName: dest?.name ?? hop }),
        semanticKey: `MOVE:${hop}`,
        metadata: { questId, locationId: hop, storyAction: { type: 'MOVE_TO_LOCATION', locationId: hop }, semanticKey: `MOVE:${hop}` },
        critical: true,
      };
    }
    const fightId = canonicalFightId(objective.targetId);
    const enemyName = ENCOUNTER_NAMES[fightId] ?? ENCOUNTER_NAMES[objective.targetId] ?? '적';
    return {
      id: `quest_fight_${objective.id}`,
      actionType: 'ATTACK',
      targetId: fightId,
      intent: CHOICE_INTENT.FIGHT,
      source: CHOICE_SOURCE.QUEST,
      basePriority: CHOICE_PRIORITY.QUEST_CRITICAL,
      textTemplate: fillTemplate(CHOICE_TEXT.fight, { enemyName }),
      semanticKey: `FIGHT:${fightId}`,
      metadata: {
        questId,
        encounterId: fightId,
        storyAction: { type: 'START_COMBAT', combatId: fightId },
        semanticKey: `FIGHT:${fightId}`,
      },
      critical: true,
    };
  }
  return null;
}

function npcCandidates(state: Readonly<GameState>, context: StoryDirectorContext): ChoiceCandidate[] {
  const candidates: ChoiceCandidate[] = [];
  for (const npc of context.presentNpcs) {
    if (!isNpcAtCurrentLocation(state, npc.npcId)) {
      continue;
    }
    const topics = topicsForNpc(state, npc.npcId).filter((topic) => isTopicAvailable(state, topic));
    for (const topic of topics) {
      const ask = /묻/.test(topic.text);
      candidates.push({
        id: `npc_topic_${topic.topicId}`,
        actionType: ask ? 'ASK' : 'TALK',
        targetId: npc.npcId,
        intent: ask ? CHOICE_INTENT.ASK : CHOICE_INTENT.TALK,
        source: CHOICE_SOURCE.NPC,
        basePriority: topic.priority,
        textTemplate: topic.text,
        semanticKey: topic.semanticKey,
        metadata: { promptId: topic.promptId, topicId: topic.topicId, semanticKey: topic.semanticKey },
      });
    }
    if (topics.length === 0) {
      candidates.push({
        id: `npc_end_${npc.npcId}`,
        actionType: 'WAIT',
        targetId: npc.npcId,
        intent: CHOICE_INTENT.GENERAL,
        source: CHOICE_SOURCE.NPC,
        basePriority: CHOICE_PRIORITY.NPC_IMPORTANT,
        textTemplate: `${npc.name}와의 대화를 마친다.`,
        semanticKey: `END:${npc.npcId}`,
        metadata: { promptId: 'end_dialogue', semanticKey: `END:${npc.npcId}` },
      });
    }
  }
  return candidates;
}

function knowledgeCandidates(state: Readonly<GameState>, context: StoryDirectorContext): ChoiceCandidate[] {
  const candidates: ChoiceCandidate[] = [];
  for (const fact of context.relevantPlayerKnownFacts) {
    if (!doesPlayerKnowFact(state, fact.id)) {
      continue;
    }
    const topic = playerFacingFactTopic(fact.id);
    for (const npc of context.presentNpcs) {
      if (!isNpcAtCurrentLocation(state, npc.npcId)) {
        continue;
      }
      if (doesNpcKnowFact(state, npc.npcId, fact.id)) {
        continue;
      }
      candidates.push({
        id: `knowledge_share_${npc.npcId}_${fact.id}`,
        actionType: 'TALK',
        targetId: npc.npcId,
        secondaryTargetId: fact.id,
        intent: CHOICE_INTENT.SHARE_INFORMATION,
        source: CHOICE_SOURCE.KNOWLEDGE,
        basePriority: CHOICE_PRIORITY.KNOWLEDGE,
        textTemplate: fillTemplate(CHOICE_TEXT.shareFact, { npcName: npc.name, factTopic: topic }),
        metadata: {
          factId: fact.id,
          storyAction: { type: 'SHARE_FACT', factId: fact.id, toId: npc.npcId },
        },
      });
    }
  }
  return candidates;
}

function relationshipCandidates(context: StoryDirectorContext): ChoiceCandidate[] {
  const candidates: ChoiceCandidate[] = [];
  for (const npc of context.presentNpcs) {
    if (npc.relationship.trust >= 50) {
      candidates.push({
        id: `rel_trust_${npc.npcId}`,
        actionType: 'TALK',
        targetId: npc.npcId,
        intent: CHOICE_INTENT.TALK,
        source: CHOICE_SOURCE.RELATIONSHIP,
        basePriority: CHOICE_PRIORITY.RELATIONSHIP,
        textTemplate: fillTemplate(CHOICE_TEXT.highTrust, { npcName: npc.name }),
        metadata: { promptId: 'talk_seria_personal_secret' },
      });
    }
    if (npc.relationship.fear >= 60) {
      candidates.push({
        id: `rel_fear_${npc.npcId}`,
        actionType: 'WAIT',
        targetId: npc.npcId,
        intent: CHOICE_INTENT.AVOID,
        source: CHOICE_SOURCE.RELATIONSHIP,
        basePriority: CHOICE_PRIORITY.RELATIONSHIP,
        textTemplate: CHOICE_TEXT.stepBackFear,
        metadata: { storyAction: { type: 'LOOK_AROUND' } },
      });
    }
  }
  return candidates;
}

function memoryCandidates(context: StoryDirectorContext): ChoiceCandidate[] {
  return context.presentNpcs
    .filter((npc) => npc.relevantMemoryTypes.includes('PLAYER_SAVED_ME'))
    .map((npc) => ({
      id: `memory_${npc.npcId}_PLAYER_SAVED_ME`,
      actionType: 'TALK' as const,
      targetId: npc.npcId,
      intent: CHOICE_INTENT.TALK,
      source: CHOICE_SOURCE.MEMORY,
      basePriority: CHOICE_PRIORITY.MEMORY,
      textTemplate: CHOICE_TEXT.recallSaved,
      metadata: { promptId: 'talk_seria_saved_memory' },
    }));
}

function explorationCandidates(state: Readonly<GameState>): ChoiceCandidate[] {
  return explorationPointsAt(state.world.currentLocationId)
    .filter((point) => !point.oneTime || !isExplorationPointCompleted(state, point.id))
    .map((point) => ({
      id: `explore_${point.id}`,
      actionType: 'INVESTIGATE' as const,
      targetId: point.id,
      intent: CHOICE_INTENT.INVESTIGATE,
      source: CHOICE_SOURCE.EXPLORATION,
      basePriority: CHOICE_PRIORITY.EXPLORATION,
      textTemplate: fillTemplate(CHOICE_TEXT.investigate, { targetName: point.name }),
      metadata: { explorationPointId: point.id, storyAction: { type: 'INVESTIGATE' as const, targetId: point.id } },
    }));
}

function combatCandidates(state: Readonly<GameState>, context: StoryDirectorContext): ChoiceCandidate[] {
  const active = activeEncounterIdsForLocation(state);
  return context.availableEncounterIds
    .filter((encounterId) => active.includes(encounterId))
    .map((encounterId) => ({
      id: `combat_${encounterId}`,
      actionType: 'ATTACK' as const,
      targetId: encounterId,
      intent: CHOICE_INTENT.FIGHT,
      source: CHOICE_SOURCE.COMBAT,
      basePriority: encounterId === ENCOUNTER_ID.RUINS_BOSS_01 ? CHOICE_PRIORITY.STORY_CRITICAL : CHOICE_PRIORITY.COMBAT,
      textTemplate: fillTemplate(CHOICE_TEXT.fight, { enemyName: ENCOUNTER_NAMES[encounterId] ?? '적' }),
      semanticKey: `FIGHT:${encounterId}`,
      metadata: { encounterId, storyAction: { type: 'START_COMBAT' as const, combatId: encounterId }, semanticKey: `FIGHT:${encounterId}` },
      critical: encounterId === ENCOUNTER_ID.RUINS_BOSS_01,
    }));
}

function moveCandidates(state: Readonly<GameState>): ChoiceCandidate[] {
  const bossActive = activeEncounterIdsForLocation(state).includes(ENCOUNTER_ID.RUINS_BOSS_01);
  return reachableLocationIds(state).map((locationId) => {
    const definition = getLocationDefinition(locationId);
    const retreat = bossActive && locationId === LOCATION_ID.FOREST_ROAD;
    return {
      id: `move_${locationId}`,
      actionType: 'MOVE' as const,
      targetId: locationId,
      intent: retreat ? CHOICE_INTENT.AVOID : CHOICE_INTENT.MOVE,
      source: retreat ? CHOICE_SOURCE.STORY : CHOICE_SOURCE.MOVE,
      basePriority: retreat ? CHOICE_PRIORITY.STORY_CRITICAL : CHOICE_PRIORITY.MOVE,
      textTemplate: retreat
        ? '잠시 물러난다.'
        : fillTemplate(CHOICE_TEXT.moveTo, { locationName: definition?.name ?? locationId }),
      metadata: { locationId, storyAction: { type: 'MOVE_TO_LOCATION' as const, locationId } },
      critical: retreat,
    };
  });
}

function classCandidates(state: Readonly<GameState>): ChoiceCandidate[] {
  if (state.world.currentLocationId !== LOCATION_ID.ANCIENT_RUINS) {
    return [];
  }
  const classId = state.player.classId;
  if (classId !== PLAYER_CLASS_ID.WARRIOR && classId !== PLAYER_CLASS_ID.MAGE && classId !== PLAYER_CLASS_ID.ROGUE) {
    return [];
  }
  const altar = getExplorationPoint('royal_magic_stone');
  const explored = altar ? isExplorationPointCompleted(state, altar.id) : true;
  const text =
    classId === PLAYER_CLASS_ID.WARRIOR
      ? CHOICE_TEXT.classWarrior
      : classId === PLAYER_CLASS_ID.MAGE
        ? CHOICE_TEXT.classMage
        : CHOICE_TEXT.classRogue;
  return [
    {
      id: `class_${classId}`,
      actionType: 'INVESTIGATE',
      targetId: explored ? undefined : altar?.id,
      intent: CHOICE_INTENT.USE_CLASS_ABILITY,
      source: CHOICE_SOURCE.CLASS,
      basePriority: CHOICE_PRIORITY.CLASS,
      textTemplate: text,
      metadata: {
        classId,
        explorationPointId: explored ? undefined : altar?.id,
        storyAction: { type: 'INVESTIGATE', targetId: explored ? undefined : altar?.id },
      },
    },
  ];
}

function generalCandidates(_state: Readonly<GameState>): ChoiceCandidate[] {
  return [
    {
      id: 'general_look',
      actionType: 'WAIT',
      intent: CHOICE_INTENT.INVESTIGATE,
      source: CHOICE_SOURCE.GENERAL,
      basePriority: CHOICE_PRIORITY.GENERAL,
      textTemplate: CHOICE_TEXT.lookAround,
      metadata: { storyAction: { type: 'LOOK_AROUND' } },
    },
    {
      id: 'general_wait',
      actionType: 'WAIT',
      intent: CHOICE_INTENT.REST,
      source: CHOICE_SOURCE.GENERAL,
      basePriority: CHOICE_PRIORITY.GENERAL - 2,
      textTemplate: CHOICE_TEXT.wait,
      metadata: { storyAction: { type: 'LOOK_AROUND' } },
    },
  ];
}

function utilityCandidates(state: Readonly<GameState>): ChoiceCandidate[] {
  const candidates: ChoiceCandidate[] = [];
  if (canChooseFirstAdvancement(state) && state.world.currentLocationId !== LOCATION_ID.LUEN_ADVENTURERS_GUILD) {
    const hop = nextHopToward(state, LOCATION_ID.LUEN_ADVENTURERS_GUILD);
    if (hop) {
      candidates.push({
        id: 'advance_move_guild',
        actionType: 'MOVE',
        targetId: hop,
        intent: CHOICE_INTENT.PROGRESS_STORY,
        source: CHOICE_SOURCE.STORY,
        basePriority: CHOICE_PRIORITY.STORY_CRITICAL,
        textTemplate: '모험가 길드로 향한다.',
        semanticKey: 'MOVE:luen_adventurers_guild',
        metadata: { locationId: hop, storyAction: { type: 'MOVE_TO_LOCATION', locationId: hop }, semanticKey: 'MOVE:luen_adventurers_guild' },
        critical: true,
      });
    }
  }
  if (shopUnlocked(state) && state.world.currentLocationId === LOCATION_ID.LUEN_GENERAL_STORE) {
    candidates.push({
      id: 'utility_open_shop',
      actionType: 'WAIT',
      intent: CHOICE_INTENT.GENERAL,
      source: CHOICE_SOURCE.STORY,
      basePriority: CHOICE_PRIORITY.STORY,
      textTemplate: '물건을 살펴본다.',
      semanticKey: 'SHOP:OPEN',
      metadata: { storyAction: { type: 'OPEN_SHOP' }, semanticKey: 'SHOP:OPEN' },
    });
  }
  if (canEnhanceHere(state) && state.world.currentLocationId === LOCATION_ID.LUEN_GENERAL_STORE) {
    candidates.push({
      id: 'utility_enhance',
      actionType: 'WAIT',
      intent: CHOICE_INTENT.GENERAL,
      source: CHOICE_SOURCE.STORY,
      basePriority: CHOICE_PRIORITY.STORY - 4,
      textTemplate: '장비를 강화한다.',
      semanticKey: 'SHOP:ENHANCE',
      metadata: { storyAction: { type: 'OPEN_SHOP' }, semanticKey: 'SHOP:ENHANCE' },
    });
  }
  if (worldFlag(state, WORLD_FLAG.SHOP_UNLOCKED) && state.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE) {
    const hop = nextHopToward(state, LOCATION_ID.LUEN_GENERAL_STORE);
    if (hop) {
      candidates.push({
        id: 'utility_move_shop',
        actionType: 'MOVE',
        targetId: hop,
        intent: CHOICE_INTENT.MOVE,
        source: CHOICE_SOURCE.MOVE,
        basePriority: CHOICE_PRIORITY.MOVE + 4,
        textTemplate: '장비를 준비하기 위해 상점으로 간다.',
        semanticKey: 'MOVE:luen_general_store',
        metadata: { locationId: hop, storyAction: { type: 'MOVE_TO_LOCATION', locationId: hop }, semanticKey: 'MOVE:luen_general_store' },
      });
    }
  }
  return candidates;
}

function semanticKeyForStoryChoice(choice: StoryChoiceDefinition): string {
  const action = choice.action;
  if (action.type === 'MOVE_TO_LOCATION') {
    return `MOVE:${action.locationId}`;
  }
  if (action.type === 'START_COMBAT') {
    return `FIGHT:${action.combatId}`;
  }
  if (action.type === 'SHARE_FACT') {
    return `SHARE:${action.toId}:${action.factId}`;
  }
  if (action.type === 'ACCEPT_QUEST') {
    return `QUEST:${action.questId}`;
  }
  if (action.type === 'TALK') {
    return `TALK:${action.promptId ?? choice.id}`;
  }
  if (action.type === 'OPEN_SHOP') {
    return 'SHOP:OPEN';
  }
  if (action.type === 'CHOOSE_CLASS_PATH') {
    return `CLASS:${action.classId}`;
  }
  if (action.type === 'INVESTIGATE') {
    return `INVESTIGATE:${action.targetId ?? 'area'}`;
  }
  if (action.type === 'REST') {
    return 'REST';
  }
  return `STORY:${choice.id}`;
}

function locationForEncounter(encounterId: string): string {
  if (
    encounterId === ENCOUNTER_ID.CH1_FOREST_SCOUTS ||
    encounterId === ENCOUNTER_ID.FOREST_GOBLIN_01 ||
    encounterId === ENCOUNTER_ID.CH1_FOREST_AMBUSH ||
    encounterId === ENCOUNTER_ID.CH1_GOBLIN_CAMP
  ) {
    return LOCATION_ID.FOREST_ROAD;
  }
  return LOCATION_ID.ANCIENT_RUINS;
}

function canonicalFightId(encounterId: string): string {
  if (encounterId === ENCOUNTER_ID.FOREST_GOBLIN_01) {
    return ENCOUNTER_ID.CH1_FOREST_SCOUTS;
  }
  if (encounterId === ENCOUNTER_ID.RUINS_MIXED_01) {
    return ENCOUNTER_ID.CH1_RUINS_GATE;
  }
  return encounterId;
}

function npcIdFromTalkChoice(choiceId: string, promptId?: string): string | undefined {
  const key = `${choiceId}_${promptId ?? ''}`;
  if (key.includes('leon')) {
    return 'leon';
  }
  if (key.includes('marta') || key.includes('innkeeper')) {
    return 'innkeeper';
  }
  if (key.includes('seria') || key.includes('saved') || key.includes('secret')) {
    return 'seria';
  }
  return undefined;
}

function nextHopToward(state: Readonly<GameState>, destinationId: string): string | null {
  if (destinationId === state.world.currentLocationId) {
    return null;
  }
  if (validateMoveDestination(state, destinationId).allowed) {
    return destinationId;
  }
  const start = state.world.currentLocationId;
  const queue: string[] = [start];
  const prev = new Map<string, string | null>([[start, null]]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const definition = getLocationDefinition(current);
    if (!definition) {
      continue;
    }
    for (const next of definition.connectedLocationIds) {
      if (prev.has(next)) {
        continue;
      }
      const nextDef = getLocationDefinition(next);
      if (!nextDef) {
        continue;
      }
      if (nextDef.discoveryRequired && state.world.locations[next]?.discovered !== true && next !== destinationId) {
        continue;
      }
      prev.set(next, current);
      if (next === destinationId) {
        let cursor = next;
        while (prev.get(cursor) && prev.get(cursor) !== start) {
          cursor = prev.get(cursor)!;
        }
        return validateMoveDestination(state, cursor).allowed ? cursor : null;
      }
      queue.push(next);
    }
  }
  return null;
}

function dedupeCandidates(candidates: ChoiceCandidate[]): ChoiceCandidate[] {
  const best = new Map<string, ChoiceCandidate>();
  for (const candidate of candidates) {
    const semantic = candidate.semanticKey ?? candidate.metadata?.semanticKey;
    const key = semantic && semantic.length > 0 ? `sem:${semantic}` : candidateActionKey(candidate);
    const existing = best.get(key);
    if (!existing || preferCandidate(candidate, existing)) {
      best.set(key, candidate);
    }
  }
  return [...best.values()];
}

function preferCandidate(next: ChoiceCandidate, current: ChoiceCandidate): boolean {
  if (Boolean(next.critical) !== Boolean(current.critical)) {
    return Boolean(next.critical);
  }
  if (next.basePriority !== current.basePriority) {
    return next.basePriority > current.basePriority;
  }
  const sourceDelta = sourcePreference(next.source) - sourcePreference(current.source);
  if (sourceDelta !== 0) {
    return sourceDelta < 0;
  }
  return next.id.localeCompare(current.id) < 0;
}

function sourcePreference(source: ChoiceCandidate['source']): number {
  const order: ChoiceCandidate['source'][] = [
    CHOICE_SOURCE.QUEST,
    CHOICE_SOURCE.STORY,
    CHOICE_SOURCE.KNOWLEDGE,
    CHOICE_SOURCE.NPC,
    CHOICE_SOURCE.COMBAT,
    CHOICE_SOURCE.EXPLORATION,
    CHOICE_SOURCE.CLASS,
    CHOICE_SOURCE.RELATIONSHIP,
    CHOICE_SOURCE.MEMORY,
    CHOICE_SOURCE.MOVE,
    CHOICE_SOURCE.GENERAL,
  ];
  return order.indexOf(source);
}
