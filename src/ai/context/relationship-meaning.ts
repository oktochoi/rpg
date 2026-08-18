import { attitudeFromRelationship } from '../../game/relationships/relationship-selectors';
import type { RelationshipState } from '../../game/npc/relationship';

export function describeRelationshipMeaning(relationship: RelationshipState): string {
  const attitude = attitudeFromRelationship(relationship);
  const parts: string[] = [];

  if (relationship.affection <= -40) {
    parts.push('개인적으로 좋아하지는 않음');
  } else if (relationship.affection >= 60) {
    parts.push('개인적으로 호감이 있음');
  } else {
    parts.push('개인적 호감은 보통');
  }

  if (relationship.trust <= -40) {
    parts.push('신뢰를 거의 주지 않음');
  } else if (relationship.trust >= 60) {
    parts.push('신뢰함');
  } else {
    parts.push('신뢰는 아직 판단 중');
  }

  if (relationship.fear >= 60) {
    parts.push('강하게 두려워함');
  } else if (relationship.fear >= 15) {
    parts.push('약간 경계하거나 두려움');
  }

  if (relationship.respect >= 60) {
    parts.push('실력과 태도를 인정함');
  } else if (relationship.respect >= 8) {
    parts.push('어느 정도 실력을 인정함');
  }

  return `태도 ${attitude}. ${parts.join(', ')}.`;
}
