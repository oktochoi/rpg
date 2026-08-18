import { createInitialGameState } from '../../core/initial-state';
import { applyEvents } from '../../core/reducer';
import { PLAYER_CLASS_ID } from '../../player/classes';
import { toStoryScreenView } from '../../story/story-view';
import { LOCATION_ID } from '../../world/locations/location-definitions';
import { getClassAppearance } from '../player/class-appearance';
import { SkillController } from '../skills/SkillController';
import { toCombatHudSkills } from '../hud/build-combat-hud-state';
import { cardinalFromVector } from './combat-depth';
import {
  GAME_ASSETS,
  PLACEHOLDER_STYLES,
  getEnemyAsset,
  getNpcAsset,
  getPlayerAsset,
  getProjectileAsset,
  getSkillIconId,
  getStoryBackground,
  listActorAssets,
  resolvePlayerVisual,
} from './asset-registry';
import { resolvePlayerVisualId } from './resolve-player-visual';
import { resetMissingAssetWarnings, warnMissingAsset } from './asset-missing';
import { projectileKindFromSpawn } from './ProjectileVisual';
import { resolveNpcPortrait } from '../../visual/npc-portrait';
import { resolveStoryBackground } from '../../visual/story-background';

function createSkills(classId: (typeof PLAYER_CLASS_ID)[keyof typeof PLAYER_CLASS_ID], mp: number) {
  return new SkillController({
    classId,
    vitals: {
      isDead: () => false,
      isCombatLocked: () => false,
      currentMp: () => mp,
      consumeMp: () => true,
    },
    aim: {
      playerX: () => 0,
      playerY: () => 0,
      pointerX: () => 1,
      pointerY: () => 0,
    },
    executors: {
      warrior_charge_slash: () => ({ ok: true }),
      warrior_guard: () => ({ ok: true }),
      mage_fireball: () => ({ ok: true }),
      mage_frost_nova: () => ({ ok: true }),
      rogue_shadow_dash: () => ({ ok: true }),
      rogue_backstab: () => ({ ok: true }),
    },
  });
}

export async function runStep28VisualScenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const warrior = getPlayerAsset('warrior');
  const mage = getPlayerAsset('mage');
  const rogue = getPlayerAsset('rogue');
  const adventurer = getPlayerAsset(PLAYER_CLASS_ID.ADVENTURER);
  if (
    warrior.id === 'swordsman' &&
    warrior.fallbackKey !== mage.fallbackKey &&
    mage.fallbackKey !== rogue.fallbackKey &&
    warrior.visualSize !== rogue.visualSize &&
    adventurer.id === 'adventurer' &&
    adventurer.fallbackKey === 'placeholder_adventurer' &&
    adventurer.visualSize !== getClassAppearance(PLAYER_CLASS_ID.ADVENTURER).size &&
    adventurer.portraitPath &&
    warrior.portraitPath &&
    resolvePlayerVisual('warrior').id === 'swordsman' &&
    resolvePlayerVisualId('HIGH_MAGE') === 'mage' &&
    resolvePlayerVisualId('SHADOW_ROGUE') === 'rogue'
  ) {
    pass('A-player-visual', `${adventurer.fallbackKey} ${warrior.fallbackKey} ${mage.fallbackKey} ${rogue.fallbackKey}`);
  } else {
    fail('A-player-visual', JSON.stringify({ adventurer, warrior, mage, rogue }));
  }

  const warriorBody = getClassAppearance('warrior').size;
  const mageBody = getClassAppearance('mage').size;
  if (warrior.visualSize !== warriorBody && mage.visualSize !== mageBody) {
    pass('B-move-physics', `visual ${warrior.visualSize} body ${warriorBody}`);
  } else {
    fail('B-move-physics', `visual matched body ${warrior.visualSize}/${warriorBody}`);
  }

  if (cardinalFromVector(-1, 0) === 'LEFT' && cardinalFromVector(0, -1) === 'UP') {
    pass('C-dash-facing', 'LEFT/UP ready for dash/attack facing');
  } else {
    fail('C-dash-facing', `${cardinalFromVector(-1, 0)} ${cardinalFromVector(0, -1)}`);
  }

  if (cardinalFromVector(1, 0.2) === 'RIGHT' && cardinalFromVector(0.2, 1) === 'DOWN') {
    pass('D-attack-facing', 'mouse-aim cardinal mapping');
  } else {
    fail('D-attack-facing', `${cardinalFromVector(1, 0.2)} ${cardinalFromVector(0.2, 1)}`);
  }

  const goblin = getEnemyAsset('goblin');
  const archer = getEnemyAsset('archer');
  const brute = getEnemyAsset('brute');
  if (goblin.visualSize < archer.visualSize && archer.visualSize < brute.visualSize && brute.originY >= 0.85) {
    pass('E-enemies', `${goblin.visualSize} ${archer.visualSize} ${brute.visualSize}`);
  } else {
    fail('E-enemies', JSON.stringify({ goblin, archer, brute }));
  }

  const kinds = [
    projectileKindFromSpawn('mage_fireball', 'player', 0xff7a3d),
    projectileKindFromSpawn('magic_bolt', 'player', 0x7ec8ff),
    projectileKindFromSpawn('enemy_shot', 'enemy', 0xffb060),
    projectileKindFromSpawn('boss_burst', 'enemy', 0xb45c9a),
  ];
  if (
    kinds[0] === 'FIREBALL' &&
    kinds[1] === 'MAGIC_BOLT' &&
    kinds[2] === 'ENEMY_ARROW' &&
    kinds[3] === 'BOSS_ARCANE_BOLT' &&
    getProjectileAsset('FIREBALL').fallbackKey !== getProjectileAsset('ENEMY_ARROW').fallbackKey
  ) {
    pass('F-projectiles', kinds.join(','));
  } else {
    fail('F-projectiles', kinds.join(','));
  }

  const boss = GAME_ASSETS.BOSS.ruins_guardian;
  if (boss.visualSize > brute.visualSize && boss.fallbackKey === 'placeholder_ruins_guardian' && boss.originY >= 0.85) {
    pass('G-boss', `size ${boss.visualSize} originY ${boss.originY}`);
  } else {
    fail('G-boss', JSON.stringify(boss));
  }

  const hudWarrior = toCombatHudSkills(createSkills(PLAYER_CLASS_ID.WARRIOR, 40).getHudSlots(), 40);
  const hudMageLow = toCombatHudSkills(createSkills(PLAYER_CLASS_ID.MAGE, 10).getHudSlots(), 10);
  const frost = hudMageLow.find((slot) => slot.slot === 'E');
  if (
    hudWarrior[0]?.name === 'Charge Slash' &&
    hudWarrior[1]?.name === 'Guard' &&
    hudWarrior.every((slot) => slot.available) &&
    frost?.name === 'Frost Nova' &&
    frost.available === false &&
    frost.mpCost === 30
  ) {
    pass('H-hud', `Q ${hudWarrior[0].name} frostMp ${frost.mpCost}`);
  } else {
    fail('H-hud', JSON.stringify({ hudWarrior, frost }));
  }

  const hudRogue = toCombatHudSkills(createSkills(PLAYER_CLASS_ID.ROGUE, 80).getHudSlots(), 80);
  if (
    hudRogue[0]?.name === 'Shadow Dash' &&
    hudRogue[1]?.name === 'Backstab' &&
    getSkillIconId('warrior_charge_slash') === 'slash' &&
    getSkillIconId('mage_fireball') === 'fire'
  ) {
    pass('I-skills', hudRogue.map((slot) => `${slot.key}:${slot.name}`).join(' '));
  } else {
    fail('I-skills', JSON.stringify(hudRogue));
  }

  const seria = resolveNpcPortrait('seria', 'curiosity');
  const leon = resolveNpcPortrait('leon');
  const marta = resolveNpcPortrait('marta');
  if (
    seria.assetId === 'seria_curiosity' &&
    seria.path === '/assets/story_assets_pack/06_seria_scholar_npc.png' &&
    leon.letter !== seria.letter &&
    leon.path === '/assets/story_assets_pack/07_leon_knight_npc.png' &&
    marta.npcId === 'innkeeper' &&
    marta.path === '/assets/story_assets_pack/08_marta_innkeeper_npc.png' &&
    getNpcAsset('innkeeper').id === 'innkeeper'
  ) {
    pass('J-portraits', `${seria.assetId} ${leon.letter} ${marta.letter}`);
  } else {
    fail('J-portraits', JSON.stringify({ seria, leon, marta }));
  }

  const village = resolveStoryBackground(LOCATION_ID.LUEN_VILLAGE);
  const forest = resolveStoryBackground(LOCATION_ID.FOREST_ROAD);
  const ruins = resolveStoryBackground(LOCATION_ID.ANCIENT_RUINS);
  const unknown = resolveStoryBackground('missing_place');
  const guild = resolveStoryBackground(LOCATION_ID.LUEN_ADVENTURERS_GUILD);
  if (
    village.theme === 'village' &&
    village.path === '/assets/story_assets_pack/01_luen_village_square.png' &&
    forest.theme === 'forest' &&
    ruins.theme === 'ruins' &&
    guild.theme === 'guild' &&
    unknown.theme === 'village' &&
    getStoryBackground(LOCATION_ID.BLUE_MOON_INN).theme === 'inn'
  ) {
    pass('K-background', `${village.theme}/${forest.theme}/${ruins.theme}/${guild.theme}`);
  } else {
    fail('K-background', JSON.stringify({ village, forest, ruins, unknown, guild }));
  }

  resetMissingAssetWarnings();
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };
  warnMissingAsset('goblin_idle');
  warnMissingAsset('goblin_idle');
  console.warn = originalWarn;
  const fallbacks = new Set(PLACEHOLDER_STYLES.map((style) => style.key));
  const combatAssets = [
    ...Object.values(GAME_ASSETS.PLAYER),
    ...Object.values(GAME_ASSETS.ENEMY),
    ...Object.values(GAME_ASSETS.BOSS),
    ...Object.values(GAME_ASSETS.PROJECTILE),
  ];
  const everyFallback = combatAssets.every((asset) => fallbacks.has(asset.fallbackKey));
  if (warnings.length === 1 && warnings[0] === '[Asset missing: goblin_idle]' && everyFallback) {
    pass('L-missing-asset', 'warn-once + placeholder fallback keys');
  } else {
    fail('L-missing-asset', JSON.stringify({ warnings, everyFallback }));
  }

  const uniqueIds = listActorAssets().map((asset) => asset.id);
  if (new Set(uniqueIds).size === uniqueIds.length) {
    pass('M-cleanup-ids', `${uniqueIds.length} unique asset ids`);
  } else {
    fail('M-cleanup-ids', uniqueIds.join(','));
  }

  const initial = createInitialGameState();
  const moved = applyEvents(initial, [{ type: 'LOCATION_ENTERED', locationId: LOCATION_ID.ANCIENT_RUINS }]);
  const view = toStoryScreenView(moved, undefined, { npcEmotion: 'neutral' });
  if (
    view.locationId === LOCATION_ID.ANCIENT_RUINS &&
    view.story.npcId.length > 0 &&
    view.choices.length > 0 &&
    view.relations.length >= 3 &&
    view.quest.title.length > 0
  ) {
    pass('N-regression', `${view.locationId} npc ${view.story.npcId} choices ${view.choices.length}`);
  } else {
    fail('N-regression', JSON.stringify({ locationId: view.locationId, npc: view.story.npcId, choices: view.choices.length }));
  }

  return lines;
}
