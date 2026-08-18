import { createGameOrchestrator } from '../core/orchestrator';
import { createInitialGameState } from '../core/initial-state';
import { applyEvents } from '../core/reducer';
import { generateStoryChoices } from '../../ai/director/generate-story-choices';
import { hydrateDirectorLlmResponse } from '../../ai/director/director-llm-schema';
import { QUEST_ID } from '../quests/quest-definitions';
import { QUEST_STATUS } from '../quests/quest-types';
import { LOCATION_ID, WORLD_FLAG } from '../world/locations/location-definitions';
import { isHubLocation, worldFlag } from '../world/locations/location-selectors';
import { derivedPlayerStats } from '../inventory/derived-stats';
import { eventsForExpGrant } from '../player/progression/progression-rules';
import { buildChoiceCandidates, buildStoryDirectorContext } from '../story/choices';
import { looksLikeInternalId, productionTextHasInternalId, resolvePlayerFacingChoiceLabel } from '../story/choices/choice-label';
import { STORY_SCENE_ID } from '../story/story-scene-definitions';
import { topicsForNpc } from '../dialogue/dialogue-topics';
import { isTopicAvailable } from '../dialogue/dialogue-topic-state';
import { toStoryScreenView } from '../story/story-view';
import { INN_REST_COST } from '../economy/economy-types';
import { storyFreeRestAvailable } from '../time/day-rules';
import { canAllocateStat } from '../player/stats/stat-rules';
import { PLAYER_CLASS_ID } from '../player/classes';
import { createMemoryStorage, createSaveService } from '../save';
import { playOrganicChapter1 } from './step34-scenarios';
import { CHAPTER_ID, isChapterCompleted } from '../story/chapters';
import { getLocationDefinition } from '../world/locations/location-definitions';

function pathBetween(start: string, dest: string): string[] {
  if (start === dest) {
    return [];
  }
  const prev = new Map<string, string | null>([[start, null]]);
  const queue = [start];
  while (queue.length > 0) {
    const cursor = queue.shift()!;
    const definition = getLocationDefinition(cursor);
    if (!definition) {
      continue;
    }
    for (const next of definition.connectedLocationIds) {
      if (prev.has(next)) {
        continue;
      }
      prev.set(next, cursor);
      if (next === dest) {
        const path: string[] = [];
        let walk: string | null = dest;
        while (walk && walk !== start) {
          path.unshift(walk);
          walk = prev.get(walk) ?? null;
        }
        return path;
      }
      queue.push(next);
    }
  }
  return [];
}

async function hopTo(orch: ReturnType<typeof createGameOrchestrator>, locationId: string) {
  for (const hop of pathBetween(orch.getState().world.currentLocationId, locationId)) {
    await orch.dispatch({ type: 'MOVE_TO_LOCATION', locationId: hop });
  }
}

export async function runStep349Scenarios(): Promise<string[]> {
  const lines: string[] = [];
  const pass = (name: string, detail: string) => lines.push(`PASS ${name}: ${detail}`);
  const fail = (name: string, detail: string) => lines.push(`FAIL ${name}: ${detail}`);

  const leveled = applyEvents(createInitialGameState(), eventsForExpGrant(createInitialGameState(), 999, 'exp:test:level', 'QUEST'));
  if ((leveled.player.level ?? 1) >= 2 && (leveled.player.unspentStatPoints ?? 0) >= 1) {
    pass('A-level-stat-point', `lv ${leveled.player.level} pts ${leveled.player.unspentStatPoints}`);
  } else {
    fail('A-level-stat-point', `lv ${leveled.player.level} pts ${leveled.player.unspentStatPoints}`);
  }

  const strOrch = createGameOrchestrator(leveled);
  const attackBefore = derivedPlayerStats(strOrch.getState().player).attackPower;
  await strOrch.dispatch({ type: 'ALLOCATE_STAT_POINT', statId: 'str' });
  const attackAfter = derivedPlayerStats(strOrch.getState().player).attackPower;
  if (attackAfter === attackBefore + 2 && strOrch.getState().player.allocatedStats.str === 1) {
    pass('B-str-attack', `${attackBefore} → ${attackAfter}`);
  } else {
    fail('B-str-attack', `${attackBefore} → ${attackAfter}`);
  }

  const vitOrch = createGameOrchestrator(leveled);
  const hpBefore = derivedPlayerStats(vitOrch.getState().player).maxHp;
  await vitOrch.dispatch({ type: 'ALLOCATE_STAT_POINT', statId: 'vit' });
  const hpAfter = derivedPlayerStats(vitOrch.getState().player).maxHp;
  if (hpAfter === hpBefore + 10) {
    pass('C-vit-hp', `${hpBefore} → ${hpAfter}`);
  } else {
    fail('C-vit-hp', `${hpBefore} → ${hpAfter}`);
  }

  const storage = createMemoryStorage();
  const saveOrch = createGameOrchestrator(vitOrch.getState(), undefined, { saveService: createSaveService(storage) });
  await saveOrch.dispatch({ type: 'SAVE_GAME', slotId: 'slot_1' });
  const loadOrch = createGameOrchestrator(createInitialGameState(), undefined, { saveService: createSaveService(storage) });
  await loadOrch.dispatch({ type: 'LOAD_GAME', slotId: 'slot_1' });
  const loaded = loadOrch.getState().player;
  if (loaded.allocatedStats.vit === 1 && loaded.unspentStatPoints === vitOrch.getState().player.unspentStatPoints) {
    pass('D-save-stats', `vit ${loaded.allocatedStats.vit} unspent ${loaded.unspentStatPoints}`);
  } else {
    fail('D-save-stats', JSON.stringify(loaded.allocatedStats));
  }

  const intro = createGameOrchestrator(createInitialGameState());
  await intro.dispatch({ type: 'NEW_GAME', name: '옥토' });
  const introChoices = await generateStoryChoices(intro.getState());
  const introLabels = introChoices.choices.map((choice) => choice.text);
  const introHasProgressionTriple = introLabels.some((text) => /길드에 들어|여관으로 간다|마을을 둘러/.test(text));
  if (
    introChoices.choices.length === 1 &&
    introLabels[0] === '계속' &&
    !introHasProgressionTriple &&
    introChoices.choices.every((choice) => !looksLikeInternalId(choice.text))
  ) {
    pass('E-continue', introLabels.join('|'));
  } else {
    fail('E-continue', JSON.stringify(introChoices.choices));
  }

  await intro.dispatch({ type: 'CONTINUE_STORY' });
  if (intro.getState().story.currentSceneId === STORY_SCENE_ID.LUEN_VILLAGE_HUB) {
    pass('E-hub-after-continue', intro.getState().story.currentSceneId);
  } else {
    fail('E-hub-after-continue', intro.getState().story.currentSceneId);
  }

  await hopTo(intro, LOCATION_ID.LUEN_ADVENTURERS_GUILD);
  const registerChoices = await generateStoryChoices(intro.getState());
  const registerRoleplay = registerChoices.choices.filter((choice) => /없다고 말한다|있다고 말한다|자신 있다고/.test(choice.text));
  if (worldFlag(intro.getState(), WORLD_FLAG.GUILD_REGISTERED) && registerRoleplay.length >= 1) {
    pass('F-register-roleplay', registerChoices.choices.map((choice) => choice.text).join('|'));
  } else {
    fail('F-register-roleplay', JSON.stringify({ registered: worldFlag(intro.getState(), WORLD_FLAG.GUILD_REGISTERED), choices: registerChoices.choices }));
  }

  const acceptFound = registerChoices.choices.find(
    (choice) => choice.actionType === 'HELP' || choice.text.includes('맡겠다고') || choice.text.includes('고블린 의뢰')
  );
  if (acceptFound) {
    await intro.dispatch({
      type: 'SELECT_DYNAMIC_CHOICE',
      choiceId: acceptFound.id,
      turnId: intro.getState().world.turn,
      candidateId: acceptFound.candidateId,
    });
  }
  if (intro.getState().quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status !== QUEST_STATUS.ACTIVE) {
    await intro.dispatch({ type: 'ACCEPT_QUEST', questId: QUEST_ID.FOREST_GOBLIN_SCOUR });
  }
  if (intro.getState().quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status === QUEST_STATUS.ACTIVE) {
    pass('G-side-or-starter-quest', intro.getState().quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status ?? '');
  } else {
    fail('G-side-or-starter-quest', intro.getState().quests[QUEST_ID.FOREST_GOBLIN_SCOUR]?.status ?? 'none');
  }

  const hub = createGameOrchestrator(createInitialGameState());
  await hub.dispatch({ type: 'NEW_GAME', name: '허브' });
  await hub.dispatch({ type: 'CONTINUE_STORY' });
  await hopTo(hub, LOCATION_ID.BLUE_MOON_INN);
  if (hub.getState().world.currentLocationId === LOCATION_ID.BLUE_MOON_INN && isHubLocation(LOCATION_ID.BLUE_MOON_INN)) {
    pass('H-hub-nav', hub.getState().world.currentLocationId);
  } else {
    fail('H-hub-nav', hub.getState().world.currentLocationId);
  }

  const innTalk = topicsForNpc(hub.getState(), 'innkeeper');
  if (innTalk.length > 0) {
    pass('I-inn-marta', innTalk.map((topic) => topic.text).join('|'));
  } else {
    fail('I-inn-marta', 'no marta topics');
  }

  const goldBefore = hub.getState().player.gold;
  await hub.dispatch({ type: 'REST' });
  const afterRest = hub.getState();
  if (
    afterRest.player.gold === goldBefore - INN_REST_COST &&
    afterRest.player.currentHp === derivedPlayerStats(afterRest.player).maxHp &&
    Math.floor(((afterRest.world.totalMinutes ?? 0) % 1440) / 60) === 8
  ) {
    pass('J-paid-rest', `gold ${afterRest.player.gold} day ${afterRest.world.day}`);
  } else {
    fail('J-paid-rest', `gold ${afterRest.player.gold} minutes ${afterRest.world.totalMinutes}`);
  }

  const freeState = applyEvents(createInitialGameState(), [
    { type: 'LOCATION_ENTERED', locationId: LOCATION_ID.BLUE_MOON_INN },
    { type: 'WORLD_FLAG_SET', flagId: WORLD_FLAG.LEON_CONFRONTATION_DONE, value: true },
    { type: 'PLAYER_GOLD_UPDATED', gold: 0 },
  ]);
  const freeOrch = createGameOrchestrator(freeState);
  if (storyFreeRestAvailable(freeOrch.getState())) {
    await freeOrch.dispatch({ type: 'REST' });
  }
  const afterFree = freeOrch.getState();
  if (
    storyFreeRestAvailable(freeState) &&
    afterFree.player.gold === 0 &&
    worldFlag(afterFree, WORLD_FLAG.STORY_FREE_REST_USED) &&
    worldFlag(afterFree, WORLD_FLAG.EPILOGUE_REST_DONE)
  ) {
    pass('K-free-story-rest', 'softlock avoided');
  } else {
    fail(
      'K-free-story-rest',
      JSON.stringify({
        available: storyFreeRestAvailable(freeState),
        gold: afterFree.player.gold,
        used: worldFlag(afterFree, WORLD_FLAG.STORY_FREE_REST_USED),
        done: worldFlag(afterFree, WORLD_FLAG.EPILOGUE_REST_DONE),
      })
    );
  }

  const doranOrch = createGameOrchestrator(createInitialGameState());
  await doranOrch.dispatch({ type: 'NEW_GAME', name: '도란' });
  await doranOrch.dispatch({ type: 'CONTINUE_STORY' });
  await hopTo(doranOrch, LOCATION_ID.LUEN_ADVENTURERS_GUILD);
  const doranTopics = topicsForNpc(doranOrch.getState(), 'guildmaster_doran').filter((topic) =>
    isTopicAvailable(doranOrch.getState(), topic)
  );
  const registerTopic = doranTopics.some((topic) => topic.topicId.includes('register') || topic.text.includes('등록하시겠'));
  if (worldFlag(doranOrch.getState(), WORLD_FLAG.GUILD_REGISTERED) && !registerTopic) {
    pass('L-doran-no-register-repeat', doranTopics.map((topic) => topic.topicId).join('|'));
  } else {
    fail('L-doran-no-register-repeat', JSON.stringify(doranTopics));
  }

  const view = toStoryScreenView(doranOrch.getState(), (await generateStoryChoices(doranOrch.getState())).choices.map((choice) => ({
    id: choice.id,
    label: choice.text,
    source: choice.source,
    candidateId: choice.candidateId,
  })));
  const rendered = [
    ...view.choices.map((choice) => choice.label),
    view.story.npcDialogue,
    view.story.situation,
    view.mainObjective ?? '',
    ...view.relations.map((relation) => relation.relation),
  ].join('\n');
  if (!productionTextHasInternalId(rendered) && view.relations.every((relation) => !/-?\d+/.test(relation.relation))) {
    pass('M-id-safety', view.choices.map((choice) => choice.label).join('|'));
  } else {
    fail('M-id-safety', rendered.slice(0, 400));
  }

  const candidates = buildChoiceCandidates(doranOrch.getState(), buildStoryDirectorContext(doranOrch.getState()));
  const first = candidates[0];
  const hydrated = first
    ? hydrateDirectorLlmResponse(
        {
          turnId: doranOrch.getState().world.turn,
          choices: [{ candidateId: first.id, text: first.id }],
        },
        doranOrch.getState().world.turn,
        candidates
      )
    : null;
  const hydratedText = hydrated?.choices[0]?.text ?? '';
  if (hydratedText && !looksLikeInternalId(hydratedText) && hydratedText !== first.id) {
    pass('N-groq-fallback-label', hydratedText);
  } else {
    fail('N-groq-fallback-label', hydratedText || 'empty');
  }

  const blocked = canAllocateStat(createInitialGameState(), 'str');
  if (!blocked.allowed) {
    pass('stat-no-points', blocked.reason ?? 'blocked');
  } else {
    fail('stat-no-points', 'allocation allowed at lv1 with 0 points');
  }

  const safe = resolvePlayerFacingChoiceLabel({ text: 'choice_2_npc_topic_doran_register', candidateId: 'npc_topic_doran_register', actionType: 'TALK' });
  if (safe === '대화를 마친다' || safe === '계속') {
    pass('N-safe-resolver', safe);
  } else {
    fail('N-safe-resolver', safe);
  }

  const full = await playOrganicChapter1();
  const finished = full.getState();
  if (
    isChapterCompleted(finished, CHAPTER_ID.CHAPTER_1_LUEN_RUINS) &&
    finished.player.classId !== PLAYER_CLASS_ID.ADVENTURER &&
    finished.player.allocatedStats &&
    worldFlag(finished, WORLD_FLAG.FIRST_ADVANCEMENT_DONE)
  ) {
    pass('T-chapter-advancement', `${finished.player.classId} stats ${JSON.stringify(finished.player.allocatedStats)}`);
  } else {
    fail('T-chapter-advancement', `${finished.player.classId} chapter ${isChapterCompleted(finished, CHAPTER_ID.CHAPTER_1_LUEN_RUINS)}`);
  }

  return lines;
}
