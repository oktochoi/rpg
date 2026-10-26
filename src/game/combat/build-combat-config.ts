import type { GameState } from '../core/game-state';
import { ITEM_ID } from '../inventory/item-definitions';
import { itemQuantity } from '../player/player-state';
import { WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import type { EncounterId } from '../core/ids';
import { getPlayerClass, resolvePlayerClassId } from '../player/classes';
import { combatRangeScale, derivedPlayerStats } from '../inventory/derived-stats';
import { isNpcDuelCombatId } from '../actions/action-validator';
import { getEnemyDefinition } from './enemies/enemy-definitions';
import {
  ENCOUNTER_ID,
  getEncounter,
  resolveEncounterId,
} from './encounters/encounter-definitions';
import { isEncounterCleared } from './encounters/encounter-progress';
import { snapshotSpawns } from './encounters/EncounterManager';
import { isTrainingCombatId } from './training/training-combat';
import type { CombatConfig, CombatEnemyConfig } from './types/combat-config';

export function playerCombatSnapshot(state: Readonly<GameState>): CombatConfig['player'] {
  const classId = resolvePlayerClassId(state.player.classId);
  const definition = getPlayerClass(classId);
  const derived = derivedPlayerStats(state.player);
  const baseAttack = definition.baseStats.attackPower;
  const levelAttackDelta = Math.max(0, (state.player.attackPower ?? baseAttack) - baseAttack);
  const attackPercent = state.player.permanentMods?.attackPercent ?? 0;
  return {
    classId,
    maxHp: derived.maxHp,
    currentHp: Math.min(state.player.currentHp, derived.maxHp),
    maxMp: derived.maxMp,
    currentMp: Math.min(state.player.currentMp, derived.maxMp),
    moveSpeed: definition.baseStats.moveSpeed,
    attackBonus: derived.attackBonus + levelAttackDelta,
    attackPercent,
    attackRangeScale: combatRangeScale(state.player),
    healingPotions: itemQuantity(state.player, ITEM_ID.HEALING_POTION),
  };
}

export function buildCombatConfig(state: Readonly<GameState>, combatId: EncounterId): CombatConfig | null {
  const player = playerCombatSnapshot(state);
  const encounterId = isNpcDuelCombatId(combatId)
    ? ENCOUNTER_ID.RUINS_EASY_01
    : resolveEncounterId(combatId);
  if (!encounterId) {
    return null;
  }

  const encounter = getEncounter(encounterId);
  if (!encounter) {
    return null;
  }

  const instanceIds = isNpcDuelCombatId(combatId) ? [combatId.replace('combat_duel_', '')] : undefined;
  const spawns = snapshotSpawns(encounter, instanceIds);
  const enemies: CombatEnemyConfig[] = spawns.map((spawn) => {
    const definition = getEnemyDefinition(spawn.enemyType);
    return {
      id: spawn.instanceId ?? spawn.enemyType,
      type: spawn.enemyType,
      maxHp: definition.maxHp,
      damage: definition.damage,
    };
  });

  const training = isTrainingCombatId(combatId) || isTrainingCombatId(encounterId);
  return {
    combatId,
    encounterId,
    player: training
      ? {
          ...player,
          currentHp: player.maxHp,
          currentMp: player.maxMp,
        }
      : player,
    enemies,
    arenaId: encounter.arenaId,
    spawnBias:
      encounterId === ENCOUNTER_ID.CH1_GOBLIN_CAMP && worldFlag(state, WORLD_FLAG.GOBLIN_CAMP_OBSERVED)
        ? 'observed'
        : 'default',
    training,
    repeatEncounter: training || isEncounterCleared(state, encounterId),
  };
}
