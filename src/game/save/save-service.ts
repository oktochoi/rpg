import type { GameState } from '../core/game-state';
import type { SaveSlotId } from '../core/ids';
import { migrateSaveData } from './save-migration';
import { toPersistedGameState } from './save-serialize';
import { allSlotIds, toSlotSummary } from './save-selectors';
import {
  AUTO_SAVE_SLOT_ID,
  SAVE_VERSION,
  canSaveGame,
  saveBlockedReason,
  storageKeyForSlot,
  type LoadResult,
  type SaveData,
  type SaveResult,
  type SaveService,
  type SaveSlotSummary,
  type SaveStorage,
} from './save-types';

export function createMemoryStorage(initial?: Record<string, string>): SaveStorage {
  const data = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

export function createBrowserStorage(): SaveStorage {
  return {
    getItem(key) {
      const storage = browserLocalStorage();
      if (!storage) {
        return null;
      }
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      const storage = browserLocalStorage();
      if (!storage) {
        throw new Error('저장에 실패했습니다.');
      }
      storage.setItem(key, value);
    },
    removeItem(key) {
      const storage = browserLocalStorage();
      if (!storage) {
        return;
      }
      try {
        storage.removeItem(key);
      } catch {
        return;
      }
    },
  };
}

function browserLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createSaveService(storage: SaveStorage, now: () => string = () => new Date().toISOString()): SaveService {
  return {
    save(slotId, gameState, playTimeSeconds) {
      const blocked = saveBlockedReason(gameState);
      if (blocked) {
        return { success: false, error: blocked };
      }
      if (!canSaveGame(gameState)) {
        return { success: false, error: '지금은 저장할 수 없습니다.' };
      }
      try {
        const existing = readSave(storage, slotId);
        const timestamp = now();
        const saveData: SaveData = {
          version: SAVE_VERSION,
          saveId: slotId,
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
          playTimeSeconds,
          gameState: toPersistedGameState(gameState, playTimeSeconds),
        };
        storage.setItem(storageKeyForSlot(slotId), JSON.stringify(saveData));
        return { success: true };
      } catch {
        return { success: false, error: '저장에 실패했습니다.' };
      }
    },
    load(slotId) {
      const raw = storage.getItem(storageKeyForSlot(slotId));
      if (!raw) {
        return { success: false, error: '저장 데이터가 없습니다.' };
      }
      try {
        const parsed: unknown = JSON.parse(raw);
        const migrated = migrateSaveData(parsed);
        if (!migrated) {
          return { success: false, error: '해당 저장 파일을 불러올 수 없습니다.' };
        }
        return { success: true, saveData: migrated };
      } catch {
        return { success: false, error: '해당 저장 파일을 불러올 수 없습니다.' };
      }
    },
    delete(slotId) {
      try {
        storage.removeItem(storageKeyForSlot(slotId));
        return { success: true };
      } catch {
        return { success: false, error: '저장에 실패했습니다.' };
      }
    },
    listSlots() {
      return allSlotIds().map((slotId) => toSlotSummary(slotId, readSave(storage, slotId)));
    },
  };
}

export function createLocalSaveService(): SaveService {
  return createSaveService(createBrowserStorage());
}

function readSave(storage: SaveStorage, slotId: SaveSlotId): SaveData | null {
  const raw = storage.getItem(storageKeyForSlot(slotId));
  if (!raw) {
    return null;
  }
  try {
    return migrateSaveData(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function shouldAutosave(events: readonly { type: string; status?: string }[]): boolean {
  return events.some(
    (event) =>
      event.type === 'COMBAT_WON' ||
      event.type === 'QUEST_COMPLETED' ||
      (event.type === 'QUEST_UPDATED' && (event.status === 'completed' || event.status === 'COMPLETED'))
  );
}

export { AUTO_SAVE_SLOT_ID };
