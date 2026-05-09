import type {
  Canonization,
  LoreEvent,
  CanonStatus,
  CanonizationStageId,
  CanonizationStep,
} from '@/lib/lore/types';
import type { LoreCanonizationOverride } from '@/lib/lore/canonization-overrides';

export interface LoreCanonizationAdminRecord {
  eventId: string;
  event: LoreEvent;
  staticCanon: Canonization;
  draftOverride?: LoreCanonizationOverride;
  publishedOverride?: LoreCanonizationOverride;
  override?: LoreCanonizationOverride;
}

export interface LoreCanonizationApiListResponse {
  events: LoreCanonizationAdminRecord[];
  count: number;
}

export interface LoreCanonizationApiRecordResponse {
  event: LoreCanonizationAdminRecord;
  message?: string;
}

export interface LoreCanonizationApiErrorResponse {
  error?: string;
  details?: string[];
}

export type CanonizationEditorValue = Canonization;

export interface CanonizationStepDraft extends CanonizationStep {
  stageId: CanonizationStageId;
}

export type CanonizationStatusValue = CanonStatus;
