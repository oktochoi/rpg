import { parseSaveData } from './save-schema';
import { SAVE_VERSION, type SaveData } from './save-types';
import { STARTING_GOLD } from '../economy/economy-types';
import { SHOPKEEPER_NPC_ID } from '../economy/shop-definitions';
import { ITEM_ID, getItemDefinition } from '../inventory/item-definitions';
import { LOCATION_ID } from '../world/locations/location-definitions';
import { createLocationRuntime } from '../world/locations/location-runtime';
import { createEmptyNpcKnowledge } from '../npc/npc-knowledge';
import { createRelationship } from '../npc/relationship';
import { allQuestDefinitions } from '../quests/quest-definitions';
import { createQuestRuntime } from '../quests/quest-runtime';

/**
 * Converts unknown save JSON into the current SaveData shape.
 * v1 → v2 fills progression defaults.
 */
export function migrateSaveData(data: unknown): SaveData | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const version = (data as { version?: unknown }).version;
  if (typeof version !== 'number' || !Number.isFinite(version) || version < 1) {
    return null;
  }
  if (version > SAVE_VERSION) {
    return null;
  }

  let current: unknown = data;
  if (version === 1) {
    current = migrateV1(current);
  }
  if (version <= 2) {
    current = migrateV2(current);
  }
  if (version <= 3) {
    current = migrateV3(current);
  }
  current = migrateV4(current);

  const parsed = parseSaveData(current);
  if (!parsed) {
    return null;
  }
  return {
    ...parsed,
    version: SAVE_VERSION,
  };
}

function migrateV1(data: unknown): unknown {
  return data;
}

function migrateV2(data: unknown): unknown {
  if (!isRecord(data)) {
    return data;
  }
  const gameState = isRecord(data.gameState) ? data.gameState : null;
  if (!gameState) {
    return data;
  }
  const player = isRecord(gameState.player) ? gameState.player : {};
  const world = isRecord(gameState.world) ? gameState.world : {};
  const story = isRecord(gameState.story) ? gameState.story : {};
  const flags = isRecord(world.flags) ? world.flags : {};
  const chapterComplete = flags.chapter_1_complete === true || flags.ruins_guardian_defeated === true;
  return {
    ...data,
    gameState: {
      ...gameState,
      processedExpSourceIds: Array.isArray(gameState.processedExpSourceIds) ? gameState.processedExpSourceIds : [],
      history: Array.isArray(gameState.history) ? gameState.history : [],
      player: {
        ...player,
        name: typeof player.name === 'string' && player.name.trim() ? player.name : '모험가',
        level: typeof player.level === 'number' ? player.level : 1,
        exp: typeof player.exp === 'number' ? player.exp : 0,
        attackPower: typeof player.attackPower === 'number' ? player.attackPower : 10,
        classRankId: typeof player.classRankId === 'string' ? player.classRankId : undefined,
      },
        world: {
          ...world,
          day: typeof world.day === 'number' ? world.day : 1,
          totalMinutes:
            typeof world.totalMinutes === 'number'
              ? world.totalMinutes
              : typeof world.day === 'number'
                ? (Math.max(1, world.day) - 1) * 1440 + 8 * 60
                : 8 * 60,
        },
      story: {
        ...story,
        currentChapterId:
          typeof story.currentChapterId === 'string'
            ? story.currentChapterId
            : chapterComplete
              ? 'CHAPTER_2_NORTHERN_SHADOW'
              : 'CHAPTER_1_LUEN_RUINS',
        completedChapterIds: Array.isArray(story.completedChapterIds)
          ? story.completedChapterIds
          : chapterComplete
            ? ['CHAPTER_1_LUEN_RUINS']
            : [],
      },
    },
  };
}

function migrateV3(data: unknown): unknown {
  if (!isRecord(data)) {
    return data;
  }
  const gameState = isRecord(data.gameState) ? data.gameState : null;
  if (!gameState) {
    return data;
  }
  const player = isRecord(gameState.player) ? gameState.player : {};
  const inventory = Array.isArray(player.inventory)
    ? player.inventory.filter((item) => isRecord(item) && typeof item.itemId === 'string' && getItemDefinition(item.itemId))
    : [];
  const equipment = isRecord(player.equipment)
    ? {
        weapon: typeof player.equipment.weapon === 'string' && getItemDefinition(player.equipment.weapon) ? player.equipment.weapon : null,
        armor: typeof player.equipment.armor === 'string' && getItemDefinition(player.equipment.armor) ? player.equipment.armor : null,
        accessory:
          typeof player.equipment.accessory === 'string' && getItemDefinition(player.equipment.accessory)
            ? player.equipment.accessory
            : null,
      }
    : { weapon: ITEM_ID.WORN_SWORD, armor: ITEM_ID.TRAVELER_CLOTHES, accessory: null };
  const npcs = isRecord(gameState.npcs) ? { ...gameState.npcs } : {};
  const relationships = isRecord(gameState.relationships) ? { ...gameState.relationships } : {};
  const npcMemories = isRecord(gameState.npcMemories) ? { ...gameState.npcMemories } : {};
  if (!npcs[SHOPKEEPER_NPC_ID]) {
    npcs[SHOPKEEPER_NPC_ID] = {
      id: SHOPKEEPER_NPC_ID,
      name: '엘린',
      locationId: LOCATION_ID.LUEN_GENERAL_STORE,
      knowledge: createEmptyNpcKnowledge(SHOPKEEPER_NPC_ID),
    };
  }
  if (!relationships[SHOPKEEPER_NPC_ID]) {
    relationships[SHOPKEEPER_NPC_ID] = createRelationship();
  }
  if (!npcMemories[SHOPKEEPER_NPC_ID]) {
    npcMemories[SHOPKEEPER_NPC_ID] = [];
  }
  const world = isRecord(gameState.world) ? gameState.world : {};
  const locations = isRecord(world.locations) ? { ...world.locations } : {};
  if (!locations[LOCATION_ID.LUEN_GENERAL_STORE]) {
    locations[LOCATION_ID.LUEN_GENERAL_STORE] = createLocationRuntime(LOCATION_ID.LUEN_GENERAL_STORE, {
      discovered: true,
    });
  }
  const quests = isRecord(gameState.quests) ? { ...gameState.quests } : {};
  for (const definition of allQuestDefinitions()) {
    if (!quests[definition.id]) {
      const runtime = createQuestRuntime(definition.id);
      if (runtime) {
        quests[definition.id] = runtime;
      }
    }
  }
  return {
    ...data,
    gameState: {
      ...gameState,
      processedRewardIds: Array.isArray(gameState.processedRewardIds) ? gameState.processedRewardIds : [],
      npcs,
      relationships,
      npcMemories,
      quests,
      world: {
        ...world,
        locations,
      },
      player: {
        ...player,
        gold: typeof player.gold === 'number' ? player.gold : STARTING_GOLD,
        inventory,
        equipment,
      },
    },
  };
}

function migrateV4(data: unknown): unknown {
  if (!isRecord(data)) {
    return data;
  }
  const gameState = isRecord(data.gameState) ? data.gameState : null;
  if (!gameState) {
    return data;
  }
  const player = isRecord(gameState.player) ? gameState.player : {};
  const world = isRecord(gameState.world) ? gameState.world : {};
  const story = isRecord(gameState.story) ? gameState.story : {};
  return {
    ...data,
    gameState: {
      ...gameState,
      player: {
        ...player,
        equipmentEnhancements: isRecord(player.equipmentEnhancements) ? player.equipmentEnhancements : {},
      },
      world: {
        ...world,
        clearedEncounterIds: Array.isArray(world.clearedEncounterIds) ? world.clearedEncounterIds : [],
      },
      story: {
        ...story,
        consumedTopicIds: Array.isArray(story.consumedTopicIds) ? story.consumedTopicIds : [],
        recentSemanticKeys: Array.isArray(story.recentSemanticKeys) ? story.recentSemanticKeys : [],
      },
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
