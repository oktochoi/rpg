import type { GameState } from '@/game/core/game-state';
import { doesPlayerKnowFact } from '@/game/knowledge/knowledge-selectors';
import { getQuestDefinition, RUINS_SEAL_FACT_ID } from '@/game/quests/quest-definitions';
import { currentObjective, statusLabel } from '@/game/quests/quest-selectors';
import { QUEST_STATUS } from '@/game/quests/quest-types';
import { chapterProgress, currentChapterId, getChapterDefinition } from '@/game/story/chapters';
import { getMainObjectiveText } from '@/game/story/chapters/main-objective';
import { GameModal } from '@/components/ui/GameModal';
import styles from './QuestLog.module.css';

interface QuestLogProps {
  state: GameState;
  onClose: () => void;
}

function isMainQuest(questId: string): boolean {
  const definition = getQuestDefinition(questId);
  return definition?.category !== 'SIDE';
}

export function QuestLog({ state, onClose }: QuestLogProps) {
  const quests = Object.values(state.quests).filter((quest) => quest.status !== QUEST_STATUS.LOCKED);
  const main = quests.filter((quest) => isMainQuest(quest.id));
  const side = quests.filter((quest) => !isMainQuest(quest.id));
  const progress = chapterProgress(state);
  const chapter = getChapterDefinition(currentChapterId(state));
  const task = getMainObjectiveText(state);
  const chapterQuestId = chapter?.mainQuestIds[0];
  const chapterQuest = chapterQuestId ? state.quests[chapterQuestId] : undefined;
  const chapterStillLocked = !chapterQuest || chapterQuest.status === QUEST_STATUS.LOCKED;
  const knowsSeal = doesPlayerKnowFact(state, RUINS_SEAL_FACT_ID);

  return (
    <GameModal title="퀘스트" kicker="의뢰" size="md" onClose={onClose}>
      <p className={styles.section}>
        {chapter?.title ?? '이번 장'}
        {progress.total > 0 ? ` · ${progress.completed} / ${progress.total}` : ''}
      </p>
      <p className={styles.objective}>지금 보이는 것: {task}</p>
      {knowsSeal ? <p className={styles.objective}>알아낸 것: 왕실 문장의 봉인. 누군가 먼저 손을 댔다.</p> : null}
      {main.length > 0 ? <p className={styles.section}>메인</p> : null}
      {main.map((quest) => (
        <QuestBlock key={quest.id} questId={quest.id} state={state} />
      ))}
      {side.length > 0 ? <p className={styles.section}>사이드</p> : null}
      {side.map((quest) => (
        <QuestBlock key={quest.id} questId={quest.id} state={state} />
      ))}
      {chapterStillLocked ? <p className={styles.empty}>다음 의뢰는 아직 열리지 않았습니다.</p> : null}
    </GameModal>
  );
}

function QuestBlock({ questId, state }: { questId: string; state: GameState }) {
  const quest = state.quests[questId];
  const definition = getQuestDefinition(questId);
  if (!quest || !definition) {
    return null;
  }
  const current = currentObjective(quest, definition.objectives);
  const completed = definition.objectives.filter((item) => quest.objectiveProgress[item.id]?.completed);
  return (
    <article className={styles.block}>
      <h3 className={styles.name}>
        {definition.title} · {statusLabel(quest.status)}
      </h3>
      <p className={styles.summary}>{definition.description}</p>
      {quest.status === QUEST_STATUS.ACTIVE && current ? (
        <p className={styles.objective}>현재 목표: {current.description}</p>
      ) : null}
      {definition.reward ? (
        <p className={styles.status}>
          보상
          {definition.reward.exp ? ` +${definition.reward.exp} 경험치` : ''}
          {definition.reward.gold ? ` +${definition.reward.gold} G` : ''}
        </p>
      ) : null}
      {completed.length > 0 ? (
        <ul className={styles.done}>
          {completed.map((objective) => (
            <li key={objective.id}>✓ {objective.description}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
