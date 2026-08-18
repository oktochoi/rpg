export interface RelationshipState {
  affection: number;
  trust: number;
  fear: number;
  respect: number;
}

export const RELATIONSHIP_MIN = -100;
export const RELATIONSHIP_MAX = 100;

export function createRelationship(values?: Partial<RelationshipState>): RelationshipState {
  return clampRelationship({
    affection: values?.affection ?? 0,
    trust: values?.trust ?? 0,
    fear: values?.fear ?? 0,
    respect: values?.respect ?? 0,
  });
}

export function clampRelationship(value: RelationshipState): RelationshipState {
  const clamp = (n: number) => Math.max(RELATIONSHIP_MIN, Math.min(RELATIONSHIP_MAX, n));
  return {
    affection: clamp(value.affection),
    trust: clamp(value.trust),
    fear: clamp(value.fear),
    respect: clamp(value.respect),
  };
}
