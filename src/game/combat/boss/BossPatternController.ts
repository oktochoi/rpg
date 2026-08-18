import type { BossDefinition, BossPatternId, BossRuntimeState } from './boss-types';
import { BOSS_PATTERN_ID } from './boss-types';
import type { BossPattern, BossPatternContext } from './patterns/boss-pattern-types';
import { ChargePattern } from './patterns/ChargePattern';
import { HeavySlamPattern } from './patterns/HeavySlamPattern';
import { ProjectileBurstPattern } from './patterns/ProjectileBurstPattern';

export class BossPatternController {
  private cycleIndex = 0;
  private active: BossPattern | null = null;
  private readonly patterns: Record<BossPatternId, BossPattern> = {
    [BOSS_PATTERN_ID.HEAVY_SLAM]: new HeavySlamPattern(),
    [BOSS_PATTERN_ID.PROJECTILE_BURST]: new ProjectileBurstPattern(),
    [BOSS_PATTERN_ID.CHARGE]: new ChargePattern(),
  };

  constructor(private readonly definition: BossDefinition) {}

  reset(): void {
    this.cycleIndex = 0;
    this.active = null;
    for (const pattern of Object.values(this.patterns)) {
      pattern.destroy();
    }
  }

  beginPhase(phase: 1 | 2): void {
    this.cycleIndex = 0;
    this.active = null;
    for (const pattern of Object.values(this.patterns)) {
      pattern.destroy();
    }
    void phase;
  }

  get currentPatternId(): BossPatternId | undefined {
    return this.active?.id;
  }

  peekNextPatternId(phase: 1 | 2): BossPatternId {
    const cycle = this.cycleFor(phase);
    return cycle[this.cycleIndex % cycle.length];
  }

  cancel(ctx: BossPatternContext): void {
    this.active?.cancel(ctx);
    this.active?.destroy();
    this.active = null;
  }

  destroy(ctx?: BossPatternContext): void {
    if (ctx) {
      this.cancel(ctx);
    }
    this.reset();
  }

  update(deltaMs: number, runtime: BossRuntimeState, ctx: BossPatternContext): void {
    if (runtime.isDead || runtime.isTransitioningPhase) {
      this.cancel(ctx);
      return;
    }

    if (this.active) {
      const status = this.active.update(deltaMs, ctx);
      if (status === 'done') {
        runtime.lastPatternId = this.active.id;
        runtime.currentPatternId = undefined;
        runtime.isAttacking = false;
        runtime.patternCooldownRemainingMs = this.delayFor(runtime.currentPhase);
        this.active.destroy();
        this.active = null;
      } else {
        runtime.currentPatternId = this.active.id;
        runtime.isAttacking = true;
      }
      return;
    }

    if (runtime.patternCooldownRemainingMs > 0) {
      runtime.patternCooldownRemainingMs = Math.max(0, runtime.patternCooldownRemainingMs - deltaMs);
      runtime.isAttacking = false;
      runtime.currentPatternId = undefined;
      return;
    }

    const nextId = this.takeNextPatternId(runtime.currentPhase);
    const pattern = this.patterns[nextId];
    if (!pattern.canUse(ctx)) {
      runtime.patternCooldownRemainingMs = this.delayFor(runtime.currentPhase);
      return;
    }
    this.active = pattern;
    runtime.currentPatternId = nextId;
    runtime.isAttacking = true;
    pattern.start(ctx);
  }

  private takeNextPatternId(phase: 1 | 2): BossPatternId {
    const cycle = this.cycleFor(phase);
    const id = cycle[this.cycleIndex % cycle.length];
    this.cycleIndex += 1;
    return id;
  }

  private cycleFor(phase: 1 | 2): readonly BossPatternId[] {
    return this.definition.phaseDefinitions.find((item) => item.id === phase)?.patternCycle ?? this.definition.patternIds;
  }

  private delayFor(phase: 1 | 2): number {
    return this.definition.phaseDefinitions.find((item) => item.id === phase)?.patternDelayMs ?? 1000;
  }
}
