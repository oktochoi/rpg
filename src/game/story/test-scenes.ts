import type { Choice } from './choice';
import type { SceneId } from '../core/ids';
import {
  CHOICE_ASK_EVENT,
  CHOICE_ASK_GOBLIN,
  CHOICE_ASK_IDENTITY,
  CHOICE_ASK_RUINS,
} from '../npc/talk-choices';

export const TEST_GOBLIN_COMBAT_ID = 'combat_goblin_ruins_01';
export const TEST_GOBLIN_ENEMY_ID = 'goblin_01';
export const TEST_GOBLIN_ARENA_ID = 'ruins_entrance';

export const SCENE_GOBLIN_INTRO = 'seria_goblin_intro';
export const SCENE_GOBLIN_VICTORY = 'seria_goblin_victory';
export const SCENE_GOBLIN_DEFEAT = 'seria_goblin_defeat';
export const SCENE_SERIA_RETURN = 'seria_return';
export const SCENE_RUINS_SEARCH = 'ruins_search';
export const SCENE_REST = 'ruins_rest';
export const SCENE_SERIA_RUINS_REPORT = 'seria_ruins_report';
export const SCENE_LUEN_VILLAGE = 'luen_village_intro';

export const CHOICE_FIGHT_GOBLIN = 'fight_goblin';
export const CHOICE_FLEE_GOBLIN = 'flee_goblin';
export const CHOICE_WATCH_GOBLIN = 'watch_goblin';
export const CHOICE_RETURN_TO_SERIA = 'return_to_seria';
export const CHOICE_SEARCH_AREA = 'search_area';
export const CHOICE_REST = 'rest_awhile';

export interface StorySceneContent {
  sceneId: SceneId;
  npcName: string;
  npcDialogue: string;
  narration: string;
  choices: readonly [Choice, Choice, Choice];
}

const INTRO_CHOICES: readonly [Choice, Choice, Choice] = [
  { id: CHOICE_FIGHT_GOBLIN, label: '고블린과 싸운다' },
  { id: CHOICE_ASK_RUINS, label: '폐허에 대해 묻는다' },
  { id: CHOICE_ASK_IDENTITY, label: '당신에 대해 묻는다' },
];

const AFTERMATH_CHOICES: readonly [Choice, Choice, Choice] = [
  { id: CHOICE_ASK_GOBLIN, label: '고블린 일을 묻는다' },
  { id: CHOICE_ASK_EVENT, label: '최근 사건을 묻는다' },
  { id: CHOICE_REST, label: '잠시 쉰다' },
];

export const STORY_SCENES: Readonly<Record<string, StorySceneContent>> = {
  [SCENE_LUEN_VILLAGE]: {
    sceneId: SCENE_LUEN_VILLAGE,
    npcName: '세리아',
    npcDialogue: '루엔 마을에 온 건가. 요즘 폐허 쪽이 심상치 않아.',
    narration: '낮은 지붕과 흙길이 이어진 작은 마을이다. 사람들이 오가며 오늘의 소문을 나눈다.',
    choices: INTRO_CHOICES,
  },
  [SCENE_GOBLIN_INTRO]: {
    sceneId: SCENE_GOBLIN_INTRO,
    npcName: '세리아',
    npcDialogue: '석문 앞에 고블린이 서 있어. 놈들 눈이 폐허 안쪽을 보고 있어.',
    narration: '허물어진 석문 앞에 고블린 한 마리가 서 있다.',
    choices: INTRO_CHOICES,
  },
  [SCENE_GOBLIN_VICTORY]: {
    sceneId: SCENE_GOBLIN_VICTORY,
    npcName: '세리아',
    npcDialogue: '고블린을 쓰러뜨렸다. 폐허 입구가 다시 조용해졌어.',
    narration: '고블린은 쓰러졌다. 폐허 입구가 다시 조용해졌다.',
    choices: AFTERMATH_CHOICES,
  },
  [SCENE_GOBLIN_DEFEAT]: {
    sceneId: SCENE_GOBLIN_DEFEAT,
    npcName: '세리아',
    npcDialogue: '무리하지 마. 일단 여기서 빠져나오자.',
    narration: '전투에서 밀려났다. 세리아가 당신을 폐허 입구 밖으로 끌어낸다.',
    choices: AFTERMATH_CHOICES,
  },
  [SCENE_SERIA_RETURN]: {
    sceneId: SCENE_SERIA_RETURN,
    npcName: '세리아',
    npcDialogue: '우선 숨을 고르자. 폐허는 없어지지 않으니까.',
    narration: '세리아와 함께 석문에서 조금 물러선다. 바람만 남아 있다.',
    choices: AFTERMATH_CHOICES,
  },
  [SCENE_RUINS_SEARCH]: {
    sceneId: SCENE_RUINS_SEARCH,
    npcName: '세리아',
    npcDialogue: '발자국은 여기까지야. 지금은 더 깊이 들어가지 말자.',
    narration: '주변을 살피면 끊어진 발자국과 낡은 창 자루만 보인다.',
    choices: AFTERMATH_CHOICES,
  },
  [SCENE_REST]: {
    sceneId: SCENE_REST,
    npcName: '세리아',
    npcDialogue: '조금 괜찮아 보이네. 준비되면 다시 움직이자.',
    narration: '잠시 앉아 숨을 고른다. 상처가 한결 가라앉는다.',
    choices: AFTERMATH_CHOICES,
  },
  [SCENE_SERIA_RUINS_REPORT]: {
    sceneId: SCENE_SERIA_RUINS_REPORT,
    npcName: '세리아',
    npcDialogue: '돌아왔군. 폐허에서 뭘 발견했지?',
    narration: '세리아가 폐허 조사 결과를 기다린다. 왕실 문장의 마법석이 아직 그녀의 손 밖에 있다.',
    choices: AFTERMATH_CHOICES,
  },
};

export function getStoryScene(sceneId: SceneId): StorySceneContent {
  return (
    STORY_SCENES[sceneId] ?? {
      sceneId,
      npcName: '',
      npcDialogue: '',
      narration: '',
      choices: INTRO_CHOICES,
    }
  );
}
