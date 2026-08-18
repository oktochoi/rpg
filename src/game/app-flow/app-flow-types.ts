export const APP_PHASE = {
  TITLE: 'TITLE',
  CHARACTER_CREATION: 'CHARACTER_CREATION',
  GAME: 'GAME',
} as const;

export type AppPhase = (typeof APP_PHASE)[keyof typeof APP_PHASE];

export const PLAYER_NAME_MIN = 1;
export const PLAYER_NAME_MAX = 16;
export const DEFAULT_PLAYER_NAME = '모험가';

export function sanitizePlayerName(raw: string): string | null {
  const name = raw.trim();
  if (name.length < PLAYER_NAME_MIN || name.length > PLAYER_NAME_MAX) {
    return null;
  }
  return name;
}
