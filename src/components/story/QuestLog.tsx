import type { GameState } from '@/game/core/game-state';
import { getQuestDefinition } from '@/game/quests/quest-definitions';
import { currentObjective, statusLabel } from '@/game/quests/quest-selectors';
import { QUEST_STATUS } from '@/game/quests/quest-types';
import styles from './StoryScreen.module.css';

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
  const visible = [...main, ...side];

  return (
    <div className={styles.overlay}>
      <section className={styles.placeholder} aria-label="퀘스트">
        <h2>퀘스트</h2>
        {visible.length === 0 ? <p>진행 중인 퀘스트가 없습니다.</p> : null}
        {main.length > 0 ? <p>MAIN QUEST</p> : null}
        {main.map((quest) => (
          <QuestBlock key={quest.id} questId={quest.id} state={state} />
        ))}
        {side.length > 0 ? <p>SIDE / ADVANCEMENT</p> : null}
        {side.map((quest) => (
          <QuestBlock key={quest.id} questId={quest.id} state={state} />
        ))}
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </section>
    </div>
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
    <div>
      <p>
        {definition.title} · {statusLabel(quest.status)}
      </p>
      {current ? <p>현재 목표: {current.description}</p> : null}
      {definition.reward ? (
        <p>
          보상: {definition.reward.exp ? `+${definition.reward.exp} EXP` : ''}
          {definition.reward.gold ? ` +${definition.reward.gold} G` : ''}
        </p>
      ) : null}
      {completed.length > 0 ? (
        <ul>
          {completed.map((objective) => (
            <li key={objective.id}>✓ {objective.description}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
