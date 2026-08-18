import type { SkillDefinition, SkillExecutionContext, SkillExecutorResult } from './skill-types';

export type SkillExecutor = (context: SkillExecutionContext) => SkillExecutorResult;

export interface SkillExecutorHooks {
  spawnFireball?: (context: SkillExecutionContext) => void;
  chargeSlash?: (context: SkillExecutionContext) => void;
  guard?: (context: SkillExecutionContext) => void;
  frostNova?: (context: SkillExecutionContext) => void;
  shadowDash?: (context: SkillExecutionContext) => void;
  backstab?: (context: SkillExecutionContext) => void;
}

function fromHook(hook?: (context: SkillExecutionContext) => void): SkillExecutor {
  return (context) => {
    if (!hook) {
      return { ok: false, reason: 'NOT_IMPLEMENTED' };
    }
    hook(context);
    return { ok: true };
  };
}

export function executeFireball(context: SkillExecutionContext, hooks: SkillExecutorHooks): SkillExecutorResult {
  if (!hooks.spawnFireball) {
    return { ok: false, reason: 'NOT_IMPLEMENTED' };
  }
  hooks.spawnFireball(context);
  return { ok: true };
}

export function createSkillExecutors(hooks: SkillExecutorHooks): Readonly<Record<string, SkillExecutor>> {
  return {
    adventurer_quick_strike: fromHook(hooks.chargeSlash),
    warrior_charge_slash: fromHook(hooks.chargeSlash),
    warrior_guard: fromHook(hooks.guard),
    mage_fireball: (context) => executeFireball(context, hooks),
    mage_frost_nova: fromHook(hooks.frostNova),
    rogue_shadow_dash: fromHook(hooks.shadowDash),
    rogue_backstab: fromHook(hooks.backstab),
  };
}

export function getExecutorForSkill(
  executors: Readonly<Record<string, SkillExecutor>>,
  skill: SkillDefinition
): SkillExecutor | undefined {
  return executors[skill.id];
}
