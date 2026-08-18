export type { CombatState, CombatStatus } from './combat-state';
export type { CombatConfig, CombatEnemyConfig } from './types/combat-config';
export type { CombatOutcome, CombatResult } from './types/combat-result';
export { startCombatGame } from './CombatGame';
export { buildCombatConfig, playerCombatSnapshot } from './build-combat-config';
export {
  publishCombatResult,
  startBridgedCombat,
  subscribeCombatResult,
} from './CombatBridge';
export { BASIC_ATTACK_DAMAGE, ENEMY_ATTACK_DAMAGE, PLAYER_MAX_HP } from './CombatConfig';
export { BASIC_ATTACKS, getBasicAttack } from './attacks/basic-attack-definitions';
export { PlayerController } from './player/PlayerController';
export { PlayerAttackController } from './player/PlayerAttackController';
export { PlayerHealthController } from './player/PlayerHealthController';
export { PlayerSkillController } from './player/PlayerSkillController';
export { SkillController } from './skills/SkillController';
export { ProjectileController } from './projectiles/ProjectileController';
export { EnemyController } from './enemies/EnemyController';
export { EnemyManager } from './enemies/EnemyManager';
export { ENEMY_DEFINITIONS, getEnemyDefinition } from './enemies/enemy-definitions';
export { ENEMY_TYPE_ID, ENEMY_BEHAVIOR_TYPE } from './enemies/enemy-types';
export type { EnemyDefinition, EnemyTypeId, EnemyBehaviorType } from './enemies/enemy-types';
export { ENCOUNTERS, ENCOUNTER_ID, getEncounter, resolveEncounterId, isBossEncounter } from './encounters/encounter-definitions';
export type { EncounterDefinition, EncounterEnemySpawn } from './encounters/encounter-types';
export { EncounterManager } from './encounters/EncounterManager';
export { BOSS_DEFINITIONS, getBossDefinition, createBossRuntime } from './boss/boss-definitions';
export { BOSS_ID, BOSS_INSTANCE_ID, BOSS_PATTERN_ID, BOSS_STATE } from './boss/boss-types';
export type { BossDefinition, BossRuntimeState } from './boss/boss-types';
export { RUINS_GUARDIAN_CONFIG } from './boss/boss-config';
export {
  ENEMY_ATTACK_COOLDOWN_MS,
  ENEMY_ATTACK_DURATION_MS,
  ENEMY_ATTACK_RANGE,
  ENEMY_COLOR,
  ENEMY_HIT_COLOR,
  ENEMY_HIT_FLASH_MS,
  ENEMY_MAX_HP,
  ENEMY_MOVE_SPEED,
  ENEMY_SIZE,
  ENEMY_STOP_DISTANCE,
} from './enemies/EnemyConfig';

