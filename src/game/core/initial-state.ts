import type { PlayerState } from '../player/player-state';
import { applyPlayerClass, isSpecializedClassId, PLAYER_CLASS_ID } from '../player/classes';
import type { GameState } from './game-state';
import { createEmptyPlayerKnowledge } from '../knowledge/player-knowledge';
import { createEmptyNpcKnowledge } from '../npc/npc-knowledge';
import { createRelationship } from '../npc/relationship';
import { getStoryScene, SCENE_LUEN_VILLAGE } from '../story/test-scenes';
import { emptyStoryVisitState } from '../story/story-state';
import { getStorySceneDefinition } from '../story/story-scene-definitions';
import { createInitialQuestRuntimes } from '../quests/quest-runtime';
import { LOCATION_ID } from '../world/locations/location-definitions';
import { createInitialLocationRuntimes } from '../world/locations/location-runtime';
import { storyChoicesForState } from '../quests/quest-story-choices';
import { totalMinutesForDayMorning } from '../time/clock-types';
import { STARTING_GOLD } from '../economy/economy-types';
import { ITEM_ID } from '../inventory/item-definitions';
import { emptyEquipment } from '../inventory/equipment-types';
import { SHOPKEEPER_NPC_ID } from '../economy/shop-definitions';

export interface NewGameOptions {
  name?: string;
  classId?: string;
}

export function createInitialGameState(options: NewGameOptions = {}): GameState {
  const scene = getStoryScene(SCENE_LUEN_VILLAGE);
  const sceneDefinition = getStorySceneDefinition(SCENE_LUEN_VILLAGE);
  const world = {
    currentLocationId: LOCATION_ID.LUEN_VILLAGE,
    day: 1,
    totalMinutes: totalMinutesForDayMorning(1),
    turn: 1,
    facts: [] as const,
    locations: createInitialLocationRuntimes(),
    flags: {},
    exploredPointIds: [] as const,
    clearedEncounterIds: [] as const,
  };
  const name = options.name?.trim() || '모험가';
  let player: PlayerState = applyPlayerClass(
    {
      id: 'player',
      name,
      locationId: LOCATION_ID.LUEN_VILLAGE,
      classId: PLAYER_CLASS_ID.ADVENTURER,
      classRankId: undefined,
      level: 1,
      exp: 0,
      attackPower: 16,
      maxHp: 100,
      currentHp: 100,
      maxMp: 70,
      currentMp: 70,
      gold: STARTING_GOLD,
      inventory: [{ itemId: ITEM_ID.HEALING_POTION, quantity: 2 }],
      equipment: {
        ...emptyEquipment(),
        weapon: ITEM_ID.WORN_SWORD,
        armor: ITEM_ID.TRAVELER_CLOTHES,
      },
      equipmentEnhancements: {},
      skills: [],
    },
    PLAYER_CLASS_ID.ADVENTURER
  );
  if (options.classId && isSpecializedClassId(options.classId)) {
    player = applyPlayerClass(player, options.classId);
  }

  const draft: GameState = {
    mode: 'STORY',
    activeCombatId: null,
    pendingFreeActionTurnId: null,
    lastActionResolution: null,
    lastTurnSummary: null,
    processedRelationshipSourceIds: [],
    processedMemorySourceIds: [],
    processedExpSourceIds: [],
    processedTurnRewardIds: [],
    processedRewardIds: [],
    actionRepeatCounts: {},
    activeMenu: null,
    saveNotice: null,
    lastEconomyNotice: null,
    history: [
      {
        id: 'history_arrival_luen',
        day: 1,
        totalMinutes: totalMinutesForDayMorning(1),
        clock: 'DAY 1 · 08:00',
        locationId: LOCATION_ID.LUEN_VILLAGE,
        summary: '루엔 마을에 도착했다.',
        kind: 'ARRIVAL',
      },
    ],
    player,
    knowledge: createEmptyPlayerKnowledge(),
    npcs: {
      seria: {
        id: 'seria',
        name: '세리아',
        locationId: LOCATION_ID.LUEN_VILLAGE,
        knowledge: createEmptyNpcKnowledge('seria'),
      },
      leon: {
        id: 'leon',
        name: '레온',
        locationId: LOCATION_ID.NORTHERN_GATE,
        knowledge: createEmptyNpcKnowledge('leon'),
      },
      innkeeper: {
        id: 'innkeeper',
        name: '마르타',
        locationId: LOCATION_ID.BLUE_MOON_INN,
        knowledge: createEmptyNpcKnowledge('innkeeper'),
      },
      guildmaster_doran: {
        id: 'guildmaster_doran',
        name: '도란',
        locationId: LOCATION_ID.LUEN_ADVENTURERS_GUILD,
        knowledge: createEmptyNpcKnowledge('guildmaster_doran'),
      },
      guard_01: {
        id: 'guard_01',
        name: '경비병',
        locationId: LOCATION_ID.LUEN_VILLAGE,
        knowledge: createEmptyNpcKnowledge('guard_01'),
      },
      [SHOPKEEPER_NPC_ID]: {
        id: SHOPKEEPER_NPC_ID,
        name: '엘린',
        locationId: LOCATION_ID.LUEN_GENERAL_STORE,
        knowledge: createEmptyNpcKnowledge(SHOPKEEPER_NPC_ID),
      },
    },
    relationships: {
      seria: createRelationship(),
      leon: createRelationship(),
      innkeeper: createRelationship(),
      guildmaster_doran: createRelationship(),
      guard_01: createRelationship(),
      [SHOPKEEPER_NPC_ID]: createRelationship(),
    },
    npcMemories: {
      seria: [],
      leon: [],
      innkeeper: [],
      guildmaster_doran: [],
      guard_01: [],
      [SHOPKEEPER_NPC_ID]: [],
    },
    story: {
      currentSceneId: scene.sceneId,
      currentNpcId: null,
      narration: sceneDefinition?.narrative ?? scene.narration,
      lastActionNarrative: null,
      choices: scene.choices,
      dialogue: [],
      ...emptyStoryVisitState(scene.sceneId),
    },
    world,
    quests: createInitialQuestRuntimes(),
  };

  return {
    ...draft,
    story: {
      ...draft.story,
      choices: storyChoicesForState(draft),
    },
  };
}
