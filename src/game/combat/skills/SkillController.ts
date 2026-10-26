import type { PlayerClassId, SkillSlot } from '../../player/classes/class-types';
import { getSkillForSlot } from './skill-definitions';
import { createSkillExecutors, type SkillExecutor } from './skill-executors';
import type {
  SkillDefinition,
  SkillExecutionContext,
  SkillRuntimeState,
  SkillUseResult,
} from './skill-types';

export interface SkillVitals {
  isDead: () => boolean;
  isCombatLocked: () => boolean;
  currentMp: () => number;
  consumeMp: (amount: number) => boolean;
}

export interface SkillAim {
  playerX: () => number;
  playerY: () => number;
  pointerX: () => number;
  pointerY: () => number;
}

export interface SkillControllerOptions {
  classId: PlayerClassId;
  vitals: SkillVitals;
  aim: SkillAim;
  executors?: Readonly<Record<string, SkillExecutor>>;
}

export interface SkillHudSlotView {
  slot: SkillSlot;
  skillId: string | null;
  name: string;
  implemented: boolean;
  cooldownRemainingMs: number;
  ready: boolean;
  mpCost: number;
  maxCooldownMs: number;
}

const SLOTS: readonly SkillSlot[] = ['Q', 'E'];

export class SkillController {
  private readonly classId: PlayerClassId;
  private readonly vitals: SkillVitals;
  private readonly aim: SkillAim;
  private readonly executors: Readonly<Record<string, SkillExecutor>>;
  private readonly cooldownRemainingMs = new Map<string, number>();
  private readonly active = new Map<string, boolean>();
  private lastExecutedSkillId: string | null = null;
  private lastUseResult: SkillUseResult | null = null;

  constructor(options: SkillControllerOptions) {
    this.classId = options.classId;
    this.vitals = options.vitals;
    this.aim = options.aim;
    this.executors = options.executors ?? createSkillExecutors({ spawnFireball: () => undefined });
  }

  getLastExecutedSkillId(): string | null {
    return this.lastExecutedSkillId;
  }

  getLastUseResult(): SkillUseResult | null {
    return this.lastUseResult;
  }

  getSkill(slot: SkillSlot): SkillDefinition | undefined {
    return getSkillForSlot(this.classId, slot);
  }

  getRuntime(slot: SkillSlot): SkillRuntimeState | null {
    const skill = this.getSkill(slot);
    if (!skill) {
      return null;
    }
    return {
      skillId: skill.id,
      cooldownRemainingMs: this.cooldownRemainingMs.get(skill.id) ?? 0,
      isActive: this.active.get(skill.id) === true,
    };
  }

  getHudSlots(): SkillHudSlotView[] {
    return SLOTS.map((slot) => {
      const skill = this.getSkill(slot);
      const cooldownRemainingMs = skill ? this.cooldownRemainingMs.get(skill.id) ?? 0 : 0;
      return {
        slot,
        skillId: skill?.id ?? null,
        name: skill?.name ?? '',
        implemented: skill?.implemented === true,
        cooldownRemainingMs,
        ready: Boolean(skill?.implemented && cooldownRemainingMs <= 0),
        mpCost: skill?.mpCost ?? 0,
        maxCooldownMs: skill?.cooldownMs ?? 0,
      };
    });
  }

  update(deltaMs: number): void {
    for (const [skillId, remaining] of this.cooldownRemainingMs) {
      const next = remaining - deltaMs;
      if (next <= 0) {
        this.cooldownRemainingMs.delete(skillId);
      } else {
        this.cooldownRemainingMs.set(skillId, next);
      }
    }
  }

  tryUse(slot: SkillSlot): SkillUseResult {
    const result = this.useSkill(slot);
    this.lastUseResult = result;
    return result;
  }

  private useSkill(slot: SkillSlot): SkillUseResult {
    if (this.vitals.isDead()) {
      return { ok: false, reason: 'DEAD' };
    }
    if (this.vitals.isCombatLocked()) {
      return { ok: false, reason: 'LOCKED' };
    }

    const skill = this.getSkill(slot);
    if (!skill) {
      return { ok: false, reason: 'NO_SKILL' };
    }

    const cooldownRemainingMs = this.cooldownRemainingMs.get(skill.id) ?? 0;
    if (cooldownRemainingMs > 0) {
      return { ok: false, reason: 'COOLDOWN' };
    }

    if (this.vitals.currentMp() < skill.mpCost) {
      return { ok: false, reason: 'MP' };
    }

    if (!skill.implemented) {
      return { ok: false, reason: 'NOT_IMPLEMENTED' };
    }

    const executor = this.executors[skill.id];
    const executed = executor?.(this.executionContext(skill)) ?? { ok: false, reason: 'NOT_IMPLEMENTED' as const };
    if (!executed.ok) {
      return { ok: false, reason: executed.reason ?? 'NOT_IMPLEMENTED' };
    }

    if (!this.vitals.consumeMp(skill.mpCost)) {
      return { ok: false, reason: 'MP' };
    }

    this.cooldownRemainingMs.set(skill.id, skill.cooldownMs);
    this.active.set(skill.id, false);
    this.lastExecutedSkillId = skill.id;
    return { ok: true, skillId: skill.id };
  }

  private executionContext(skill: SkillDefinition): SkillExecutionContext {
    return {
      playerX: this.aim.playerX(),
      playerY: this.aim.playerY(),
      pointerX: this.aim.pointerX(),
      pointerY: this.aim.pointerY(),
      skill,
    };
  }
}
