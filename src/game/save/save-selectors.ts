import { getPlayerClass, isPlayerClassId } from '../player/classes';
import type { SaveData, SaveSlotSummary } from './save-types';
import { AUTO_SAVE_SLOT_ID, MANUAL_SAVE_SLOTS } from './save-types';

import { getLocationDefinition } from '../world/locations/location-definitions';

export function classLabel(classId: string): string {
  if (!isPlayerClassId(classId)) {
    return '방랑자';
  }
  return getPlayerClass(classId).name;
}

export function locationLabel(locationId: string): string {
  const definition = getLocationDefinition(locationId);
  if (definition) {
    return definition.name;
  }
  if (locationId === 'ash_inn') {
    return '잿빛 여관';
  }
  if (locationId === 'ash_town') {
    return '잿빛 마을';
  }
  return locationId;
}

export function formatPlayTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toSlotSummary(slotId: string, saveData: SaveData | null): SaveSlotSummary {
  if (!saveData) {
    return { slotId, empty: true };
  }
  const player = saveData.gameState.player;
  return {
    slotId,
    empty: false,
    characterName: player.name,
    classId: player.classId,
    classLabel: classLabel(player.classId),
    level: player.level,
    locationId: saveData.gameState.world.currentLocationId,
    locationLabel: locationLabel(saveData.gameState.world.currentLocationId),
    playTimeSeconds: saveData.playTimeSeconds,
    updatedAt: saveData.updatedAt,
  };
}

export function allSlotIds(): readonly string[] {
  return [...MANUAL_SAVE_SLOTS, AUTO_SAVE_SLOT_ID];
}
