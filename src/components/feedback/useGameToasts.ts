import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { audioManager, SFX_ID } from '@/game/audio';
import type { GameState } from '@/game/core/game-state';
import { getQuestDefinition, RUINS_SEAL_FACT_ID } from '@/game/quests/quest-definitions';
import { RUINS_GUARDIAN_FACT_ID } from '@/game/world/locations/location-definitions';
import { getChapterDefinition } from '@/game/story/chapters';
import { getMainObjectiveText } from '@/game/story/chapters/main-objective';
import type { GameToastItem } from './GameToast';

const TOAST_MS = 1800;

function importantFactLabel(factId: string): string | null {
  if (factId === RUINS_SEAL_FACT_ID) {
    return '왕실 문장이 새겨진 마법석';
  }
  if (factId === RUINS_GUARDIAN_FACT_ID) {
    return '고대 수호자가 깨어났다';
  }
  return null;
}

function completedObjectives(state: GameState): string[] {
  const keys: string[] = [];
  for (const quest of Object.values(state.quests)) {
    const definition = getQuestDefinition(quest.id);
    for (const [objectiveId, progress] of Object.entries(quest.objectiveProgress)) {
      if (!progress?.completed) {
        continue;
      }
      const objective = definition?.objectives.find((item) => item.id === objectiveId);
      keys.push(`${quest.id}:${objectiveId}:${objective?.description ?? objectiveId}`);
    }
  }
  return keys;
}

function pushToast(setItems: Dispatch<SetStateAction<GameToastItem[]>>, item: GameToastItem) {
  setItems((current) => [...current, item]);
  window.setTimeout(() => {
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }, TOAST_MS);
}

export function useGameToasts(state: GameState): GameToastItem[] {
  const [items, setItems] = useState<GameToastItem[]>([]);
  const questsRef = useRef<string[]>([]);
  const factsRef = useRef<readonly string[]>(state.knowledge.knownFactIds);
  const levelRef = useRef(state.player.level ?? 1);
  const dayRef = useRef(state.world.day ?? 1);
  const chapterRef = useRef((state.story.completedChapterIds ?? []).join(','));
  const objectiveRef = useRef(getMainObjectiveText(state));
  const turnRewardRef = useRef(state.lastTurnSummary?.sourceActionId ?? null);
  const economyRef = useRef(state.lastEconomyNotice?.id ?? null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current) {
      questsRef.current = completedObjectives(state);
      factsRef.current = state.knowledge.knownFactIds;
      levelRef.current = state.player.level ?? 1;
      dayRef.current = state.world.day ?? 1;
      chapterRef.current = (state.story.completedChapterIds ?? []).join(',');
      objectiveRef.current = getMainObjectiveText(state);
      turnRewardRef.current = state.lastTurnSummary?.sourceActionId ?? null;
      readyRef.current = true;
      return;
    }

    const nextQuests = completedObjectives(state);
    const addedQuests = nextQuests.filter((key) => !questsRef.current.includes(key));
    questsRef.current = nextQuests;
    for (const key of addedQuests) {
      const description = key.split(':').slice(2).join(':');
      audioManager.playSfx(SFX_ID.QUEST_UPDATE);
      pushToast(setItems, {
        id: `quest-${key}-${state.world.turn}`,
        title: 'OBJECTIVE COMPLETE',
        detail: description,
      });
    }

    const addedFacts = state.knowledge.knownFactIds.filter((factId) => !factsRef.current.includes(factId));
    factsRef.current = state.knowledge.knownFactIds;
    for (const factId of addedFacts) {
      const label = importantFactLabel(factId);
      if (!label) {
        continue;
      }
      audioManager.playSfx(SFX_ID.IMPORTANT_DISCOVERY);
      pushToast(setItems, { id: `fact-${factId}-${state.world.turn}`, title: '새로운 정보', detail: label });
    }

    const level = state.player.level ?? 1;
    if (level > levelRef.current) {
      pushToast(setItems, {
        id: `level-${level}-${state.world.turn}`,
        title: 'LEVEL UP!',
        detail: `Lv.${level} · 능력치 포인트 +1`,
      });
    }
    levelRef.current = level;

    const day = state.world.day ?? 1;
    if (day > dayRef.current) {
      const hour = Math.floor(((state.world.totalMinutes ?? 0) % 1440) / 60);
      const minute = (state.world.totalMinutes ?? 0) % 60;
      const morning = hour === 8 && minute === 0;
      pushToast(setItems, {
        id: `day-${day}`,
        title: morning ? '다음 날 아침' : `DAY ${day}`,
        detail: morning ? `DAY ${day} · 08:00` : `DAY ${day}`,
      });
    }
    dayRef.current = day;

    const chapters = (state.story.completedChapterIds ?? []).join(',');
    if (chapters !== chapterRef.current) {
      const latest = (state.story.completedChapterIds ?? []).at(-1);
      const title = getChapterDefinition(latest)?.title ?? 'CHAPTER COMPLETE';
      pushToast(setItems, {
        id: `chapter-${latest ?? chapters}`,
        title: 'CHAPTER COMPLETE',
        detail: title,
      });
    }
    chapterRef.current = chapters;

    const objective = getMainObjectiveText(state);
    if (objective !== objectiveRef.current && addedQuests.length > 0) {
      pushToast(setItems, {
        id: `objective-${state.world.turn}`,
        title: '새 목표',
        detail: objective,
      });
    }
    objectiveRef.current = objective;

    const notice = state.lastEconomyNotice;
    if (notice && notice.id !== economyRef.current) {
      economyRef.current = notice.id;
      pushToast(setItems, { id: notice.id, title: notice.title, detail: notice.detail });
    }

    const summary = state.lastTurnSummary;
    if (summary && summary.sourceActionId !== turnRewardRef.current) {
      turnRewardRef.current = summary.sourceActionId;
      const parts: string[] = [];
      if (summary.minutes > 0) {
        parts.push(`${summary.minutes}분 경과`);
      }
      if (summary.exp > 0) {
        parts.push(`+${summary.exp} EXP`);
      }
      if (parts.length > 0) {
        pushToast(setItems, {
          id: `turn-${summary.sourceActionId}`,
          title: parts[0] ?? '',
          detail: parts.slice(1).join(' · ') || undefined,
        });
      }
    }
  }, [state]);

  return items;
}
