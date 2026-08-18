import type { ChoiceCandidate, DynamicChoice } from './choice-types';
import { CHOICE_SOURCE, choiceIdFor } from './choice-types';
import { resolveCandidateFacingLabel } from './choice-label';
import { DIRECTOR_MAX_CHOICES } from './choice-priority';
import { hasActionableQuestCandidate, hasMainProgressCandidate } from './choice-candidate-builder';
import type { DirectorDebugSnapshot } from '../../../ai/director/director-types';

export function compareCandidates(a: ChoiceCandidate, b: ChoiceCandidate): number {
  if (Boolean(a.critical) !== Boolean(b.critical)) {
    return a.critical ? -1 : 1;
  }
  if (b.basePriority !== a.basePriority) {
    return b.basePriority - a.basePriority;
  }
  return a.id.localeCompare(b.id);
}

export function rankChoiceCandidates(
  candidates: readonly ChoiceCandidate[],
  max = DIRECTOR_MAX_CHOICES
): { selected: ChoiceCandidate[]; debug: DirectorDebugSnapshot } {
  const sorted = [...candidates].sort(compareCandidates);
  const selected: ChoiceCandidate[] = [];
  const usedSources = new Set<string>();

  for (const candidate of sorted) {
    if (selected.length >= max) {
      break;
    }
    if (candidate.critical) {
      selected.push(candidate);
      usedSources.add(candidate.source);
    }
  }

  for (const candidate of sorted) {
    if (selected.length >= max) {
      break;
    }
    if (selected.includes(candidate) || usedSources.has(candidate.source)) {
      continue;
    }
    selected.push(candidate);
    usedSources.add(candidate.source);
  }

  for (const candidate of sorted) {
    if (selected.length >= max) {
      break;
    }
    if (!selected.includes(candidate)) {
      selected.push(candidate);
      usedSources.add(candidate.source);
    }
  }

  ensureQuestPresent(sorted, selected, max);
  ensureMainProgress(sorted, selected, max);

  const selectedIds = new Set(selected.map((item) => item.id));
  const debug: DirectorDebugSnapshot = {
    currentSceneId: '',
    turnId: 0,
    candidateCount: candidates.length,
    candidates: sorted.map((item) => ({
      id: item.id,
      source: item.source,
      priority: item.basePriority,
      critical: item.critical === true,
      text: item.textTemplate,
    })),
    selectedIds: selected.map((item) => item.id),
    excluded: sorted
      .filter((item) => !selectedIds.has(item.id))
      .map((item) => ({
        id: item.id,
        source: item.source,
        priority: item.basePriority,
        critical: item.critical === true,
        text: item.textTemplate,
        excludedReason: exclusionReason(item, selected),
      })),
  };

  return { selected: selected.sort(compareCandidates), debug };
}

function ensureQuestPresent(
  sorted: readonly ChoiceCandidate[],
  selected: ChoiceCandidate[],
  max: number
): void {
  if (!hasActionableQuestCandidate(sorted)) {
    return;
  }
  if (selected.some((item) => item.source === CHOICE_SOURCE.QUEST)) {
    return;
  }
  const quest = sorted.find((item) => item.source === CHOICE_SOURCE.QUEST);
  if (!quest) {
    return;
  }
  if (selected.length < max) {
    selected.push(quest);
    return;
  }
  let replaceAt = -1;
  let worst = Number.POSITIVE_INFINITY;
  for (let index = 0; index < selected.length; index += 1) {
    const item = selected[index];
    if (item.critical) {
      continue;
    }
    if (item.basePriority < worst) {
      worst = item.basePriority;
      replaceAt = index;
    }
  }
  if (replaceAt >= 0) {
    selected[replaceAt] = quest;
  }
}

function ensureMainProgress(
  sorted: readonly ChoiceCandidate[],
  selected: ChoiceCandidate[],
  max: number
): void {
  if (hasMainProgressCandidate(selected)) {
    return;
  }
  const progress = sorted.find(
    (item) => item.critical === true || item.intent === 'PROGRESS_STORY' || item.source === CHOICE_SOURCE.QUEST
  );
  if (!progress) {
    return;
  }
  if (selected.length < max) {
    selected.unshift(progress);
    return;
  }
  const replaceAt = selected.findIndex((item) => item.critical !== true);
  if (replaceAt >= 0) {
    selected[replaceAt] = progress;
  }
}
function exclusionReason(candidate: ChoiceCandidate, selected: readonly ChoiceCandidate[]): string {
  if (selected.some((item) => item.id === candidate.id)) {
    return '';
  }
  if (selected.length >= DIRECTOR_MAX_CHOICES && candidate.critical !== true) {
    return 'max_choices';
  }
  if (selected.some((item) => item.source === candidate.source) && candidate.critical !== true) {
    return 'diversity';
  }
  return 'ranked_below';
}

export function toDynamicChoices(turnId: number, selected: readonly ChoiceCandidate[]): DynamicChoice[] {
  return selected.map((candidate) => ({
    id: choiceIdFor(turnId, candidate.id),
    text: resolveCandidateFacingLabel(candidate),
    intent: candidate.intent,
    actionType: candidate.actionType,
    targetId: candidate.targetId,
    secondaryTargetId: candidate.secondaryTargetId,
    metadata: candidate.metadata as Record<string, unknown> | undefined,
    source: candidate.source,
    priority: candidate.basePriority,
    candidateId: candidate.id,
  }));
}
