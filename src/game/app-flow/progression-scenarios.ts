import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import type { GameEvent } from '../core/event';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { eventsForProgression } from '../player/progression/progression-rules';
import { eventsForTurnRewards } from '../player/progression/action-rewards';
import { CHAPTER_FACT_ID } from '../knowledge/chapter-1-facts';
import { toPersistedGameState, toGameState } from '../save/save-serialize';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';

function pass(id: string, detail: string): string {
  return `PASS ${id} — ${detail}`;
}

function fail(id: string, detail: string): string {
  return `FAIL ${id} — ${detail}`;
}

function applyPipeline(state: ReturnType<typeof createInitialGameState>, incoming: readonly GameEvent[]) {
  const progressed = eventsForProgression(state, incoming);
  const mid = applyEvents(state, [...incoming, ...progressed]);
  const turn = eventsForTurnRewards(state, incoming);
  return applyEvents(mid, turn);
}

function combatWon(combatId: string): GameEvent {
  return { type: 'COMBAT_WON', combatId, defeatedEnemyIds: ['enemy_1'] };
}

export async function runProgressionScenarios(): Promise<string[]> {
  const lines: string[] = [];

  // --- Repeat investigate/look grants 0 EXP ---
  {
    let state = createInitialGameState();
    const before = state.player.exp ?? 0;
    for (let i = 0; i < 6; i += 1) {
      const incoming: GameEvent[] = [
        {
          type: 'ACTION_RESOLVED',
          turnId: state.world.turn + i,
          resolution: {
            success: true,
            actionType: 'INVESTIGATE',
            narrative: '주변을 살핀다.',
          },
        },
        { type: 'AREA_INVESTIGATED', locationId: state.world.currentLocationId },
      ];
      state = applyPipeline(state, incoming);
      state = {
        ...state,
        world: { ...state.world, turn: state.world.turn + 1 },
        actionRepeatCounts: {
          ...(state.actionRepeatCounts ?? {}),
          [`INVESTIGATE:${state.world.currentLocationId}:${state.story.currentSceneId}`]: i + 1,
        },
      };
    }
    const after = state.player.exp ?? 0;
    if (after === before) {
      lines.push(pass('repeat-investigate-no-exp', `exp stayed ${after}`));
    } else {
      lines.push(fail('repeat-investigate-no-exp', `exp ${before} → ${after}`));
    }
  }

  // --- Encounter first clear vs repeat ---
  {
    let state = createInitialGameState();
    state = {
      ...state,
      world: {
        ...state.world,
        currentLocationId: LOCATION_ID.FOREST_ROAD,
        flags: { ...state.world.flags, [WORLD_FLAG.GUILD_REGISTERED]: true },
      },
    };
    const first = applyPipeline(state, [combatWon(ENCOUNTER_ID.CH1_FOREST_SCOUTS)]);
    const firstExp = (first.player.exp ?? 0) - (state.player.exp ?? 0);
    const firstGold = first.player.gold - state.player.gold;
    const hasFirstExpId = (first.processedExpSourceIds ?? []).includes(
      `exp:combat:first:${ENCOUNTER_ID.CH1_FOREST_SCOUTS}`
    );

    const second = applyPipeline(first, [combatWon(ENCOUNTER_ID.CH1_FOREST_SCOUTS)]);
    const secondExpDelta = (second.player.exp ?? 0) - (first.player.exp ?? 0);
    const secondGoldDelta = second.player.gold - first.player.gold;

    if (hasFirstExpId && firstExp > 0 && firstGold >= 100) {
      lines.push(pass('first-clear-reward', `exp +${firstExp} gold +${firstGold}`));
    } else {
      lines.push(fail('first-clear-reward', JSON.stringify({ firstExp, firstGold, hasFirstExpId })));
    }
    if (secondExpDelta === 0 && secondGoldDelta > 0 && secondGoldDelta < firstGold) {
      lines.push(pass('repeat-clear-gold-only', `exp +${secondExpDelta} gold +${secondGoldDelta}`));
    } else {
      lines.push(fail('repeat-clear-gold-only', JSON.stringify({ secondExpDelta, secondGoldDelta, firstGold })));
    }
  }

  // --- Milestone fact once ---
  {
    const state = createInitialGameState();
    const learn: GameEvent = { type: 'PLAYER_LEARNED_FACT', factId: CHAPTER_FACT_ID.CAMP_BLUE_GLOW };
    const once = applyPipeline(state, [learn]);
    const twice = applyPipeline(once, [learn]);
    const id = `exp:milestone:${CHAPTER_FACT_ID.CAMP_BLUE_GLOW}`;
    const onceHas = (once.processedExpSourceIds ?? []).includes(id);
    const expStable = (once.player.exp ?? 0) === (twice.player.exp ?? 0);
    if (onceHas && expStable && (once.player.exp ?? 0) > 0) {
      lines.push(pass('milestone-once', `exp ${once.player.exp}`));
    } else {
      lines.push(
        fail('milestone-once', JSON.stringify({ onceHas, expStable, exp: once.player.exp, twice: twice.player.exp }))
      );
    }
  }

  // --- Quest reward once ---
  {
    let state = createInitialGameState();
    state = {
      ...state,
      quests: {
        ...state.quests,
        [QUEST_ID.FOREST_GOBLIN_SCOUR]: {
          ...state.quests[QUEST_ID.FOREST_GOBLIN_SCOUR],
          status: QUEST_STATUS.ACTIVE,
        },
      },
    };
    const complete: GameEvent = { type: 'QUEST_COMPLETED', questId: QUEST_ID.FOREST_GOBLIN_SCOUR };
    const once = applyPipeline(state, [complete]);
    const twice = applyPipeline(once, [complete]);
    const goldOnce = once.player.gold - state.player.gold;
    const goldTwice = twice.player.gold - once.player.gold;
    const expStable = (once.player.exp ?? 0) === (twice.player.exp ?? 0);
    if (goldOnce > 0 && goldTwice === 0 && expStable) {
      lines.push(pass('quest-once', `gold +${goldOnce}, second +${goldTwice}`));
    } else {
      lines.push(fail('quest-once', JSON.stringify({ goldOnce, goldTwice, expStable })));
    }
  }

  // --- Save/Load keeps processedExpSourceIds ---
  {
    let state = createInitialGameState();
    const learn: GameEvent = { type: 'PLAYER_LEARNED_FACT', factId: CHAPTER_FACT_ID.CAMP_BLUE_GLOW };
    state = applyPipeline(state, [learn]);
    const expBefore = state.player.exp ?? 0;
    const persisted = toPersistedGameState(state, 0);
    const loaded = toGameState(persisted);
    const after = applyPipeline(loaded, [learn]);
    if (
      (loaded.processedExpSourceIds ?? []).includes(`exp:milestone:${CHAPTER_FACT_ID.CAMP_BLUE_GLOW}`) &&
      (after.player.exp ?? 0) === (loaded.player.exp ?? 0) &&
      expBefore > 0
    ) {
      lines.push(pass('save-load-exp', `exp held at ${loaded.player.exp}`));
    } else {
      lines.push(
        fail(
          'save-load-exp',
          JSON.stringify({
            expBefore,
            loaded: loaded.player.exp,
            after: after.player.exp,
            ids: loaded.processedExpSourceIds,
          })
        )
      );
    }
  }

  return lines;
}
