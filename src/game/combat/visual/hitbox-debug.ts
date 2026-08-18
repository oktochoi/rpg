export function isCombatHitboxDebug(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('hitbox') === '1';
}
