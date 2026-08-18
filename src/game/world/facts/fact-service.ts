import type { CombatResult } from '../../combat/types/combat-result';
import { isNpcDuelCombatId } from '../../actions/action-validator';
import { getPresentEntityIds } from '../../actions/entity-resolver';
import type { GameState } from '../../core/game-state';
import type { ActorId, FactId } from '../../core/ids';
import { PLAYER_ACTOR_ID } from '../../knowledge/knowledge-config';
import type { WorldFact, WorldFactType } from './world-fact';
import { TEST_GOBLIN_COMBAT_ID } from '../../story/test-scenes';

export interface CombatWitnessContext {
  locationId: string;
  witnessIds: readonly ActorId[];
}

export const COMBAT_WITNESS_CONTEXT: Readonly<Record<string, CombatWitnessContext>> = {
  combat_goblin_ruins_01: {
    locationId: 'ancient_ruins',
    witnessIds: [PLAYER_ACTOR_ID, 'seria'],
  },
};

export function getCombatWitnessContext(
  combatId: string,
  state?: Readonly<GameState>
): CombatWitnessContext {
  if (state) {
    const presentNpcs = Object.values(state.npcs)
      .filter((npc) => npc.locationId === state.world.currentLocationId)
      .map((npc) => npc.id);
    return {
      locationId: state.world.currentLocationId,
      witnessIds: uniqueIds([PLAYER_ACTOR_ID, ...presentNpcs]),
    };
  }
  return (
    COMBAT_WITNESS_CONTEXT[combatId] ?? {
      locationId: 'ancient_ruins',
      witnessIds: [PLAYER_ACTOR_ID],
    }
  );
}

function uniqueIds(ids: readonly ActorId[]): ActorId[] {
  return [...new Set(ids)];
}

export function createActionFact(
  state: Readonly<GameState>,
  type: WorldFactType,
  key: string,
  options?: {
    targetIds?: ActorId[];
    tags?: string[];
    payload?: WorldFact['payload'];
  }
): WorldFact {
  const present = getPresentEntityIds(state).filter((id) => state.npcs[id]);
  return {
    id: createFactId(type, key, state.world.turn),
    type,
    occurredAtTurn: state.world.turn,
    locationId: state.world.currentLocationId,
    actorIds: [PLAYER_ACTOR_ID],
    targetIds: options?.targetIds,
    witnessIds: uniqueIds([PLAYER_ACTOR_ID, ...present]),
    tags: options?.tags ?? ['action'],
    publicLevel: 'PRIVATE',
    payload: options?.payload,
  };
}

function createFactId(type: WorldFactType, key: string, turn: number): FactId {
  return `fact_${type.toLowerCase()}_${key}_t${turn}`;
}

export function createCombatFacts(state: Readonly<GameState>, result: CombatResult): WorldFact[] {
  const context = getCombatWitnessContext(result.combatId, state);
  const turn = state.world.turn;
  const facts: WorldFact[] = [];
  const goblinTags = result.combatId === TEST_GOBLIN_COMBAT_ID;
  const tags = goblinTags ? ['combat', 'goblin', 'ruins'] : ['combat'];

  if (result.outcome === 'VICTORY') {
    facts.push({
      id: createFactId('COMBAT_WON', result.combatId, turn),
      type: 'COMBAT_WON',
      occurredAtTurn: turn,
      locationId: context.locationId,
      actorIds: [PLAYER_ACTOR_ID],
      targetIds: [...result.defeatedEnemyIds],
      witnessIds: [...context.witnessIds],
      tags,
      publicLevel: 'PRIVATE',
      payload: {
        combatId: result.combatId,
        remainingHp: result.player.remainingHp,
      },
    });

    result.defeatedEnemyIds.forEach((enemyId, index) => {
      if (!shouldRecordEnemyFact(result, enemyId, index)) {
        return;
      }
      facts.push({
        id: createFactId('ENEMY_DEFEATED', enemyId, turn),
        type: 'ENEMY_DEFEATED',
        occurredAtTurn: turn,
        locationId: context.locationId,
        actorIds: [PLAYER_ACTOR_ID],
        targetIds: [enemyId],
        witnessIds: [...context.witnessIds],
        tags: isImportantEnemy(enemyId, result.defeatedEnemyTypes?.[index])
          ? [...tags, 'brute']
          : tags,
        publicLevel: 'PRIVATE',
        payload: {
          combatId: result.combatId,
          enemyId,
        },
      });
    });

    return facts;
  }

  facts.push({
    id: createFactId('COMBAT_LOST', result.combatId, turn),
    type: 'COMBAT_LOST',
    occurredAtTurn: turn,
    locationId: context.locationId,
    actorIds: [PLAYER_ACTOR_ID],
    witnessIds: [...context.witnessIds],
    tags: goblinTags ? ['combat', 'ruins'] : ['combat'],
    publicLevel: 'PRIVATE',
    payload: {
      combatId: result.combatId,
    },
  });

  return facts;
}

function shouldRecordEnemyFact(result: CombatResult, enemyId: string, index: number): boolean {
  if (result.combatId === TEST_GOBLIN_COMBAT_ID || isNpcDuelCombatId(result.combatId)) {
    return true;
  }
  return isImportantEnemy(enemyId, result.defeatedEnemyTypes?.[index]);
}

function isImportantEnemy(enemyId: string, typeId?: string): boolean {
  return typeId === 'brute' || enemyId.startsWith('brute') || typeId === 'RUINS_GUARDIAN' || enemyId.startsWith('ruins_guardian');
}
