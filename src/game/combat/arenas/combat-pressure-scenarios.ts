import { ARENA_ID } from '../arenas/arena-types';
import { ARENA_DEFINITIONS } from '../arenas/arena-definitions';
import { dashStoppedByWall, layoutArena, predictAim, toWorldRect, walkableRatio } from '../arenas/arena-geometry';
import { clampToWalkable, createWalkableArea, walkableContains } from '../arenas/walkable-bounds';
import { AttackTokenBoard, canGrantMeleeToken } from '../enemies/attack-tokens';
import { ENEMY_DEFINITIONS } from '../enemies/enemy-definitions';
import { ENEMY_TYPE_ID } from '../enemies/enemy-types';
import { MeleeBehavior } from '../enemies/behaviors/MeleeBehavior';
import { RangedBehavior } from '../enemies/behaviors/RangedBehavior';
import { HeavyMeleeBehavior } from '../enemies/behaviors/HeavyMeleeBehavior';
import type { EnemyBehaviorContext } from '../enemies/behaviors/behavior-types';
import { surroundOffset } from '../enemies/behaviors/behavior-types';
import { ENCOUNTER_ID, getEncounter } from '../encounters/encounter-definitions';
import { PLAYER_HIT_INVINCIBLE_MS, POTION_COOLDOWN_MS } from '../CombatConfig';
import { DASH_PROFILES, PLAYER_CLASSES } from '../../player/classes/class-definitions';
import { bannedRepeat, selectWeightedBossPattern } from '../boss/pattern-selection';
import { BOSS_PATTERN_ID } from '../boss/boss-types';
import { circleHitsRect } from '../arenas/arena-geometry';

function ctx(
  type: keyof typeof ENEMY_DEFINITIONS,
  overrides: Partial<EnemyBehaviorContext> = {}
): EnemyBehaviorContext {
  const definition = ENEMY_DEFINITIONS[type];
  return {
    x: 0,
    y: 0,
    playerX: 200,
    playerY: 0,
    playerVx: 0,
    playerVy: 0,
    homeX: 0,
    homeY: 0,
    distance: 200,
    isPlayerAlive: true,
    isAttacking: false,
    knockbackActive: false,
    moveSpeed: definition.moveSpeed,
    definition,
    formationIndex: 0,
    aliveCount: 1,
    hasMeleeToken: true,
    ...overrides,
  };
}

export function runCombatPressureScenarios(): string[] {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const ids = [
    ARENA_ID.FOREST_SCOUTS,
    ARENA_ID.FOREST_AMBUSH,
    ARENA_ID.GOBLIN_CAMP,
    ARENA_ID.RUINS_ENTRANCE,
    ARENA_ID.RUINS_GUARDIAN,
  ] as const;
  const ratios = ids.map((id) => {
    const arena = ARENA_DEFINITIONS[id];
    const layout = layoutArena(1280, 720, arena.logicalWidth, arena.logicalHeight);
    const solids = [...arena.walls, ...arena.obstacles].map((rect) => toWorldRect(rect, layout));
    return { id, ratio: walkableRatio(layout.width, layout.height, solids), obstacles: arena.obstacles.length };
  });
  if (ratios.every((item) => item.ratio >= 0.8 && item.ratio <= 0.92 && item.obstacles >= 3)) {
    pass(
      'arenas-walkable',
      ratios.map((item) => `${item.id}:${(item.ratio * 100).toFixed(0)}%`).join(' ')
    );
  } else {
    fail('arenas-walkable', JSON.stringify(ratios));
  }

  const scouts = getEncounter(ENCOUNTER_ID.CH1_FOREST_SCOUTS);
  const ambush = getEncounter(ENCOUNTER_ID.CH1_FOREST_AMBUSH);
  const camp = getEncounter(ENCOUNTER_ID.CH1_GOBLIN_CAMP);
  const gate = getEncounter(ENCOUNTER_ID.CH1_RUINS_GATE);
  const boss = getEncounter(ENCOUNTER_ID.RUINS_BOSS_01);
  if (
    scouts?.arenaId === ARENA_ID.FOREST_SCOUTS &&
    ambush?.arenaId === ARENA_ID.FOREST_AMBUSH &&
    camp?.arenaId === ARENA_ID.GOBLIN_CAMP &&
    gate?.arenaId === ARENA_ID.RUINS_ENTRANCE &&
    boss?.arenaId === ARENA_ID.RUINS_GUARDIAN &&
    (camp?.enemies.length ?? 0) >= 4
  ) {
    pass('encounter-arenas', `${scouts.difficultyTag} ${ambush?.difficultyTag} ${camp?.difficultyTag} ${gate?.difficultyTag}`);
  } else {
    fail('encounter-arenas', JSON.stringify({ scouts, ambush, camp, gate, boss }));
  }

  const adventurerDash = DASH_PROFILES.adventurer_dash;
  const playerSpeed = PLAYER_CLASSES.adventurer.baseStats.moveSpeed;
  const goblin = ENEMY_DEFINITIONS[ENEMY_TYPE_ID.GOBLIN];
  if (
    adventurerDash.cooldownMs >= 750 &&
    adventurerDash.cooldownMs <= 1000 &&
    goblin.moveSpeed / playerSpeed >= 0.8 &&
    goblin.moveSpeed / playerSpeed <= 0.95 &&
    PLAYER_HIT_INVINCIBLE_MS >= 250 &&
    PLAYER_HIT_INVINCIBLE_MS <= 400 &&
    POTION_COOLDOWN_MS >= 1000 &&
    POTION_COOLDOWN_MS <= 2000
  ) {
    pass(
      'player-feel',
      `dashCd ${adventurerDash.cooldownMs} goblin ${goblin.moveSpeed}/${playerSpeed} i-frame ${PLAYER_HIT_INVINCIBLE_MS} potion ${POTION_COOLDOWN_MS}`
    );
  } else {
    fail('player-feel', JSON.stringify({ adventurerDash, goblin, playerSpeed }));
  }

  const floors = (['forest', 'camp', 'ruins', 'guardian', 'yard'] as const).map((theme) => ({
    theme,
    area: createWalkableArea(theme, 1280, 720),
  }));
  const forestFloor = floors[0]?.area;
  const sky = forestFloor ? walkableContains(forestFloor, 640, 80) : true;
  const clearing = forestFloor ? walkableContains(forestFloor, 640, 520) : false;
  const treeLine = forestFloor ? walkableContains(forestFloor, 40, 520) : true;
  const pulled = forestFloor ? clampToWalkable(forestFloor, 40, 80, 16) : { x: 0, y: 0 };
  const pulledInside = forestFloor ? walkableContains(forestFloor, pulled.x, pulled.y, 16) : false;
  const themed = floors.every(({ area }) => {
    const midX = area.aabb.x + area.aabb.width / 2;
    const midY = area.aabb.y + area.aabb.height * 0.72;
    return walkableContains(area, midX, midY) && !walkableContains(area, midX, 40);
  });
  if (forestFloor && !sky && clearing && !treeLine && pulledInside && pulled.y > forestFloor.aabb.y && themed) {
    pass('walkable-floor', `forest center ok, edge ${pulled.x.toFixed(0)},${pulled.y.toFixed(0)}`);
  } else {
    fail('walkable-floor', JSON.stringify({ sky, clearing, treeLine, pulled, pulledInside, themed }));
  }

  const melee = new MeleeBehavior();
  const left = surroundOffset(ctx(ENEMY_TYPE_ID.GOBLIN, { formationIndex: 0, aliveCount: 3 }), 48);
  const mid = surroundOffset(ctx(ENEMY_TYPE_ID.GOBLIN, { formationIndex: 1, aliveCount: 3 }), 48);
  const right = surroundOffset(ctx(ENEMY_TYPE_ID.GOBLIN, { formationIndex: 2, aliveCount: 3 }), 48);
  const lunge = melee.shouldStartAttack(ctx(ENEMY_TYPE_ID.GOBLIN, { distance: 90 }));
  const noToken = melee.shouldStartAttack(ctx(ENEMY_TYPE_ID.GOBLIN, { distance: 40, hasMeleeToken: false }));
  if (left.y !== right.y && mid.x !== left.x && lunge && !noToken) {
    pass('goblin-flank-lunge', `slots ${left.y.toFixed(0)}/${right.y.toFixed(0)}`);
  } else {
    fail('goblin-flank-lunge', JSON.stringify({ left, mid, right, lunge, noToken }));
  }

  const ranged = new RangedBehavior();
  const predicted = predictAim(0, 0, 100, 0, 220, 0, 0.2);
  const hold = ranged.chooseMove(ctx(ENEMY_TYPE_ID.ARCHER, { distance: 250, playerX: 250 }));
  const retreatLimited = ranged.chooseMove(
    ctx(ENEMY_TYPE_ID.ARCHER, { x: 160, distance: 80, playerX: 80, homeX: 0, homeY: 0 })
  );
  if (predicted.x > 0.9 && Math.abs(hold.vx) < 80 && retreatLimited.vy !== undefined) {
    pass('archer-prediction', `aim ${predicted.x.toFixed(2)} retreat ${retreatLimited.vx.toFixed(0)}`);
  } else {
    fail('archer-prediction', JSON.stringify({ predicted, hold, retreatLimited }));
  }

  const heavy = new HeavyMeleeBehavior();
  const wantCharge = heavy.shouldStartAttack(ctx(ENEMY_TYPE_ID.BRUTE, { distance: 180 }));
  const bruteDef = ENEMY_DEFINITIONS[ENEMY_TYPE_ID.BRUTE];
  if (wantCharge && bruteDef.stunLockImmune && (bruteDef.chargeSpeed ?? 0) > bruteDef.moveSpeed) {
    pass('brute-charge', `speed ${bruteDef.chargeSpeed} windup ${bruteDef.chargeWindupMs}`);
  } else {
    fail('brute-charge', JSON.stringify({ wantCharge, bruteDef }));
  }

  const board = new AttackTokenBoard(2);
  const a = board.tryAcquireMelee('g1');
  const b = board.tryAcquireMelee('g2');
  const c = board.tryAcquireMelee('g3');
  board.release('g1');
  const d = board.tryAcquireMelee('g3');
  if (a && b && !c && d && canGrantMeleeToken(1) && !canGrantMeleeToken(2)) {
    pass('attack-tokens', `slots ${board.maxSlots} third-blocked`);
  } else {
    fail('attack-tokens', JSON.stringify({ a, b, c, d }));
  }

  const pillar = { x: 40, y: 40, w: 20, h: 80 };
  const blocked = dashStoppedByWall(30, 80, 1, 0, 80, 12, [pillar]);
  const arrowHit = circleHitsRect({ x: 50, y: 80, radius: 7 }, pillar);
  if (blocked && arrowHit) {
    pass('cover-collision', 'pillar blocks dash path and projectile radius');
  } else {
    fail('cover-collision', JSON.stringify({ blocked, arrowHit }));
  }

  const banned = bannedRepeat(['heavy_slam', 'heavy_slam']);
  const picks = Array.from({ length: 12 }, (_, index) => selectWeightedBossPattern(90, ['heavy_slam', 'heavy_slam'], () => (index % 10) / 10));
  if (banned === 'heavy_slam' && picks.every((id) => id !== 'heavy_slam')) {
    pass('pattern-rotation', `banned ${banned} alt ${Array.from(new Set(picks)).join(',')}`);
  } else {
    fail('pattern-rotation', JSON.stringify({ banned, picks }));
  }

  const far = selectWeightedBossPattern(320, [], () => 0.99);
  const near = selectWeightedBossPattern(80, [], () => 0.01);
  if (far === BOSS_PATTERN_ID.CHARGE && near === BOSS_PATTERN_ID.HEAVY_SLAM) {
    pass('pattern-distance', `far ${far} near ${near}`);
  } else {
    fail('pattern-distance', JSON.stringify({ far, near }));
  }

  return lines;
}
