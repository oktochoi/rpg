import { ACTION_TYPES, type ActionResolution, type ActionType } from '../actions/action-types';
import type { GameMode } from '../core/game-mode';
import type { NPCMemory, MemoryEmotion, NPCMemoryType } from '../npc/memory/memory-types';
import type { KnowledgeSourceType, NpcKnowledgeEntry } from '../npc/npc-knowledge';
import type { NpcState } from '../npc/npc-state';
import type { RelationshipState } from '../npc/relationship';
import type { InventoryItem, PlayerSkill, PlayerState, SkillUseContext } from '../player/player-state';
import { getPlayerClass, isPlayerClassId, PLAYER_CLASS_ID, baseRankIdForClass } from '../player/classes';
import { migrateQuestStatus } from '../quests/quest-types';
import { allQuestDefinitions, getQuestDefinition } from '../quests/quest-definitions';
import { getItemDefinition } from '../inventory/item-definitions';
import { createQuestRuntime } from '../quests/quest-runtime';
import { emptyProgress } from '../quests/quest-selectors';
import type { QuestState } from '../story/quest-state';
import type { DialogueMessage, StoryState } from '../story/story-state';
import type { Choice } from '../story/choice';
import type { WorldState } from '../core/world-state';
import type { WorldFact, WorldFactType, PublicLevel } from '../world/facts/world-fact';
import { createInitialLocationRuntimes } from '../world/locations/location-runtime';
import { createLocationRuntime } from '../world/locations/location-runtime';
import type { LocationRuntimeState } from '../world/locations/location-types';
import type { HistoryEntry } from '../history/history-types';
import { totalMinutesForDayMorning } from '../time/clock-types';
import { SAVE_VERSION, type PersistedGameState, type SaveData } from './save-types';

const GAME_MODES: readonly GameMode[] = ['STORY', 'DIALOGUE', 'RESOLVING', 'COMBAT', 'MENU'];
const FACT_TYPES: readonly WorldFactType[] = [
  'NPC_MET',
  'NPC_HELPED',
  'NPC_ATTACKED',
  'ENEMY_DEFEATED',
  'COMBAT_WON',
  'COMBAT_LOST',
  'ITEM_OBTAINED',
  'LOCATION_DISCOVERED',
  'INFORMATION_REVEALED',
  'QUEST_STARTED',
  'QUEST_COMPLETED',
  'IMPORTANT_EVENT',
];
const PUBLIC_LEVELS: readonly PublicLevel[] = ['PRIVATE', 'LOCAL', 'PUBLIC'];
const SOURCE_TYPES: readonly KnowledgeSourceType[] = ['WITNESSED', 'TOLD_BY_PLAYER', 'TOLD_BY_NPC', 'PUBLIC_EVENT'];
const MEMORY_TYPES: readonly NPCMemoryType[] = [
  'PLAYER_HELPED_ME',
  'PLAYER_SAVED_ME',
  'PLAYER_ATTACKED_ME',
  'PLAYER_THREATENED_ME',
  'PLAYER_BETRAYED_ME',
  'PLAYER_KEPT_PROMISE',
  'PLAYER_BROKE_PROMISE',
  'PLAYER_GAVE_GIFT',
  'PLAYER_SHOWED_SKILL',
  'SHARED_EXPERIENCE',
  'IMPORTANT_CONVERSATION',
  'OTHER',
];
const MEMORY_EMOTIONS: readonly MemoryEmotion[] = [
  'GRATITUDE',
  'ANGER',
  'FEAR',
  'RESPECT',
  'TRUST',
  'SUSPICION',
  'SADNESS',
  'NEUTRAL',
];
const SKILL_CONTEXTS: readonly SkillUseContext[] = ['STORY', 'COMBAT', 'BOTH'];
const SPEAKERS: readonly DialogueMessage['speaker'][] = ['PLAYER', 'NPC'];

export function parseSaveData(value: unknown): SaveData | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.version !== 'number' || !Number.isFinite(value.version)) {
    return null;
  }
  if (typeof value.saveId !== 'string' || typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') {
    return null;
  }
  if (typeof value.playTimeSeconds !== 'number' || value.playTimeSeconds < 0) {
    return null;
  }
  const gameState = parsePersistedGameState(value.gameState);
  if (!gameState) {
    return null;
  }
  return {
    version: value.version,
    saveId: value.saveId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    playTimeSeconds: value.playTimeSeconds,
    gameState,
  };
}

export function parsePersistedGameState(value: unknown): PersistedGameState | null {
  if (!isRecord(value)) {
    return null;
  }
  if (!isGameMode(value.mode)) {
    return null;
  }
  const player = parsePlayer(value.player);
  const world = parseWorld(value.world);
  const npcs = parseNpcs(value.npcs);
  const relationships = parseRelationships(value.relationships);
  const quests = parseQuests(value.quests);
  const knowledge = parseKnowledge(value.knowledge);
  const npcMemories = parseNpcMemories(value.npcMemories);
  const story = parseStory(value.story);
  if (!player || !world || !npcs || !relationships || !quests || !knowledge || !npcMemories || !story) {
    return null;
  }
  if (!isStringArray(value.processedRelationshipSourceIds) || !isStringArray(value.processedMemorySourceIds)) {
    return null;
  }
  const lastActionResolution = parseLastAction(value.lastActionResolution);
  if (value.lastActionResolution !== null && lastActionResolution === undefined) {
    return null;
  }
  const playTimeSeconds =
    isRecord(value.meta) && typeof value.meta.playTimeSeconds === 'number' ? value.meta.playTimeSeconds : 0;

  return {
    meta: { playTimeSeconds },
    mode: value.mode,
    activeCombatId: value.activeCombatId === null || typeof value.activeCombatId === 'string' ? value.activeCombatId : null,
    pendingFreeActionTurnId:
      value.pendingFreeActionTurnId === null || typeof value.pendingFreeActionTurnId === 'number'
        ? value.pendingFreeActionTurnId
        : null,
    lastActionResolution: lastActionResolution ?? null,
    processedRelationshipSourceIds: value.processedRelationshipSourceIds,
    processedMemorySourceIds: value.processedMemorySourceIds,
    processedExpSourceIds: isStringArray(value.processedExpSourceIds) ? value.processedExpSourceIds : [],
    processedTurnRewardIds: isStringArray(value.processedTurnRewardIds) ? value.processedTurnRewardIds : [],
    processedRewardIds: isStringArray(value.processedRewardIds) ? value.processedRewardIds : [],
    actionRepeatCounts: parseStringNumberMap(value.actionRepeatCounts),
    player,
    world,
    npcs,
    relationships,
    quests,
    knowledge,
    npcMemories,
    story,
    history: parseHistory(value.history),
  };
}

function parsePlayer(value: unknown): PlayerState | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.locationId !== 'string' ||
    typeof value.classId !== 'string' ||
    typeof value.maxHp !== 'number' ||
    typeof value.currentHp !== 'number' ||
    !Array.isArray(value.inventory) ||
    !Array.isArray(value.skills)
  ) {
    return null;
  }
  const inventory: InventoryItem[] = [];
  for (const item of value.inventory) {
    if (!isRecord(item) || typeof item.itemId !== 'string' || typeof item.quantity !== 'number') {
      continue;
    }
    if (!getItemDefinition(item.itemId)) {
      continue;
    }
    inventory.push({ itemId: item.itemId, quantity: item.quantity });
  }
  const equipmentRecord = isRecord(value.equipment) ? value.equipment : {};
  const equipment = {
    weapon:
      typeof equipmentRecord.weapon === 'string' && getItemDefinition(equipmentRecord.weapon) ? equipmentRecord.weapon : null,
    armor: typeof equipmentRecord.armor === 'string' && getItemDefinition(equipmentRecord.armor) ? equipmentRecord.armor : null,
    accessory:
      typeof equipmentRecord.accessory === 'string' && getItemDefinition(equipmentRecord.accessory)
        ? equipmentRecord.accessory
        : null,
  };
  const skills: PlayerSkill[] = [];
  for (const skill of value.skills) {
    if (!isRecord(skill) || typeof skill.id !== 'string' || !isOneOf(skill.usableIn, SKILL_CONTEXTS)) {
      return null;
    }
    skills.push({ id: skill.id, usableIn: skill.usableIn });
  }
  return {
    id: value.id,
    name: typeof value.name === 'string' && value.name.trim() ? value.name : '모험가',
    locationId: value.locationId,
    classId: value.classId === 'wanderer' ? PLAYER_CLASS_ID.ADVENTURER : value.classId,
    maxHp: value.maxHp,
    currentHp: value.currentHp,
    maxMp:
      typeof value.maxMp === 'number'
        ? value.maxMp
        : isPlayerClassId(value.classId)
          ? getPlayerClass(value.classId).baseStats.maxMp
          : getPlayerClass(PLAYER_CLASS_ID.WARRIOR).baseStats.maxMp,
    currentMp:
      typeof value.currentMp === 'number'
        ? value.currentMp
        : typeof value.maxMp === 'number'
          ? value.maxMp
          : isPlayerClassId(value.classId)
            ? getPlayerClass(value.classId).baseStats.maxMp
            : getPlayerClass(PLAYER_CLASS_ID.WARRIOR).baseStats.maxMp,
    gold: typeof value.gold === 'number' ? Math.max(0, value.gold) : 50,
    inventory,
    equipment,
    equipmentEnhancements: parseStringNumberMap(value.equipmentEnhancements),
    skills,
    level: typeof value.level === 'number' && Number.isFinite(value.level) ? Math.max(1, value.level) : 1,
    exp: typeof value.exp === 'number' && Number.isFinite(value.exp) ? Math.max(0, value.exp) : 0,
    attackPower:
      typeof value.attackPower === 'number' && Number.isFinite(value.attackPower)
        ? value.attackPower
        : isPlayerClassId(value.classId)
          ? getPlayerClass(value.classId).baseStats.attackPower
          : 10,
    classRankId: typeof value.classRankId === 'string' ? value.classRankId : baseRankIdForClass(value.classId) ?? undefined,
    unspentStatPoints:
      typeof value.unspentStatPoints === 'number' && Number.isFinite(value.unspentStatPoints)
        ? Math.max(0, Math.floor(value.unspentStatPoints))
        : 0,
    allocatedStats: {
      vit: numberStat(value.allocatedStats, 'vit'),
      str: numberStat(value.allocatedStats, 'str'),
      int: numberStat(value.allocatedStats, 'int'),
      agi: numberStat(value.allocatedStats, 'agi'),
    },
  };
}

function parseWorld(value: unknown): WorldState | null {
  if (!isRecord(value) || typeof value.currentLocationId !== 'string' || typeof value.turn !== 'number' || !Array.isArray(value.facts)) {
    return null;
  }
  const facts: WorldFact[] = [];
  for (const fact of value.facts) {
    const parsed = parseFact(fact);
    if (!parsed) {
      return null;
    }
    facts.push(parsed);
  }
  const locations = parseLocations(value.locations) ?? createInitialLocationRuntimes();
  if (!locations[value.currentLocationId]) {
    locations[value.currentLocationId] = createLocationRuntime(value.currentLocationId, {
      discovered: true,
      visited: true,
      visitCount: 1,
    });
  }
  const flags = parseFlags(value.flags);
  const exploredPointIds = value.exploredPointIds === undefined ? [] : isStringArray(value.exploredPointIds) ? value.exploredPointIds : null;
  if (!flags || exploredPointIds === null) {
    return null;
  }
  const day = typeof value.day === 'number' && Number.isFinite(value.day) ? Math.max(1, value.day) : 1;
  const totalMinutes =
    typeof value.totalMinutes === 'number' && Number.isFinite(value.totalMinutes)
      ? Math.max(0, value.totalMinutes)
      : totalMinutesForDayMorning(day);
  return {
    currentLocationId: value.currentLocationId,
    day,
    totalMinutes,
    turn: value.turn,
    facts,
    locations,
    flags,
    exploredPointIds,
    clearedEncounterIds: isStringArray(value.clearedEncounterIds) ? value.clearedEncounterIds : [],
  };
}

function parseFlags(value: unknown): Record<string, boolean> | null {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    return null;
  }
  const flags: Record<string, boolean> = {};
  for (const [id, flag] of Object.entries(value)) {
    if (typeof flag !== 'boolean') {
      return null;
    }
    flags[id] = flag;
  }
  return flags;
}

function parseLocations(value: unknown): Record<string, LocationRuntimeState> | null {
  if (value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }
  const locations = createInitialLocationRuntimes();
  for (const [id, item] of Object.entries(value)) {
    if (!isRecord(item) || typeof item.locationId !== 'string' || typeof item.discovered !== 'boolean' || typeof item.visited !== 'boolean' || typeof item.visitCount !== 'number') {
      return null;
    }
    const flags = parseFlags(item.flags);
    if (!flags) {
      return null;
    }
    locations[id] = {
      locationId: item.locationId,
      discovered: item.discovered,
      visited: item.visited,
      visitCount: item.visitCount,
      firstVisitedAtTurn: typeof item.firstVisitedAtTurn === 'number' ? item.firstVisitedAtTurn : undefined,
      lastVisitedAtTurn: typeof item.lastVisitedAtTurn === 'number' ? item.lastVisitedAtTurn : undefined,
      flags,
    };
  }
  return locations;
}

function parseFact(value: unknown): WorldFact | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.id !== 'string' ||
    !isOneOf(value.type, FACT_TYPES) ||
    typeof value.occurredAtTurn !== 'number' ||
    typeof value.locationId !== 'string' ||
    !isStringArray(value.actorIds) ||
    !isStringArray(value.witnessIds) ||
    !isStringArray(value.tags) ||
    !isOneOf(value.publicLevel, PUBLIC_LEVELS)
  ) {
    return null;
  }
  return {
    id: value.id,
    type: value.type,
    occurredAtTurn: value.occurredAtTurn,
    locationId: value.locationId,
    actorIds: value.actorIds,
    targetIds: value.targetIds === undefined || isStringArray(value.targetIds) ? value.targetIds : undefined,
    witnessIds: value.witnessIds,
    tags: value.tags,
    publicLevel: value.publicLevel,
    payload: isRecord(value.payload) ? (value.payload as WorldFact['payload']) : undefined,
  };
}

function parseNpcs(value: unknown): Record<string, NpcState> | null {
  if (!isRecord(value)) {
    return null;
  }
  const npcs: Record<string, NpcState> = {};
  for (const [id, npc] of Object.entries(value)) {
    if (!isRecord(npc) || typeof npc.id !== 'string' || typeof npc.name !== 'string' || typeof npc.locationId !== 'string' || !isRecord(npc.knowledge) || !Array.isArray(npc.knowledge.entries)) {
      return null;
    }
    const entries: NpcKnowledgeEntry[] = [];
    for (const entry of npc.knowledge.entries) {
      if (
        !isRecord(entry) ||
        typeof entry.factId !== 'string' ||
        !isOneOf(entry.sourceType, SOURCE_TYPES) ||
        typeof entry.confidence !== 'number' ||
        typeof entry.learnedAtTurn !== 'number'
      ) {
        return null;
      }
      entries.push({
        factId: entry.factId,
        sourceType: entry.sourceType,
        sourceId: typeof entry.sourceId === 'string' ? entry.sourceId : undefined,
        confidence: entry.confidence,
        learnedAtTurn: entry.learnedAtTurn,
      });
    }
    npcs[id] = {
      id: npc.id,
      name: npc.name,
      locationId: npc.locationId,
      knowledge: { npcId: typeof npc.knowledge.npcId === 'string' ? npc.knowledge.npcId : npc.id, entries },
    };
  }
  return npcs;
}

function parseRelationships(value: unknown): Record<string, RelationshipState> | null {
  if (!isRecord(value)) {
    return null;
  }
  const relationships: Record<string, RelationshipState> = {};
  for (const [id, relation] of Object.entries(value)) {
    if (
      !isRecord(relation) ||
      typeof relation.affection !== 'number' ||
      typeof relation.trust !== 'number' ||
      typeof relation.fear !== 'number' ||
      typeof relation.respect !== 'number'
    ) {
      return null;
    }
    relationships[id] = {
      affection: relation.affection,
      trust: relation.trust,
      fear: relation.fear,
      respect: relation.respect,
    };
  }
  return relationships;
}

function parseQuests(value: unknown): Record<string, QuestState> | null {
  if (!isRecord(value)) {
    return null;
  }
  const quests: Record<string, QuestState> = {};
  for (const [id, quest] of Object.entries(value)) {
    if (!isRecord(quest) || typeof quest.id !== 'string' || typeof quest.status !== 'string') {
      return null;
    }
    const status = migrateQuestStatus(quest.status);
    if (!status) {
      return null;
    }
    const definition = getQuestDefinition(id);
    const progress = parseObjectiveProgress(quest.objectiveProgress) ?? emptyProgress(definition?.objectives ?? []);
    quests[id] = {
      id: quest.id,
      questId: typeof quest.questId === 'string' ? quest.questId : quest.id,
      status,
      requesterNpcId:
        typeof quest.requesterNpcId === 'string' ? quest.requesterNpcId : definition?.requesterNpcId,
      objectiveProgress: progress,
      startedAtTurn: typeof quest.startedAtTurn === 'number' ? quest.startedAtTurn : undefined,
      completedAtTurn: typeof quest.completedAtTurn === 'number' ? quest.completedAtTurn : undefined,
    };
  }
  for (const definition of allQuestDefinitions()) {
    if (!quests[definition.id]) {
      const runtime = createQuestRuntime(definition.id);
      if (runtime) {
        quests[definition.id] = runtime;
      }
    }
  }
  return quests;
}

function parseObjectiveProgress(value: unknown): Record<string, QuestState['objectiveProgress'][string]> | null {
  if (value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }
  const progress: Record<string, QuestState['objectiveProgress'][string]> = {};
  for (const [id, item] of Object.entries(value)) {
    if (!isRecord(item) || typeof item.objectiveId !== 'string' || typeof item.currentCount !== 'number' || typeof item.completed !== 'boolean') {
      return null;
    }
    progress[id] = {
      objectiveId: item.objectiveId,
      currentCount: item.currentCount,
      completed: item.completed,
      countedIds: item.countedIds === undefined || isStringArray(item.countedIds) ? item.countedIds : [],
    };
  }
  return progress;
}

function parseKnowledge(value: unknown): { knownFactIds: readonly string[] } | null {
  if (!isRecord(value) || !isStringArray(value.knownFactIds)) {
    return null;
  }
  return { knownFactIds: value.knownFactIds };
}

function parseNpcMemories(value: unknown): Record<string, NPCMemory[]> | null {
  if (!isRecord(value)) {
    return null;
  }
  const memories: Record<string, NPCMemory[]> = {};
  for (const [id, list] of Object.entries(value)) {
    if (!Array.isArray(list)) {
      return null;
    }
    const parsed: NPCMemory[] = [];
    for (const memory of list) {
      const item = parseMemory(memory);
      if (!item) {
        return null;
      }
      parsed.push(item);
    }
    memories[id] = parsed;
  }
  return memories;
}

function parseMemory(value: unknown): NPCMemory | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.npcId !== 'string' ||
    !isOneOf(value.type, MEMORY_TYPES) ||
    typeof value.summary !== 'string' ||
    !isStringArray(value.relatedFactIds) ||
    typeof value.importance !== 'number' ||
    typeof value.createdAtTurn !== 'number'
  ) {
    return null;
  }
  return {
    id: value.id,
    npcId: value.npcId,
    type: value.type,
    summary: value.summary,
    relatedFactIds: value.relatedFactIds,
    importance: value.importance,
    emotionalTag: value.emotionalTag === undefined || isOneOf(value.emotionalTag, MEMORY_EMOTIONS) ? value.emotionalTag : undefined,
    createdAtTurn: value.createdAtTurn,
    lastRecalledAtTurn: typeof value.lastRecalledAtTurn === 'number' ? value.lastRecalledAtTurn : undefined,
    sourceEventId: typeof value.sourceEventId === 'string' ? value.sourceEventId : undefined,
  };
}

function parseStory(value: unknown): StoryState | null {
  if (!isRecord(value) || typeof value.currentSceneId !== 'string' || !Array.isArray(value.choices) || !Array.isArray(value.dialogue)) {
    return null;
  }
  if (value.currentNpcId !== null && typeof value.currentNpcId !== 'string') {
    return null;
  }
  if (typeof value.narration !== 'string') {
    return null;
  }
  if (value.lastActionNarrative !== null && typeof value.lastActionNarrative !== 'string') {
    return null;
  }
  const choices: Choice[] = [];
  for (const choice of value.choices) {
    if (!isRecord(choice) || typeof choice.id !== 'string' || typeof choice.label !== 'string') {
      return null;
    }
    choices.push({ id: choice.id, label: choice.label });
  }
  const dialogue: DialogueMessage[] = [];
  for (const message of value.dialogue) {
    if (!isRecord(message) || !isOneOf(message.speaker, SPEAKERS) || typeof message.text !== 'string') {
      return null;
    }
    dialogue.push({ speaker: message.speaker, text: message.text });
  }
  return {
    currentSceneId: value.currentSceneId,
    currentNpcId: value.currentNpcId,
    narration: value.narration,
    lastActionNarrative: value.lastActionNarrative,
    choices,
    dialogue,
    visitedSceneIds: isStringArray(value.visitedSceneIds) ? value.visitedSceneIds : [],
    sceneVisitCount: parseStringNumberMap(value.sceneVisitCount),
    previousSceneId: typeof value.previousSceneId === 'string' ? value.previousSceneId : undefined,
    enteredAtTurn: typeof value.enteredAtTurn === 'number' ? value.enteredAtTurn : undefined,
    flags: parseStringBooleanMap(value.flags),
    currentChapterId: typeof value.currentChapterId === 'string' ? value.currentChapterId : 'CHAPTER_1_LUEN_RUINS',
    completedChapterIds: isStringArray(value.completedChapterIds) ? value.completedChapterIds : [],
    consumedTopicIds: isStringArray(value.consumedTopicIds) ? value.consumedTopicIds : [],
    recentSemanticKeys: isStringArray(value.recentSemanticKeys) ? value.recentSemanticKeys : [],
    lastActionStateHash: typeof value.lastActionStateHash === 'string' ? value.lastActionStateHash : undefined,
  };
}

function parseHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const entries: HistoryEntry[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.day !== 'number' ||
      typeof item.summary !== 'string' ||
      typeof item.kind !== 'string'
    ) {
      continue;
    }
    entries.push({
      id: item.id,
      day: item.day,
      totalMinutes: typeof item.totalMinutes === 'number' ? item.totalMinutes : undefined,
      clock: typeof item.clock === 'string' ? item.clock : undefined,
      locationId: typeof item.locationId === 'string' ? item.locationId : undefined,
      summary: item.summary,
      kind: item.kind as HistoryEntry['kind'],
    });
  }
  return entries;
}

function parseLastAction(value: unknown): ActionResolution | null | undefined {
  if (value === null) {
    return null;
  }
  if (!isRecord(value) || typeof value.success !== 'boolean' || !isOneOf(value.actionType, ACTION_TYPES) || typeof value.narrative !== 'string') {
    return undefined;
  }
  return {
    success: value.success,
    actionType: value.actionType as ActionType,
    narrative: value.narrative,
    generatedEventIds: isStringArray(value.generatedEventIds) ? value.generatedEventIds : undefined,
    nextMode: value.nextMode === 'STORY' || value.nextMode === 'DIALOGUE' || value.nextMode === 'COMBAT' ? value.nextMode : undefined,
  };
}

function isGameMode(value: unknown): value is GameMode {
  return isOneOf(value, GAME_MODES);
}

function numberStat(container: unknown, key: string): number {
  if (!isRecord(container)) {
    return 0;
  }
  const value = container[key];
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function parseStringNumberMap(value: unknown): Readonly<Record<string, number>> {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'number' && Number.isFinite(item)) {
      result[key] = item;
    }
  }
  return result;
}

function parseStringBooleanMap(value: unknown): Readonly<Record<string, boolean>> {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'boolean') {
      result[key] = item;
    }
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isOneOf<T extends string>(value: unknown, list: readonly T[]): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

export function isCurrentSaveVersion(version: number): boolean {
  return version === SAVE_VERSION;
}
