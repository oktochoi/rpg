import { ENCOUNTER_ID, isBossEncounter } from './encounter-definitions';

const ENCOUNTER_TITLES: Readonly<Record<string, string>> = {
  [ENCOUNTER_ID.RUINS_EASY_01]: '고대 폐허 — 고블린',
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: '숲길 — 고블린 정찰대',
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: '숲길 — 고블린 정찰대',
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: '숲길 — 매복',
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: '고블린 야영지',
  [ENCOUNTER_ID.CH1_RUINS_GATE]: '고대 폐허 — 입구',
  [ENCOUNTER_ID.RUINS_MIXED_01]: '고대 폐허 — 입구',
  [ENCOUNTER_ID.RUINS_HEAVY_01]: '고대 폐허 — 중혼합',
  [ENCOUNTER_ID.RUINS_BOSS_01]: '고대 수호자',
};

export function encounterTitle(encounterId: string): string {
  if (ENCOUNTER_TITLES[encounterId]) {
    return ENCOUNTER_TITLES[encounterId];
  }
  return isBossEncounter(encounterId) ? '고대 수호자' : '전투';
}
