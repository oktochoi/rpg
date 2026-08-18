import type { Command } from '../core/command';
import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import type { NpcId } from '../core/ids';
import { sceneIdForAftermathChoice } from '../core/reducer';
import { eventsForGrantFact, eventsForPlayerDiscoveredFact, eventsForRecordedFact, eventsForShareFact } from '../knowledge/knowledge-service';
import { actorKnowsFact } from '../knowledge/knowledge-selectors';
import { isTalkChoice, npcIdFromTalkKey } from '../npc/talk-choices';
import { eventsForBeginFreeAction, eventsForCommitFreeAction } from '../actions/action-rules';
import { eventsForRest, canRest } from '../time/day-rules';
import { eventsForUseItem } from '../inventory/item-rules';
import { eventsForEquipItem, eventsForUnequipSlot, eventsForAdvancementStarter, canEquipItem } from '../inventory/equipment-rules';
import { eventsForEnhanceEquipment, enhanceBlockedReason } from '../inventory/enhancement-rules';
import { eventsForDialogueConsumption } from '../dialogue/dialogue-effects';
import { currentShopId, eventsForBuyItem, buyBlockedReason, eventsForSellItem, sellBlockedReason } from '../economy/shop-rules';
import { isEncounterCleared } from '../combat/encounters/encounter-progress';
import { playerHasItem } from '../player/player-state';
import { canChooseFirstAdvancement } from '../player/classes/first-advancement';
import { PLAYER_CLASS_ID } from '../player/classes';
import { lookAroundResult } from '../world/living-luen';
import { isNpcDuelCombatId } from '../actions/action-validator';
import { ENCOUNTER_ID, isStartableCombatId } from '../combat/encounters/encounter-definitions';
import { getQuestDefinition, QUEST_ID, RUINS_SEAL_FACT_ID } from '../quests/quest-definitions';
import { requirementsMet } from '../quests/quest-selectors';
import {
  CHOICE_ACCEPT_RUINS_MYSTERY,
  CHOICE_ENTER_RUINS,
  CHOICE_FIGHT_RUINS_MIXED,
  CHOICE_REPORT_RUINS,
  storyChoicesForState,
} from '../quests/quest-story-choices';
import {
  CHOICE_INVESTIGATE_ALTAR,
  CHOICE_INVESTIGATE_AREA,
  CHOICE_LOOK_AROUND,
  CHOICE_OPEN_SHOP,
  CHOICE_FIGHT_FOREST_GOBLIN,
  CHOICE_PASS_GATE,
  CHOICE_REGISTER_GUILD,
  locationChoiceDestination,
} from '../world/locations/location-story-choices';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { eventsForMoveToLocation, validateMoveToLocation } from '../world/locations/location-rules';
import { isKnownLocationId } from '../world/locations/location-definitions';
import { isNpcAtCurrentLocation, worldFlag } from '../world/locations/location-selectors';
import { eventsForExplorationPoint, resolveExplorationForInvestigate } from '../world/exploration/exploration-service';
import { QUEST_OBJECTIVE_TYPE, QUEST_STATUS } from '../quests/quest-types';
import {
  CHOICE_FIGHT_GOBLIN,
  CHOICE_FLEE_GOBLIN,
  CHOICE_REST,
  CHOICE_WATCH_GOBLIN,
  SCENE_GOBLIN_INTRO,
  TEST_GOBLIN_COMBAT_ID,
} from '../story/test-scenes';
import { createCombatFacts } from '../world/facts/fact-service';
import {
  eventsForRelationshipRequests,
  relationshipRequestsForCombat,
  relationshipRequestsForShare,
} from '../relationships/relationship-service';
import { eventsForMemoryRecall, eventsForMemoryRequests } from '../npc/memory/memory-service';
import { saveBlockedReason } from '../save/save-types';
import { getStorySceneDefinition, STORY_SCENE_ID } from '../story/story-scene-definitions';
import { findAvailableChoiceDefinition } from '../story/story-choice-service';
import type { StoryChoiceDefinition } from '../story/story-scene-types';
import { candidateIdFromChoiceId, CHOICE_INTENT } from '../story/choices/choice-types';
import { findLiveCandidate, revalidateCandidate } from '../story/choices/choice-revalidation';
import type { MenuId } from '../core/command';
import type { SaveSlotId } from '../core/ids';
import type { RuleResult, RulesEngine } from './rules-engine';
import { eventsForAllocateStat, canAllocateStat } from '../player/stats/stat-rules';
import { isStatId } from '../player/stats/stat-types';

function reject(reason: string): RuleResult {
  return { allowed: false, events: [], reason };
}

function allow(events: readonly GameEvent[]): RuleResult {
  return { allowed: true, events };
}

function isStoryInputBlocked(state: Readonly<GameState>): boolean {
  return state.mode === 'COMBAT' || state.mode === 'RESOLVING';
}

export function createRulesEngine(): RulesEngine {
  return {
    evaluate(command: Command, state: Readonly<GameState>): RuleResult {
      switch (command.type) {
        case 'START_COMBAT':
          return evaluateStartCombat(command.combatId, state);
        case 'RESOLVE_COMBAT':
          return evaluateResolveCombat(command, state);
        case 'SELECT_CHOICE':
          return evaluateSelectChoice(command.choiceId, state);
        case 'SELECT_DYNAMIC_CHOICE':
          return evaluateSelectDynamicChoice(command, state);
        case 'SUBMIT_FREE_INPUT':
        case 'FREE_ACTION':
          return evaluateBeginFreeAction(command, state);
        case 'COMMIT_FREE_ACTION':
          return evaluateCommitFreeAction(command, state);
        case 'SHARE_FACT':
          return evaluateShareFact(command, state);
        case 'GRANT_FACT':
          return evaluateGrantFact(command, state);
        case 'START_DIALOGUE':
          return evaluateStartDialogue(command.npcId, state);
        case 'END_DIALOGUE':
          return evaluateEndDialogue(state);
        case 'RECORD_DIALOGUE':
          return evaluateRecordDialogue(command, state);
        case 'SET_RELATIONSHIP':
          return evaluateSetRelationship(command, state);
        case 'SET_PLAYER_GOLD':
          if (isStoryInputBlocked(state)) {
            return reject('지금은 상태를 바꿀 수 없습니다.');
          }
          return allow([{ type: 'PLAYER_GOLD_UPDATED', gold: command.gold }]);
        case 'SET_PLAYER_CLASS':
          if (isStoryInputBlocked(state)) {
            return reject('지금은 상태를 바꿀 수 없습니다.');
          }
          return allow([{ type: 'PLAYER_CLASS_UPDATED', classId: command.classId }]);
        case 'ACCEPT_QUEST':
          return evaluateAcceptQuest(command.questId, state);
        case 'COMPLETE_QUEST':
          return evaluateCompleteQuest(command.questId, state);
        case 'FAIL_QUEST':
          return evaluateFailQuest(command.questId, state);
        case 'MOVE_TO_LOCATION':
          return evaluateMoveToLocation(command.locationId, state);
        case 'MOVE_NPC':
          return evaluateMoveNpc(command.npcId, command.locationId, state);
        case 'ENTER_STORY_SCENE':
          return evaluateEnterStoryScene(command.sceneId, state);
        case 'OPEN_MENU':
          return evaluateOpenMenu(command.menu, state);
        case 'CLOSE_MENU':
          return allow([{ type: 'MENU_CLOSED' }]);
        case 'SAVE_GAME':
          return evaluateSaveGame(command.slotId, state);
        case 'LOAD_GAME':
          return evaluateLoadGame(state);
        case 'DELETE_SAVE':
          return allow([{ type: 'SAVE_NOTICE', message: '저장 데이터를 삭제했습니다.' }]);
        case 'NEW_GAME':
          if (state.mode === 'COMBAT') {
            return reject('전투 중에는 새 게임을 시작할 수 없습니다.');
          }
          return allow([{ type: 'GAME_STARTED', name: command.name }]);
        case 'CHOOSE_CLASS_PATH': {
          return evaluateChooseClassPath(command.classId, state);
        }
        case 'REST':
          return evaluateRest(state);
        case 'USE_ITEM':
          return evaluateUseItem(command.itemId, state);
        case 'EQUIP_ITEM':
          return evaluateEquipItem(command.itemId, state);
        case 'UNEQUIP_ITEM':
          return evaluateUnequipItem(command.slot, state);
        case 'BUY_ITEM':
          return evaluateBuyItem(command.itemId, state);
        case 'SELL_ITEM':
          return evaluateSellItem(command.itemId, command.quantity ?? 1, state);
        case 'ENHANCE_EQUIPMENT':
          return evaluateEnhanceEquipment(command.itemId, state);
        case 'ALLOCATE_STAT_POINT':
          return evaluateAllocateStatPoint(command.statId, state);
        case 'CONTINUE_STORY':
          return evaluateContinueStory(state);
        case 'END_COMBAT':
          return reject('전투는 RESOLVE_COMBAT으로만 종료합니다.');
        default:
          return reject('이번 STEP에서 처리하지 않는 Command입니다.');
      }
    },
  };
}

function evaluateStartCombat(combatId: string, state: Readonly<GameState>): RuleResult {
  if (state.mode === 'COMBAT' || state.activeCombatId !== null) {
    return reject('이미 전투가 진행 중입니다.');
  }
  if (state.mode !== 'STORY' && state.mode !== 'DIALOGUE') {
    return reject('현재 모드에서는 전투를 시작할 수 없습니다.');
  }
  if (!isStartableCombatId(combatId) && !isNpcDuelCombatId(combatId)) {
    return reject('알 수 없는 전투입니다.');
  }
  if (isEncounterCleared(state, combatId)) {
    return reject('이미 정리한 싸움이다.');
  }
  if (state.player.currentHp <= 0) {
    return reject('전투를 시작할 수 없는 상태입니다.');
  }
  return allow([{ type: 'COMBAT_STARTED', combatId }]);
}

function evaluateResolveCombat(
  command: Extract<Command, { type: 'RESOLVE_COMBAT' }>,
  state: Readonly<GameState>
): RuleResult {
  if (state.mode !== 'COMBAT' || state.activeCombatId === null) {
    return reject('진행 중인 전투가 없습니다.');
  }
  if (command.result.combatId !== state.activeCombatId) {
    return reject('전투 ID가 일치하지 않습니다.');
  }

    const remainingHp = Math.max(0, command.result.player.remainingHp);
  const resourceEvents: GameEvent[] = [{ type: 'PLAYER_COMBAT_HP_UPDATED', currentHp: remainingHp }];
  if (typeof command.result.player.remainingMp === 'number') {
    resourceEvents.push({
      type: 'PLAYER_COMBAT_MP_UPDATED',
      currentMp: Math.max(0, command.result.player.remainingMp),
    });
  }
  for (const itemId of command.result.consumedItemIds ?? []) {
    resourceEvents.push({ type: 'ITEM_CONSUMED', itemId });
  }

  if (command.result.outcome === 'VICTORY') {
    const defeatedEvents: GameEvent[] = command.result.defeatedEnemyIds.map((enemyId) => ({
      type: 'ENEMY_DEFEATED',
      enemyId,
    }));
    const combatFacts = createCombatFacts(state, command.result);
    const requests = relationshipRequestsForCombat(state, command.result);
    const factIds = combatFacts.map((fact) => fact.id);
    return allow([
      ...resourceEvents,
      ...defeatedEvents,
      {
        type: 'COMBAT_WON',
        combatId: command.result.combatId,
        defeatedEnemyIds: command.result.defeatedEnemyIds,
      },
      ...combatFacts.flatMap(eventsForRecordedFact),
      { type: 'COMBAT_ENDED', combatId: command.result.combatId },
      ...eventsForRelationshipRequests(state, requests),
      ...eventsForMemoryRequests(state, requests, factIds),
    ]);
  }

  return allow([
    ...resourceEvents,
    { type: 'PLAYER_DEFEATED' },
    { type: 'COMBAT_LOST', combatId: command.result.combatId },
    ...createCombatFacts(state, command.result).flatMap(eventsForRecordedFact),
    { type: 'COMBAT_ENDED', combatId: command.result.combatId },
  ]);
}

function evaluateShareFact(
  command: Extract<Command, { type: 'SHARE_FACT' }>,
  state: Readonly<GameState>
): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('Combat 중에는 정보를 전달할 수 없습니다.');
  }
  if (!state.world.facts.some((fact) => fact.id === command.factId)) {
    return reject('존재하지 않는 사실입니다.');
  }
  if (!actorKnowsFact(state, command.fromId, command.factId)) {
    return reject('전달자가 해당 사실을 모릅니다.');
  }
  if (!state.npcs[command.toId]) {
    return reject('대상 NPC가 없습니다.');
  }

  const events = eventsForShareFact(state, {
    factId: command.factId,
    fromId: command.fromId,
    toId: command.toId,
  });
  if (events.length === 0) {
    return reject('이미 알고 있거나 전달할 수 없습니다.');
  }
  return allow([
    ...events,
    ...eventsForRelationshipRequests(
      state,
      relationshipRequestsForShare(command.fromId, command.toId, command.factId)
    ),
  ]);
}

function evaluateGrantFact(
  command: Extract<Command, { type: 'GRANT_FACT' }>,
  state: Readonly<GameState>
): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('Combat 중에는 정보를 부여할 수 없습니다.');
  }
  const events = eventsForGrantFact(state, command.npcId, command.factId);
  if (events.length === 0) {
    return reject('사실을 부여할 수 없습니다.');
  }
  return allow(events);
}

function evaluateStartDialogue(npcId: NpcId, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('Combat 중에는 대화를 시작할 수 없습니다.');
  }
  if (!state.npcs[npcId]) {
    return reject('대화할 수 없는 대상입니다.');
  }
  if (!isNpcAtCurrentLocation(state, npcId)) {
    return reject('현재 장소에 해당 대상이 없습니다.');
  }
  return allow([{ type: 'DIALOGUE_STARTED', npcId }]);
}

function evaluateRecordDialogue(
  command: Extract<Command, { type: 'RECORD_DIALOGUE' }>,
  state: Readonly<GameState>
): RuleResult {
  if (state.mode === 'COMBAT') {
    return reject('Combat 중에는 대화를 기록할 수 없습니다.');
  }
  if (!state.npcs[command.npcId]) {
    return reject('대화할 수 없는 대상입니다.');
  }
  if (!isNpcAtCurrentLocation(state, command.npcId)) {
    return reject('현재 장소에 해당 대상이 없습니다.');
  }
  return allow([
    {
      type: 'DIALOGUE_TURN_RECORDED',
      npcId: command.npcId,
      playerText: command.playerText,
      npcText: command.npcText,
    },
    ...eventsForMemoryRecall(command.npcId, command.usedMemoryIds ?? [], state.world.turn),
  ]);
}

function evaluateSetRelationship(
  command: Extract<Command, { type: 'SET_RELATIONSHIP' }>,
  state: Readonly<GameState>
): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('Combat 중에는 관계를 변경할 수 없습니다.');
  }
  if (!state.npcs[command.npcId]) {
    return reject('대상 NPC가 없습니다.');
  }
  return allow([
    {
      type: 'RELATIONSHIP_UPDATED',
      npcId: command.npcId,
      trust: command.trust,
      fear: command.fear,
      respect: command.respect,
      affection: command.affection,
    },
  ]);
}

function evaluateEnterStoryScene(sceneId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 Scene을 변경할 수 없습니다.');
  }
  const definition = getStorySceneDefinition(sceneId);
  if (!definition) {
    return reject('존재하지 않는 Scene입니다.');
  }
  if (definition.locationId !== state.world.currentLocationId) {
    return reject('현재 장소에서 들어갈 수 없는 Scene입니다.');
  }
  if (state.story.currentSceneId === sceneId) {
    return allow([]);
  }
  return allow([{ type: 'STORY_SCENE_ENTERED', sceneId }]);
}

function evaluateContinueStory(state: Readonly<GameState>, nextSceneId?: string): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 이야기를 이어갈 수 없습니다.');
  }
  if (state.mode !== 'STORY' && state.mode !== 'DIALOGUE') {
    return reject('현재 모드에서는 이야기를 이어갈 수 없습니다.');
  }
  const scene = getStorySceneDefinition(state.story.currentSceneId);
  const continueChoice = scene?.choices.find((choice) => choice.action.type === 'CONTINUE');
  const next =
    nextSceneId ??
    scene?.continueTo ??
    (continueChoice?.action.type === 'CONTINUE' ? continueChoice.action.nextSceneId : undefined);
  if (!next && !scene?.autoContinue && !continueChoice) {
    return reject('지금은 이어서 진행할 장면이 없다.');
  }
  const events: GameEvent[] = [{ type: 'STORY_CONTINUED', sceneId: next }];
  if (next && next !== state.story.currentSceneId) {
    events.push({ type: 'STORY_SCENE_ENTERED', sceneId: next });
  }
  return allow(events);
}

function evaluateAllocateStatPoint(statId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 능력치를 올릴 수 없습니다.');
  }
  const check = canAllocateStat(state, statId);
  if (!check.allowed) {
    return reject(check.reason ?? '남은 능력치 포인트가 없다.');
  }
  if (!isStatId(statId)) {
    return reject('알 수 없는 능력치다.');
  }
  return allow(eventsForAllocateStat(state, statId));
}

function evaluateStoryChoice(
  choiceId: string,
  choice: StoryChoiceDefinition,
  state: Readonly<GameState>
): RuleResult {
  if (choice.id === 'skip_forest_ambush' || choiceId === 'skip_forest_ambush') {
    return allow([
      { type: 'CHOICE_RESOLVED', choiceId },
      { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.FOREST_AMBUSH_CLEARED, value: true },
      { type: 'ENCOUNTER_CLEARED', encounterId: ENCOUNTER_ID.CH1_FOREST_AMBUSH },
      {
        type: 'ACTION_RESOLVED',
        turnId: state.world.turn,
        resolution: {
          success: true,
          actionType: 'MOVE',
          narrative: '활 시위 소리를 피해 길을 따른다.',
          nextMode: 'STORY',
        },
      },
    ]);
  }
  const action = choice.action;
  if (action.type === 'MOVE_TO_LOCATION') {
    return evaluateMoveChoice(choiceId, action.locationId, state);
  }
  if (action.type === 'START_COMBAT') {
    const combat = evaluateStartCombat(action.combatId, state);
    if (!combat.allowed) {
      return combat;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...combat.events]);
  }
  if (action.type === 'SHARE_FACT') {
    const share = evaluateShareFact(
      { type: 'SHARE_FACT', factId: action.factId, fromId: 'player', toId: action.toId },
      state
    );
    if (!share.allowed) {
      return share;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...share.events]);
  }
  if (action.type === 'ACCEPT_QUEST') {
    const accepted = evaluateAcceptQuest(action.questId, state);
    if (!accepted.allowed) {
      return accepted;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...accepted.events]);
  }
  if (action.type === 'INVESTIGATE') {
    return evaluateInvestigateChoice(choiceId, state, action.targetId);
  }
  if (action.type === 'LOOK_AROUND') {
    return allow(lookAroundEvents(choiceId, state));
  }
  if (action.type === 'CONTINUE') {
    return evaluateContinueStory(state, action.nextSceneId ?? choice.nextSceneId);
  }
  if (action.type === 'REST') {
    const rested = evaluateRest(state);
    if (!rested.allowed) {
      return rested;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...rested.events]);
  }
  if (action.type === 'OPEN_SHOP') {
    return evaluateOpenMenu('shop', state);
  }
  if (action.type === 'CHOOSE_CLASS_PATH') {
    return evaluateChooseClassPath(action.classId, state);
  }
  if (action.type === 'PASS_GATE') {
    const open = worldFlag(state, WORLD_FLAG.NORTHERN_GATE_OPEN);
    return allow([
      { type: 'CHOICE_RESOLVED', choiceId },
      {
        type: 'ACTION_RESOLVED',
        turnId: state.world.turn,
        resolution: {
          success: false,
          actionType: 'MOVE',
          narrative: open
            ? '문 너머의 길은 아직 열리지 않았다. 하지만 북문의 그림자가 드리우기 시작했다.'
            : '지금은 문을 통과할 수 없다.',
          nextMode: 'STORY',
        },
      },
    ]);
  }
  if (action.type === 'ENTER_SCENE') {
    const entered = evaluateEnterStoryScene(action.sceneId, state);
    if (!entered.allowed) {
      return entered;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...entered.events]);
  }
  if (action.type === 'TALK') {
    const npcId = npcIdFromTalkKey(choiceId, action.promptId) ?? state.story.currentNpcId ?? undefined;
    return allow([
      { type: 'CHOICE_RESOLVED', choiceId },
      ...eventsForDialogueConsumption(state, {
        npcId,
        promptId: action.promptId ?? choiceId,
      }),
      {
        type: 'ACTION_RESOLVED',
        turnId: state.world.turn,
        resolution: {
          success: true,
          actionType: 'TALK',
          narrative: '대화를 나눈다.',
          nextMode: 'STORY',
        },
      },
    ]);
  }
  if (action.type === 'LEARN_FACT') {
    const learned = eventsForPlayerDiscoveredFact(state, action.factId);
    const events: GameEvent[] = [
      { type: 'CHOICE_RESOLVED', choiceId },
      ...learned,
      {
        type: 'ACTION_RESOLVED',
        turnId: state.world.turn,
        resolution: {
          success: true,
          actionType: 'ASK',
          narrative: '그 선택은 기억에 남는다.',
          nextMode: 'STORY',
        },
      },
    ];
    if (choice.nextSceneId) {
      const entered = evaluateEnterStoryScene(choice.nextSceneId, state);
      if (entered.allowed) {
        events.push(...entered.events);
      }
    }
    return allow(events);
  }
  if (choice.nextSceneId) {
    const entered = evaluateEnterStoryScene(choice.nextSceneId, state);
    if (!entered.allowed) {
      return entered;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...entered.events]);
  }
  return allow([{ type: 'CHOICE_RESOLVED', choiceId }]);
}

function evaluateSelectDynamicChoice(
  command: Extract<Command, { type: 'SELECT_DYNAMIC_CHOICE' }>,
  state: Readonly<GameState>
): RuleResult {
  if (command.turnId !== state.world.turn) {
    return reject('STALE_DIRECTOR_RESPONSE');
  }
  if (isStoryInputBlocked(state)) {
    return reject('지금은 선택지를 고를 수 없습니다.');
  }
  if (state.mode !== 'STORY' && state.mode !== 'DIALOGUE') {
    return reject('현재 모드에서는 선택지를 고를 수 없습니다.');
  }
  const candidateId = command.candidateId || candidateIdFromChoiceId(command.choiceId, command.turnId);
  if (!candidateId) {
    return reject('지금은 그 행동을 할 수 없다.');
  }
  const candidate = findLiveCandidate(state, candidateId);
  if (!candidate) {
    return reject('지금은 그 행동을 할 수 없다.');
  }
  const check = revalidateCandidate(state, candidate);
  if (!check.ok) {
    return reject(check.reason);
  }

  const isTalk =
    (candidate.actionType === 'TALK' || candidate.actionType === 'ASK') &&
    candidate.intent !== CHOICE_INTENT.SHARE_INFORMATION;
  if (candidate.id.startsWith('npc_end_') || candidate.metadata?.promptId === 'end_dialogue') {
    const ended = evaluateEndDialogue(state);
    if (!ended.allowed) {
      return ended;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId: command.choiceId }, ...ended.events]);
  }
  if (isTalk) {
    const npcId = candidate.targetId ?? state.story.currentNpcId ?? 'seria';
    return allow([
      { type: 'ACTION_RESOLVE_STARTED', turnId: command.turnId, input: candidate.textTemplate },
      { type: 'CHOICE_RESOLVED', choiceId: command.choiceId },
      ...eventsForDialogueConsumption(state, {
        npcId,
        topicId: candidate.metadata?.topicId,
        promptId: candidate.metadata?.promptId,
        semanticKey: candidate.semanticKey,
      }),
      { type: 'DIALOGUE_STARTED', npcId },
    ]);
  }

  if (candidate.metadata?.storyChoiceId) {
    return evaluateSelectChoice(candidate.metadata.storyChoiceId, state);
  }

  const storyAction = candidate.metadata?.storyAction;
  if (storyAction) {
    const synthetic: StoryChoiceDefinition = {
      id: command.choiceId,
      text: candidate.textTemplate,
      action: storyAction,
    };
    return evaluateStoryChoice(command.choiceId, synthetic, state);
  }

  if (candidate.actionType === 'MOVE' && candidate.targetId) {
    return evaluateMoveChoice(command.choiceId, candidate.targetId, state);
  }
  if (candidate.actionType === 'ATTACK') {
    const combatId = candidate.metadata?.encounterId ?? candidate.targetId;
    if (!combatId) {
      return reject('알 수 없는 전투입니다.');
    }
    const combat = evaluateStartCombat(combatId, state);
    if (!combat.allowed) {
      return combat;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId: command.choiceId }, ...combat.events]);
  }
  if (candidate.actionType === 'HELP' && candidate.targetId) {
    const accepted = evaluateAcceptQuest(candidate.targetId, state);
    if (!accepted.allowed) {
      return accepted;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId: command.choiceId }, ...accepted.events]);
  }
  if (candidate.actionType === 'INVESTIGATE') {
    return evaluateInvestigateChoice(
      command.choiceId,
      state,
      candidate.metadata?.explorationPointId ?? candidate.targetId
    );
  }
  return allow([
    { type: 'CHOICE_RESOLVED', choiceId: command.choiceId },
    {
      type: 'ACTION_RESOLVED',
      turnId: state.world.turn,
      resolution: {
        success: true,
        actionType: candidate.actionType,
        narrative: candidate.textTemplate,
        nextMode: 'STORY',
      },
    },
  ]);
}

function evaluateSelectChoice(choiceId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('Combat 중에는 Story 입력을 받을 수 없습니다.');
  }
  if (state.mode !== 'STORY' && state.mode !== 'DIALOGUE') {
    return reject('현재 모드에서는 선택지를 고를 수 없습니다.');
  }

  const storyChoice = findAvailableChoiceDefinition(state, choiceId);
  if (storyChoice) {
    return evaluateStoryChoice(choiceId, storyChoice, state);
  }

  if (choiceId === 'intro_square' || choiceId === 'intro_guild' || choiceId === 'intro_inn' || choiceId === 'intro_continue') {
    return evaluateContinueStory(state, STORY_SCENE_ID.LUEN_VILLAGE_HUB);
  }
  if (choiceId === CHOICE_REGISTER_GUILD || choiceId === 'register_adventurer') {
    if (worldFlag(state, WORLD_FLAG.GUILD_REGISTERED)) {
      return allow([{ type: 'STORY_CONTINUED', sceneId: STORY_SCENE_ID.LUEN_GUILD }]);
    }
    return evaluateEnterStoryScene(STORY_SCENE_ID.LUEN_GUILD_REGISTER, state);
  }

  const knownChoice =
    state.story.choices.some((choice) => choice.id === choiceId) ||
    storyChoicesForState(state).some((choice) => choice.id === choiceId);
  if (!knownChoice) {
    return reject('현재 Scene에 없는 선택지입니다.');
  }

  if (choiceId === CHOICE_ACCEPT_RUINS_MYSTERY) {
    const accepted = evaluateAcceptQuest(QUEST_ID.RUINS_MYSTERY, state);
    if (!accepted.allowed) {
      return accepted;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...accepted.events]);
  }

  if (choiceId === CHOICE_ENTER_RUINS) {
    return evaluateMoveChoice(choiceId, LOCATION_ID.ANCIENT_RUINS, state);
  }

  const destination = locationChoiceDestination(choiceId);
  if (destination) {
    return evaluateMoveChoice(choiceId, destination, state);
  }

  if (choiceId === CHOICE_INVESTIGATE_ALTAR || choiceId === CHOICE_INVESTIGATE_AREA) {
    return evaluateInvestigateChoice(choiceId, state);
  }

  if (choiceId === CHOICE_LOOK_AROUND) {
    return allow(lookAroundEvents(choiceId, state));
  }

  if (choiceId === CHOICE_PASS_GATE) {
    const open = worldFlag(state, WORLD_FLAG.NORTHERN_GATE_OPEN);
    return allow([
      { type: 'CHOICE_RESOLVED', choiceId },
      {
        type: 'ACTION_RESOLVED',
        turnId: state.world.turn,
        resolution: {
          success: false,
          actionType: 'MOVE',
          narrative: open
            ? '문 너머의 길은 아직 열리지 않았다. 하지만 북문의 그림자가 드리우기 시작했다.'
            : '지금은 문을 통과할 수 없다.',
          nextMode: 'STORY',
        },
      },
    ]);
  }

  if (choiceId === CHOICE_FIGHT_RUINS_MIXED) {
    const combat = evaluateStartCombat(ENCOUNTER_ID.CH1_RUINS_GATE, state);
    if (!combat.allowed) {
      return combat;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...combat.events]);
  }
  if (choiceId === CHOICE_FIGHT_FOREST_GOBLIN || choiceId.startsWith(`${CHOICE_FIGHT_FOREST_GOBLIN}_`)) {
    const combat = evaluateStartCombat(ENCOUNTER_ID.CH1_FOREST_SCOUTS, state);
    if (!combat.allowed) {
      return combat;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...combat.events]);
  }
  if (choiceId === CHOICE_OPEN_SHOP) {
    return evaluateOpenMenu('shop', state);
  }

  if (choiceId === CHOICE_REPORT_RUINS) {
    const share = eventsForShareFact(state, {
      factId: RUINS_SEAL_FACT_ID,
      fromId: 'player',
      toId: 'seria',
    });
    const events: GameEvent[] = [{ type: 'CHOICE_RESOLVED', choiceId }, ...share];
    if (share.length > 0) {
      events.push(
        ...eventsForRelationshipRequests(
          state,
          relationshipRequestsForShare('player', 'seria', RUINS_SEAL_FACT_ID)
        )
      );
    }
    return allow(events);
  }

  if (isTalkChoice(choiceId)) {
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }]);
  }

  if (choiceId === CHOICE_FIGHT_GOBLIN) {
    const combat = evaluateStartCombat(TEST_GOBLIN_COMBAT_ID, state);
    if (!combat.allowed) {
      return combat;
    }
    return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...combat.events]);
  }

  if (choiceId === CHOICE_FLEE_GOBLIN || choiceId === CHOICE_WATCH_GOBLIN) {
    return allow([
      { type: 'CHOICE_RESOLVED', choiceId },
      { type: 'STORY_UPDATED', sceneId: SCENE_GOBLIN_INTRO },
    ]);
  }

  const events: GameEvent[] = [
    { type: 'CHOICE_RESOLVED', choiceId },
    { type: 'STORY_UPDATED', sceneId: sceneIdForAftermathChoice(choiceId) },
  ];

  if (choiceId === CHOICE_REST) {
    events.push({ type: 'PLAYER_COMBAT_HP_UPDATED', currentHp: state.player.maxHp });
  }

  return allow(events);
}

function evaluateBeginFreeAction(
  command: Extract<Command, { type: 'FREE_ACTION' } | { type: 'SUBMIT_FREE_INPUT' }>,
  state: Readonly<GameState>
): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 자유 입력을 받을 수 없습니다.');
  }
  if (state.mode !== 'STORY' && state.mode !== 'DIALOGUE') {
    return reject('현재 모드에서는 자유 입력을 할 수 없습니다.');
  }
  const turnId = command.type === 'FREE_ACTION' ? command.turnId : state.world.turn;
  const input = command.type === 'FREE_ACTION' ? command.input : command.text;
  if (turnId !== state.world.turn) {
    return reject('이전 차례의 입력입니다.');
  }
  return allow(eventsForBeginFreeAction(turnId, input));
}

function evaluateCommitFreeAction(
  command: Extract<Command, { type: 'COMMIT_FREE_ACTION' }>,
  state: Readonly<GameState>
): RuleResult {
  if (state.mode !== 'RESOLVING') {
    return reject('처리할 자유 입력이 없습니다.');
  }
  if (state.pendingFreeActionTurnId !== command.turnId || command.turnId !== state.world.turn) {
    return reject('이전 차례의 입력입니다.');
  }
  if (command.payload.gold && state.player.gold < command.payload.gold.amount) {
    return reject('가진 금화가 부족하다.');
  }
  const advancement = parseFirstAdvancementInput(command.rawInput);
  if (canChooseFirstAdvancement(state) && advancement === 'invalid') {
    return reject('그런 길은 없다. 검사, 마법사, 도적 중에서 고르라.');
  }
  if (canChooseFirstAdvancement(state) && advancement && advancement !== 'invalid') {
    return evaluateChooseClassPath(advancement, state);
  }
  return allow(eventsForCommitFreeAction(state, command.payload, command.rawInput));
}

function evaluateMoveToLocation(locationId: string, state: Readonly<GameState>): RuleResult {
  const check = validateMoveToLocation(state, locationId);
  if (!check.allowed) {
    return reject(check.reason ?? '지금은 이동할 수 없습니다.');
  }
  return allow(eventsForMoveToLocation(state, locationId));
}

function evaluateMoveChoice(choiceId: string, locationId: string, state: Readonly<GameState>): RuleResult {
  const moved = evaluateMoveToLocation(locationId, state);
  if (!moved.allowed) {
    return moved;
  }
  return allow([{ type: 'CHOICE_RESOLVED', choiceId }, ...moved.events]);
}

function evaluateMoveNpc(npcId: NpcId, locationId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 NPC를 이동시킬 수 없습니다.');
  }
  const npc = state.npcs[npcId];
  if (!npc) {
    return reject('존재하지 않는 NPC입니다.');
  }
  if (!isKnownLocationId(locationId)) {
    return reject('그곳으로 가는 길은 아직 알지 못한다.');
  }
  if (npc.locationId === locationId) {
    return reject('이미 그 장소에 있다.');
  }
  return allow([
    {
      type: 'NPC_MOVED',
      npcId,
      fromLocationId: npc.locationId,
      toLocationId: locationId,
    },
  ]);
}

function evaluateInvestigateChoice(choiceId: string, state: Readonly<GameState>, targetId?: string): RuleResult {
  const input = choiceId === CHOICE_INVESTIGATE_ALTAR ? '부서진 제단을 조사한다.' : '주변을 조사한다.';
  const resolved = resolveExplorationForInvestigate(state, input, targetId);
  const events: GameEvent[] = [
    { type: 'CHOICE_RESOLVED', choiceId },
    { type: 'AREA_INVESTIGATED', locationId: state.world.currentLocationId },
  ];
  if (resolved.point && resolved.alreadyExplored) {
    events.push({
      type: 'ACTION_RESOLVED',
      turnId: state.world.turn,
      resolution: {
        success: true,
        actionType: 'INVESTIGATE',
        narrative: '이미 살펴본 곳이다.',
        nextMode: 'STORY',
      },
    });
    return allow(events);
  }
  if (resolved.point) {
    events.push(...eventsForExplorationPoint(state, resolved.point));
    events.push({
      type: 'ACTION_RESOLVED',
      turnId: state.world.turn,
      resolution: {
        success: true,
        actionType: 'INVESTIGATE',
        narrative: resolved.point.description,
        nextMode: 'STORY',
      },
    });
    return allow(events);
  }
  events.push({
    type: 'ACTION_RESOLVED',
    turnId: state.world.turn,
    resolution: {
      success: true,
      actionType: 'INVESTIGATE',
      narrative: '주변을 살핀다. 당장은 더 눈에 띄는 것이 없다.',
      nextMode: 'STORY',
    },
  });
  return allow(events);
}

function evaluateAcceptQuest(questId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 퀘스트를 받을 수 없습니다.');
  }
  const quest = state.quests[questId];
  if (!quest) {
    return reject('존재하지 않는 퀘스트입니다.');
  }
  if (quest.status === QUEST_STATUS.ACTIVE || quest.status === QUEST_STATUS.COMPLETED) {
    return reject('이미 진행 중이거나 완료된 퀘스트입니다.');
  }
  const definition = getQuestDefinition(questId);
  if (quest.status === QUEST_STATUS.LOCKED) {
    if (!definition || !requirementsMet(state, definition.prerequisites)) {
      return reject('아직 받을 수 없는 퀘스트입니다.');
    }
  } else if (quest.status !== QUEST_STATUS.AVAILABLE) {
    return reject('아직 받을 수 없는 퀘스트입니다.');
  }
  const events: GameEvent[] = [];
  if (quest.status === QUEST_STATUS.LOCKED) {
    events.push({ type: 'QUEST_AVAILABLE', questId });
  }
  events.push({ type: 'QUEST_STARTED', questId });
  const talkWithTopic = definition?.objectives.find(
    (objective) => objective.type === QUEST_OBJECTIVE_TYPE.TALK_TO_NPC && Boolean(objective.conversationTopicId)
  );
  const talkNpcId = talkWithTopic?.targetId ?? (talkWithTopic ? quest.requesterNpcId : undefined);
  if (talkNpcId) {
    events.push({
      type: 'DIALOGUE_TURN_RECORDED',
      npcId: talkNpcId,
      playerText: '내가 조사해볼게.',
      npcText: '부탁할게.',
    });
  }
  return allow(events);
}

function evaluateCompleteQuest(questId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 퀘스트를 완료할 수 없습니다.');
  }
  const quest = state.quests[questId];
  if (!quest) {
    return reject('존재하지 않는 퀘스트입니다.');
  }
  if (quest.status === QUEST_STATUS.COMPLETED) {
    return reject('이미 완료된 퀘스트입니다.');
  }
  return allow([{ type: 'QUEST_COMPLETED', questId }]);
}

function evaluateFailQuest(questId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 퀘스트를 실패 처리할 수 없습니다.');
  }
  const quest = state.quests[questId];
  if (!quest) {
    return reject('존재하지 않는 퀘스트입니다.');
  }
  if (quest.status === QUEST_STATUS.COMPLETED || quest.status === QUEST_STATUS.FAILED) {
    return reject('이미 끝난 퀘스트입니다.');
  }
  return allow([{ type: 'QUEST_FAILED', questId }]);
}

function evaluateOpenMenu(menu: MenuId | undefined, state: Readonly<GameState>): RuleResult {
  if (state.mode === 'COMBAT') {
    return reject('전투 중에는 메뉴를 열 수 없습니다.');
  }
  if (!menu) {
    return reject('열 메뉴가 없습니다.');
  }
  if (menu === 'shop') {
    if (!currentShopId(state)) {
      return reject('상점 안에서만 거래할 수 있다.');
    }
  }
  return allow([{ type: 'MENU_OPENED', menu }]);
}

function evaluateSaveGame(slotId: SaveSlotId, state: Readonly<GameState>): RuleResult {
  const blocked = saveBlockedReason(state);
  if (blocked) {
    return reject(blocked);
  }
  return allow([{ type: 'GAME_SAVED', slotId }]);
}

function evaluateLoadGame(state: Readonly<GameState>): RuleResult {
  if (state.mode === 'COMBAT') {
    return reject('전투 중에는 불러올 수 없습니다.');
  }
  if (state.mode === 'RESOLVING') {
    return reject('지금은 불러올 수 없습니다.');
  }
  return allow([]);
}

function evaluateRest(state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 쉴 수 없습니다.');
  }
  const events = eventsForRest(state);
  if (events.length === 0) {
    return reject(canRest(state).reason ?? '여관에서만 하루를 쉴 수 있다.');
  }
  return allow(events);
}

function evaluateUseItem(itemId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 물건을 쓸 수 없습니다.');
  }
  if (!playerHasItem(state.player, itemId)) {
    return reject('그런 물건을 가지고 있지 않다.');
  }
  const events = eventsForUseItem(state, itemId);
  if (events.length === 0) {
    return reject('그 물건을 쓸 수 없다.');
  }
  return allow(events);
}

function evaluateChooseClassPath(classId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 전직할 수 없습니다.');
  }
  if (!canChooseFirstAdvancement(state)) {
    return reject('아직 길을 정할 때가 아니다.');
  }
  if (
    classId !== PLAYER_CLASS_ID.WARRIOR &&
    classId !== PLAYER_CLASS_ID.MAGE &&
    classId !== PLAYER_CLASS_ID.ROGUE
  ) {
    return reject('선택할 수 없는 길이다.');
  }
  return allow([
    { type: 'PLAYER_CLASS_UPDATED', classId },
    ...eventsForAdvancementStarter({ ...state, player: { ...state.player, classId } }, classId),
    { type: 'PLAYER_CLASS_PATH_CHOSEN', classId },
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.FIRST_ADVANCEMENT_DONE, value: true },
  ]);
}

function evaluateEquipItem(itemId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 장비를 바꿀 수 없습니다.');
  }
  const check = canEquipItem(state, itemId);
  if (!check.allowed) {
    return reject(check.reason ?? '장착할 수 없다.');
  }
  const events = eventsForEquipItem(state, itemId);
  if (events.length === 0) {
    return reject('이미 장착한 물건이다.');
  }
  return allow(events);
}

function evaluateUnequipItem(slot: 'WEAPON' | 'ARMOR' | 'ACCESSORY', state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 장비를 바꿀 수 없습니다.');
  }
  const events = eventsForUnequipSlot(state, slot);
  if (events.length === 0) {
    return reject('벗을 장비가 없다.');
  }
  return allow(events);
}

function evaluateBuyItem(itemId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 거래할 수 없습니다.');
  }
  const blocked = buyBlockedReason(state, itemId);
  if (blocked) {
    return reject(blocked);
  }
  return allow(eventsForBuyItem(state, itemId));
}

function evaluateEndDialogue(state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 대화를 끝낼 수 없습니다.');
  }
  return allow([{ type: 'DIALOGUE_ENDED', npcId: state.story.currentNpcId ?? 'seria' }]);
}

function evaluateEnhanceEquipment(itemId: string, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 강화할 수 없습니다.');
  }
  const blocked = enhanceBlockedReason(state, itemId);
  if (blocked) {
    return reject(blocked);
  }
  return allow(eventsForEnhanceEquipment(state, itemId));
}

function evaluateSellItem(itemId: string, quantity: number, state: Readonly<GameState>): RuleResult {
  if (isStoryInputBlocked(state)) {
    return reject('지금은 거래할 수 없습니다.');
  }
  const blocked = sellBlockedReason(state, itemId, quantity);
  if (blocked) {
    return reject(blocked);
  }
  return allow(eventsForSellItem(state, itemId, quantity));
}

function lookAroundEvents(choiceId: string, state: Readonly<GameState>): GameEvent[] {
  const result = lookAroundResult(state);
  return [
    { type: 'CHOICE_RESOLVED', choiceId },
    ...result.events,
    {
      type: 'ACTION_RESOLVED',
      turnId: state.world.turn,
      resolution: {
        success: true,
        actionType: 'INVESTIGATE',
        narrative: result.narrative,
        nextMode: 'STORY',
      },
    },
  ];
}

function parseFirstAdvancementInput(text: string): typeof PLAYER_CLASS_ID.WARRIOR | typeof PLAYER_CLASS_ID.MAGE | typeof PLAYER_CLASS_ID.ROGUE | 'invalid' | null {
  const normalized = text.replace(/\s+/g, '');
  if (/검사|전사|sword|warrior/i.test(normalized)) {
    return PLAYER_CLASS_ID.WARRIOR;
  }
  if (/마법|mage|wizard/i.test(normalized)) {
    return PLAYER_CLASS_ID.MAGE;
  }
  if (/도적|rogue|도둑/i.test(normalized)) {
    return PLAYER_CLASS_ID.ROGUE;
  }
  if (/길|전직|직업|된다/.test(normalized)) {
    return 'invalid';
  }
  return null;
}
