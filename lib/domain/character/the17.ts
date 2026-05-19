export const THE_17_TRAIT_TYPE = 'The 17'
export const THE_17_FILTER_VALUE = 'The 17'
export const THE_17_TOKEN_IDS = [
  319,
  375,
  416,
  833,
  1250,
  1353,
  1843,
  1851,
  3077,
  3886,
  4369,
  4449,
  4485,
  4701,
  5150,
  5734,
  6179,
  6218,
] as const

export const THE_17_COUNT = THE_17_TOKEN_IDS.length

export function isThe17HardcodedFilter(value: string | null | undefined): boolean {
  return value === THE_17_FILTER_VALUE
}
