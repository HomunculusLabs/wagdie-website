const LEGACY_DEFAULT_PERSONA_PATTERN = /A mysterious character from the world of WAGDIE\. Character #([^\n.]+)\./g

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function buildNeutralDefaultPersonality(tokenId: string): string {
  return `A mysterious character whose story is still being written. Character #${tokenId}.`
}

export function neutralizeLegacyDefaultPersonaSeedText(value: string): string {
  return value.replace(LEGACY_DEFAULT_PERSONA_PATTERN, (_match, tokenId: string) => (
    buildNeutralDefaultPersonality(tokenId)
  ))
}

export function neutralizeLegacyDefaultPersonaSeedsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return neutralizeLegacyDefaultPersonaSeedText(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => neutralizeLegacyDefaultPersonaSeedsDeep(item)) as T
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, neutralizeLegacyDefaultPersonaSeedsDeep(child)])
    ) as T
  }

  return value
}
