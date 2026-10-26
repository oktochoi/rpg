export function isGameDebugEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_GAME_DEBUG === '1') {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1';
}

/** Boss STATE / PATTERN / PHASE labels. Normal play stays clean. */
export function isCombatDebugEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_GAME_DEBUG === '1') {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1' || params.get('combatdebug') === '1';
}

export function isNavDebugEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('navdebug') === '1';
}

export function isDevelopmentBuild(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function setGameDebugEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (enabled) {
      window.localStorage.setItem('ai-rpg-debug', '1');
    } else {
      window.localStorage.removeItem('ai-rpg-debug');
    }
  } catch {
    /* ignore */
  }
}
