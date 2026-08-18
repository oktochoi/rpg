import type { CommandDispatcher } from '@/game/core/command';
import type { SaveSlotId } from '@/game/core/ids';
import { AUTO_SAVE_SLOT_ID, MANUAL_SAVE_SLOTS } from '@/game/save/save-types';
import { formatPlayTime, formatSavedAt } from '@/game/save/save-selectors';
import type { SaveSlotSummary } from '@/game/save/save-types';
import styles from './menu.module.css';

interface MenuProps {
  dispatch: CommandDispatcher;
  slots: readonly SaveSlotSummary[];
  onClose: () => void;
}

function slotTitle(slotId: string): string {
  if (slotId === AUTO_SAVE_SLOT_ID) {
    return 'AUTO SAVE';
  }
  if (slotId === 'slot_1') {
    return 'SLOT 1';
  }
  if (slotId === 'slot_2') {
    return 'SLOT 2';
  }
  return 'SLOT 3';
}

export function Menu({ dispatch, slots, onClose }: MenuProps) {
  const slotMap = new Map(slots.map((slot) => [slot.slotId, slot]));

  function confirmLoad(slotId: SaveSlotId) {
    if (!window.confirm('현재 진행 상황은 저장하지 않으면 사라질 수 있습니다.\n\n불러오시겠습니까?')) {
      return;
    }
    dispatch({ type: 'LOAD_GAME', slotId });
    onClose();
  }

  function confirmDelete(slotId: SaveSlotId) {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }
    dispatch({ type: 'DELETE_SAVE', slotId });
  }

  return (
    <div className={styles.overlay}>
      <section className={styles.panel} aria-label="저장">
        <div className={styles.header}>
          <h2 className={styles.title}>SAVE</h2>
          <button className={styles.close} type="button" onClick={onClose}>
            닫기
          </button>
        </div>
        <ul className={styles.slots}>
          {MANUAL_SAVE_SLOTS.map((slotId) => {
            const slot = slotMap.get(slotId) ?? { slotId, empty: true };
            return (
              <li className={styles.slot} key={slotId}>
                <SlotBody slot={slot} title={slotTitle(slotId)} />
                <div className={styles.actions}>
                  <button className={styles.action} type="button" onClick={() => dispatch({ type: 'SAVE_GAME', slotId })}>
                    저장
                  </button>
                  <button
                    className={styles.action}
                    type="button"
                    disabled={slot.empty}
                    onClick={() => confirmLoad(slotId)}
                  >
                    불러오기
                  </button>
                  <button
                    className={styles.action}
                    type="button"
                    disabled={slot.empty}
                    onClick={() => confirmDelete(slotId)}
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
          <li className={styles.slot}>
            <SlotBody slot={slotMap.get(AUTO_SAVE_SLOT_ID) ?? { slotId: AUTO_SAVE_SLOT_ID, empty: true }} title="AUTO SAVE" />
            <div className={styles.actions}>
              <button
                className={styles.action}
                type="button"
                disabled={slotMap.get(AUTO_SAVE_SLOT_ID)?.empty !== false}
                onClick={() => confirmLoad(AUTO_SAVE_SLOT_ID)}
              >
                불러오기
              </button>
              <button
                className={styles.action}
                type="button"
                disabled={slotMap.get(AUTO_SAVE_SLOT_ID)?.empty !== false}
                onClick={() => confirmDelete(AUTO_SAVE_SLOT_ID)}
              >
                삭제
              </button>
            </div>
          </li>
        </ul>
        <button className={styles.newGame} type="button" onClick={() => dispatch({ type: 'NEW_GAME' })}>
          New Game
        </button>
      </section>
    </div>
  );
}

function SlotBody({ slot, title }: { slot: SaveSlotSummary; title: string }) {
  if (slot.empty) {
    return (
      <div>
        <p className={styles.slotTitle}>{title}</p>
        <p className={styles.empty}>Empty</p>
      </div>
    );
  }
  return (
    <div>
      <p className={styles.slotTitle}>{title}</p>
      <p className={styles.meta}>
        {slot.characterName} · {slot.classLabel}
      </p>
      <p className={styles.meta}>{slot.locationLabel}</p>
      <p className={styles.meta}>{formatPlayTime(slot.playTimeSeconds ?? 0)}</p>
      <p className={styles.meta}>Last Save: {slot.updatedAt ? formatSavedAt(slot.updatedAt) : '-'}</p>
    </div>
  );
}
