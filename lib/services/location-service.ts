/**
 * Location Service - Business Logic Layer
 *
 * Handles all business logic for location CRUD operations.
 * Follows Clean Architecture by keeping business logic separate from data access.
 */

import { LocationRepository } from '@/lib/repositories/locationRepository'
import { generateUniqueSlug, isValidSlug } from '@/lib/utils/slug'
import type { Location, CreateLocationInput, UpdateLocationInput } from '@/lib/types/map'

// Validation constants
const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 200
const DESCRIPTION_MAX_LENGTH = 2000

// Map bounds (for coordinate validation)
const MAP_BOUNDS = {
  minX: 0,
  maxX: 1000,
  minY: 0,
  maxY: 1000,
}

/**
 * Log admin actions to server console
 */
function logAdminAction(
  action: 'create' | 'update' | 'delete',
  adminAddress: string,
  locationId: string,
  status: 'success' | 'failed',
  error?: string
): void {
  const timestamp = new Date().toISOString()
  const truncatedAddress = `${adminAddress.slice(0, 6)}...${adminAddress.slice(-4)}`

  if (status === 'success') {
    console.log(`[${timestamp}] [LOCATION] admin=${truncatedAddress} action=${action} id=${locationId} status=success`)
  } else {
    console.error(`[${timestamp}] [LOCATION] admin=${truncatedAddress} action=${action} id=${locationId} status=failed error="${error}"`)
  }
}

/**
 * Validate location name
 */
function validateName(name: string | undefined): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' }
  }

  const trimmed = name.trim()

  if (trimmed.length < NAME_MIN_LENGTH) {
    return { valid: false, error: 'Name cannot be empty' }
  }

  if (trimmed.length > NAME_MAX_LENGTH) {
    return { valid: false, error: `Name cannot exceed ${NAME_MAX_LENGTH} characters` }
  }

  return { valid: true }
}

/**
 * Validate description
 */
function validateDescription(description: string | undefined): { valid: boolean; error?: string } {
  if (description === undefined || description === null) {
    return { valid: true }
  }

  if (typeof description !== 'string') {
    return { valid: false, error: 'Description must be a string' }
  }

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return { valid: false, error: `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters` }
  }

  return { valid: true }
}

/**
 * Validate coordinates
 */
function validateCoordinates(coordinates: { x: number; y: number } | undefined): { valid: boolean; error?: string } {
  if (!coordinates) {
    return { valid: false, error: 'Coordinates are required' }
  }

  if (typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' }
  }

  if (!Number.isFinite(coordinates.x) || !Number.isFinite(coordinates.y)) {
    return { valid: false, error: 'Coordinates must be finite numbers' }
  }

  if (
    coordinates.x < MAP_BOUNDS.minX ||
    coordinates.x > MAP_BOUNDS.maxX ||
    coordinates.y < MAP_BOUNDS.minY ||
    coordinates.y > MAP_BOUNDS.maxY
  ) {
    return {
      valid: false,
      error: `Coordinates must be within map bounds (${MAP_BOUNDS.minX}-${MAP_BOUNDS.maxX}, ${MAP_BOUNDS.minY}-${MAP_BOUNDS.maxY})`,
    }
  }

  return { valid: true }
}

export class LocationService {
  private repository: LocationRepository

  constructor(repository?: LocationRepository) {
    this.repository = repository ?? new LocationRepository()
  }

  /**
   * Get all locations
   */
  async getAll(): Promise<Location[]> {
    return this.repository.getAll()
  }

  /**
   * Get a location by ID
   */
  async getById(id: string): Promise<Location | null> {
    return this.repository.getById(id)
  }

  /**
   * Create a new location
   */
  async create(input: CreateLocationInput, adminAddress: string): Promise<Location> {
    // Validate input
    const errors: string[] = []

    const nameValidation = validateName(input.name)
    if (!nameValidation.valid) errors.push(nameValidation.error!)

    const descValidation = validateDescription(input.description)
    if (!descValidation.valid) errors.push(descValidation.error!)

    const coordValidation = validateCoordinates(input.coordinates)
    if (!coordValidation.valid) errors.push(coordValidation.error!)

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }

    // Generate unique slug
    const existingSlugs = await this.repository.getAllIds()
    const slug = generateUniqueSlug(input.name, existingSlugs)

    if (!isValidSlug(slug)) {
      throw new ValidationError('Could not generate valid slug from name', [
        'Name must contain at least one alphanumeric character',
      ])
    }

    try {
      const location = await this.repository.create(slug, input)
      logAdminAction('create', adminAddress, slug, 'success')
      return location
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logAdminAction('create', adminAddress, slug, 'failed', message)
      throw error
    }
  }

  /**
   * Update an existing location
   */
  async update(id: string, input: UpdateLocationInput, adminAddress: string): Promise<Location> {
    // Check if location exists
    const existing = await this.repository.getById(id)
    if (!existing) {
      throw new NotFoundError(`Location '${id}' not found`)
    }

    // Validate input
    const errors: string[] = []

    if (input.name !== undefined) {
      const nameValidation = validateName(input.name)
      if (!nameValidation.valid) errors.push(nameValidation.error!)
    }

    if (input.description !== undefined) {
      const descValidation = validateDescription(input.description)
      if (!descValidation.valid) errors.push(descValidation.error!)
    }

    if (input.coordinates !== undefined) {
      const coordValidation = validateCoordinates(input.coordinates)
      if (!coordValidation.valid) errors.push(coordValidation.error!)
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }

    // Check if there are any actual updates
    if (
      input.name === undefined &&
      input.description === undefined &&
      input.coordinates === undefined
    ) {
      throw new ValidationError('No updates provided', ['At least one field must be updated'])
    }

    try {
      const location = await this.repository.update(id, input)
      logAdminAction('update', adminAddress, id, 'success')
      return location
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logAdminAction('update', adminAddress, id, 'failed', message)
      throw error
    }
  }

  /**
   * Delete a location
   */
  async delete(id: string, adminAddress: string): Promise<void> {
    // Check if location exists
    const existing = await this.repository.getById(id)
    if (!existing) {
      throw new NotFoundError(`Location '${id}' not found`)
    }

    // Check for staked characters
    const stakedCount = await this.repository.getStakedCharacterCount(id)
    if (stakedCount > 0) {
      throw new ConflictError(
        `Cannot delete location: ${stakedCount} character${stakedCount === 1 ? ' is' : 's are'} staked here`
      )
    }

    try {
      await this.repository.delete(id)
      logAdminAction('delete', adminAddress, id, 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logAdminAction('delete', adminAddress, id, 'failed', message)
      throw error
    }
  }

  /**
   * Get staked character count for a location
   */
  async getStakedCharacterCount(id: string): Promise<number> {
    return this.repository.getStakedCharacterCount(id)
  }
}

// Custom error classes
export class ValidationError extends Error {
  details: string[]

  constructor(message: string, details: string[]) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}
