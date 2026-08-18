import * as Phaser from 'phaser';
import { EventBus } from '../../EventBus';
import type { CombatStatus } from '../combat-state';
import { PLAYER_MAX_HP } from '../CombatConfig';
import { COMBAT_CONFIG_REGISTRY_KEY } from '../CombatGame';
import { CombatFeedback } from '../effects/CombatFeedback';
import { COMBAT_FEEL } from '../effects/CombatFeelConfig';
import { EnemyManager } from '../enemies/EnemyManager';
import type { EnemyController } from '../enemies/EnemyController';
import type { EnemyRangedShot } from '../enemies/enemy-runtime';
import { CombatHud } from '../hud/CombatHud';
import { BossHud } from '../hud/BossHud';
import { getBasicAttack } from '../attacks/basic-attack-definitions';
import { PlayerAttackController } from '../player/PlayerAttackController';
import { getClassAppearance } from '../player/class-appearance';
import { PlayerController } from '../player/PlayerController';
import { PlayerHealthController } from '../player/PlayerHealthController';
import { PlayerSkillController } from '../player/PlayerSkillController';
import { ProjectileController } from '../projectiles/ProjectileController';
import { SkillCombatService } from '../skills/SkillCombatService';
import { createSkillExecutors } from '../skills/skill-executors';
import { EncounterManager } from '../encounters/EncounterManager';
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
import { buildCombatHudState } from '../hud/build-combat-hud-state';
import { audioManager, BGM_CONTEXT, SFX_ID, sfxForDash, sfxForEnemyAttack, sfxForPlayerAttack, sfxForSkill } from '../../audio';
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
    this.wasDashing = false;
    this.wasPlayerDead = false;
    this.wasPhaseTransition = false;
    this.heardDeathIds.clear();
    this.boss = undefined;
    this.bossHud = undefined;
    this.combatConfig = this.registry.get(COMBAT_CONFIG_REGISTRY_KEY) as CombatConfig | undefined;
    this.cameras.main.setBackgroundColor('#1a1612');
    this.syncWorldBounds();

    const classId = resolvePlayerClassId(this.combatConfig?.player.classId ?? 'wanderer');
    const classDefinition = getPlayerClass(classId);
    const appearance = getClassAppearance(classId);
    const dash = getDashProfile(classId);
    this.playerSize = appearance.size;

    const player = this.createPlayerVisual(appearance);
    player.setAlpha(0);
    this.physics.add.existing(player);

    const body = player.body as Phaser.Physics.Arcade.Body;
    this.player = player;
    this.playerVisual = makePlayerVisual(this, classId, appearance.size);
    this.controller = new PlayerController(this, body, {
      moveSpeed: this.combatConfig?.player.moveSpeed ?? classDefinition.baseStats.moveSpeed,
      dash,
    });
    this.health = new PlayerHealthController(this, player, this.controller, {
      maxHp: this.combatConfig?.player.maxHp ?? PLAYER_MAX_HP,
      currentHp: this.combatConfig?.player.currentHp ?? PLAYER_MAX_HP,
      maxMp: this.combatConfig?.player.maxMp ?? classDefinition.baseStats.maxMp,
      currentMp: this.combatConfig?.player.currentMp ?? classDefinition.baseStats.maxMp,
      bodyColor: appearance.color,
      size: appearance.size,
    });
    this.projectiles = new ProjectileController(this);
    this.attack = new PlayerAttackController(this, player, this.controller, {
      profile: {
        ...getBasicAttack(classId, classDefinition.combat.basicAttackId),
        damage: getBasicAttack(classId, classDefinition.combat.basicAttackId).damage + (this.combatConfig?.player.attackBonus ?? 0),
      },
      spawnProjectile: (request) => {
        this.projectiles?.spawn({
          skillId: request.skillId,
          x: request.originX,
          y: request.originY,
          pointerX: request.pointerX,
          pointerY: request.pointerY,
          speed: request.speed,
          damage: request.damage,
          lifetimeMs: request.lifetimeMs,
          radius: request.radius,
          color: request.color,
          knockbackScale: request.knockbackScale,
          owner: 'player',
        });
        audioManager.playSfx(sfxForPlayerAttack(classId));
      },
    });
    this.feedback = new CombatFeedback(this);
    this.enemyManager = new EnemyManager(this, player, () => !this.health?.isDead, this.handleEnemyRangedShot);
    this.encounterManager = new EncounterManager(this.enemyManager);
    const encounterId =
      this.combatConfig?.encounterId ?? resolveEncounterId(this.combatConfig?.combatId ?? '') ?? ENCOUNTER_ID.RUINS_EASY_01;
    this.encounterManager.start(encounterId, {
      width: this.scale.width,
      height: this.scale.height,
      instanceIds: this.combatConfig?.enemies.map((enemy) => enemy.id),
    });
    this.spawnBossIfNeeded(player);
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
      this.controller?.update(delta);
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
              takeDamage: (hit) => this.health?.takeDamage(hit) ?? false,
            }
          : undefined,
        (enemy, damage) => {
          this.feedback?.playAttackHit(enemy.gameObject, damage, {
            shakeScale: this.isBossTarget(enemy) ? COMBAT_FEEL.bossChipShakeScale : 1,
            offsetY: this.hitOffset(enemy),
          });
          audioManager.playSfx(SFX_ID.ENEMY_HIT);
          this.checkCombatEnd();
        },
        (damage) => {
          if (this.player) {
            this.feedback?.playReceivedHit(this.player, damage, this.playerHitOffset());
            audioManager.playSfx(SFX_ID.PLAYER_HIT);
          }
          this.checkCombatEnd();
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
    this.encounterManager?.update(delta, { width: this.scale.width, height: this.scale.height });
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

  private spawnBossIfNeeded(player: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc): void {
    const encounter = this.encounterManager?.getDefinition();
    if (!encounter?.bossId) {
      return;
    }
    const definition = getBossDefinition(encounter.bossId);
    if (!definition) {
      return;
    }
    const point = resolveSpawnPoint(encounter.bossSpawn ?? { x: 0.72, y: 0.46 }, this.scale.width, this.scale.height);
    const visual = this.add.rectangle(point.x, point.y, definition.size, definition.size, definition.color);
    visual.setAlpha(0);
    this.physics.add.existing(visual);
    this.boss = new BossController(
      this,
      visual,
      definition,
      encounter.bossInstanceId ?? `${definition.id.toLowerCase()}_001`,
      () => ({ x: this.player?.x ?? 0, y: this.player?.y ?? 0 }),
      () => ({ width: this.scale.width, height: this.scale.height }),
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
      }
    );
    this.bossHud = new BossHud(this, this.boss);
    this.bossVisual = makeBossVisual(this, definition.id, definition.size);
    this.physics.add.collider(player, visual);
  }

  private syncActorVisuals(): void {
    if (this.player && this.controller && this.health) {
      const aim = this.attack?.isAttacking ? this.attack.attackDirection : this.controller.facing;
      const skillSlot = this.currentSkillVisualSlot();
      this.playerVisual?.update({
        x: this.player.x,
        y: this.player.y,
        facingX: aim.x,
        facingY: aim.y,
        moving: this.controller.isMoving,
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
      });
    }
    if (this.boss) {
      const snapshot = this.boss.debugSnapshot();
      const pattern =
        snapshot.patternId === 'heavy_slam' || snapshot.patternId === 'projectile_burst' || snapshot.patternId === 'charge'
          ? snapshot.patternId
          : null;
      this.bossVisual?.update({
        x: this.boss.gameObject.x,
        y: this.boss.gameObject.y,
        facingX: this.boss.attackDirection.x,
        facingY: this.boss.attackDirection.y,
        moving: !this.boss.isDead && this.boss.state === 'IDLE',
        hit: this.boss.isHit,
        dead: this.boss.isDead,
        deadT: this.boss.deathProgress,
        attacking: this.boss.state === 'ATTACKING' || this.boss.state === 'WINDUP',
        attackActive: this.boss.state === 'ATTACKING',
        phase: this.boss.currentPhase === 2 || this.boss.isTransitioningPhase ? 2 : 1,
        phaseTransition: this.boss.isTransitioningPhase,
        bossPattern: pattern,
        delta: this.lastVisualDelta,
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
      return getEnemyAsset((target as EnemyController).typeId).damageTextOffsetY ?? 20;
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
    this.projectiles?.spawnEnemyShot({
      x: shot.originX,
      y: shot.originY,
      dirX: shot.dirX,
      dirY: shot.dirY,
      speed: shot.definition.projectileSpeed ?? 320,
      damage: shot.definition.damage,
      lifetimeMs: shot.definition.projectileLifetimeMs ?? 1400,
      radius: shot.definition.projectileRadius ?? 7,
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
    audioManager.playSfx(sfxForPlayerAttack(this.combatConfig?.player.classId ?? 'warrior'));
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
    this.encounterManager?.haltAll();
    this.boss?.halt();
    this.projectiles?.destroyAll();
    this.skillCombat?.destroy();

    const isBoss = Boolean(this.boss);
    this.time.delayedCall(420, () => {
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

    const applied = enemy.takeDamage({
      amount: this.attack.damage,
      direction: this.attack.attackDirection,
      attackId: this.attack.attackId,
      knockbackScale: this.attack.knockbackScale,
    });

    if (applied) {
      this.feedback?.playAttackHit(enemy.gameObject, this.attack.damage, {
        shakeScale: this.isBossTarget(enemy) ? COMBAT_FEEL.bossChipShakeScale : 1,
        offsetY: this.hitOffset(enemy),
      });
      audioManager.playSfx(SFX_ID.ENEMY_HIT);
    }

    this.checkCombatEnd();
  }

  private canApplyEnemyAttackHit(enemy: EnemyController): boolean {
    return Boolean(
      this.status === 'RUNNING' &&
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
      audioManager.playSfx(sfxForEnemyAttack(enemy.typeId));
      audioManager.playSfx(SFX_ID.PLAYER_HIT);
    }
    this.checkCombatEnd();
  }

  private canApplyBossHitbox(boss: BossController, kind: 'slam' | 'charge'): boolean {
    if (this.status !== 'RUNNING' || boss.isDead || !this.health || this.health.isDead || !this.controller || this.controller.isInvincible) {
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
      audioManager.playSfx(SFX_ID.PLAYER_HIT);
    }
    this.checkCombatEnd();
  }

  private syncCombatAudioCues(): void {
    if (this.health?.isDead && !this.wasPlayerDead) {
      audioManager.playSfx(SFX_ID.PLAYER_DEATH);
    }
    this.wasPlayerDead = this.health?.isDead === true;

    for (const enemy of this.enemyManager?.getEnemies() ?? []) {
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

  private syncWorldBounds(): void {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
  }

  private clampActor(
    target: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc | undefined,
    size: number
  ): void {
    if (!target) {
      return;
    }

    const half = size / 2;
    target.x = Phaser.Math.Clamp(target.x, half, this.scale.width - half);
    target.y = Phaser.Math.Clamp(target.y, half, this.scale.height - half);
  }
}
