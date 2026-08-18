import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { generateStoryChoices, fallbackResponse } from '../../ai/director/generate-story-choices';
import { isStaleDirectorResponse } from '../../ai/director/director-types';
import { ENCOUNTER_ID } from '../combat/encounters/encounter-definitions';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { worldFlag } from '../world/locations/location-selectors';
import { getLocationDescription } from '../world/locations/location-selectors';
import { ITEM_ID, getItemDefinition } from '../inventory/item-definitions';
import { STARTING_GOLD } from '../economy/economy-types';
import { affordableShopItemIds, shopItemIdsFor, shopStockPhase, SHOP_STOCK_PHASE } from '../economy/shop-stock';
import { buyBlockedReason } from '../economy/shop-rules';
import { buildChoiceCandidates, buildStoryDirectorContext } from '../story/choices';
import { selectInteractionState } from '../story/interaction-state';
import { topicsForNpc } from '../dialogue/dialogue-topics';
import { isTopicAvailable } from '../dialogue/dialogue-topic-state';
import { isSmallTalkSemanticKey } from '../dialogue/small-talk';
import { STORY_SCENE_ID } from '../story/story-scene-definitions';
import { lookAroundResult } from '../world/living-luen';
import { MICRO_EVENTS, SECRET_POINTS, isMicroEventSeen } from '../world/living-luen/micro-events';
import { CHAPTER_FACT_ID } from '../knowledge/chapter-1-facts';
import { doesNpcKnowFact, doesPlayerKnowFact } from '../knowledge/knowledge-selectors';
import { ACTION_EXP } from '../player/progression/level-config';
import { playOrganicChapter1 } from './step34-scenarios';
import { CHAPTER_ID, isChapterCompleted } from '../story/chapters';
import { createMemoryStorage, createSaveService } from '../save';
import { PLAYER_CLASS_ID } from '../player/classes';
import { eventsForQuestEffects } from '../quests/quest-effects';

function withFlags(flags: Record<string, boolean>) {
  const state = createInitialGameState();
  return applyEvents(
    state,
    Object.entries(flags).map(([flagId, value]) => ({ type: 'WORLD_FLAG_SET' as const, flagId, value }))
  );
}

export async function runStep348Scenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const idle = createInitialGameState();
  const interaction = selectInteractionState(idle, { inGame: true, candidateCount: 3 });
  if (interaction.canInteract && !interaction.isResolving) {
    pass('A-interaction-idle', interaction.mode);
  } else {
    fail('A-interaction-idle', JSON.stringify(interaction));
  }

  const resolving = { ...idle, mode: 'RESOLVING' as const, pendingFreeActionTurnId: 1 };
  const locked = selectInteractionState(resolving, { inGame: true });
  if (!locked.canInteract && locked.reason === 'resolving') {
    pass('A-resolving-reason', locked.reason);
  } else {
    fail('A-resolving-reason', JSON.stringify(locked));
  }

  const stale = isStaleDirectorResponse(21, { turnId: 20 });
  const kept = await generateStoryChoices({ ...idle, world: { ...idle.world, turn: 21 } }, {
    async generateChoices() {
      return { turnId: 20, choices: [] };
    },
  });
  if (stale && kept.debugReason === 'stale_turn' && kept.choices.length > 0) {
    pass('B-stale-fallback', `${kept.choices.length} choices`);
  } else {
    fail('B-stale-fallback', JSON.stringify(kept));
  }

  const groqFail = await generateStoryChoices(idle, {
    async generateChoices() {
      throw new Error('timeout');
    },
  });
  if (groqFail.debugReason === 'fallback' && groqFail.choices.length > 0) {
    pass('A-groq-fallback', groqFail.debugReason);
  } else {
    fail('A-groq-fallback', JSON.stringify(groqFail));
  }

  const seria = applyEvents(createInitialGameState(), [
    { type: 'STORY_SCENE_ENTERED', sceneId: STORY_SCENE_ID.LUEN_VILLAGE_HUB },
  ]);
  const first = topicsForNpc(seria, 'seria').filter((topic) => isTopicAvailable(seria, topic));
  const consumed = applyEvents(
    seria,
    first.filter((topic) => !isSmallTalkSemanticKey(topic.semanticKey)).map((topic) => ({
      type: 'DIALOGUE_TOPIC_CONSUMED' as const,
      topicId: `${topic.npcId}:${topic.topicId}`,
    }))
  );
  const after = topicsForNpc(consumed, 'seria').filter((topic) => isTopicAvailable(consumed, topic));
  const afterCandidates = buildChoiceCandidates(consumed, buildStoryDirectorContext(consumed));
  const hasEnd = afterCandidates.some((candidate) => candidate.id.startsWith('npc_end_') || candidate.metadata?.promptId === 'end_dialogue');
  const hasSmall = after.some((topic) => isSmallTalkSemanticKey(topic.semanticKey));
  if (hasEnd && hasSmall && afterCandidates.length > 0) {
    pass('C-dialogue-exhausted', `small ${hasSmall} end ${hasEnd}`);
  } else {
    fail('C-dialogue-exhausted', JSON.stringify({ hasEnd, hasSmall, after: after.length, cand: afterCandidates.length }));
  }

  const combatBack = applyEvents(createInitialGameState(), [
    { type: 'COMBAT_STARTED', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS },
    { type: 'COMBAT_ENDED', combatId: ENCOUNTER_ID.CH1_FOREST_SCOUTS },
  ]);
  const afterCombat = selectInteractionState(
    { ...combatBack, mode: 'STORY' },
    { inGame: true, candidateCount: 3 }
  );
  if (afterCombat.canInteract) {
    pass('E-combat-return', afterCombat.mode);
  } else {
    fail('E-combat-return', JSON.stringify(afterCombat));
  }

  const firstVisitGold = STARTING_GOLD + 18 + 30;
  const shopReady = applyEvents(createInitialGameState(), [
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.SHOP_UNLOCKED, value: true },
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.FOREST_GOBLIN_DEFEATED, value: true },
    { type: 'PLAYER_GOLD_UPDATED', gold: firstVisitGold },
    { type: 'LOCATION_ENTERED', locationId: LOCATION_ID.LUEN_GENERAL_STORE },
  ]);
  const affordable = affordableShopItemIds(shopReady);
  if (firstVisitGold === 98 && affordable.length > 0 && affordable.includes(ITEM_ID.HEALING_POTION)) {
    pass('F-shop-first-visit', `${affordable.join(',')} gold ${firstVisitGold}`);
  } else {
    fail('F-shop-first-visit', JSON.stringify({ firstVisitGold, affordable }));
  }

  const bandage = getItemDefinition(ITEM_ID.LINEN_BANDAGE);
  const sturdy = getItemDefinition(ITEM_ID.STURDY_SWORD);
  const iron = getItemDefinition(ITEM_ID.IRON_SWORD);
  if (bandage?.buyPrice === 12 && sturdy?.buyPrice === 45 && (iron?.buyPrice ?? 0) >= 90 && (iron?.buyPrice ?? 0) <= 110) {
    pass('F-shop-prices', `bandage ${bandage.buyPrice} sturdy ${sturdy.buyPrice} iron ${iron?.buyPrice}`);
  } else {
    fail('F-shop-prices', JSON.stringify({ bandage, sturdy, iron }));
  }

  const phaseA = shopStockPhase(createInitialGameState());
  const phaseB = shopStockPhase(withFlags({ [WORLD_FLAG.SHOP_UNLOCKED]: true, [WORLD_FLAG.FOREST_GOBLIN_DEFEATED]: true }));
  const phaseC = shopStockPhase(withFlags({ [WORLD_FLAG.GOBLIN_CAMP_CLEARED]: true }));
  const stockC = shopItemIdsFor(withFlags({ [WORLD_FLAG.GOBLIN_CAMP_CLEARED]: true }));
  if (phaseA === SHOP_STOCK_PHASE.A && phaseB === SHOP_STOCK_PHASE.B && phaseC === SHOP_STOCK_PHASE.C && stockC.includes(ITEM_ID.IRON_SWORD)) {
    pass('H-shop-stock', `${phaseA}->${phaseB}->${phaseC}`);
  } else {
    fail('H-shop-stock', `${phaseA} ${phaseB} ${phaseC}`);
  }

  const poorShop = applyEvents(shopReady, [{ type: 'PLAYER_GOLD_UPDATED', gold: 10 }]);
  const ironBlocked = buyBlockedReason({ ...poorShop, world: { ...poorShop.world, currentLocationId: LOCATION_ID.LUEN_GENERAL_STORE } }, ITEM_ID.IRON_SWORD);
  if (ironBlocked && affordableShopItemIds({ ...poorShop, world: { ...poorShop.world, currentLocationId: LOCATION_ID.LUEN_GENERAL_STORE }, player: { ...poorShop.player, gold: 12 } }).length > 0) {
    pass('F-shop-disabled-buy', ironBlocked);
  } else {
    fail('F-shop-disabled-buy', String(ironBlocked));
  }

  const marta1 = topicsForNpc(createInitialGameState(), 'innkeeper');
  const marta2 = topicsForNpc(withFlags({ [WORLD_FLAG.FOREST_GOBLIN_DEFEATED]: true, [WORLD_FLAG.GUILD_REGISTERED]: true }), 'innkeeper');
  const martaIntro = marta1.some((topic) => topic.topicId === 'marta_first_meeting');
  const martaQuiet = marta2.some((topic) => topic.topicId === 'marta_forest_quiet' || topic.semanticKey.includes('FOREST_QUIET') || isSmallTalkSemanticKey(topic.semanticKey));
  if (martaIntro && martaQuiet) {
    pass('I-marta-revisit', `${marta1.length}->${marta2.length}`);
  } else {
    fail('I-marta-revisit', JSON.stringify({ martaIntro, martaQuiet, first: marta1[0]?.topicId }));
  }

  const smallKeys = ['a', 'b', 'c'].map((id) => `SMALL_TALK:innkeeper:marta_${id}`);
  if (ACTION_EXP.TALK <= 1 && ACTION_EXP.ASK <= 1 && isSmallTalkSemanticKey(smallKeys[0])) {
    pass('K-small-talk-exp', `talk ${ACTION_EXP.TALK}`);
  } else {
    fail('K-small-talk-exp', String(ACTION_EXP.TALK));
  }

  const campState = withFlags({ [WORLD_FLAG.GOBLIN_CAMP_CLEARED]: true });
  const campEffects = eventsForQuestEffects(campState, QUEST_ID.LEON_GOBLIN_WATCH, [
    { type: 'CREATE_WORLD_FACT', factType: 'QUEST_COMPLETED', factId: CHAPTER_FACT_ID.PUBLIC_GOBLIN_CAMP_CLEARED, tags: ['public', 'goblin'] },
  ]);
  const campPublic = applyEvents(campState, campEffects);
  if (doesNpcKnowFact(campPublic, 'innkeeper', CHAPTER_FACT_ID.PUBLIC_GOBLIN_CAMP_CLEARED)) {
    pass('L-public-event', 'marta learned camp public');
  } else {
    fail('L-public-event', campEffects.map((event) => event.type).join(','));
  }

  const villageLook = lookAroundResult({ ...createInitialGameState(), world: { ...createInitialGameState().world, currentLocationId: LOCATION_ID.LUEN_VILLAGE } });
  if (villageLook.narrative.length > 10 && villageLook.narrative !== '주변을 천천히 살핀다. 당장은 더 눈에 띄는 것이 없다.') {
    pass('M-micro-look', villageLook.narrative.slice(0, 40));
  } else {
    fail('M-micro-look', villageLook.narrative);
  }

  const seen = applyEvents(createInitialGameState(), [
    { type: 'EXPLORATION_POINT_COMPLETED', pointId: MICRO_EVENTS[0].id, locationId: MICRO_EVENTS[0].locationId },
  ]);
  if (isMicroEventSeen(seen, MICRO_EVENTS[0].id) && SECRET_POINTS.length >= 3) {
    pass('M-micro-once', MICRO_EVENTS[0].id);
  } else {
    fail('M-micro-once', MICRO_EVENTS[0].id);
  }

  const arrival = getLocationDescription(LOCATION_ID.LUEN_VILLAGE, createInitialGameState());
  const afterQuest = getLocationDescription(
    LOCATION_ID.LUEN_VILLAGE,
    withFlags({ [WORLD_FLAG.FOREST_GOBLIN_DEFEATED]: true })
  );
  const postGuardian = getLocationDescription(
    LOCATION_ID.LUEN_VILLAGE,
    withFlags({ [WORLD_FLAG.RUINS_GUARDIAN_DEFEATED]: true })
  );
  if (arrival !== afterQuest && afterQuest !== postGuardian) {
    pass('S-world-activity', 'village variants');
  } else {
    fail('S-world-activity', `${arrival} | ${afterQuest}`);
  }

  const hubs = [
    LOCATION_ID.LUEN_VILLAGE,
    LOCATION_ID.LUEN_ADVENTURERS_GUILD,
    LOCATION_ID.BLUE_MOON_INN,
    LOCATION_ID.LUEN_GENERAL_STORE,
    LOCATION_ID.FOREST_ROAD,
  ];
  const emptyHubs = hubs.filter((locationId) => {
    const state = { ...createInitialGameState(), world: { ...createInitialGameState().world, currentLocationId: locationId }, player: { ...createInitialGameState().player, locationId } };
    return buildChoiceCandidates(state, buildStoryDirectorContext(state)).length < 1;
  });
  if (emptyHubs.length === 0 && fallbackResponse(createInitialGameState()).choices.length > 0) {
    pass('T-zero-choice-hubs', hubs.length.toString());
  } else {
    fail('T-zero-choice-hubs', emptyHubs.join(','));
  }

  const storage = createMemoryStorage();
  const saveOrch = createGameOrchestrator(shopReady, undefined, { saveService: createSaveService(storage) });
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  const loadOrch = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storage) });
  await loadOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  if (loadOrch.getState().player.gold === shopReady.player.gold) {
    pass('N-save', String(loadOrch.getState().player.gold));
  } else {
    fail('N-save', String(loadOrch.getState().player.gold));
  }

  const full = await playOrganicChapter1();
  const finished = full.getState();
  if (
    isChapterCompleted(finished, CHAPTER_ID.CHAPTER_1_LUEN_RUINS) &&
    finished.player.level >= 5 &&
    finished.player.level <= 6 &&
    finished.player.classId !== PLAYER_CLASS_ID.ADVENTURER
  ) {
    pass('Q-recommended-level', `lv ${finished.player.level}`);
  } else {
    fail('Q-recommended-level', `lv ${finished.player.level} class ${finished.player.classId}`);
  }

  return lines;
}
