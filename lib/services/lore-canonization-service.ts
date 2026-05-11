import { getActiveLoreBaseDataset } from '@/lib/lore/base-query';
import type { LoreBaseDataset } from '@/lib/lore/base-dataset';
import {
  parseLoreCanonizationOverrideInput,
  validateLoreCanonizationOverride,
  type LoreCanonizationOverride,
  type LoreCanonizationOverrideInput,
  type LoreCanonizationOverrideSet,
} from '@/lib/lore/canonization-overrides';
import {
  loreCanonizationRepository,
  type LoreCanonizationRepository,
} from '@/lib/repositories/lore-canonization-repository';
import type { Canonization, LoreEvent } from '@/lib/lore/types';

export interface LoreCanonizationAdminRecord {
  eventId: string;
  event: LoreEvent;
  staticCanon: Canonization;
  draftOverride?: LoreCanonizationOverride;
  publishedOverride?: LoreCanonizationOverride;
  override?: LoreCanonizationOverride;
}

export class LoreCanonizationValidationError extends Error {
  details: string[];

  constructor(message: string, details: string[]) {
    super(message);
    this.name = 'LoreCanonizationValidationError';
    this.details = details;
  }
}

export class LoreCanonizationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoreCanonizationNotFoundError';
  }
}

export type LoreCanonizationBaseDatasetLoader = () => Promise<LoreBaseDataset>;

export class LoreCanonizationService {
  constructor(
    private repository: LoreCanonizationRepository = loreCanonizationRepository,
    private loadBaseDataset: LoreCanonizationBaseDatasetLoader = getActiveLoreBaseDataset,
  ) {}

  async listAdminRecords(): Promise<LoreCanonizationAdminRecord[]> {
    const overrideSets = await this.repository.findAll();
    const overridesByEventId = new Map(overrideSets.map((overrideSet) => [overrideSet.eventId, overrideSet]));

    const dataset = await this.loadBaseDataset();
    return dataset.events.map((event) => this.toAdminRecord(event, overridesByEventId.get(event.id)));
  }

  async getAdminRecord(eventId: string): Promise<LoreCanonizationAdminRecord> {
    const dataset = await this.loadBaseDataset();
    const event = dataset.indexes.eventsById.get(eventId);
    if (!event) {
      throw new LoreCanonizationNotFoundError(`Lore event '${eventId}' not found`);
    }

    const overrideSet = await this.repository.findByEventId(eventId);
    return this.toAdminRecord(event, overrideSet ?? undefined);
  }

  async saveDraft(
    eventId: string,
    body: unknown,
    adminAddress: string,
  ): Promise<LoreCanonizationAdminRecord> {
    const dataset = await this.loadBaseDataset();
    const parsed = parseLoreCanonizationOverrideInput(body, eventId, { dataset });
    if (!parsed.ok) {
      throw new LoreCanonizationValidationError('Invalid canonization override', parsed.errors);
    }

    const overrideSet = await this.repository.upsertDraft(parsed.input, adminAddress);
    const event = dataset.indexes.eventsById.get(eventId);
    if (!event) {
      throw new LoreCanonizationNotFoundError(`Lore event '${eventId}' not found`);
    }

    return this.toAdminRecord(event, overrideSet);
  }

  async publishDraft(eventId: string, adminAddress: string): Promise<LoreCanonizationAdminRecord> {
    const dataset = await this.loadBaseDataset();
    const event = dataset.indexes.eventsById.get(eventId);
    if (!event) {
      throw new LoreCanonizationNotFoundError(`Lore event '${eventId}' not found`);
    }

    const existing = await this.repository.findByEventId(eventId);
    if (!existing?.draftOverride) {
      throw new LoreCanonizationValidationError('No draft override to publish', [
        `Override for '${eventId}' has no unpublished draft`,
      ]);
    }

    const validationInput: LoreCanonizationOverrideInput = {
      eventId,
      status: existing.draftOverride.canon.status,
      stageId: existing.draftOverride.canon.stageId,
      note: existing.draftOverride.canon.note,
      path: existing.draftOverride.canon.path,
    };
    const errors = validateLoreCanonizationOverride(validationInput, dataset);
    if (errors.length > 0) {
      throw new LoreCanonizationValidationError('Invalid canonization override', errors);
    }

    const overrideSet = await this.repository.publish(validationInput, adminAddress);
    return this.toAdminRecord(event, overrideSet);
  }

  async resetOverride(eventId: string): Promise<LoreCanonizationAdminRecord> {
    const dataset = await this.loadBaseDataset();
    const event = dataset.indexes.eventsById.get(eventId);
    if (!event) {
      throw new LoreCanonizationNotFoundError(`Lore event '${eventId}' not found`);
    }

    await this.repository.delete(eventId);
    return this.toAdminRecord(event);
  }

  private toAdminRecord(
    event: LoreEvent,
    overrideSet?: LoreCanonizationOverrideSet,
  ): LoreCanonizationAdminRecord {
    return {
      eventId: event.id,
      event,
      staticCanon: event.canon,
      draftOverride: overrideSet?.draftOverride,
      publishedOverride: overrideSet?.publishedOverride,
      override: overrideSet?.override,
    };
  }
}

export const loreCanonizationService = new LoreCanonizationService();
