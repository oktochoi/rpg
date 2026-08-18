import type { GameEvent } from '../core/event';
import type { GameState } from '../core/game-state';
import type { NpcId } from '../core/ids';
import { createRelationship } from '../npc/relationship';
import type { NpcAttitude } from './relationship-types';
import type { RelationshipState } from '../npc/relationship';

export function getRelationship(state: Readonly<GameState>, npcId: NpcId): RelationshipState {
  return state.relationships[npcId] ?? createRelationship();
}

export function getNpcAttitude(state: Readonly<GameState>, npcId: NpcId): NpcAttitude {
  return attitudeFromRelationship(getRelationship(state, npcId));
}

export function attitudeFromRelationship(relationship: RelationshipState): NpcAttitude {
  if (relationship.fear >= 40) {
    return 'AFRAID';
  }
  if (relationship.affection <= -50 && relationship.trust <= -40) {
    return 'HOSTILE';
  }
  if (relationship.trust <= -40) {
    return 'SUSPICIOUS';
  }
  if (relationship.respect >= 40) {
    return 'RESPECTFUL';
  }
  if (relationship.affection >= 60 || relationship.trust >= 40) {
    return 'FRIENDLY';
  }
  return 'NEUTRAL';
}

export function relationshipBandLabel(relationship: RelationshipState): string {
  const attitude = attitudeFromRelationship(relationship);
  if (attitude === 'AFRAID') {
    return '경계함';
  }
  if (attitude === 'HOSTILE') {
    return '적대함';
  }
  if (attitude === 'SUSPICIOUS') {
    return '경계함';
  }
  if (attitude === 'RESPECTFUL') {
    return '실력을 인정함';
  }
  if (attitude === 'FRIENDLY') {
    return relationship.trust >= 40 ? '신뢰함' : '호의';
  }
  if (relationship.affection >= 20 || relationship.trust >= 15) {
    return '조금 친숙함';
  }
  return '낯선 사람';
}

export function formatRelationshipFeedback(npcName: string, event: Extract<GameEvent, { type: 'NPC_RELATIONSHIP_CHANGED' }>): string {
  const parts: string[] = [];
  if (event.delta.respect > 0) {
    parts.push('실력을 인정한다');
  }
  if (event.delta.trust > 0) {
    parts.push('말을 더 믿는다');
  }
  if (event.delta.affection > 0) {
    parts.push('조금 더 가깝게 느낀다');
  }
  if (event.delta.fear > 0) {
    parts.push('당신을 경계한다');
  }
  if (event.delta.affection < 0 || event.delta.trust < 0) {
    parts.push('관계가 조금 멀어졌다');
  }
  return parts.length > 0 ? `${npcName}가 ${parts.join(', ')}.` : '';
}
