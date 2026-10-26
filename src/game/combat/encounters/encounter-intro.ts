import { ENEMY_TYPE_ID, type EnemyTypeId } from '../enemies/enemy-types';
import { ENCOUNTER_ID, isBossEncounter } from './encounter-definitions';
import { encounterTitle } from './encounter-presentation';

const ART = {
  forest: '/game-assets/combat/backgrounds/forest.png',
  camp: '/game-assets/combat/backgrounds/camp.png',
  ruins: '/game-assets/combat/backgrounds/ruins.png',
  guardian: '/game-assets/combat/backgrounds/guardian.png',
  yard: '/game-assets/combat/backgrounds/yard.png',
} as const;

export type EncounterIntroLayout = 'stageLeft' | 'stageRight' | 'stageCenter';
export type EncounterIntroMode = 'practice' | 'skirmish' | 'boss';

export interface EncounterIntroCopy {
  alert: string;
  appear: string;
  warn: string;
  title: string;
  tagline: string;
  backdrop: string;
  portrait: string;
  layout: EncounterIntroLayout;
  focus: string;
  durationMs: number;
  boss: boolean;
  /** Practice skips the encounter sting. Boss keeps the banner. Skirmishes use a short caption. */
  mode: EncounterIntroMode;
}

const PORTRAIT = {
  goblin: '/assets/sprites/goblin_warrior/frames/idle_01.png',
  archer: '/assets/sprites/goblin_archer/frames/idle_01.png',
  mage: '/assets/sprites/goblin_mage/frames/idle_01.png',
  golem: '/assets/sprites/stone_golem/frames/idle_01.png',
  wolf: '/assets/sprites/dire_wolf/frames/idle_01.png',
  boss: '/assets/bosses/ruins_guardian/sheet/idle_01.png',
} as const;

const STAGE: Record<string, { portrait: string; layout: EncounterIntroLayout; focus: string }> = {
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: { portrait: PORTRAIT.archer, layout: 'stageRight', focus: '72% 30%' },
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: { portrait: PORTRAIT.goblin, layout: 'stageLeft', focus: '40% 60%' },
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: { portrait: PORTRAIT.goblin, layout: 'stageRight', focus: '70% 40%' },
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: { portrait: PORTRAIT.goblin, layout: 'stageCenter', focus: 'center 40%' },
  [ENCOUNTER_ID.CH1_FOREST_DEEP]: { portrait: PORTRAIT.archer, layout: 'stageLeft', focus: '20% 45%' },
  [ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER]: { portrait: PORTRAIT.wolf, layout: 'stageRight', focus: '62% center' },
  [ENCOUNTER_ID.FOREST_WOLF_01]: { portrait: PORTRAIT.wolf, layout: 'stageCenter', focus: 'center 60%' },
  [ENCOUNTER_ID.CH1_RUINS_GATE]: { portrait: PORTRAIT.golem, layout: 'stageLeft', focus: '35% 40%' },
  [ENCOUNTER_ID.RUINS_MIXED_01]: { portrait: PORTRAIT.archer, layout: 'stageRight', focus: '55% 35%' },
  [ENCOUNTER_ID.RUINS_EASY_01]: { portrait: PORTRAIT.goblin, layout: 'stageLeft', focus: 'center' },
  [ENCOUNTER_ID.RUINS_ARCHER_01]: { portrait: PORTRAIT.archer, layout: 'stageRight', focus: '72% 30%' },
  [ENCOUNTER_ID.RUINS_MAGE_01]: { portrait: PORTRAIT.mage, layout: 'stageCenter', focus: 'center 30%' },
  [ENCOUNTER_ID.RUINS_BRUTE_01]: { portrait: PORTRAIT.golem, layout: 'stageCenter', focus: 'center 45%' },
  [ENCOUNTER_ID.RUINS_HEAVY_01]: { portrait: PORTRAIT.golem, layout: 'stageLeft', focus: '40% 40%' },
  [ENCOUNTER_ID.RUINS_BOSS_01]: { portrait: PORTRAIT.boss, layout: 'stageCenter', focus: 'center 20%' },
  [ENCOUNTER_ID.TRAINING_GROUNDS]: { portrait: '', layout: 'stageCenter', focus: 'center' },
};

interface IntroSeed {
  alert: string;
  appear: string;
  warn: string;
  tagline: string;
  backdrop: string;
  durationMs?: number;
  boss?: boolean;
}

const INTRO_BY_ENCOUNTER: Record<string, IntroSeed> = {
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: {
    alert: '수풀에서 짧은 금속 소리가 난다…',
    appear: '궁수가 뒤쪽 나무 그늘에 자리를 잡는다',
    warn: '적이 나타났다',
    tagline: '앞에서 막고, 뒤에서 쏜다',
    backdrop: ART.forest,
  },
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: {
    alert: '숲 냄새가 달라진다…',
    appear: '발소리가 가까워진다',
    warn: '정찰대',
    tagline: '고블린만 길을 막는다',
    backdrop: ART.forest,
  },
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: {
    alert: '발밑이 조용해진다…',
    appear: '수풀 양쪽이 일어선다',
    warn: '매복',
    tagline: '양쪽에서 고블린이 일어선다',
    backdrop: ART.forest,
  },
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: {
    alert: '모닥불 연기가 보인다…',
    appear: '야영지가 들썩인다',
    warn: '야영지',
    tagline: '야영지의 고블린',
    backdrop: ART.camp,
  },
  [ENCOUNTER_ID.CH1_FOREST_DEEP]: {
    alert: '빛이 숲 밑으로 가라앉는다…',
    appear: '고블린이 숲 안쪽을 막는다',
    warn: '깊은 숲',
    tagline: '아직 고블린뿐이다',
    backdrop: ART.forest,
  },
  [ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER]: {
    alert: '누군가 열쇠를 감춘 채 달린다…',
    appear: '수상한 고블린이 돌아선다',
    warn: '열쇠의 주인',
    tagline: '늑대가 열쇠를 호위한다',
    backdrop: ART.forest,
  },
  [ENCOUNTER_ID.FOREST_WOLF_01]: {
    alert: '울음이 바로 옆이다…',
    appear: '낮은 그림자가 달린다',
    warn: '다이어 울프',
    tagline: '조련사와 두 마리',
    backdrop: ART.forest,
  },
  [ENCOUNTER_ID.CH1_RUINS_GATE]: {
    alert: '석문 안에서 쇳소리가 난다…',
    appear: '골렘 수문장이 입구를 막는다',
    warn: '수문장',
    tagline: '주술사가 뒤에서 돕는다',
    backdrop: ART.ruins,
  },
  [ENCOUNTER_ID.RUINS_MIXED_01]: {
    alert: '돌바닥이 차가워진다…',
    appear: '여러 기척이 한꺼번에 인다',
    warn: '폐허 입구',
    tagline: '섞여 나온 적',
    backdrop: ART.ruins,
  },
  [ENCOUNTER_ID.RUINS_EASY_01]: {
    alert: '무너진 복도 끝에서…',
    appear: '고블린이 돌을 집어 든다',
    warn: '고블린',
    tagline: '폐허의 잔당',
    backdrop: ART.ruins,
  },
  [ENCOUNTER_ID.RUINS_ARCHER_01]: {
    alert: '시위 소리가 들린다…',
    appear: '높은 곳에서 조준한다',
    warn: '궁수',
    tagline: '방패 뒤에서 쏜다',
    backdrop: ART.ruins,
  },
  [ENCOUNTER_ID.RUINS_MAGE_01]: {
    alert: '공기가 마른다…',
    appear: '주문이 피어오른다',
    warn: '고블린 메이지',
    tagline: '호위가 주문을 가린다',
    backdrop: ART.ruins,
  },
  [ENCOUNTER_ID.RUINS_BRUTE_01]: {
    alert: '바닥이 울린다…',
    appear: '돌덩이가 일어선다',
    warn: '스톤 골렘',
    tagline: '부하가 앞을 연다',
    backdrop: ART.ruins,
  },
  [ENCOUNTER_ID.RUINS_HEAVY_01]: {
    alert: '폐허 한가운데가 무겁다…',
    appear: '큰 그림자가 앞을 가린다',
    warn: '중무장',
    tagline: '쉽게 끝나지 않는다',
    backdrop: ART.ruins,
  },
  [ENCOUNTER_ID.RUINS_BOSS_01]: {
    alert: '바닥의 푸른 룬이 하나씩 빛나기 시작한다.',
    appear: '골렘이 정지 상태에서 눈을 뜬다',
    warn: '고대 수호자',
    tagline: '누군가 이 봉인을 건드렸다',
    backdrop: ART.guardian,
    durationMs: 3600,
    boss: true,
  },
  [ENCOUNTER_ID.TRAINING_GROUNDS]: {
    alert: '훈련장에 선다…',
    appear: '허수아비가 기다린다',
    warn: '훈련',
    tagline: '실전은 아니다',
    backdrop: ART.yard,
    durationMs: 0,
  },
};

function stageFor(encounterId: string, boss: boolean): { portrait: string; layout: EncounterIntroLayout; focus: string } {
  return (
    STAGE[encounterId] ?? {
      portrait: boss ? PORTRAIT.boss : PORTRAIT.goblin,
      layout: boss ? 'stageCenter' : 'stageLeft',
      focus: boss ? 'center 20%' : 'center',
    }
  );
}

const MEET_LINE: Readonly<Record<string, string>> = {
  [ENCOUNTER_ID.CH1_FOREST_SCOUTS]: '고블린 정찰대를 마주쳤다',
  [ENCOUNTER_ID.FOREST_GOBLIN_01]: '고블린을 마주쳤다',
  [ENCOUNTER_ID.CH1_FOREST_AMBUSH]: '매복한 무리를 마주쳤다',
  [ENCOUNTER_ID.CH1_GOBLIN_CAMP]: '고블린 야영지를 마주쳤다',
  [ENCOUNTER_ID.CH1_FOREST_DEEP]: '깊은 숲의 무리를 마주쳤다',
  [ENCOUNTER_ID.CH1_FOREST_KEY_HOLDER]: '열쇠를 호위하는 늑대를 마주쳤다',
  [ENCOUNTER_ID.FOREST_WOLF_01]: '다이어 울프를 마주쳤다',
  [ENCOUNTER_ID.CH1_RUINS_GATE]: '입구의 골렘 수문장을 마주쳤다',
  [ENCOUNTER_ID.RUINS_MIXED_01]: '폐허 입구의 무리를 마주쳤다',
  [ENCOUNTER_ID.RUINS_EASY_01]: '고블린을 마주쳤다',
  [ENCOUNTER_ID.RUINS_ARCHER_01]: '고블린 궁수를 마주쳤다',
  [ENCOUNTER_ID.RUINS_MAGE_01]: '고블린 주술사를 마주쳤다',
  [ENCOUNTER_ID.RUINS_BRUTE_01]: '스톤 골렘을 마주쳤다',
  [ENCOUNTER_ID.RUINS_HEAVY_01]: '폐허의 중무장을 마주쳤다',
  [ENCOUNTER_ID.RUINS_BOSS_01]: '고대 수호자를 마주쳤다',
  [ENCOUNTER_ID.TRAINING_GROUNDS]: '훈련용 허수아비 앞에 선다',
};

export function encounterMeetLine(encounterId: string): string {
  return MEET_LINE[encounterId] ?? (isBossEncounter(encounterId) ? '고대 수호자를 마주쳤다' : '적을 마주쳤다');
}

export function buildEncounterIntroCopy(encounterId: string): EncounterIntroCopy {
  const boss = isBossEncounter(encounterId);
  const title = encounterTitle(encounterId);
  const seed = INTRO_BY_ENCOUNTER[encounterId];
  const stage = stageFor(encounterId, seed?.boss ?? boss);
  if (seed) {
    return {
      alert: seed.alert,
      appear: seed.appear,
      warn: seed.warn,
      title,
      tagline: seed.tagline,
      backdrop: seed.backdrop,
      portrait: stage.portrait,
      layout: stage.layout,
      focus: stage.focus,
      durationMs: seed.durationMs ?? (seed.boss || boss ? 3600 : 2800),
      boss: seed.boss ?? boss,
      mode: introMode(encounterId, seed.boss ?? boss),
    };
  }
  if (boss) {
    return {
      alert: '제단 너머가 고요해진다…',
      appear: '룬이 점등한다',
      warn: '고대 수호자',
      title,
      tagline: '봉인의 주인',
      backdrop: ART.guardian,
      portrait: stage.portrait,
      layout: stage.layout,
      focus: stage.focus,
      durationMs: 3600,
      boss: true,
      mode: 'boss',
    };
  }
  return {
    alert: '기척이 갈라진다…',
    appear: title,
    warn: '전투',
    title,
    tagline: '준비',
    backdrop: ART.forest,
    portrait: stage.portrait,
    layout: stage.layout,
    focus: stage.focus,
    durationMs: 2800,
    boss: false,
    mode: introMode(encounterId, false),
  };
}

function introMode(encounterId: string, boss: boolean): EncounterIntroMode {
  if (encounterId === ENCOUNTER_ID.TRAINING_GROUNDS) {
    return 'practice';
  }
  return boss ? 'boss' : 'skirmish';
}

export type EntrancePace = 'full' | 'brief';
export type EntranceSide = 'left' | 'right' | 'alternate';

export interface EntrancePlan {
  fromX: number;
  fromY: number;
  durationMs: number;
  style: 'run_in' | 'drop_back' | 'materialize' | 'awaken' | 'stand';
}

export function encounterEntranceSide(encounterId: string): EntranceSide {
  const layout = STAGE[encounterId]?.layout;
  if (layout === 'stageLeft') {
    return 'left';
  }
  if (layout === 'stageRight') {
    return 'right';
  }
  return 'alternate';
}

export function planEnemyEntrance(
  typeId: EnemyTypeId,
  targetX: number,
  targetY: number,
  bounds: { width: number; height: number; originX: number; originY: number },
  index: number,
  pace: EntrancePace = 'full',
  side: EntranceSide = 'alternate'
): EntrancePlan {
  const midX = bounds.originX + bounds.width * 0.5;
  const stagger = Math.min(index, 2) * (pace === 'brief' ? 40 : 55);
  const brief = pace === 'brief';

  if (typeId === ENEMY_TYPE_ID.TRAINING_DUMMY) {
    return {
      fromX: targetX,
      fromY: targetY,
      durationMs: 0,
      style: 'stand',
    };
  }
  if (typeId === ENEMY_TYPE_ID.ARCHER) {
    return {
      fromX: targetX + (index % 2 === 0 ? -28 : 28),
      fromY: bounds.originY - (brief ? 72 : 110),
      durationMs: (brief ? 240 : 380) + stagger,
      style: 'drop_back',
    };
  }
  if (typeId === ENEMY_TYPE_ID.GOBLIN_MAGE) {
    return {
      fromX: targetX,
      fromY: targetY,
      durationMs: (brief ? 220 : 360) + stagger,
      style: 'materialize',
    };
  }
  if (typeId === ENEMY_TYPE_ID.BRUTE) {
    return {
      fromX: targetX,
      fromY: targetY,
      durationMs: (brief ? 300 : 520) + stagger,
      style: 'awaken',
    };
  }

  const fromLeft = side === 'left' ? true : side === 'right' ? false : targetX < midX || index % 2 === 0;
  const travel = typeId === ENEMY_TYPE_ID.DIRE_WOLF ? (brief ? 240 : 300) : brief ? 160 : 200;
  return {
    fromX: fromLeft ? bounds.originX - travel : bounds.originX + bounds.width + travel,
    fromY: targetY,
    durationMs: (typeId === ENEMY_TYPE_ID.DIRE_WOLF ? (brief ? 240 : 380) : brief ? 300 : 460) + stagger,
    style: 'run_in',
  };
}

export type EncounterStartPhase = 'pre' | 'entrance' | 'ready' | 'active';

export interface EncounterStartPlan {
  phases: Array<'pre' | 'entrance' | 'ready'>;
  preMs: number;
  /** Minimum time the entrance beat stays up. The tween may run longer. */
  entranceMs: number;
  readyMs: number;
  /** After READY, the player can move but enemy AI, shots, and damage stay off. */
  graceMs: number;
  walkIn: boolean;
  playEnemyEntrances: boolean;
  boss: boolean;
  cue: string;
  meet: string;
}

export function planEncounterStart(input: {
  encounterId: string;
  training: boolean;
  repeat: boolean;
  observed: boolean;
  boss: boolean;
}): EncounterStartPlan {
  const copy = buildEncounterIntroCopy(input.encounterId);
  const meet = encounterMeetLine(input.encounterId);
  if (input.training || copy.mode === 'practice') {
    return {
      phases: ['ready'],
      preMs: 0,
      entranceMs: 0,
      readyMs: 80,
      graceMs: 0,
      walkIn: false,
      playEnemyEntrances: false,
      boss: false,
      cue: '',
      meet: '',
    };
  }
  if (input.boss || copy.mode === 'boss') {
    const repeat = input.repeat;
    return {
      phases: repeat ? ['entrance', 'ready'] : ['pre', 'entrance', 'ready'],
      preMs: repeat ? 0 : 400,
      entranceMs: repeat ? 620 : 860,
      readyMs: repeat ? 180 : 240,
      graceMs: 0,
      walkIn: !input.observed && !repeat,
      playEnemyEntrances: true,
      boss: true,
      cue: repeat ? '' : copy.alert,
      meet,
    };
  }
  if (!input.repeat && input.encounterId === ENCOUNTER_ID.CH1_FOREST_SCOUTS) {
    return {
      phases: ['pre', 'entrance', 'ready'],
      preMs: 560,
      entranceMs: 680,
      readyMs: 220,
      graceMs: 720,
      walkIn: !input.observed,
      playEnemyEntrances: true,
      boss: false,
      cue: copy.alert,
      meet,
    };
  }
  if (input.repeat) {
    return {
      phases: ['entrance', 'ready'],
      preMs: 0,
      entranceMs: 320,
      readyMs: 180,
      graceMs: 0,
      walkIn: false,
      playEnemyEntrances: true,
      boss: false,
      cue: '',
      meet,
    };
  }
  return {
    phases: ['pre', 'entrance', 'ready'],
    preMs: 380,
    entranceMs: 420,
    readyMs: 200,
    graceMs: 0,
    walkIn: !input.observed,
    playEnemyEntrances: true,
    boss: false,
    cue: copy.alert,
    meet,
  };
}

export function encounterStartBudgetMs(plan: EncounterStartPlan): number {
  return plan.preMs + plan.entranceMs + plan.readyMs + plan.graceMs;
}

/** Delay before an enemy's first swing. 0 on repeats, training, and bosses. */
export function openingAttackDelayMs(input: {
  encounterId: string;
  repeat: boolean;
  training: boolean;
  boss: boolean;
  index: number;
  ranged: boolean;
}): number {
  if (input.training || input.boss || input.repeat) {
    return 0;
  }
  const scout = input.encounterId === ENCOUNTER_ID.CH1_FOREST_SCOUTS;
  const base = scout ? 780 : 240;
  const step = scout ? 460 : 200;
  const ranged = input.ranged ? (scout ? 1100 : 380) : 0;
  return base + input.index * step + ranged;
}
