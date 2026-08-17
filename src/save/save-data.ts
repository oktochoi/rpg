import type { SaveSlotId } from '../game/core/ids';
import type { GameState } from '../game/core/game-state';

export interface SaveData {
  version: number;
  savedAt: string;
  gameState: GameState;
}

export interface SaveRepository {
  save(slotId: SaveSlotId, data: SaveData): void;
  load(slotId: SaveSlotId): SaveData | null;
}
