import type { GameState } from '../../core/game-state';
import { getQuestDefinition, QUEST_ID } from '../../quests/quest-definitions';
import { currentObjective, featuredQuest } from '../../quests/quest-selectors';
import { QUEST_STATUS } from '../../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../../world/locations/location-definitions';
import { worldFlag } from '../../world/locations/location-selectors';
import { CHAPTER_ID } from './chapter-types';
import { currentChapterId, isChapterCompleted } from './chapter-rules';
import { getChapterDefinition } from './chapter-definitions';
import { canChooseFirstAdvancement, isAdventurer } from '../../player/classes/first-advancement';

export function getMainObjectiveText(state: Readonly<GameState>): string {
  if (canChooseFirstAdvancement(state) || (isAdventurer(state.player.classId) && worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE) && !worldFlag(state, WORLD_FLAG.FIRST_ADVANCEMENT_DONE))) {
    if ((state.player.level ?? 1) < 5) {
      return '경험을 더 쌓은 뒤 길드로 돌아가세요.';
    }
    return '모험가 길드에서 첫 번째 직업을 선택하세요.';
  }

  const chapterId = currentChapterId(state);
  if (chapterId === CHAPTER_ID.CHAPTER_1_LUEN_RUINS && !isChapterCompleted(state, CHAPTER_ID.CHAPTER_1_LUEN_RUINS)) {
    const forest = state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR];
    const ruins = state.quests[QUEST_ID.RUINS_MYSTERY];
    if (!worldFlag(state, WORLD_FLAG.GUILD_REGISTERED)) {
      return '루엔 모험가 길드에서 등록하세요.';
    }
    if (forest?.status === QUEST_STATUS.AVAILABLE) {
      return '길드에서 첫 의뢰를 맡으세요.';
    }
    if (forest?.status === QUEST_STATUS.ACTIVE) {
      const definition = getQuestDefinition(forest.id);
      const current = definition ? currentObjective(forest, definition.objectives) : undefined;
      if (current?.id === 'win_scouts') {
        return '숲길의 고블린을 처리하세요.';
      }
      if (current?.id === 'report_doran') {
        return '길드로 돌아가 보상을 받으세요.';
      }
      return current?.description ?? '첫 의뢰를 마치세요.';
    }
    if (forest?.status === QUEST_STATUS.COMPLETED && (!ruins || ruins.status === QUEST_STATUS.LOCKED)) {
      return '장비를 정비하세요. 광장 옆 잡화점을 이용할 수 있습니다.';
    }
    if (ruins?.status === QUEST_STATUS.LOCKED || !ruins) {
      if (worldFlag(state, WORLD_FLAG.SHOP_UNLOCKED) && state.world.currentLocationId === LOCATION_ID.LUEN_VILLAGE) {
        return '세리아를 만나거나 장비를 정비하세요.';
      }
      return '세리아를 만나세요.';
    }
    if (ruins.status === QUEST_STATUS.AVAILABLE) {
      return '세리아의 폐허 조사 의뢰를 맡으세요.';
    }
    if (ruins.status === QUEST_STATUS.ACTIVE) {
      const definition = getQuestDefinition(ruins.id);
      const current = definition ? currentObjective(ruins, definition.objectives) : undefined;
      if (current?.id === 'visit_ruins') {
        return '고대 폐허를 조사하세요.';
      }
      if (current?.id === 'win_mixed') {
        return '폐허 입구의 적을 물리치세요.';
      }
      if (current?.id === 'investigate_ruins') {
        return '제단을 조사하세요.';
      }
      if (current?.id === 'report_seria') {
        return '세리아에게 보고하세요.';
      }
      if (current) {
        return current.description;
      }
      if (!worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) && worldFlag(state, WORLD_FLAG.ROYAL_STONE_DISCOVERED)) {
        return '깨어난 수호자를 상대하세요.';
      }
    }
    if (ruins.status === QUEST_STATUS.COMPLETED && !worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED)) {
      return '고대 폐허의 수호자를 물리치세요.';
    }
    if (worldFlag(state, WORLD_FLAG.RUINS_GUARDIAN_DEFEATED) && !worldFlag(state, WORLD_FLAG.POST_GUARDIAN_INVESTIGATED)) {
      return '제단을 조사하세요.';
    }
    if (worldFlag(state, WORLD_FLAG.POST_GUARDIAN_INVESTIGATED) && !worldFlag(state, WORLD_FLAG.RUINS_ESCAPED)) {
      return '폐허를 빠져나가세요.';
    }
    if (worldFlag(state, WORLD_FLAG.RUINS_ESCAPED) && !worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN)) {
      return '루엔으로 돌아가세요.';
    }
    if (worldFlag(state, WORLD_FLAG.RETURNED_TO_LUEN) && !worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT)) {
      return '세리아에게 보고하세요.';
    }
    if (worldFlag(state, WORLD_FLAG.SERIA_FINAL_REPORT) && !worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE)) {
      return '레온과 이야기하세요.';
    }
    if (worldFlag(state, WORLD_FLAG.LEON_CONFRONTATION_DONE) && !worldFlag(state, WORLD_FLAG.EPILOGUE_REST_DONE)) {
      return '푸른 달 여관에서 휴식하세요.';
    }
    if (worldFlag(state, WORLD_FLAG.EPILOGUE_REST_DONE) && !worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE)) {
      return '길드로 가서 공적을 인정받으세요.';
    }
    if (worldFlag(state, WORLD_FLAG.GUILD_RECOGNITION_DONE) && !worldFlag(state, WORLD_FLAG.NORTHERN_GATE_HOOK_SEEN)) {
      return '북문으로 향하세요.';
    }
  }

  if (isChapterCompleted(state, CHAPTER_ID.CHAPTER_1_LUEN_RUINS) || chapterId === CHAPTER_ID.CHAPTER_2_NORTHERN_SHADOW) {
    if (state.world.currentLocationId !== LOCATION_ID.NORTHERN_GATE) {
      return '북문으로 향하세요.';
    }
    return '레온에게 북문 너머의 소문을 들으세요.';
  }

  const featured = featuredQuest(state);
  const definition = featured ? getQuestDefinition(featured.id) : null;
  const current = featured && definition ? currentObjective(featured, definition.objectives) : undefined;
  if (current) {
    return current.description;
  }
  const chapter = getChapterDefinition(chapterId);
  return chapter?.description ?? '주변을 둘러보세요.';
}
