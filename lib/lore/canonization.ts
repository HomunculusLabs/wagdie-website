import { canonizationStageIds } from './types';
import type {
  CanonStatus,
  Canonization,
  CanonizationStageId,
  CanonizationStep,
} from './types';

export type CanonizationTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

export interface CanonizationStageDefinition {
  id: CanonizationStageId;
  label: string;
  shortLabel: string;
  description: string;
  order: number;
  terminal: boolean;
  tone: CanonizationTone;
}

export interface CanonizationProgress {
  stage: CanonizationStageDefinition;
  currentStep?: CanonizationStep;
  completedCount: number;
  totalCount: number;
  percent: number;
  terminal: boolean;
}

export const canonizationStageDefinitions: Record<CanonizationStageId, CanonizationStageDefinition> = {
  archived: {
    id: 'archived',
    label: 'Archived reference',
    shortLabel: 'Archived',
    description: 'Preserved for historical reference without asserting canon standing.',
    order: 0,
    terminal: true,
    tone: 'muted',
  },
  community_recorded: {
    id: 'community_recorded',
    label: 'Community entry recorded',
    shortLabel: 'Community entry',
    description: 'A community-originated record has been captured in the static archive.',
    order: 10,
    terminal: false,
    tone: 'info',
  },
  source_attributed: {
    id: 'source_attributed',
    label: 'Review & verification',
    shortLabel: 'Verified sources',
    description: 'Sources and preservation metadata are attached for curator review.',
    order: 20,
    terminal: false,
    tone: 'info',
  },
  continuity_review: {
    id: 'continuity_review',
    label: 'Continuity review',
    shortLabel: 'In review',
    description: 'Curators are checking the record against established WAGDIE lore.',
    order: 30,
    terminal: false,
    tone: 'warning',
  },
  canon_candidate: {
    id: 'canon_candidate',
    label: 'Canon candidate',
    shortLabel: 'Candidate',
    description: 'The record is promoted for final canon acceptance.',
    order: 40,
    terminal: false,
    tone: 'warning',
  },
  canonized: {
    id: 'canonized',
    label: 'Approved canon',
    shortLabel: 'Approved',
    description: 'Accepted as canon for the curated lore archive.',
    order: 50,
    terminal: true,
    tone: 'success',
  },
  disputed: {
    id: 'disputed',
    label: 'Disputed record',
    shortLabel: 'Disputed',
    description: 'Conflicting or unresolved source/continuity evidence blocks promotion.',
    order: 60,
    terminal: true,
    tone: 'warning',
  },
  rejected: {
    id: 'rejected',
    label: 'Rejected / non-canon',
    shortLabel: 'Rejected',
    description: 'Reviewed and retained as non-canon reference material.',
    order: 70,
    terminal: true,
    tone: 'danger',
  },
};

export const canonStatusLabels: Record<CanonStatus, string> = {
  canon: 'Canon',
  canonizing: 'Canonizing',
  community: 'Community',
  disputed: 'Disputed',
  non_canon: 'Non-canon',
  archival: 'Archival',
};

const statusStageMap: Record<CanonStatus, readonly CanonizationStageId[]> = {
  canon: ['canonized'],
  canonizing: ['continuity_review', 'canon_candidate'],
  community: ['community_recorded', 'source_attributed'],
  disputed: ['disputed'],
  non_canon: ['rejected'],
  archival: ['archived'],
};

const fallbackStage = canonizationStageDefinitions.archived;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export const isCanonizationStageId = (value: string): value is CanonizationStageId => {
  return (canonizationStageIds as readonly string[]).includes(value);
};

export const getCanonizationStageDefinition = (
  stageId: CanonizationStageId,
): CanonizationStageDefinition => {
  return canonizationStageDefinitions[stageId] ?? fallbackStage;
};

export const getCanonizationStageOptions = (): CanonizationStageDefinition[] => {
  return [...canonizationStageIds]
    .map((stageId) => canonizationStageDefinitions[stageId])
    .sort((a, b) => a.order - b.order);
};

export const getCanonizationStatusLabel = (status: CanonStatus): string => {
  return canonStatusLabels[status] ?? status;
};

export const isValidCanonizationStageForStatus = (
  status: CanonStatus,
  stageId: CanonizationStageId,
): boolean => {
  return statusStageMap[status]?.includes(stageId) ?? false;
};

export const getCurrentCanonizationStep = (canon: Canonization): CanonizationStep | undefined => {
  return canon.path.find((step) => step.status === 'current');
};

export const getCanonizationProgress = (canon: Canonization): CanonizationProgress => {
  const stage = getCanonizationStageDefinition(canon.stageId);
  const currentStep = getCurrentCanonizationStep(canon);
  const displayableSteps = canon.path.filter((step) => step.status !== 'skipped');
  const totalCount = displayableSteps.length;
  const completedCount = displayableSteps.filter((step) => step.status === 'complete').length;

  if (totalCount === 0 || (currentStep && currentStep.stageId !== canon.stageId)) {
    return {
      stage,
      currentStep,
      completedCount,
      totalCount,
      percent: 0,
      terminal: stage.terminal,
    };
  }

  const currentStepWeight = currentStep ? (stage.terminal ? 1 : 0.5) : 0;
  const percent = clamp(Math.round(((completedCount + currentStepWeight) / totalCount) * 100));

  return {
    stage,
    currentStep,
    completedCount,
    totalCount,
    percent,
    terminal: stage.terminal,
  };
};
