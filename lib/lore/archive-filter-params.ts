import { isCanonizationStageId } from './canonization';
import { canonStatuses } from './types';
import type { CanonStatus, LoreArchiveFilters } from './types';

type FilterInputValue = string | string[] | undefined | null;
type FilterInput = URLSearchParams | Record<string, FilterInputValue> | undefined | null;

const isCanonStatus = (value: string): value is CanonStatus => {
  return (canonStatuses as readonly string[]).includes(value);
};

const firstValue = (value: FilterInputValue): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
};

const cleanValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const getParam = (input: FilterInput, key: keyof LoreArchiveFilters): string | undefined => {
  if (!input) {
    return undefined;
  }

  if (input instanceof URLSearchParams) {
    return cleanValue(input.get(key) ?? undefined);
  }

  return cleanValue(firstValue(input[key]));
};

export const parseLoreArchiveFilters = (input: FilterInput): LoreArchiveFilters => {
  const canonStatus = getParam(input, 'canonStatus');
  const canonStage = getParam(input, 'canonStage');

  return {
    season: getParam(input, 'season'),
    location: getParam(input, 'location'),
    character: getParam(input, 'character'),
    keyword: getParam(input, 'keyword'),
    canonStatus: canonStatus && isCanonStatus(canonStatus) ? canonStatus : undefined,
    canonStage: canonStage && isCanonizationStageId(canonStage) ? canonStage : undefined,
  };
};
