import { EventBus } from '../../EventBus';
import { COMBAT_HUD_EVENT, type CombatHudState } from './combat-hud-types';

let lastKey = '';
let lastPublishAt = 0;

export function publishCombatHud(snapshot: CombatHudState | null): void {
  if (snapshot === null) {
    lastKey = '';
    EventBus.emit(COMBAT_HUD_EVENT, null);
    return;
  }
  const key = hudKey(snapshot);
  const now = performance.now();
  if (key === lastKey && now - lastPublishAt < 100) {
    return;
  }
  lastKey = key;
  lastPublishAt = now;
  EventBus.emit(COMBAT_HUD_EVENT, snapshot);
}

export function subscribeCombatHud(handler: (snapshot: CombatHudState | null) => void): () => void {
  EventBus.on(COMBAT_HUD_EVENT, handler);
  return () => {
    EventBus.off(COMBAT_HUD_EVENT, handler);
  };
}

function hudKey(snapshot: CombatHudState): string {
  const skills = snapshot.player.skills
    .map((slot) => `${slot.slot}:${Math.ceil(slot.currentCooldown / 100)}:${slot.available ? 1 : 0}`)
    .join(',');
  const boss = snapshot.boss
    ? `${Math.round(snapshot.boss.hp)}:${snapshot.boss.phase}`
    : 'none';
  return [
    snapshot.status,
    snapshot.player.classId,
    Math.round(snapshot.player.hp),
    Math.round(snapshot.player.mp),
    Math.ceil(snapshot.player.dashCooldown / 100),
    skills,
    boss,
  ].join('|');
}
