import type { NpcProfile } from './npc-profile';

export const SERIA_PROFILE: NpcProfile = {
  id: 'seria',
  name: '세리아',
  role: '마법사',
  personality: ['냉정함', '지적', '호기심 많음', '쉽게 사람을 믿지 않음'],
  speakingStyle: '짧고 차분함. 감정을 크게 드러내지 않음.',
  values: ['지식', '자유', '마법 연구'],
  currentGoal: '고대 폐허 조사',
};

export const LEON_PROFILE: NpcProfile = {
  id: 'leon',
  name: '레온',
  role: '기사',
  personality: ['원칙적', '명예 중시', '책임감 강함', '의심이 많음'],
  speakingStyle: '격식 있고 단정함.',
  values: ['왕국', '질서', '명예'],
  currentGoal: '지역 치안 유지',
};

export const INNKEEPER_PROFILE: NpcProfile = {
  id: 'innkeeper',
  name: '마르타',
  role: '여관주인',
  personality: ['친절함', '수다스러움', '현실적', '소문에 관심이 많음'],
  speakingStyle: '편안하고 친근함.',
  values: ['가족', '돈', '안전'],
  currentGoal: '여관 운영',
};

export const DORAN_PROFILE: NpcProfile = {
  id: 'guildmaster_doran',
  name: '도란',
  role: '모험가 길드 책임자',
  personality: ['침착함', '현실적', '경험이 많음', '신입에게 엄격하지만 공정함'],
  speakingStyle: '짧고 단정함. 허세를 싫어한다.',
  values: ['책임', '훈련', '마을의 안전'],
  currentGoal: '루엔 주변의 위험을 관리하고 모험가를 육성한다.',
};

export const ELIN_PROFILE: NpcProfile = {
  id: 'shopkeeper_elin',
  name: '엘린',
  role: '잡화점 주인',
  personality: ['현실적', '밝음', '흥정에 단호함'],
  speakingStyle: '짧고 명랑하지만 값은 깎아 주지 않는다.',
  values: ['정직한 거래', '마을의 일상'],
  currentGoal:
    '물건을 팔고 산다. 가격은 고정이다. 회복 물약 20G, 마나 물약 25G, 철제 검 100G, 초급 마법 지팡이 100G, 강철 단검 100G, 가죽 갑옷 80G, 간단한 반지 60G. 가격을 바꾸거나 없는 물건을 만들어 주지 않는다.',
};

export const NPC_PROFILES: Readonly<Record<string, NpcProfile>> = {
  seria: SERIA_PROFILE,
  leon: LEON_PROFILE,
  innkeeper: INNKEEPER_PROFILE,
  guildmaster_doran: DORAN_PROFILE,
  shopkeeper_elin: ELIN_PROFILE,
};

export function getNpcProfile(npcId: string): NpcProfile | null {
  return NPC_PROFILES[npcId] ?? null;
}
