export { getKnownFactsForNpc, doesNpcKnowFact, getPlayerKnownFacts, doesPlayerKnowFact } from './knowledge-selectors';
export { eventsForRecordedFact, eventsForShareFact, eventsForPublicReveal, eventsForGrantFact, eventsForPlayerDiscoveredFact } from './knowledge-service';
export { CHAPTER_FACT_ID } from './chapter-1-facts';
export { KNOWLEDGE_CONFIDENCE, PLAYER_ACTOR_ID } from './knowledge-config';
export type { PlayerKnowledge } from './player-knowledge';
export { createEmptyPlayerKnowledge } from './player-knowledge';
