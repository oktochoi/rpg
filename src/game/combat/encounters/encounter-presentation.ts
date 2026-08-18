import { ENCOUNTER_ID, isBossEncounter } from './encounter-definitions';

const ENCOUNTER_TITLES: Readonly<Record<string, string>> = {
  [ENCOUNTER_ID.RUINS_EASY_01]: '고대 폐허 — 고블린 매복',
  [ENCOUNTER_ID.RUINS_ARCHER_01]: '고대 폐허 — 숲 궁수',
  [ENCOUNTER_ID.RUINS_BRUTE_01]: '고대 폐허 — 브루트',
  [ENCOUNTER_ID.RUINS_MIXED_01]: '고대 폐허 — 고블린 매복',
  [ENCOUNTER_ID.RUINS_HEAVY_01]: '고대 폐허 — 중혼합',
  [ENCOUNTER_ID.RUINS_BOSS_01]: '고대 수호자',
};

export function encounterTitle(encounterId: string): string {
  if (ENCOUNTER_TITLES[encounterId]) {
    return ENCOUNTER_TITLES[encounterId];
  }
  return isBossEncounter(encounterId) ? '고대 수호자' : '전투';
}
