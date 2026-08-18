export function applyDamageReduction(amount: number, reduction: number): number {
  if (amount <= 0) {
    return 0;
  }
  return Math.max(0, Math.round(amount * (1 - Math.max(0, Math.min(1, reduction)))));
}

export function dashDistancePx(speed: number, durationMs: number): number {
  return speed * (durationMs / 1000);
}

export function isBackAttack(
  attacker: { x: number; y: number },
  target: { x: number; y: number },
  targetFacing: { x: number; y: number }
): boolean {
  const toAttackerX = attacker.x - target.x;
  const toAttackerY = attacker.y - target.y;
  const length = Math.hypot(toAttackerX, toAttackerY);
  if (length === 0) {
    return false;
  }
  const facingLength = Math.hypot(targetFacing.x, targetFacing.y);
  if (facingLength === 0) {
    return false;
  }
  const dot =
    (targetFacing.x / facingLength) * (toAttackerX / length) +
    (targetFacing.y / facingLength) * (toAttackerY / length);
  return dot < 0;
}

export function backstabDamage(baseDamage: number, backDamage: number, isBack: boolean): number {
  return isBack ? backDamage : baseDamage;
}

export function inRadius(
  origin: { x: number; y: number },
  target: { x: number; y: number },
  radius: number
): boolean {
  return Math.hypot(origin.x - target.x, origin.y - target.y) <= radius;
}

export function collectTargetsInRadius<T extends { x: number; y: number }>(
  origin: { x: number; y: number },
  targets: readonly T[],
  radius: number
): T[] {
  return targets.filter((target) => inRadius(origin, target, radius));
}

export function tickTimedModifier(
  remainingMs: number,
  deltaMs: number
): { remainingMs: number; active: boolean } {
  const next = remainingMs - deltaMs;
  return { remainingMs: Math.max(0, next), active: next > 0 };
}
