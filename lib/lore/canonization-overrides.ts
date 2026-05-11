import {
  getCurrentCanonizationStep,
  isCanonizationStageId,
  isValidCanonizationStageForStatus,
} from './canonization';
import { getStaticLoreBaseDataset, type LoreBaseDataset } from './base-dataset';
import {
  canonStatuses,
  type CanonStatus,
  type Canonization,
  type CanonizationStageId,
  type CanonizationStep,
  type CanonizationStepStatus,
} from './types';

export const loreCanonizationPublicationStatuses = ['draft', 'published'] as const;
export type LoreCanonizationPublicationStatus = (typeof loreCanonizationPublicationStatuses)[number];

export interface LoreCanonizationOverrideInput {
  eventId: string;
  status: CanonStatus;
  stageId: CanonizationStageId;
  note?: string;
  path: CanonizationStep[];
}

export interface LoreCanonizationOverride {
  eventId: string;
  canon: Canonization;
  publicationStatus: LoreCanonizationPublicationStatus;
  updatedBy: string;
  publishedBy?: string;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
}


export interface LoreCanonizationOverrideSet {
  eventId: string;
  draftOverride?: LoreCanonizationOverride;
  publishedOverride?: LoreCanonizationOverride;
  override?: LoreCanonizationOverride;
}

export type LoreCanonizationOverrideParseResult =
  | { ok: true; input: LoreCanonizationOverrideInput }
  | { ok: false; errors: string[] };

const canonizationStepStatuses: readonly CanonizationStepStatus[] = [
  'complete',
  'current',
  'blocked',
  'not_started',
  'skipped',
];

export interface LoreCanonizationValidationOptions {
  dataset?: LoreBaseDataset;
  validate?: boolean;
}

const getValidationDataset = (dataset?: LoreBaseDataset): LoreBaseDataset => {
  return dataset ?? getStaticLoreBaseDataset();
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isCanonStatus = (value: unknown): value is CanonStatus => {
  return typeof value === 'string' && (canonStatuses as readonly string[]).includes(value);
};

export const isLoreCanonizationPublicationStatus = (
  value: unknown,
): value is LoreCanonizationPublicationStatus => {
  return typeof value === 'string' && loreCanonizationPublicationStatuses.includes(
    value as LoreCanonizationPublicationStatus,
  );
};

const isCanonizationStepStatus = (value: unknown): value is CanonizationStepStatus => {
  return typeof value === 'string' && canonizationStepStatuses.includes(value as CanonizationStepStatus);
};

const readString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const readOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'string' ? value.trim() || undefined : undefined;
};

const parsePath = (value: unknown, errors: string[]): CanonizationStep[] => {
  if (!Array.isArray(value)) {
    errors.push('path must be an array');
    return [];
  }

  return value.map((stepValue, index) => {
    const pathLabel = `path[${index}]`;
    if (!isRecord(stepValue)) {
      errors.push(`${pathLabel} must be an object`);
      return { stageId: 'archived', status: 'not_started' } satisfies CanonizationStep;
    }

    const rawStageId = stepValue.stageId ?? stepValue.stage_id;
    const rawStatus = stepValue.status;
    const stageId = readString(rawStageId);
    const status = readString(rawStatus);

    if (!stageId || !isCanonizationStageId(stageId)) {
      errors.push(`${pathLabel}.stageId is invalid`);
    }

    if (!status || !isCanonizationStepStatus(status)) {
      errors.push(`${pathLabel}.status is invalid`);
    }

    const rawSourceIds = stepValue.sourceIds ?? stepValue.source_ids;
    let parsedSourceIds: string[] | undefined;
    if (rawSourceIds !== undefined) {
      if (!Array.isArray(rawSourceIds) || !rawSourceIds.every((sourceId) => typeof sourceId === 'string')) {
        errors.push(`${pathLabel}.sourceIds must be an array of source ids`);
      } else {
        parsedSourceIds = [...new Set(rawSourceIds.map((sourceId) => sourceId.trim()).filter(Boolean))];
      }
    }

    return {
      stageId: isCanonizationStageId(stageId ?? '') ? stageId as CanonizationStageId : 'archived',
      status: isCanonizationStepStatus(status) ? status : 'not_started',
      label: readOptionalString(stepValue.label),
      date: readOptionalString(stepValue.date),
      note: readOptionalString(stepValue.note),
      sourceIds: parsedSourceIds,
    } satisfies CanonizationStep;
  });
};

export const validateLoreCanonizationOverride = (
  input: LoreCanonizationOverrideInput,
  dataset?: LoreBaseDataset,
): string[] => {
  const errors: string[] = [];
  const validationDataset = getValidationDataset(dataset);
  const { eventsById, sourcesById } = validationDataset.indexes;

  if (!eventsById.has(input.eventId)) {
    errors.push(`event_id does not match an active lore event: ${input.eventId}`);
  }

  if (!isValidCanonizationStageForStatus(input.status, input.stageId)) {
    errors.push(`canon status ${input.status} is incompatible with stage ${input.stageId}`);
  }

  if (input.path.length === 0) {
    errors.push('path must include at least one step');
    return errors;
  }

  const currentSteps = input.path.filter((step) => step.status === 'current');
  if (currentSteps.length !== 1) {
    errors.push('path must include exactly one current step');
  }

  const currentStep = getCurrentCanonizationStep({
    status: input.status,
    stageId: input.stageId,
    note: input.note,
    path: input.path,
  });
  if (currentStep && currentStep.stageId !== input.stageId) {
    errors.push(`current step stage ${currentStep.stageId} does not match stage ${input.stageId}`);
  }

  const seenStageIds = new Set<string>();
  input.path.forEach((step, index) => {
    const pathLabel = `path[${index}]`;

    if (!isCanonizationStageId(step.stageId)) {
      errors.push(`${pathLabel}.stageId is invalid`);
    }

    if (!isCanonizationStepStatus(step.status)) {
      errors.push(`${pathLabel}.status is invalid`);
    }

    if (seenStageIds.has(step.stageId)) {
      errors.push(`${pathLabel}.stageId duplicates ${step.stageId}`);
    }
    seenStageIds.add(step.stageId);

    step.sourceIds?.forEach((sourceId) => {
      if (!sourcesById.has(sourceId)) {
        errors.push(`${pathLabel}.sourceIds references missing source: ${sourceId}`);
      }
    });
  });

  return errors;
};

export const parseLoreCanonizationOverrideInput = (
  body: unknown,
  routeEventId?: string,
  options: LoreCanonizationValidationOptions = {},
): LoreCanonizationOverrideParseResult => {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return { ok: false, errors: ['Invalid JSON body'] };
  }

  const payload = isRecord(body.canon) ? body.canon : body;
  const eventId = routeEventId ?? readString(body.eventId ?? body.event_id);
  const rawStatus = payload.status;
  const rawStageId = payload.stageId ?? payload.stage_id;
  const status = readString(rawStatus);
  const stageId = readString(rawStageId);

  if (!eventId) {
    errors.push('event_id is required');
  } else if (body.eventId !== undefined && body.eventId !== eventId) {
    errors.push('Body eventId must match route eventId');
  } else if (body.event_id !== undefined && body.event_id !== eventId) {
    errors.push('Body event_id must match route eventId');
  }

  if (!status || !isCanonStatus(status)) {
    errors.push('status is invalid');
  }

  if (!stageId || !isCanonizationStageId(stageId)) {
    errors.push('stageId is invalid');
  }

  const path = parsePath(payload.path, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const input = {
    eventId: eventId!,
    status: status as CanonStatus,
    stageId: stageId as CanonizationStageId,
    note: readOptionalString(payload.note),
    path,
  } satisfies LoreCanonizationOverrideInput;

  if (options.validate !== false) {
    const validationErrors = validateLoreCanonizationOverride(input, options.dataset);
    if (validationErrors.length > 0) {
      return { ok: false, errors: validationErrors };
    }
  }

  return { ok: true, input };
};

export const toCanonization = (input: LoreCanonizationOverrideInput, updatedAt?: string): Canonization => {
  return {
    status: input.status,
    stageId: input.stageId,
    note: input.note,
    path: input.path,
    updatedAt,
  };
};
