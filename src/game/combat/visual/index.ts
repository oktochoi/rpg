export { COMBAT_DEPTH, cardinalFromVector } from './combat-depth';
export type { CardinalFacing } from './combat-depth';
export type { VisualAnimState, SpriteAnimationDefinition, GameAssetDefinition } from './asset-types';
export {
  GAME_ASSETS,
  PLACEHOLDER_STYLES,
  resolvePlayerVisual,
  getPlayerAsset,
  getEnemyAsset,
  getBossAsset,
  getNpcAsset,
  getSkillIconId,
  getProjectileAsset,
  getEffectAsset,
  listEffectAssets,
  getStoryBackground,
  listActorAssets,
  listCombatSpriteAssets,
} from './asset-registry';
export { PLAYER_VISUAL_ID, resolvePlayerVisualId } from './resolve-player-visual';
export type { PlayerVisualId } from './resolve-player-visual';
export { CombatAssetLoader } from './CombatAssetLoader';
export { createPlayerVisual, createEnemyVisual, createBossVisual } from './visual-factory';
export { PlayerVisual } from './PlayerVisual';
export { EnemyVisual } from './EnemyVisual';
export { BossVisual } from './BossVisual';
export { createProjectileVisual, projectileKindFromSpawn } from './ProjectileVisual';
export { warnMissingAsset, resetMissingAssetWarnings } from './asset-missing';
export { resolvePlayerAnim, resolveEnemyAnim, resolveBossAnim } from './animation-priority';
export { animationKey, ANIMATION_FRAME_RATE, sequenceTextureKey } from './animation-keys';
export { registerSpriteAnimations, registerImageSequenceAnimations } from './animation-registry';
export { isCombatHitboxDebug } from './hitbox-debug';
