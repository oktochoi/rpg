import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import { getItemDefinition } from './item-definitions';
import { derivedPlayerStats } from './derived-stats';
import { playerHasItem } from '../player/player-state';

export function eventsForUseItem(state: Readonly<GameState>, itemId: string): GameEvent[] {
  const definition = getItemDefinition(itemId);
  if (!definition || definition.type !== 'CONSUMABLE' || !playerHasItem(state.player, itemId)) {
    return [];
  }
  const derived = derivedPlayerStats(state.player);
  const events: GameEvent[] = [{ type: 'ITEM_CONSUMED', itemId }];
  if (definition.healHp && definition.healHp > 0) {
    events.push({
      type: 'PLAYER_COMBAT_HP_UPDATED',
      currentHp: Math.min(derived.maxHp, state.player.currentHp + definition.healHp),
    });
  }
  if (definition.healMp && definition.healMp > 0) {
    events.push({
      type: 'PLAYER_COMBAT_MP_UPDATED',
      currentMp: Math.min(derived.maxMp, state.player.currentMp + definition.healMp),
    });
  }
  events.push({
    type: 'ACTION_RESOLVED',
    turnId: state.world.turn,
    resolution: {
      success: true,
      actionType: 'USE_ITEM',
      narrative: `${definition.name}을(를) 사용했다.`,
      nextMode: 'STORY',
    },
  });
  return events;
}
