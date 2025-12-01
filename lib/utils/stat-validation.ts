/**
 * Stat Validation Utilities
 * Validation rules for character stats and name
 */

export const STAT_CONSTRAINTS = {
  coreStats: { min: 1, max: 30 },      // STR, DEX, CON, INT, WIS, CHA
  hp: { min: 0, max: 999 },
  maxHp: { min: 1, max: 999 },
  ac: { min: 0, max: 30 },
  speed: { min: 0, max: 120 },
  level: { min: 1, max: 20 },
  experience: { min: 0, max: 999999 },
  name: { maxLength: 100 }
} as const

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate character name
 * @param name - The name to validate
 * @returns Validation result with error message if invalid
 */
export function validateName(name: string | null | undefined): ValidationResult {
  if (name === null || name === undefined || name === '') {
    // Empty/null names are allowed (clears the name)
    return { valid: true }
  }

  const trimmed = name.trim()
  if (trimmed.length > STAT_CONSTRAINTS.name.maxLength) {
    return {
      valid: false,
      error: `Name must be ${STAT_CONSTRAINTS.name.maxLength} characters or less`
    }
  }

  return { valid: true }
}

/**
 * Validate a core stat (STR, DEX, CON, INT, WIS, CHA)
 * @param value - The stat value to validate
 * @param statName - Name of the stat for error messages
 * @returns Validation result with error message if invalid
 */
export function validateCoreStat(
  value: number | null | undefined,
  statName: string
): ValidationResult {
  if (value === null || value === undefined) {
    // Null values are allowed for uninitialized characters
    return { valid: true }
  }

  if (!Number.isInteger(value)) {
    return {
      valid: false,
      error: `${statName} must be a whole number`
    }
  }

  const { min, max } = STAT_CONSTRAINTS.coreStats
  if (value < min || value > max) {
    return {
      valid: false,
      error: `${statName} must be between ${min} and ${max}`
    }
  }

  return { valid: true }
}

/**
 * Validate HP (current hit points)
 */
export function validateHp(value: number | null | undefined): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: true }
  }

  if (!Number.isInteger(value)) {
    return { valid: false, error: 'HP must be a whole number' }
  }

  const { min, max } = STAT_CONSTRAINTS.hp
  if (value < min || value > max) {
    return { valid: false, error: `HP must be between ${min} and ${max}` }
  }

  return { valid: true }
}

/**
 * Validate Max HP
 */
export function validateMaxHp(value: number | null | undefined): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: true }
  }

  if (!Number.isInteger(value)) {
    return { valid: false, error: 'Max HP must be a whole number' }
  }

  const { min, max } = STAT_CONSTRAINTS.maxHp
  if (value < min || value > max) {
    return { valid: false, error: `Max HP must be between ${min} and ${max}` }
  }

  return { valid: true }
}

/**
 * Validate AC (Armor Class)
 */
export function validateAc(value: number | null | undefined): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: true }
  }

  if (!Number.isInteger(value)) {
    return { valid: false, error: 'AC must be a whole number' }
  }

  const { min, max } = STAT_CONSTRAINTS.ac
  if (value < min || value > max) {
    return { valid: false, error: `AC must be between ${min} and ${max}` }
  }

  return { valid: true }
}

/**
 * Validate Speed
 */
export function validateSpeed(value: number | null | undefined): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: true }
  }

  if (!Number.isInteger(value)) {
    return { valid: false, error: 'Speed must be a whole number' }
  }

  const { min, max } = STAT_CONSTRAINTS.speed
  if (value < min || value > max) {
    return { valid: false, error: `Speed must be between ${min} and ${max}` }
  }

  return { valid: true }
}

/**
 * Validate Level
 */
export function validateLevel(value: number | null | undefined): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: true }
  }

  if (!Number.isInteger(value)) {
    return { valid: false, error: 'Level must be a whole number' }
  }

  const { min, max } = STAT_CONSTRAINTS.level
  if (value < min || value > max) {
    return { valid: false, error: `Level must be between ${min} and ${max}` }
  }

  return { valid: true }
}

/**
 * Validate Experience
 */
export function validateExperience(value: number | null | undefined): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: true }
  }

  if (!Number.isInteger(value)) {
    return { valid: false, error: 'Experience must be a whole number' }
  }

  const { min, max } = STAT_CONSTRAINTS.experience
  if (value < min || value > max) {
    return { valid: false, error: `Experience must be between ${min} and ${max}` }
  }

  return { valid: true }
}

/**
 * Validate all derived stats at once
 */
export interface DerivedStatsInput {
  hp?: number | null
  max_hp?: number | null
  ac?: number | null
  speed?: number | null
  level?: number | null
  experience?: number | null
}

export function validateDerivedStats(stats: DerivedStatsInput): ValidationResult[] {
  const results: ValidationResult[] = []

  if ('hp' in stats) results.push(validateHp(stats.hp))
  if ('max_hp' in stats) results.push(validateMaxHp(stats.max_hp))
  if ('ac' in stats) results.push(validateAc(stats.ac))
  if ('speed' in stats) results.push(validateSpeed(stats.speed))
  if ('level' in stats) results.push(validateLevel(stats.level))
  if ('experience' in stats) results.push(validateExperience(stats.experience))

  return results
}

/**
 * Validate all core stats at once
 */
export interface CoreStatsInput {
  str?: number | null
  dex?: number | null
  con?: number | null
  int?: number | null
  wis?: number | null
  cha?: number | null
}

export function validateCoreStats(stats: CoreStatsInput): ValidationResult[] {
  const results: ValidationResult[] = []

  if ('str' in stats) results.push(validateCoreStat(stats.str, 'STR'))
  if ('dex' in stats) results.push(validateCoreStat(stats.dex, 'DEX'))
  if ('con' in stats) results.push(validateCoreStat(stats.con, 'CON'))
  if ('int' in stats) results.push(validateCoreStat(stats.int, 'INT'))
  if ('wis' in stats) results.push(validateCoreStat(stats.wis, 'WIS'))
  if ('cha' in stats) results.push(validateCoreStat(stats.cha, 'CHA'))

  return results
}
