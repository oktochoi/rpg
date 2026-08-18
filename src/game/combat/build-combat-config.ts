import type { GameState } from '../core/game-state';
import type { EncounterId } from '../core/ids';
import { getPlayerClass, resolvePlayerClassId } from '../player/classes';
import { derivedPlayerStats } from '../inventory/derived-stats';
import { isNpcDuelCombatId } from '../actions/action-validator';
import { getEnemyDefinition } from './enemies/enemy-definitions';
import {
  ENCOUNTER_ID,
  getEncounter,
  resolveEncounterId,
} from './encounters/encounter-definitions';
import { snapshotSpawns } from './encounters/EncounterManager';
import type { CombatConfig, CombatEnemyConfig } from './types/combat-config';

export function playerCombatSnapshot(state: Readonly<GameState>): CombatConfig['player'] {
  const classId = resolvePlayerClassId(state.player.classId);
  const definition = getPlayerClass(classId);
  const derived = derivedPlayerStats(state.player);
  return {
    classId,
    maxHp: derived.maxHp,
    currentHp: Math.min(state.player.currentHp, derived.maxHp),
    maxMp: derived.maxMp,
    currentMp: Math.min(state.player.currentMp, derived.maxMp),
    moveSpeed: definition.baseStats.moveSpeed,
    attackBonus: derived.attackBonus,
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

  return {
    combatId,
    encounterId,
    player,
    enemies,
    arenaId: encounter.arenaId,
  };
}
