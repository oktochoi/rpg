import * as Phaser from 'phaser';
import { EventBus } from '../../EventBus';
import type { CombatStatus } from '../combat-state';
import { ATTACK_MOVE_MULTIPLIER, PLAYER_MAX_HP, POTION_COOLDOWN_MS } from '../CombatConfig';
import { CombatArena } from '../arenas/CombatArena';
import { DangerZoneController } from '../effects/DangerZoneController';
import { ITEM_ID, getItemDefinition } from '../../inventory/item-definitions';
import { COMBAT_CONFIG_REGISTRY_KEY } from '../CombatGame';
import { CombatFeedback } from '../effects/CombatFeedback';
import { COMBAT_FEEL } from '../effects/CombatFeelConfig';
import { EnemyManager } from '../enemies/EnemyManager';
import type { EnemyController } from '../enemies/EnemyController';
import type { EnemyRangedShot } from '../enemies/enemy-runtime';
import { CombatHud } from '../hud/CombatHud';
import { BossHud } from '../hud/BossHud';
import { getBasicAttack } from '../attacks/basic-attack-definitions';
import {
  damageNumberForStrike,
  isBasicAttackId,
  readCombatHp,
  rollBasicAttackStrike,
} from '../attacks/basic-attack-strike';
import { PlayerAttackController } from '../player/PlayerAttackController';
import { getClassAppearance } from '../player/class-appearance';
import { PlayerController } from '../player/PlayerController';
import { PlayerHealthController } from '../player/PlayerHealthController';
import { PlayerSkillController } from '../player/PlayerSkillController';
import { ProjectileController } from '../projectiles/ProjectileController';
import { SkillCombatService } from '../skills/SkillCombatService';
import { createSkillExecutors } from '../skills/skill-executors';
import { EncounterManager } from '../encounters/EncounterManager';
import { encounterEntranceSide, openingAttackDelayMs, planEncounterStart, type EncounterStartPhase, type EncounterStartPlan } from '../encounters/encounter-intro';
import { clearEncounterCue, publishEncounterCue } from '../encounters/encounter-cue-bridge';
import { ENCOUNTER_ID, resolveEncounterId, resolveSpawnPoint } from '../encounters/encounter-definitions';
import { getBossDefinition } from '../boss/boss-definitions';
import { BossController } from '../boss/BossController';
import type { CombatHittable } from '../types/combat-hittable';
import { getDashProfile, getPlayerClass, resolvePlayerClassId } from '../../player/classes';
import type { CombatConfig } from '../types/combat-config';
import { COMBAT_RESULT_EVENT, type CombatResult } from '../types/combat-result';
import { getBossAsset, getEnemyAsset, getPlayerAsset } from '../visual/asset-registry';
import { CombatAssetLoader } from '../visual/CombatAssetLoader';
import { createBossVisual as makeBossVisual, createPlayerVisual as makePlayerVisual } from '../visual/visual-factory';
import type { BossVisual } from '../visual/BossVisual';
import type { PlayerVisual } from '../visual/PlayerVisual';
import { publishCombatHud } from '../hud/combat-hud-bridge';
import { setCombatOutcomeHandlers } from '../hud/combat-outcome-bridge';
import { ENEMY_TYPE_ID } from '../enemies/enemy-types';
import { buildCombatHudState } from '../hud/build-combat-hud-state';
import { audioManager, bgmContextForCombat, BGM_CONTEXT, SFX_ID, playPlayerSwing, sfxForDash, sfxForEnemyAttack, sfxForSkill } from '../../audio';
import { isGameDebugEnabled } from '../../debug/debug-flags';

export class CombatScene extends Phaser.Scene {
  private playerVisual?: PlayerVisual;
  private bossVisual?: BossVisual;
  private player?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc;
  private controller?: PlayerController;
  private health?: PlayerHealthController;
  private attack?: PlayerAttackController;
  private skills?: PlayerSkillController;
  private skillCombat?: SkillCombatService;
  private projectiles?: ProjectileController;
  private enemyManager?: EnemyManager;
  private encounterManager?: EncounterManager;
  private boss?: BossController;
  private hud?: CombatHud;
  private bossHud?: BossHud;
  private feedback?: CombatFeedback;
  private arena?: CombatArena;
  private dangerZones?: DangerZoneController;
  private potionKey: Phaser.Input.Keyboard.Key | null = null;
  private potionCount = 0;
  private potionCooldownMs = 0;
  private potionsUsed = 0;
  private aliveLabel?: Phaser.GameObjects.Text;
  private combatConfig?: CombatConfig;
  private status: CombatStatus = 'RUNNING';
  private lastSlashAttackId = 0;
  private playerSize = 32;
  private resultSent = false;
  private lastSkillVisualId: string | null = null;
  private skillVisualUntil = 0;
  private lastVisualDelta = 16;
  private wasDashing = false;
  private wasPlayerDead = false;
  private wasPhaseTransition = false;
  private readonly heardDeathIds = new Set<string>();
  /** PRE_ENCOUNTER → ENEMY_ENTRANCE → READY → ACTIVE_COMBAT. AI stays halted until active. */
  private startPhase: EncounterStartPhase = 'pre';
  private phaseMs = 0;
  private phaseBudget = 1;
  private startPlan: EncounterStartPlan | null = null;
  private playerEntering = false;
  private playerEnterFacing = 1;

  constructor() {
    super('CombatScene');
  }

  preload(): void {
    CombatAssetLoader.preload(this);
  }

  create(): void {
    CombatAssetLoader.create(this);
    this.status = 'RUNNING';
    this.resultSent = false;
    this.retreatOnLeave = false;
    this.wasDashing = false;
    this.wasPlayerDead = false;
    this.wasPhaseTransition = false;
    this.phaseMs = 0;
    this.startPlan = null;
    this.playerEntering = false;
    this.heardDeathIds.clear();
    this.startPhase = 'pre';
    this.boss = undefined;
    this.bossHud = undefined;
    this.combatConfig = this.registry.get(COMBAT_CONFIG_REGISTRY_KEY) as CombatConfig | undefined;
    this.arena = new CombatArena(this, this.combatConfig?.arenaId ?? 'forest_scouts_arena', this.combatConfig?.spawnBias ?? 'default');
    this.dangerZones = new DangerZoneController(this);
    this.potionCount = this.combatConfig?.player.healingPotions ?? 0;
    this.potionCooldownMs = 0;
    this.potionsUsed = 0;
    this.potionKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H) ?? null;
    this.cameras.main.setBackgroundColor('#12100e');
    this.syncWorldBounds();

    const classId = resolvePlayerClassId(this.combatConfig?.player.classId ?? 'wanderer');
    const classDefinition = getPlayerClass(classId);
    const appearance = getClassAppearance(classId);
    const dash = getDashProfile(classId);
    this.playerSize = appearance.size;

    const player = this.createPlayerVisual(appearance);
    const spawn = this.arena?.view.playerSpawn ?? { x: this.scale.width / 2, y: this.scale.height / 2 };
    player.setPosition(spawn.x, spawn.y);
    player.setAlpha(0);
    this.physics.add.existing(player);

    const body = player.body as Phaser.Physics.Arcade.Body;
    this.player = player;
    this.playerVisual = makePlayerVisual(this, classId, appearance.size);
    this.controller = new PlayerController(this, body, {
      moveSpeed: this.combatConfig?.player.moveSpeed ?? classDefinition.baseStats.moveSpeed,
      dash,
      clampBlink: (x, y, radius) => this.arena?.clampPoint(x, y, radius) ?? { x, y },
    });
    const training = this.combatConfig?.training === true;
    this.health = new PlayerHealthController(this, player, this.controller, {
      maxHp: this.combatConfig?.player.maxHp ?? PLAYER_MAX_HP,
      currentHp: this.combatConfig?.player.currentHp ?? PLAYER_MAX_HP,
      maxMp: this.combatConfig?.player.maxMp ?? classDefinition.baseStats.maxMp,
      currentMp: this.combatConfig?.player.currentMp ?? classDefinition.baseStats.maxMp,
      bodyColor: appearance.color,
      size: appearance.size,
      infiniteResources: training,
      invulnerable: training,
    });
    this.projectiles = new ProjectileController(this);
    const basic = getBasicAttack(classId, classDefinition.combat.basicAttackId);
    const rangeScale = this.combatConfig?.player.attackRangeScale ?? 1;
    const attackPercent = this.combatConfig?.player.attackPercent ?? 0;
    const rawDamage = basic.damage + (this.combatConfig?.player.attackBonus ?? 0);
    this.attack = new PlayerAttackController(this, player, this.controller, {
      profile: {
        ...basic,
        damage: Math.max(1, Math.round(rawDamage * (1 + attackPercent / 100))),
        hitbox: {
          ...basic.hitbox,
          width: Math.round(basic.hitbox.width * rangeScale),
          height: Math.round(basic.hitbox.height * rangeScale),
          offset: Math.round(basic.hitbox.offset * rangeScale),
        },
        projectile: basic.projectile
          ? {
              ...basic.projectile,
              lifetimeMs: Math.round(basic.projectile.lifetimeMs * rangeScale),
              radius: Math.max(4, Math.round(basic.projectile.radius * Math.min(rangeScale, 1.25))),
            }
          : undefined,
      },
      spawnProjectile: (request) => {
        const strike = isBasicAttackId(request.skillId)
          ? rollBasicAttackStrike(request.damage)
          : { damage: request.damage, critical: false };
        this.projectiles?.spawn({
          skillId: request.skillId,
          x: request.originX,
          y: request.originY,
          pointerX: request.pointerX,
          pointerY: request.pointerY,
          speed: request.speed,
          damage: strike.damage,
          lifetimeMs: request.lifetimeMs,
          radius: request.radius,
          color: request.color,
          knockbackScale: request.knockbackScale,
          owner: 'player',
          critical: strike.critical,
        });
        playPlayerSwing(classId, this.attack?.attackId ?? 0);
      },
    });
    this.feedback = new CombatFeedback(this);
    const openingScout =
      this.combatConfig?.encounterId === ENCOUNTER_ID.CH1_FOREST_SCOUTS &&
      this.combatConfig?.repeatEncounter !== true;
    this.enemyManager = new EnemyManager(
      this,
      player,
      () => !this.health?.isDead,
      this.handleEnemyRangedShot,
      openingScout ? 1 : 2
    );
    this.enemyManager.setWorldQueries(
      () => ({ x: this.controller?.facing ? (player.body as Phaser.Physics.Arcade.Body).velocity.x : 0, y: (player.body as Phaser.Physics.Arcade.Body).velocity.y }),
      (x, y, radius) => this.arena?.collidesCircle(x, y, radius) ?? false
    );
    if (this.arena) {
      this.enemyManager.setNavigation(this.arena.solidRects, this.arena.walkableAabb, (x, y) =>
        this.arena?.containsWalkable(x, y) ?? true
      );
    }
    this.encounterManager = new EncounterManager(this.enemyManager);
    const encounterId =
      this.combatConfig?.encounterId ?? resolveEncounterId(this.combatConfig?.combatId ?? '') ?? ENCOUNTER_ID.RUINS_EASY_01;
    const layout = this.arena?.layout;
    this.encounterManager.start(encounterId, {
      width: layout?.width ?? this.scale.width,
      height: layout?.height ?? this.scale.height,
      originX: layout?.x ?? 0,
      originY: layout?.y ?? 0,
      instanceIds: this.combatConfig?.enemies.map((enemy) => enemy.id),
    });
    this.spawnBossIfNeeded(player);
    this.beginEncounterIntro();
    this.skillCombat = new SkillCombatService(
      this,
      () => this.player,
      this.controller,
      this.health,
      this.feedback,
      () => this.getHittables(),
      (enemy, damage) => {
        this.feedback?.playAttackHit(enemy.gameObject, damage, {
          shakeScale: this.isBossTarget(enemy) ? COMBAT_FEEL.bossChipShakeScale : 1,
          offsetY: this.hitOffset(enemy),
        });
        audioManager.playSfx(SFX_ID.ENEMY_HIT);
        this.checkCombatEnd();
      }
    );
    this.skills = new PlayerSkillController(this, {
      classId,
      vitals: {
        isDead: () => this.health?.isDead === true,
        isCombatLocked: () => this.controller?.isCombatLocked === true || this.status !== 'RUNNING',
        currentMp: () => this.health?.currentMp ?? 0,
        consumeMp: (amount) => this.health?.consumeMp(amount) ?? false,
      },
      aim: {
        playerX: () => this.player?.x ?? 0,
        playerY: () => this.player?.y ?? 0,
        pointerX: () => this.input.activePointer.worldX,
        pointerY: () => this.input.activePointer.worldY,
      },
      executors: createSkillExecutors({
        spawnFireball: (context) => this.projectiles?.spawnFireball(context),
        chargeSlash: (context) => this.skillCombat?.chargeSlash(context),
        guard: (context) => this.skillCombat?.guard(context),
        frostNova: (context) => this.skillCombat?.frostNova(context),
        shadowDash: (context) => this.skillCombat?.shadowDash(context),
        backstab: (context) => this.skillCombat?.backstab(context),
      }),
    });
    this.hud = new CombatHud(this, this.health, this.skills, appearance.label);
    this.lastSlashAttackId = 0;
    this.wireEnemyCollisions(player);
    this.wireBossCollisions(player);
    this.wireArenaColliders(player);
    this.aliveLabel = this.add.text(this.scale.width - 16, 16, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#9a8f7d',
    });
    this.aliveLabel.setOrigin(1, 0);
    this.aliveLabel.setVisible(isGameDebugEnabled());

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.projectiles?.destroyAll();
      this.skillCombat?.destroy();
      this.playerVisual?.destroy();
      this.bossVisual?.destroy();
      publishCombatHud(null);
      clearEncounterCue();
      setCombatOutcomeHandlers(null);
    });

    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.focus();
  }

  update(_time: number, delta: number): void {
    this.lastVisualDelta = delta;
    this.feedback?.update(delta);

    if (this.feedback?.isHitStopping) {
      this.syncActorVisuals();
      this.hud?.update();
      this.bossHud?.update();
      this.syncAliveLabel();
      this.publishHud();
      return;
    }

    if (this.status === 'RUNNING') {
      if (this.startPhase !== 'active') {
        this.phaseMs = Math.max(0, this.phaseMs - delta);
        if (this.phaseMs <= 0) {
          this.advanceStartPhase();
        }
        this.encounterManager?.update(delta, {
          width: this.arena?.layout.width ?? this.scale.width,
          height: this.arena?.layout.height ?? this.scale.height,
        });
        this.boss?.update(delta);
        this.syncActorVisuals();
        this.hud?.update();
        this.bossHud?.update();
        this.syncAliveLabel();
        this.publishHud();
        return;
      }
      this.controller?.setCombatModifiers({
        attackMoveMultiplier: this.attack?.isAttacking ? ATTACK_MOVE_MULTIPLIER : 1,
        dashLocked: this.attack?.blocksDash === true,
      });
      if (this.controller?.isDashing && this.attack?.isAttacking && !this.attack.blocksDash) {
        this.attack.cancel();
      }
      this.controller?.update(delta);
      this.tryUsePotion();
      if (this.potionCooldownMs > 0) {
        this.potionCooldownMs = Math.max(0, this.potionCooldownMs - delta);
      }
      if (this.controller) {
        if (this.controller.isDashing && !this.wasDashing) {
          audioManager.playSfx(sfxForDash(this.controller.dashStyle));
        }
        this.wasDashing = this.controller.isDashing;
      }
      this.attack?.update(delta);
      this.skills?.update(delta);
      this.skillCombat?.update(delta);
      this.projectiles?.update(
        delta,
        this.getAliveHittables(),
        this.player && this.health && this.controller
          ? {
              x: this.player.x,
              y: this.player.y,
              radius: this.playerSize / 2,
              isInvincible: this.controller.isInvincible,
              takeDamage: (hit) =>
                this.startPhase === 'active' ? (this.health?.takeDamage(hit) ?? false) : false,
            }
          : undefined,
        (enemy, damage, critical) => {
          this.feedback?.playAttackHit(enemy.gameObject, damage, {
            shakeScale: this.isBossTarget(enemy) ? COMBAT_FEEL.bossChipShakeScale : 1,
            offsetY: this.hitOffset(enemy),
            critical,
          });
          audioManager.playSfx(SFX_ID.ENEMY_HIT);
          this.checkCombatEnd();
        },
        (damage) => {
          if (this.startPhase !== 'active') {
            return;
          }
          if (this.player) {
            this.feedback?.playReceivedHit(this.player, damage, this.playerHitOffset());
            audioManager.playSfx(SFX_ID.PLAYER_HIT);
          }
          this.checkCombatEnd();
        },
        this.arena?.solidRects
      );
      this.dangerZones?.update(
        delta,
        this.player && this.controller
          ? {
              x: this.player.x,
              y: this.player.y,
              radius: this.playerSize / 2,
              isInvincible: this.controller.isInvincible,
            }
          : undefined,
        (damage, attackId, dirX, dirY) => {
          if (this.startPhase !== 'active') {
            return;
          }
          const applied = this.health?.takeDamage({
            amount: damage,
            attackId,
            direction: new Phaser.Math.Vector2(dirX, dirY),
          });
          if (applied && this.player) {
            this.feedback?.playReceivedHit(this.player, damage, this.playerHitOffset());
            audioManager.playSfx(SFX_ID.PLAYER_HIT);
          }
        }
      );
      this.syncSlashEffect();
      this.boss?.update(delta);
      this.checkCombatEnd();
    } else {
      this.boss?.update(delta);
    }

    if (this.player && this.controller) {
      const showTrail = this.controller.dashStyle !== 'blink' && this.controller.isEvasive;
      const shadow = this.controller.isSkillMoving && this.lastSkillVisualId === 'rogue_shadow_dash';
      this.feedback?.syncDashAfterImage(this.player, showTrail, delta, shadow ? 0x1a1028 : undefined);
    }

    this.health?.update(delta);
    this.encounterManager?.update(delta, {
      width: this.arena?.layout.width ?? this.scale.width,
      height: this.arena?.layout.height ?? this.scale.height,
    });
    this.syncActorVisuals();
    this.syncCombatAudioCues();
    this.hud?.update();
    this.bossHud?.update();
    this.syncAliveLabel();
    this.publishHud();
  }

  private createPlayerVisual(appearance: ReturnType<typeof getClassAppearance>) {
    if (appearance.shape === 'circle') {
      return this.add.circle(
        this.scale.width / 2,
        this.scale.height / 2,
        appearance.size / 2,
        appearance.color
      );
    }
    return this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      appearance.size,
      appearance.size,
      appearance.color
    );
  }

  private beginEncounterIntro(): void {
    const encounterId = this.combatConfig?.encounterId ?? '';
    const training = this.combatConfig?.training === true;
    const repeat = this.combatConfig?.repeatEncounter === true;
    this.startPlan = planEncounterStart({
      encounterId,
      training,
      repeat,
      observed: this.combatConfig?.spawnBias === 'observed',
      boss: Boolean(this.boss),
    });
    this.controller?.lockCombat();
    this.enemyManager?.haltAll();
    this.boss?.halt();
    if (training) {
      audioManager.playBgmContext(bgmContextForCombat(encounterId));
    } else if (this.startPlan.playEnemyEntrances && this.startPlan.phases[0] === 'pre') {
      this.enemyManager?.holdForEntrance();
    }
    if (this.startPlan.walkIn) {
      this.beginPlayerWalkIn();
    }
    this.enterStartPhase(this.startPlan.phases[0] ?? 'ready');
    this.encounterManager?.update(0, {
      width: this.arena?.layout.width ?? this.scale.width,
      height: this.arena?.layout.height ?? this.scale.height,
    });
    this.syncActorVisuals();
  }

  private enterStartPhase(phase: 'pre' | 'entrance' | 'ready'): void {
    this.startPhase = phase;
    const plan = this.startPlan;
    if (!plan) {
      this.finishEncounterIntro();
      return;
    }
    if (phase === 'entrance') {
      const layout = this.arena?.layout;
      const animMs = plan.playEnemyEntrances
        ? (this.enemyManager?.playEntrances(
            {
              width: layout?.width ?? this.scale.width,
              height: layout?.height ?? this.scale.height,
              originX: layout?.x ?? 0,
              originY: layout?.y ?? 0,
            },
            this.combatConfig?.repeatEncounter ? 'brief' : 'full',
            encounterEntranceSide(this.combatConfig?.encounterId ?? '')
          ) ?? 0)
        : 0;
      this.phaseMs = Math.max(plan.entranceMs, animMs);
      this.phaseBudget = Math.max(1, this.phaseMs);
    if (plan.boss) {
      this.tweens.killTweensOf(this.cameras.main);
      this.nudgeCameraTowardBoss();
    }
    } else if (phase === 'ready') {
      this.phaseMs = plan.readyMs + plan.graceMs;
      this.phaseBudget = Math.max(1, this.phaseMs);
      this.beginReadyBeat();
    } else {
      this.phaseMs = plan.preMs;
      this.phaseBudget = Math.max(1, this.phaseMs);
    }
    this.publishStartCue();
  }

  private advanceStartPhase(): void {
    const order = this.startPlan?.phases ?? [];
    const index = order.indexOf(this.startPhase as 'pre' | 'entrance' | 'ready');
    const next = order[index + 1];
    if (!next) {
      this.finishEncounterIntro();
      return;
    }
    this.enterStartPhase(next);
  }

  private beginReadyBeat(): void {
    const encounterId = this.combatConfig?.encounterId ?? '';
    if (!this.combatConfig?.training) {
      audioManager.playSfx(SFX_ID.COMBAT_START);
      audioManager.playBgmContext(bgmContextForCombat(encounterId));
    }
    if (this.startPlan?.boss) {
      this.cameras.main.shake(220, 0.004);
      this.settleCamera();
    }
    if ((this.startPlan?.graceMs ?? 0) > 0) {
      this.controller?.unlockCombat();
    }
  }

  private nudgeCameraTowardBoss(): void {
    if (!this.boss) {
      return;
    }
    const cam = this.cameras.main;
    const dx = Phaser.Math.Clamp((this.boss.gameObject.x - cam.midPoint.x) * 0.22, -80, 80);
    const dy = Phaser.Math.Clamp((this.boss.gameObject.y - cam.midPoint.y) * 0.16, -48, 48);
    this.tweens.add({
      targets: cam,
      zoom: 1.05,
      scrollX: dx,
      scrollY: dy,
      duration: 420,
      ease: 'Sine.easeOut',
    });
  }

  private settleCamera(): void {
    this.tweens.killTweensOf(this.cameras.main);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1,
      scrollX: 0,
      scrollY: 0,
      duration: 200,
      ease: 'Sine.easeInOut',
    });
  }

  private beginPlayerWalkIn(): void {
    if (!this.player || !this.arena) {
      return;
    }
    const spawnX = this.player.x;
    const spawnY = this.player.y;
    const from = this.arena.clampPoint(spawnX - 160, spawnY, this.playerSize / 2);
    if (Math.hypot(from.x - spawnX, from.y - spawnY) < 28) {
      return;
    }
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setEnable(false);
    this.player.setPosition(from.x, from.y);
    this.playerEntering = true;
    this.playerEnterFacing = Math.sign(spawnX - from.x) || 1;
    this.tweens.add({
      targets: this.player,
      x: spawnX,
      y: spawnY,
      duration: 340,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        body.reset(this.player?.x ?? spawnX, this.player?.y ?? spawnY);
      },
      onComplete: () => {
        this.playerEntering = false;
        if (!this.player?.active) {
          return;
        }
        body.setEnable(true);
        body.reset(spawnX, spawnY);
      },
    });
  }

  private publishStartCue(): void {
    const plan = this.startPlan;
    if (!plan) {
      return;
    }
    const line = this.startPhase === 'pre' ? plan.cue : this.startPhase === 'active' ? '' : plan.meet;
    publishEncounterCue({
      phase: this.startPhase,
      line,
      boss: plan.boss,
    });
  }

  private finishEncounterIntro(): void {
    this.startPhase = 'active';
    this.phaseMs = 0;
    const encounterId = this.combatConfig?.encounterId ?? '';
    const repeat = this.combatConfig?.repeatEncounter === true;
    const training = this.combatConfig?.training === true;
    const boss = Boolean(this.startPlan?.boss);
    this.enemyManager?.resumeAll((enemy, index) =>
      openingAttackDelayMs({
        encounterId,
        repeat,
        training,
        boss,
        index,
        ranged: enemy.typeId === ENEMY_TYPE_ID.ARCHER || enemy.typeId === ENEMY_TYPE_ID.GOBLIN_MAGE,
      })
    );
    this.boss?.resume();
    this.controller?.unlockCombat();
    this.publishStartCue();
  }

  private spawnBossIfNeeded(player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc): void {
    const encounter = this.encounterManager?.getDefinition();
    if (!encounter?.bossId) {
      return;
    }
    const definition = getBossDefinition(encounter.bossId);
    if (!definition) {
      return;
    }
    const point = resolveSpawnPoint(
      encounter.bossSpawn ?? { x: 0.55, y: 0.42 },
      this.arena?.layout.width ?? this.scale.width,
      this.arena?.layout.height ?? this.scale.height,
      { x: this.arena?.layout.x ?? 0, y: this.arena?.layout.y ?? 0 }
    );
    const placed = this.arena?.clampPoint(point.x, point.y, definition.size / 2) ?? point;
    const visual = this.add.rectangle(placed.x, placed.y, definition.size, definition.size, definition.color);
    visual.setAlpha(0);
    this.physics.add.existing(visual);
    this.boss = new BossController(
      this,
      visual,
      definition,
      encounter.bossInstanceId ?? `${definition.id.toLowerCase()}_001`,
      () => ({ x: this.player?.x ?? 0, y: this.player?.y ?? 0 }),
      () => ({
        width: this.arena?.layout.width ?? this.scale.width,
        height: this.arena?.layout.height ?? this.scale.height,
        originX: this.arena?.layout.x ?? 0,
        originY: this.arena?.layout.y ?? 0,
      }),
      (shot) => {
        this.projectiles?.spawnEnemyShot(shot);
        audioManager.playSfx(SFX_ID.GUARDIAN_PROJECTILE);
      },
      () => {
        if (this.boss) {
          this.projectiles?.destroyBySourceId(this.boss.id);
        }
        this.projectiles?.destroyOwned('enemy');
        this.feedback?.playBossDeath();
        audioManager.playSfx(SFX_ID.GUARDIAN_DEATH);
        this.checkCombatEnd();
      },
      (x, y, radius, durationMs, damage, tickMs) => {
        this.dangerZones?.spawn({ x, y, radius, durationMs, tickMs, damage });
      }
    );
    this.bossHud = new BossHud(this, this.boss);
    this.bossVisual = makeBossVisual(this, definition.id, definition.size);
    this.physics.add.collider(player, visual);
  }

  private syncActorVisuals(): void {
    this.containActors();
    if (this.player && this.controller && this.health) {
      const aim = this.attack?.isAttacking ? this.attack.attackDirection : this.controller.facing;
      const skillSlot = this.currentSkillVisualSlot();
      this.playerVisual?.update({
        x: this.player.x,
        y: this.player.y,
        facingX: this.playerEntering ? this.playerEnterFacing : aim.x,
        facingY: aim.y,
        moving: this.playerEntering || this.controller.isMoving,
        dashing: this.controller.isEvasive,
        invincible: this.controller.isInvincible && !this.health.isHitFlashing,
        hit: this.health.isHitFlashing,
        dead: this.health.isDead,
        deadT: this.health.deathProgress,
        attacking: this.attack?.isAttacking,
        attackActive: this.attack?.isStrikePhase,
        guarding: this.health.isGuarding,
        skillSlot,
        blink: this.controller.isDashing && this.controller.dashStyle === 'blink',
        shadowDash: this.controller.isSkillMoving && this.lastSkillVisualId === 'rogue_shadow_dash',
        delta: this.lastVisualDelta,
        speed: this.actorSpeed(
          this.player,
          this.playerEntering ? (this.combatConfig?.player.moveSpeed ?? 220) : 0
        ),
      });
    }
    if (this.boss) {
      const snapshot = this.boss.debugSnapshot();
      const pattern =
        snapshot.patternId === 'heavy_slam' || snapshot.patternId === 'projectile_burst' || snapshot.patternId === 'charge'
          ? snapshot.patternId
          : null;
      const bossAwaken = this.startPhase === 'entrance' && this.startPlan?.boss === true;
      const bossConcealed = this.startPhase === 'pre' && this.startPlan?.boss === true;
      this.bossVisual?.update({
        x: this.boss.gameObject.x,
        y: this.boss.gameObject.y,
        facingX: this.boss.attackDirection.x,
        facingY: this.boss.attackDirection.y,
        moving: !bossAwaken && !bossConcealed && !this.boss.isDead && this.boss.state === 'IDLE',
        entrance: bossAwaken ? 'awaken' : undefined,
        entranceT: bossAwaken ? 1 - this.phaseMs / this.phaseBudget : undefined,
        concealed: bossConcealed,
        hit: this.boss.isHit,
        dead: this.boss.isDead,
        deadT: this.boss.deathProgress,
        attacking: this.boss.state === 'ATTACKING' || this.boss.state === 'WINDUP',
        attackActive: this.boss.state === 'ATTACKING',
        phase: this.boss.currentPhase === 2 || this.boss.isTransitioningPhase ? 2 : 1,
        phaseTransition: this.boss.isTransitioningPhase,
        bossPattern: pattern,
        delta: this.lastVisualDelta,
        speed: this.actorSpeed(this.boss.gameObject),
      });
    }
  }

  private currentSkillVisualSlot(): 'Q' | 'E' | null {
    const executed = this.skills?.getLastExecutedSkillId() ?? null;
    if (executed && executed !== this.lastSkillVisualId) {
      this.lastSkillVisualId = executed;
      this.skillVisualUntil = performance.now() + 320;
      const sfx = sfxForSkill(executed);
      if (sfx) {
        audioManager.playSfx(sfx);
      }
    }
    if (!executed || performance.now() >= this.skillVisualUntil) {
      return null;
    }
    if (executed === 'warrior_guard' || executed === 'mage_frost_nova' || executed === 'rogue_backstab') {
      return 'E';
    }
    return 'Q';
  }

  private hitOffset(target: CombatHittable): number {
    if (this.isBossTarget(target)) {
      return getBossAsset(this.boss?.bossId ?? 'RUINS_GUARDIAN').damageTextOffsetY ?? 40;
    }
    if ('typeId' in target) {
      const asset = getEnemyAsset((target as EnemyController).typeId);
      const aboveHead = Math.round(asset.visualSize * (asset.originY ?? 0.9) + 6);
      return Math.max(asset.damageTextOffsetY ?? 20, aboveHead);
    }
    return Math.round(target.size * 0.5);
  }

  private playerHitOffset(): number {
    return getPlayerAsset(this.combatConfig?.player.classId ?? 'warrior').damageTextOffsetY ?? 18;
  }

  private publishHud(): void {
    if (!this.health || !this.controller || !this.combatConfig) {
      return;
    }
    publishCombatHud(
      buildCombatHudState({
        status: this.status,
        classId: this.combatConfig.player.classId,
        hp: this.health.currentHp,
        maxHp: this.health.maxHp,
        mp: this.health.currentMp,
        maxMp: this.health.maxMp,
        dashCooldown: this.controller.dashCooldownRemainingMs,
        dashMaxCooldown: this.controller.dashCooldownMs,
        potionCount: this.potionCount,
        potionCooldown: this.potionCooldownMs,
        potionMaxCooldown: POTION_COOLDOWN_MS,
        skills: this.skills?.getHudSlots() ?? [],
        boss: this.boss
          ? {
              name: this.boss.name,
              hp: this.boss.currentHp,
              maxHp: this.boss.maxHp,
              phase: this.boss.currentPhase,
            }
          : undefined,
      })
    );
  }

  private getHittables(): CombatHittable[] {
    const targets: CombatHittable[] = [...(this.enemyManager?.getEnemies() ?? [])];
    if (this.boss) {
      targets.push(this.boss);
    }
    return targets;
  }

  private getAliveHittables(): CombatHittable[] {
    return this.getHittables().filter((target) => !target.isDead);
  }

  private isBossTarget(target: CombatHittable): boolean {
    return this.boss !== undefined && target.id === this.boss.id;
  }

  private wireArenaColliders(player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc): void {
    const actors: Phaser.GameObjects.GameObject[] = [player];
    for (const enemy of this.enemyManager?.getEnemies() ?? []) {
      actors.push(enemy.gameObject);
    }
    if (this.boss) {
      actors.push(this.boss.gameObject);
    }
    this.arena?.wireColliders(actors);
  }

  private wireEnemyCollisions(player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc): void {
    if (!this.attack) {
      return;
    }
    for (const enemy of this.enemyManager?.getEnemies() ?? []) {
      this.physics.add.collider(player, enemy.gameObject);
      this.physics.add.overlap(
        this.attack.hitboxObject,
        enemy.gameObject,
        () => this.handlePlayerAttackOverlap(enemy),
        () => this.canApplyPlayerAttackHit(enemy),
        this
      );
      this.physics.add.overlap(
        enemy.attackHitboxObject,
        player,
        () => this.handleEnemyAttackOverlap(enemy),
        () => this.canApplyEnemyAttackHit(enemy),
        this
      );
    }
  }

  private wireBossCollisions(player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc): void {
    if (!this.attack || !this.boss) {
      return;
    }
    const boss = this.boss;
    this.physics.add.overlap(
      this.attack.hitboxObject,
      boss.gameObject,
      () => this.handlePlayerAttackOverlap(boss),
      () => this.canApplyPlayerAttackHit(boss),
      this
    );
    this.physics.add.overlap(
      boss.slamHitboxObject,
      player,
      () => this.handleBossSlamOverlap(boss),
      () => this.canApplyBossHitbox(boss, 'slam'),
      this
    );
    this.physics.add.overlap(
      boss.chargeHitboxObject,
      player,
      () => this.handleBossChargeOverlap(boss),
      () => this.canApplyBossHitbox(boss, 'charge'),
      this
    );
  }

  private handleEnemyRangedShot = (shot: EnemyRangedShot): void => {
    const isMage = shot.definition.id === 'goblin_mage';
    this.projectiles?.spawnEnemyShot({
      x: shot.originX,
      y: shot.originY,
      dirX: shot.dirX,
      dirY: shot.dirY,
      speed: shot.definition.projectileSpeed ?? 320,
      damage: shot.definition.damage,
      lifetimeMs: shot.definition.projectileLifetimeMs ?? 1400,
      radius: shot.definition.projectileRadius ?? 7,
      color: isMage ? shot.definition.color : undefined,
      skillId: isMage ? 'enemy_mage_bolt' : 'enemy_shot',
    });
    audioManager.playSfx(SFX_ID.ARCHER_SHOT);
  };

  private syncSlashEffect(): void {
    if (!this.attack || !this.player || !this.feedback || this.attack.kind !== 'MELEE') {
      return;
    }

    if (!this.attack.isAttacking || this.attack.attackId === this.lastSlashAttackId) {
      return;
    }

    this.lastSlashAttackId = this.attack.attackId;
    const classId = resolvePlayerClassId(this.combatConfig?.player.classId ?? 'warrior');
    this.feedback.playSlash(
      this.player.x,
      this.player.y,
      this.attack.attackDirection,
      classId === 'rogue' ? 'backstab' : 'slash_basic'
    );
    playPlayerSwing(this.combatConfig?.player.classId ?? 'warrior', this.attack.attackId);
  }

  private syncAliveLabel(): void {
    if (this.boss) {
      this.aliveLabel?.setText(`BOSS ${this.boss.isDead ? 'DEAD' : 'ALIVE'}`);
      return;
    }
    const spawned = this.enemyManager?.getEnemies().length ?? 0;
    const alive = this.enemyManager?.getAliveCount() ?? 0;
    this.aliveLabel?.setText(`ALIVE ${alive}/${spawned}`);
  }

  private checkCombatEnd(): void {
    if (this.health?.isDead) {
      this.enterResult('DEFEAT');
      return;
    }

    if (this.boss) {
      if (this.boss.isDead) {
        this.enterResult('VICTORY');
      }
      return;
    }

    // Training dummies respawn — never auto-end the session.
    if (this.combatConfig?.training) {
      return;
    }
    if (this.encounterManager?.isVictory()) {
      this.enterResult('VICTORY');
    }
  }

  private enterResult(status: CombatStatus): void {
    if (this.status !== 'RUNNING' || !this.hud) {
      return;
    }

    this.status = status;
    this.attack?.cancel();
    this.controller?.lockCombat();
    if (status === 'DEFEAT') {
      this.enemyManager?.hideOverheads();
    }
    this.encounterManager?.haltAll();
    this.boss?.halt();
    this.projectiles?.destroyAll();
    this.skillCombat?.destroy();
    setCombatOutcomeHandlers({
      retry: this.restartCombat,
      leave: this.submitRetreat,
      proceed: this.submitResult,
    });

    const isBoss = Boolean(this.boss);
    // Let death / idle settle before victory chrome.
    this.time.delayedCall(isBoss ? 900 : 620, () => {
      if (!this.hud) {
        return;
      }
      if (status === 'VICTORY') {
        audioManager.playSfx(SFX_ID.VICTORY);
        audioManager.playBgmContext(BGM_CONTEXT.VICTORY);
        this.hud.showResult(status, this.submitResult, undefined, { boss: isBoss });
        return;
      }
      audioManager.playSfx(SFX_ID.DEFEAT);
      audioManager.playBgmContext(BGM_CONTEXT.DEFEAT);
      this.hud.showResult(status, this.restartCombat, this.submitResult, { boss: isBoss });
    });
  }

  private restartCombat = (): void => {
    this.scene.restart();
  };

  private retreatOnLeave = false;

  private submitRetreat = (): void => {
    this.retreatOnLeave = true;
    this.submitResult();
  };

  private submitResult = (): void => {
    if (!this.combatConfig || !this.health || this.status === 'RUNNING' || this.resultSent) {
      return;
    }

    this.resultSent = true;
    const defeatedEnemyIds = [
      ...(this.enemyManager?.getDefeatedInstanceIds() ?? []),
      ...(this.boss?.isDead ? [this.boss.id] : []),
    ];
    const defeatedEnemyTypes = [
      ...(this.enemyManager?.getDefeatedTypes() ?? []),
      ...(this.boss?.isDead ? [this.boss.bossId] : []),
    ];
    const result: CombatResult = {
      combatId: this.combatConfig.combatId,
      outcome: this.status === 'VICTORY' ? 'VICTORY' : 'DEFEAT',
      player: {
        remainingHp: this.health.currentHp,
        remainingMp: this.health.currentMp,
      },
      defeatedEnemyIds,
      defeatedEnemyTypes,
      consumedItemIds: Array.from({ length: this.potionsUsed }, () => ITEM_ID.HEALING_POTION),
      retreatToVillage: this.retreatOnLeave,
    };

    EventBus.emit(COMBAT_RESULT_EVENT, result);
  };

  private canApplyPlayerAttackHit(enemy: CombatHittable): boolean {
    return Boolean(
      this.status === 'RUNNING' && this.attack && this.attack.kind === 'MELEE' && !enemy.isDead
    );
  }

  private handlePlayerAttackOverlap(enemy: CombatHittable): void {
    if (!this.attack) {
      return;
    }

    const strike = rollBasicAttackStrike(this.attack.damage);
    const before = readCombatHp(enemy);
    const applied = enemy.takeDamage({
      amount: strike.damage,
      direction: this.attack.attackDirection,
      attackId: this.attack.attackId,
      knockbackScale: this.attack.knockbackScale,
    });

    if (applied) {
      const shown = damageNumberForStrike(before, readCombatHp(enemy), strike.damage);
      this.feedback?.playAttackHit(enemy.gameObject, shown, {
        shakeScale: this.isBossTarget(enemy) ? COMBAT_FEEL.bossChipShakeScale : 1,
        offsetY: this.hitOffset(enemy),
        critical: strike.critical,
      });
      audioManager.playSfx(SFX_ID.ENEMY_HIT);
    }

    this.checkCombatEnd();
  }

  private canApplyEnemyAttackHit(enemy: EnemyController): boolean {
    return Boolean(
      this.status === 'RUNNING' &&
        this.startPhase === 'active' &&
        !enemy.isDead &&
        this.health &&
        !this.health.isDead &&
        this.controller &&
        !this.controller.isInvincible
    );
  }

  private handleEnemyAttackOverlap(enemy: EnemyController): void {
    if (!this.health) {
      return;
    }

    const applied = this.health.takeDamage({
      amount: enemy.attackDamage,
      direction: enemy.attackDirection,
      attackId: enemy.attackId,
    });

    if (applied && this.player) {
      this.feedback?.playReceivedHit(this.player, enemy.attackDamage, this.playerHitOffset());
      audioManager.playSfx(SFX_ID.PLAYER_HIT);
    }
    this.checkCombatEnd();
  }

  private canApplyBossHitbox(boss: BossController, kind: 'slam' | 'charge'): boolean {
    if (this.startPhase !== 'active' || this.status !== 'RUNNING' || boss.isDead || !this.health || this.health.isDead || !this.controller || this.controller.isInvincible) {
      return false;
    }
    return kind === 'slam' ? boss.isSlamHitboxActive() : boss.isChargeHitboxActive();
  }

  private handleBossSlamOverlap(boss: BossController): void {
    this.applyBossMeleeHit(boss, boss.slamDamage, boss.slamAttackId, SFX_ID.GUARDIAN_SLAM);
  }

  private handleBossChargeOverlap(boss: BossController): void {
    this.applyBossMeleeHit(boss, boss.chargeDamage, boss.chargeAttackId, SFX_ID.GUARDIAN_CHARGE);
  }

  private applyBossMeleeHit(boss: BossController, amount: number, attackId: number, sfxId: typeof SFX_ID.GUARDIAN_SLAM | typeof SFX_ID.GUARDIAN_CHARGE): void {
    if (!this.health) {
      return;
    }
    const applied = this.health.takeDamage({
      amount,
      direction: new Phaser.Math.Vector2(boss.attackDirection.x, boss.attackDirection.y),
      attackId,
    });
    if (applied && this.player) {
      this.feedback?.playReceivedHit(this.player, amount, this.playerHitOffset(), true);
      audioManager.playSfx(sfxId);
    }
    this.checkCombatEnd();
  }

  private syncCombatAudioCues(): void {
    if (this.health?.isDead && !this.wasPlayerDead) {
      audioManager.playSfx(SFX_ID.PLAYER_DEATH);
    }
    this.wasPlayerDead = this.health?.isDead === true;

    for (const enemy of this.enemyManager?.getEnemies() ?? []) {
      if (enemy.isAttacking) {
        const swingKey = `${enemy.id}:${enemy.attackId}`;
        if (!this.heardDeathIds.has(swingKey)) {
          this.heardDeathIds.add(swingKey);
          audioManager.playSfx(sfxForEnemyAttack(enemy.typeId));
        }
      }
      if (enemy.isDead && !this.heardDeathIds.has(enemy.id)) {
        this.heardDeathIds.add(enemy.id);
        audioManager.playSfx(SFX_ID.ENEMY_DEATH);
      }
    }

    if (this.boss?.isDead && !this.heardDeathIds.has('boss')) {
      this.heardDeathIds.add('boss');
    }

    if (this.boss?.isTransitioningPhase && !this.wasPhaseTransition) {
      audioManager.playSfx(SFX_ID.GUARDIAN_PHASE2);
    }
    this.wasPhaseTransition = this.boss?.isTransitioningPhase === true;
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.cameras.main.setSize(gameSize.width, gameSize.height);
    this.arena?.resize(gameSize.width, gameSize.height);
    this.syncWorldBounds();
    this.clampActor(this.player, this.playerSize);
    for (const enemy of this.enemyManager?.getEnemies() ?? []) {
      this.clampActor(enemy.gameObject, enemy.size);
    }
    if (this.boss) {
      this.clampActor(this.boss.gameObject, this.boss.size);
    }
    this.aliveLabel?.setPosition(gameSize.width - 16, 16);
  }

  private tryUsePotion(): void {
    if (!this.potionKey || this.status !== 'RUNNING' || this.health?.isDead) {
      return;
    }
    if (!Phaser.Input.Keyboard.JustDown(this.potionKey)) {
      return;
    }
    if (this.potionCooldownMs > 0) {
      return;
    }
    const training = this.combatConfig?.training === true;
    if (!training && this.potionCount <= 0) {
      return;
    }
    const heal = getItemDefinition(ITEM_ID.HEALING_POTION)?.healHp ?? 30;
    const restored = this.health?.heal(heal) ?? 0;
    if (restored <= 0 && (this.health?.currentHp ?? 0) >= (this.health?.maxHp ?? 0)) {
      return;
    }
    if (!training) {
      this.potionCount -= 1;
      this.potionsUsed += 1;
    }
    this.potionCooldownMs = POTION_COOLDOWN_MS;
  }

  private syncWorldBounds(): void {
    const floor = this.arena?.walkableAabb;
    if (floor) {
      this.physics.world.setBounds(floor.x, floor.y, floor.width, floor.height);
      return;
    }
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
  }

  private containActors(): void {
    if (!this.playerEntering) {
      this.clampActor(this.player, this.playerSize);
    }
    for (const enemy of this.enemyManager?.getEnemies() ?? []) {
      if (this.enemyManager?.isEntering(enemy.id)) {
        continue;
      }
      this.clampActor(enemy.gameObject, enemy.size);
    }
    if (this.boss) {
      this.clampActor(this.boss.gameObject, this.boss.size);
    }
  }

  /** px/s the actor is actually traveling, so the walk cycle can match the ground. */
  private actorSpeed(target: Phaser.GameObjects.GameObject, fallback = 0): number {
    const body = target.body as Phaser.Physics.Arcade.Body | undefined;
    const measured = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    return measured > 24 ? measured : fallback;
  }

  private clampActor(
    target: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc | undefined,
    size: number
  ): void {
    if (!target || !this.arena) {
      return;
    }
    const next = this.arena.clampPoint(target.x, target.y, size / 2);
    if (Math.abs(next.x - target.x) < 0.5 && Math.abs(next.y - target.y) < 0.5) {
      return;
    }
    const body = target.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      const vx = body.velocity.x;
      const vy = body.velocity.y;
      body.reset(next.x, next.y);
      body.setVelocity(vx, vy);
      return;
    }
    target.setPosition(next.x, next.y);
  }
}
