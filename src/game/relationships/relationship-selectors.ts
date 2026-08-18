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
  if (relationship.fear >= 60) {
    return 'AFRAID';
  }
  if (relationship.affection <= -50 && relationship.trust <= -40) {
    return 'HOSTILE';
  }
  if (relationship.trust <= -40) {
    return 'SUSPICIOUS';
  }
  if (relationship.affection >= 60) {
    return 'FRIENDLY';
  }
  if (relationship.respect >= 60) {
    return 'RESPECTFUL';
  }
  return 'NEUTRAL';
}

export function formatRelationshipFeedback(npcName: string, event: Extract<GameEvent, { type: 'NPC_RELATIONSHIP_CHANGED' }>): string {
  const parts: string[] = [];
  if (event.delta.affection) {
    parts.push(`호감 ${signed(event.delta.affection)}`);
  }
  if (event.delta.trust) {
    parts.push(`신뢰 ${signed(event.delta.trust)}`);
  }
  if (event.delta.fear) {
    parts.push(`두려움 ${signed(event.delta.fear)}`);
  }
  if (event.delta.respect) {
    parts.push(`존경 ${signed(event.delta.respect)}`);
  }
  return parts.length > 0 ? `${npcName} ${parts.join(' · ')}` : '';
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
