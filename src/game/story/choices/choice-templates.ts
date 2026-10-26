import { RUINS_GUARDIAN_FACT_ID } from '../../world/locations/location-definitions';
import { RUINS_SEAL_FACT_ID } from '../../quests/quest-definitions';
import { withEuro } from '../../text/korean-josa';

export const CHOICE_TEXT = {
  lookAround: '주변을 살핀다.',
  wait: '잠시 상황을 지켜본다.',
  returnPrevious: '이전 장소로 돌아간다.',
  talkNpc: '{npcName}에게 말을 건다.',
  askTopic: '{npcName}에게 {topic}에 대해 묻는다.',
  investigate: '{targetName}을 자세히 조사한다.',
  fight: '{enemyName}에게 맞선다.',
  shareFact: '{npcName}에게 {factTopic}에 대해 이야기한다.',
  highTrust: '{npcName}에게 자신의 의심을 솔직하게 털어놓는다.',
  stepBackFear: '더 압박하지 않고 한발 물러선다.',
  recallSaved: '폐허에서 있었던 일을 다시 꺼낸다.',
  classWarrior: '무너진 돌벽을 힘으로 밀어본다.',
  classMage: '마력의 흐름을 읽어 주변을 분석한다.',
  classRogue: '숨겨진 틈과 장치를 찾아본다.',
} as const;

const PLAYER_FACT_TOPICS: Readonly<Record<string, string>> = {
  [RUINS_SEAL_FACT_ID]: '왕실 문장이 새겨진 마법석',
  [RUINS_GUARDIAN_FACT_ID]: '고대 수호자',
};

const LEAK_TERMS = ['암살', '암살자', 'assassin', 'assassination'] as const;

export function moveTowardLabel(locationName: string): string {
  return `${withEuro(locationName)} 향한다.`;
}

export function fillTemplate(template: string, vars: Readonly<Record<string, string>>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => vars[key] ?? '');
}

export function playerFacingFactTopic(factId: string, fallback = '발견한 단서'): string {
  return PLAYER_FACT_TOPICS[factId] ?? fallback;
}

export function containsLeakedSecret(text: string): boolean {
  const lower = text.toLowerCase();
  return LEAK_TERMS.some((term) => lower.includes(term.toLowerCase()));
}

export function sanitizeChoiceText(text: string): string {
  if (!containsLeakedSecret(text)) {
    return text;
  }
  return text.replace(/암살자?/g, '사건').replace(/assassin(ation)?/gi, '사건');
}
