import { LOCATION_DEFINITIONS, LOCATION_ID } from './location-definitions';

const LOCATION_ALIASES: ReadonlyArray<{ id: string; aliases: readonly string[] }> = [
  { id: LOCATION_ID.LUEN_VILLAGE, aliases: ['루엔 마을', '루엔마을', '마을', '루엔'] },
  { id: LOCATION_ID.LUEN_ADVENTURERS_GUILD, aliases: ['모험가 길드', '길드'] },
  { id: LOCATION_ID.LUEN_GENERAL_STORE, aliases: ['잡화점', '상점', '가게'] },
  { id: LOCATION_ID.BLUE_MOON_INN, aliases: ['푸른 달 여관', '푸른달 여관', '여관'] },
  { id: LOCATION_ID.FOREST_ROAD, aliases: ['숲 길', '숲길'] },
  { id: LOCATION_ID.ANCIENT_RUINS, aliases: ['고대 폐허', '폐허'] },
  { id: LOCATION_ID.NORTHERN_GATE, aliases: ['북쪽 문', '북문'] },
];

/**
 * Resolves a player phrase to a defined location id.
 * Never creates a new location for unknown names.
 */
export function resolveLocationAlias(text: string): string | null {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  let best: { id: string; length: number } | null = null;
  for (const entry of LOCATION_ALIASES) {
    for (const alias of entry.aliases) {
      const needle = alias.toLowerCase();
      if (normalized.includes(needle) && LOCATION_DEFINITIONS[entry.id] && (!best || alias.length > best.length)) {
        best = { id: entry.id, length: alias.length };
      }
    }
  }
  return best?.id ?? null;
}

export function looksLikeMoveIntent(text: string): boolean {
  return /간다|향해|이동|걸어|들어간다|향한다/.test(text);
}
