import type { RelationshipChangeReason, RelationshipDelta } from './relationship-types';
import type { RelationshipState } from '../npc/relationship';

export type RelationshipRule = Pick<RelationshipState, 'affection' | 'trust' | 'fear' | 'respect'>;

export const EMPTY_RELATIONSHIP_RULE: RelationshipRule = {
  affection: 0,
  trust: 0,
  fear: 0,
  respect: 0,
};

export const RELATIONSHIP_RULES: Readonly<Record<RelationshipChangeReason, Partial<RelationshipRule>>> = {
  PLAYER_HELPED_NPC: { affection: 8, trust: 6 },
  PLAYER_SAVED_NPC: { affection: 15, trust: 12, respect: 10 },
  PLAYER_GAVE_GIFT: { affection: 6, trust: 3 },
  PLAYER_KEPT_PROMISE: { affection: 4, trust: 10 },
  PLAYER_BROKE_PROMISE: { affection: -8, trust: -25 },
  PLAYER_LIED: { trust: -15, affection: -5 },
  PLAYER_THREATENED_NPC: { affection: -12, trust: -10, fear: 20 },
  PLAYER_ATTACKED_NPC: { affection: -30, trust: -35, fear: 15 },
  PLAYER_DEFEATED_NPC: { affection: -20, trust: -25, fear: 10, respect: 5 },
  PLAYER_SHOWED_SKILL: { respect: 8 },
  PLAYER_SHARED_INFORMATION: { trust: 5 },
  PLAYER_INSULTED_NPC: { affection: -10 },
  PLAYER_COMPLETED_REQUEST: { affection: 10, trust: 8 },
  PLAYER_PROVED_CAPABILITY: { respect: 8, trust: 4 },
};

const NPC_REASON_MODIFIERS: Readonly<Record<string, Partial<Record<RelationshipChangeReason, Partial<RelationshipRule>>>>> = {
  seria: {
    PLAYER_SHOWED_SKILL: { respect: 2 },
  },
  leon: {
    PLAYER_THREATENED_NPC: { respect: -5 },
    PLAYER_ATTACKED_NPC: { respect: 5 },
  },
  innkeeper: {
    PLAYER_GAVE_GIFT: { affection: 3 },
  },
};

export function ruleForReason(reason: RelationshipChangeReason): RelationshipRule {
  return {
    ...EMPTY_RELATIONSHIP_RULE,
    ...RELATIONSHIP_RULES[reason],
  };
}

export function personalityModifier(npcId: string, reason: RelationshipChangeReason): Partial<RelationshipRule> {
  return NPC_REASON_MODIFIERS[npcId]?.[reason] ?? {};
}

export function mergeRelationshipRule(
  base: Partial<RelationshipRule>,
  extra: Partial<RelationshipRule>
): RelationshipRule {
  return {
    affection: (base.affection ?? 0) + (extra.affection ?? 0),
    trust: (base.trust ?? 0) + (extra.trust ?? 0),
    fear: (base.fear ?? 0) + (extra.fear ?? 0),
    respect: (base.respect ?? 0) + (extra.respect ?? 0),
  };
}

export function toRelationshipDelta(
  npcId: string,
  reason: RelationshipChangeReason,
  sourceEventId: string
): RelationshipDelta {
  const merged = mergeRelationshipRule(ruleForReason(reason), personalityModifier(npcId, reason));
  return {
    npcId,
    reason,
    sourceEventId,
    affection: merged.affection || undefined,
    trust: merged.trust || undefined,
    fear: merged.fear || undefined,
    respect: merged.respect || undefined,
  };
}
