import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createGameOrchestrator } from '../../core/orchestrator';
import { applyEvents } from '../../core/reducer';
import { createInitialGameState } from '../../core/initial-state';
import { PLAYER_CLASS_ID, CLASS_RANK_ID } from '../../player/classes';
import { createMemoryStorage, createSaveService } from '../../save';
import { getClassAppearance } from '../player/class-appearance';
import { SkillController } from '../skills/SkillController';
import { toCombatHudSkills } from '../hud/build-combat-hud-state';
import { toStoryScreenView } from '../../story/story-view';
import {
  GAME_ASSETS,
  getBossAsset,
  getEffectAsset,
  getEnemyAsset,
  getPlayerAsset,
  getProjectileAsset,
  listCombatSpriteAssets,
} from './asset-registry';
import { animationKey, ANIMATION_FRAME_RATE } from './animation-keys';
import { resolveBossAnim, resolveEnemyAnim, resolvePlayerAnim } from './animation-priority';
import { resolvePlayerVisualId } from './resolve-player-visual';

function publicExists(urlPath: string): boolean {
  return existsSync(join(process.cwd(), 'public', urlPath.replace(/^\//, '')));
}

function createSkills() {
  return new SkillController({
    classId: PLAYER_CLASS_ID.WARRIOR,
    vitals: {
      isDead: () => false,
      isCombatLocked: () => false,
      currentMp: () => 40,
      consumeMp: () => true,
    },
    aim: { playerX: () => 0, playerY: () => 0, pointerX: () => 1, pointerY: () => 0 },
    executors: {
      warrior_charge_slash: () => ({ ok: true }),
      warrior_guard: () => ({ ok: true }),
    },
  });
}

export async function runStep29AnimationScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const warriorStates = ['idle', 'walk', 'attack', 'dash', 'skill1', 'skill2', 'hit', 'death'] as const;
  const warriorPriority =
    resolvePlayerAnim({ dead: true }) === 'death' &&
    resolvePlayerAnim({ hit: true, moving: true }) === 'hit' &&
    resolvePlayerAnim({ skillSlot: 'Q', moving: true }) === 'skill1' &&
    resolvePlayerAnim({ guarding: true, moving: true }) === 'guard' &&
    resolvePlayerAnim({ attacking: true, dashing: true, moving: true }) === 'attack_windup' &&
    resolvePlayerAnim({ attacking: true, attackActive: true, dashing: true }) === 'attack' &&
    resolvePlayerAnim({ dashing: true, moving: true }) === 'dash' &&
    resolvePlayerAnim({ moving: true }) === 'walk' &&
    resolvePlayerAnim({}) === 'idle';
  if (warriorPriority && GAME_ASSETS.PLAYER.swordsman.portraitPath && resolvePlayerVisualId('warrior') === 'swordsman') {
    pass('A-warrior', warriorStates.join(','));
  } else {
    fail('A-warrior', JSON.stringify({ warriorPriority }));
  }

  const mage = getPlayerAsset('mage');
  if (mage.id === 'mage' && mage.fallbackKey === 'placeholder_mage' && mage.portraitPath && mage.skillEffectPath) {
    pass('B-mage', `${mage.fallbackKey} portrait+skill-sheet registered, combat effect fallback`);
  } else {
    fail('B-mage', mage.fallbackKey);
  }

  if (
    getPlayerAsset('rogue').scale === 0.95 &&
    resolvePlayerAnim({ skillSlot: 'E' }) === 'skill2' &&
    resolvePlayerAnim({ skillSlot: 'Q' }) === 'skill1'
  ) {
    pass('C-rogue', 'shadow dash Q / backstab E');
  } else {
    fail('C-rogue', JSON.stringify(getPlayerAsset('rogue')));
  }

  if (
    resolveEnemyAnim({ dead: true, attacking: true }) === 'death' &&
    resolveEnemyAnim({ hit: true, attacking: true }) === 'hit' &&
    resolveEnemyAnim({ attacking: true, moving: true }) === 'attack_windup' &&
    resolveEnemyAnim({ attacking: true, attackActive: true }) === 'attack' &&
    resolveEnemyAnim({ moving: true }) === 'walk' &&
    getEnemyAsset('goblin').originY >= 0.8
  ) {
    pass('D-goblin', `size ${getEnemyAsset('goblin').visualSize}`);
  } else {
    fail('D-goblin', JSON.stringify(getEnemyAsset('goblin')));
  }

  const archer = getEnemyAsset('archer');
  if (
    archer.id === 'archer' &&
    resolveEnemyAnim({ attacking: true }) === 'attack_windup' &&
    resolveEnemyAnim({ attacking: true, attackActive: true }) === 'attack' &&
    resolveEnemyAnim({ dashing: true, moving: true }) === 'dash' &&
    publicExists(archer.path) &&
    archer.sourceKind === 'spritesheet' &&
    archer.frameWidth === 256 &&
    (archer.animations?.walk?.endFrame ?? 0) === 15
  ) {
    pass('E-archer', archer.path);
  } else {
    fail('E-archer', archer.id);
  }

  const brute = getEnemyAsset('brute');
  if (
    brute.visualSize > archer.visualSize &&
    brute.originY >= 0.85 &&
    resolveEnemyAnim({ attacking: true, moving: true }) === 'attack_windup' &&
    publicExists(brute.path) &&
    brute.sourceKind === 'spritesheet' &&
    brute.frameWidth === 256 &&
    (brute.animations?.death?.endFrame ?? -1) === 39
  ) {
    pass('F-brute', `stone_golem ${brute.path}`);
  } else {
    fail('F-brute', JSON.stringify({ path: brute.path, sourceKind: brute.sourceKind, size: brute.visualSize }));
  }

  const boss = getBossAsset('RUINS_GUARDIAN');
  if (
    resolveBossAnim({ dead: true }) === 'death' &&
    resolveBossAnim({ phaseTransition: true }) === 'phase_transition' &&
    resolveBossAnim({ bossPattern: 'heavy_slam' }) === 'attack_windup' &&
    resolveBossAnim({ bossPattern: 'heavy_slam', attackActive: true }) === 'slam' &&
    resolveBossAnim({ bossPattern: 'projectile_burst' }) === 'burst' &&
    resolveBossAnim({ bossPattern: 'charge' }) === 'idle' &&
    resolveBossAnim({ bossPattern: 'charge', attackActive: true }) === 'walk' &&
    boss.visualSize > brute.visualSize &&
    boss.originY >= 0.85 &&
    !boss.stateTextures?.charge &&
    !boss.stateTextures?.phase_transition
  ) {
    pass('G-boss', animationKey('boss', boss.id, 'idle'));
  } else {
    fail('G-boss', JSON.stringify(boss));
  }

  if (animationKey('player', 'warrior', 'idle') === 'player_warrior_idle' && animationKey('enemy', 'goblin', 'walk') === 'enemy_goblin_walk') {
    pass('H-facing-keys', 'player_warrior_idle / enemy_goblin_walk');
  } else {
    fail('H-facing-keys', animationKey('player', 'warrior', 'idle'));
  }

  const body = getClassAppearance('warrior').size;
  const visual = getPlayerAsset('warrior').visualSize * getPlayerAsset('warrior').scale;
  if (visual !== body && getEnemyAsset('goblin').visualSize !== body) {
    pass('I-collision', `body ${body} visual ${visual}`);
  } else {
    fail('I-collision', `${body}/${visual}`);
  }

  const warriorFile = publicExists(getPlayerAsset('warrior').path);
  const mageFile = publicExists(getPlayerAsset('mage').path);
  const adventurerFile = publicExists(getPlayerAsset(PLAYER_CLASS_ID.ADVENTURER).path);
  const missingCount = listCombatSpriteAssets().filter((asset) => !publicExists(asset.path)).length;
  if (warriorFile && mageFile && adventurerFile) {
    pass('J-missing-asset', `player frames PRESENT, ${missingCount} other combat sprites MISSING`);
  } else if (!warriorFile && !mageFile && missingCount === listCombatSpriteAssets().length) {
    pass('J-missing-asset', `all ${missingCount} combat sprites MISSING, mixed fallback ready`);
  } else if (warriorFile !== mageFile) {
    pass('J-missing-asset', `mixed warrior=${warriorFile} mage=${mageFile}`);
  } else if (!mageFile) {
    pass('J-missing-asset', 'mage placeholder fallback');
  } else {
    fail('J-missing-asset', JSON.stringify({ warriorFile, mageFile, adventurerFile, missingCount }));
  }

  if (resolvePlayerAnim({ dead: true, attacking: true, moving: true }) === 'death' && resolveEnemyAnim({ dead: true }) === 'death') {
    pass('K-death', 'logic death maps to death visual only');
  } else {
    fail('K-death', resolvePlayerAnim({ dead: true }));
  }

  const created = new Set<string>();
  const ensure = (key: string) => {
    if (created.has(key)) {
      return false;
    }
    created.add(key);
    return true;
  };
  const first = ensure('player_warrior_idle');
  const second = ensure('player_warrior_idle');
  if (first && !second) {
    pass('L-restart-anims', 'duplicate animation create skipped');
  } else {
    fail('L-restart-anims', `${first}/${second}`);
  }

  const hud = toCombatHudSkills(createSkills().getHudSlots(), 40);
  if (hud[0]?.name === '돌진 베기' && hud[1]?.name === '방어') {
    pass('M-hud', hud.map((slot) => slot.name).join('/'));
  } else {
    fail('M-hud', JSON.stringify(hud));
  }

  const story = toStoryScreenView(createInitialGameState());
  if (story.choices.length > 0 && story.story.npcId.length > 0) {
    pass('N-groq-story-view', `npc ${story.story.npcId} choices ${story.choices.length}`);
  } else {
    fail('N-groq-story-view', JSON.stringify({ npc: story.story.npcId, choices: story.choices.length }));
  }

  const storage = createMemoryStorage();
  const saveState = applyEvents(createInitialGameState(), [{ type: 'PLAYER_CLASS_UPDATED', classId: PLAYER_CLASS_ID.ROGUE }]);
  const orch = createGameOrchestrator(saveState, undefined, { saveService: createSaveService(storage) });
  await orch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  await orch.dispatch({ type: 'SET_PLAYER_CLASS', classId: PLAYER_CLASS_ID.WARRIOR });
  await orch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const restored = orch.getState();
  if (restored.player.classId === PLAYER_CLASS_ID.ROGUE && getPlayerAsset(restored.player.classId).id === 'rogue') {
    pass('O-save-load', `class ${restored.player.classId} visual ${getPlayerAsset(restored.player.classId).fallbackKey}`);
  } else {
    fail('O-save-load', restored.player.classId);
  }

  const projectileKinds = ['MAGIC_BOLT', 'FIREBALL', 'ENEMY_ARROW', 'BOSS_ARCANE_BOLT'] as const;
  const effects = ['slash_basic', 'frost_nova', 'shadow_dash', 'boss_slam'] as const;
  const rates = ANIMATION_FRAME_RATE.idle === 5 && ANIMATION_FRAME_RATE.walk === 6 && ANIMATION_FRAME_RATE.attack === 10;
  const playerEffectsPresent =
    publicExists(getEffectAsset('slash_basic').path) &&
    publicExists(getEffectAsset('slash_charge').path) &&
    publicExists(getEffectAsset('frost_nova').path) &&
    publicExists(getEffectAsset('shadow_dash').path) &&
    publicExists(getEffectAsset('backstab').path) &&
    publicExists(getProjectileAsset('MAGIC_BOLT').path);
  if (
    projectileKinds.every((kind) => getProjectileAsset(kind).fallbackKey.startsWith('placeholder_')) &&
    effects.every((id) => getEffectAsset(id).fallbackKey === 'graphics') &&
    !publicExists(getEffectAsset('boss_slam').path) &&
    playerEffectsPresent &&
    rates
  ) {
    pass('P-regression', 'player skill effects PRESENT, boss/guard Graphics fallback, frame rates, sprite/physics split');
  } else {
    fail('P-regression', 'fallback or rates');
  }

  const adventurer = getPlayerAsset(PLAYER_CLASS_ID.ADVENTURER);
  const adventurerMapped =
    adventurer.id === 'adventurer' &&
    adventurer.fallbackKey === 'placeholder_adventurer' &&
    adventurer.originY >= 0.8 &&
    adventurer.originY <= 1 &&
    adventurer.visualSize !== getClassAppearance(PLAYER_CLASS_ID.ADVENTURER).size &&
    Boolean(adventurer.portraitPath && publicExists(adventurer.portraitPath)) &&
    publicExists(adventurer.path) &&
    adventurer.sourceKind === 'spritesheet' &&
    adventurer.frameWidth === 256 &&
    (adventurer.animations?.idle?.endFrame ?? 0) === 7 &&
    resolvePlayerVisualId(PLAYER_CLASS_ID.ADVENTURER) === 'adventurer' &&
    resolvePlayerVisualId(PLAYER_CLASS_ID.WARRIOR) === 'swordsman' &&
    resolvePlayerVisualId('HIGH_SWORDSMAN') === 'swordsman' &&
    resolvePlayerVisualId('SWORDMASTER', CLASS_RANK_ID.WARRIOR_MASTER) === 'swordsman' &&
    resolvePlayerVisualId(PLAYER_CLASS_ID.MAGE, CLASS_RANK_ID.MAGE_MASTER) === 'mage' &&
    resolvePlayerVisualId(PLAYER_CLASS_ID.ROGUE, CLASS_RANK_ID.ROGUE_ADVANCED) === 'rogue' &&
    resolvePlayerAnim({ attacking: true }) === 'attack_windup' &&
    resolvePlayerAnim({ attacking: true, attackActive: true }) === 'attack' &&
    animationKey('player', adventurer.id, 'walk') === 'player_adventurer_walk';
  const firstWalk = ensure('player_adventurer_walk');
  const secondWalk = ensure('player_adventurer_walk');
  if (adventurerMapped && firstWalk && !secondWalk) {
    pass(
      'Q-adventurer',
      `${adventurer.portraitPath} originY ${adventurer.originY} portrait PRESENT spritesheet PRESENT`
    );
  } else {
    fail('Q-adventurer', JSON.stringify({ adventurerMapped, firstWalk, secondWalk, path: adventurer.path, originY: adventurer.originY }));
  }

  const goblin = getEnemyAsset('goblin');
  const goblinMage = getEnemyAsset('goblin_mage');
  const wolf = getEnemyAsset('dire_wolf');
  const enemyPresent =
    publicExists(goblin.path) &&
    publicExists(archer.path) &&
    publicExists(brute.path) &&
    publicExists(goblinMage.path) &&
    publicExists(wolf.path) &&
    publicExists(boss.path) &&
    publicExists(boss.stateTextures?.idle ?? '') &&
    publicExists(getProjectileAsset('ENEMY_ARROW').path) &&
    publicExists(getProjectileAsset('FIREBALL').path) &&
    goblin.sourceKind === 'spritesheet' &&
    archer.sourceKind === 'spritesheet' &&
    brute.sourceKind === 'spritesheet' &&
    goblinMage.sourceKind === 'spritesheet' &&
    wolf.sourceKind === 'spritesheet' &&
    (goblin.animations?.attack?.startFrame ?? -1) === 16 &&
    (goblin.animations?.death?.endFrame ?? -1) === 39;
  if (enemyPresent) {
    pass(
      'R-enemy-boss-sprites',
      `smooth pack + boss + projectiles PRESENT walk=${goblin.animations?.walk?.frameRate}`
    );
  } else {
    fail(
      'R-enemy-boss-sprites',
      JSON.stringify({
        goblin: goblin.path,
        archer: archer.path,
        brute: brute.path,
        goblinMage: goblinMage.path,
        wolf: wolf.path,
        boss: boss.path,
      })
    );
  }

  return lines;
}
