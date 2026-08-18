import type { GameState } from '../core/game-state';
import { SCENE_GOBLIN_INTRO } from '../story/test-scenes';

export type EntityKind = 'npc' | 'enemy' | 'object';

export interface KnownEntity {
  id: string;
  name: string;
  aliases: readonly string[];
  kind: EntityKind;
  attackable: boolean;
  stealableItemIds: readonly string[];
}

export const KNOWN_ENTITIES: readonly KnownEntity[] = [
  {
    id: 'seria',
    name: '세리아',
    aliases: ['세리아', 'seria'],
    kind: 'npc',
    attackable: true,
    stealableItemIds: [],
  },
  {
    id: 'leon',
    name: '레온',
    aliases: ['레온', 'leon'],
    kind: 'npc',
    attackable: true,
    stealableItemIds: [],
  },
  {
    id: 'innkeeper',
    name: '마르타',
    aliases: ['마르타', '여관주인', '여관 주인', 'innkeeper'],
    kind: 'npc',
    attackable: true,
    stealableItemIds: [],
  },
  {
    id: 'guard_01',
    name: '경비병',
    aliases: ['경비병', '경비', 'guard'],
    kind: 'npc',
    attackable: true,
    stealableItemIds: ['guard_key'],
  },
  {
    id: 'goblin_01',
    name: '고블린',
    aliases: ['고블린', 'goblin'],
    kind: 'enemy',
    attackable: true,
    stealableItemIds: [],
  },
  {
    id: 'king',
    name: '왕',
    aliases: ['왕', 'king'],
    kind: 'npc',
    attackable: true,
    stealableItemIds: [],
  },
];

export interface ResolvedEntity {
  id: string;
  entity: KnownEntity;
  inScene: boolean;
}

export function getKnownEntity(id: string): KnownEntity | undefined {
  return KNOWN_ENTITIES.find((entity) => entity.id === id);
}

export function getPresentEntityIds(state: Readonly<GameState>): string[] {
  const ids: string[] = [];
  for (const npc of Object.values(state.npcs)) {
    if (npc.locationId === state.world.currentLocationId) {
      ids.push(npc.id);
    }
  }
  if (state.story.currentSceneId === SCENE_GOBLIN_INTRO) {
    ids.push('goblin_01');
  }
  return ids;
}

export function isEntityPresent(state: Readonly<GameState>, entityId: string): boolean {
  return getPresentEntityIds(state).includes(entityId);
}

/**
 * Resolves a display name to an entity id.
 * Prefers entities in the current scene; does not spawn missing entities.
 */
export function resolveEntityByName(text: string, presentIds: readonly string[]): ResolvedEntity | null {
  const lower = text.toLowerCase();
  const matches = KNOWN_ENTITIES.filter((entity) =>
    entity.aliases.some((alias) => lower.includes(alias.toLowerCase()))
  );

  if (matches.length === 0) {
    return null;
  }

  const inScene = matches.filter((entity) => presentIds.includes(entity.id));
  if (inScene.length > 1) {
    return null;
  }
  if (inScene.length === 1) {
    return { id: inScene[0].id, entity: inScene[0], inScene: true };
  }
  if (matches.length > 1) {
    return null;
  }

  return {
    id: matches[0].id,
    entity: matches[0],
    inScene: false,
  };
}

export function resolveTargetFromInput(
  text: string,
  presentIds: readonly string[],
  particles: 'address' | 'object' | 'any' = 'any'
): ResolvedEntity | null {
  const address = text.match(
    /(세리아|레온|마르타|여관\s*주인|여관주인|경비병|경비|고블린|왕|seria|leon|innkeeper|guard|goblin|king)\s*(에게|한테)/i
  );
  const object = text.match(
    /(세리아|레온|마르타|여관\s*주인|여관주인|경비병|경비|고블린|왕|seria|leon|innkeeper|guard|goblin|king)\s*(을|를|의)/i
  );

  if (particles === 'address') {
    return address?.[1] ? resolveEntityByName(address[1], presentIds) : null;
  }
  if (particles === 'object') {
    return object?.[1] ? resolveEntityByName(object[1], presentIds) : null;
  }
  if (address?.[1]) {
    return resolveEntityByName(address[1], presentIds);
  }
  if (object?.[1]) {
    return resolveEntityByName(object[1], presentIds);
  }
  return resolveEntityByName(text, presentIds);
}
