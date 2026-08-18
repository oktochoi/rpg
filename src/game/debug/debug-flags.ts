export function isGameDebugEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    return true;
  }
  try {
    return window.localStorage.getItem('ai-rpg-debug') === '1';
  } catch {
    return false;
  }
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
