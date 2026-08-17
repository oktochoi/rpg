import type { StoryScreenView } from './types';

export const STORY_SCREEN_PLACEHOLDER: StoryScreenView = {
  title: '잿빛 연대기',
  locationName: '잿빛 여관',
  day: 3,
  player: {
    name: '방랑자',
    job: '방랑자',
    level: 1,
    hp: 42,
    maxHp: 42,
    mp: 18,
    maxMp: 18,
    stats: [
      { label: '힘', value: 8 },
      { label: '민첩', value: 12 },
      { label: '지력', value: 10 },
      { label: '매력', value: 11 },
    ],
  },
  story: {
    npcName: '여관 주인 마라',
    npcDialogue:
      '이런 밤에 문을 두드리는 이는 드물어요. 비도 거세고, 숲길에 발자국이 늘어난 뒤로는 손님을 가려 받는 편이지요. 우선 벽난로 곁에 앉아요. 이름은… 나중에 들어도 됩니다.',
    situation:
      '빗소리가 여관 홀을 채운다. 벽난로는 약하게 타오르고, 낡은 간판의 글자는 그을음에 가려 거의 보이지 않는다. 카운터 너머로 마라가 잔을 닦으며 당신을 살핀다.',
  },
  quest: {
    title: '여관의 소문',
    status: '진행 중',
    summary: '잿빛 여관에서 들리는 밤길의 소문을 듣는다.',
  },
  relations: [
    { npcName: '마라', relation: '호의' },
    { npcName: '경비병 칼', relation: '중립' },
    { npcName: '행상 소렌', relation: '미지' },
  ],
  choices: [
    { id: 'choice-1', label: '여관의 빈방을 부탁한다' },
    { id: 'choice-2', label: '밤길에 대한 소문을 묻는다' },
    { id: 'choice-3', label: '조용히 홀을 둘러본다' },
  ],
};
