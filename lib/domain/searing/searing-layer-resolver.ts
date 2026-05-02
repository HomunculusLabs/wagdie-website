import type { CharacterMetadata, NFTAttribute } from '../../../types/character'
import type { ConcordSearingMap, ConcordSearingVariant } from './concord-searing-map'
import { CONCORD_SEARING_VARIANT_KEYS } from './concord-searing-map'
import { ALIGNMENT_MAP } from './alignment-map'

export const WAGDIE_LAYER_BASE_URL = process.env.WAGDIE_LAYER_BASE_URL || '/images/wagdie-layers'

export const SEARING_LAYERS = [
  'Background',
  'Back',
  'Decrepit',
  'Body',
  'Armor',
  'Hair',
  'Mask',
  'Front',
] as const

const SEARING_LAYER_SET = new Set<string>(SEARING_LAYERS)

export type SearingLayerName = typeof SEARING_LAYERS[number]

export type SearingLayer = {
  trait_type: SearingLayerName
  value?: string | number
  url: string
  position: number
  seared: string
}

export type ResolvedSearingVariant = {
  location: string
  newTrait: string
  makesBald: boolean
  source: 'default' | typeof CONCORD_SEARING_VARIANT_KEYS[number]
}

export type SearingLayerResolution = {
  alignment: string
  variant: ResolvedSearingVariant
  layers: SearingLayer[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeAttribute(value: unknown): NFTAttribute | null {
  if (!isRecord(value) || typeof value.trait_type !== 'string') return null

  const rawValue = value.value
  if (
    typeof rawValue !== 'string' &&
    typeof rawValue !== 'number' &&
    typeof rawValue !== 'undefined'
  ) {
    return null
  }

  return {
    trait_type: value.trait_type,
    ...(rawValue !== undefined ? { value: rawValue } : {}),
  } as NFTAttribute
}

export function normalizeNftAttributes(metadataOrAttributes: CharacterMetadata | NFTAttribute[] | unknown): NFTAttribute[] {
  const maybeAttributes = Array.isArray(metadataOrAttributes)
    ? metadataOrAttributes
    : isRecord(metadataOrAttributes) && Array.isArray(metadataOrAttributes.attributes)
      ? metadataOrAttributes.attributes
      : []

  return maybeAttributes
    .map(normalizeAttribute)
    .filter((attribute): attribute is NFTAttribute => attribute !== null)
}

export function getAttributeByTraitType(attributes: NFTAttribute[], traitType: string): NFTAttribute | undefined {
  const target = traitType.toLowerCase()
  return attributes.find((attribute) => attribute.trait_type.toLowerCase() === target)
}

export function getAlignmentForAttributes(attributes: NFTAttribute[]): string {
  const explicitAlignment = getAttributeByTraitType(attributes, 'Alignment')?.value
  if (typeof explicitAlignment === 'string' && explicitAlignment.trim()) {
    return explicitAlignment.trim()
  }

  const background = getAttributeByTraitType(attributes, 'Background')?.value
  if (typeof background !== 'string' || !background.trim()) {
    return 'Unknown'
  }

  const backgroundCompare = background.toLowerCase()
  for (const [alignment, backgrounds] of Object.entries(ALIGNMENT_MAP)) {
    if (backgrounds.some((candidate) => candidate.toLowerCase().includes(backgroundCompare))) {
      return alignment
    }
  }

  return 'Unknown'
}

function getVariantAlignment(variant: ConcordSearingVariant | null | undefined): string | null {
  if (!variant) return null

  const traits = Array.isArray(variant.traits)
    ? variant.traits
    : Array.isArray(variant.trait)
      ? variant.trait
      : []

  const firstTrait = traits[0]
  if (!isRecord(firstTrait)) return null

  const alignment = firstTrait.Alignment ?? firstTrait.alignment
  return typeof alignment === 'string' && alignment.trim() ? alignment.trim() : null
}

function stringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function booleanOrFalse(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false
}

export function resolveSearingVariant(
  concord: ConcordSearingMap,
  alignment: string
): ResolvedSearingVariant {
  const normalizedAlignment = alignment.toLowerCase()

  for (const key of CONCORD_SEARING_VARIANT_KEYS) {
    const variant = concord[key]
    const variantAlignment = getVariantAlignment(variant)

    if (variantAlignment && variantAlignment.toLowerCase() === normalizedAlignment) {
      return {
        location: stringOrEmpty(variant?.location),
        newTrait: stringOrEmpty(variant?.new_trait),
        makesBald: booleanOrFalse(variant?.makesBald),
        source: key,
      }
    }
  }

  return {
    location: concord.location || '',
    newTrait: concord.new_trait || '',
    makesBald: Boolean(concord.makesBald),
    source: 'default',
  }
}

function layerUrl(layer: string, value: string | number | undefined): string {
  return `${WAGDIE_LAYER_BASE_URL}/${layer}/${encodeURIComponent(String(value ?? 'None'))}.png`
}

function searingLayerUrl(location: string, newTrait: string): string {
  return `${WAGDIE_LAYER_BASE_URL}/Searing/${encodeURIComponent(location)}/${encodeURIComponent(newTrait)}.png`
}

export function resolveSearingLayersForCharacter(
  metadataOrAttributes: CharacterMetadata | NFTAttribute[] | unknown,
  concord: ConcordSearingMap
): SearingLayerResolution {
  const attributes = normalizeNftAttributes(metadataOrAttributes)
  const alignment = getAlignmentForAttributes(attributes)
  const variant = resolveSearingVariant(concord, alignment)

  const workingAttributes: NFTAttribute[] = [...attributes]
  if (variant.location && !workingAttributes.find((attribute) => attribute.trait_type === variant.location)) {
    if (variant.location === 'Mask+Armor' && !workingAttributes.find((attribute) => attribute.trait_type === 'Mask')) {
      workingAttributes.push({ trait_type: 'Mask', value: 'None' })
    }

    workingAttributes.push({ trait_type: variant.location, value: 'None' })
  }

  const affectedLayers = variant.location === 'Mask+Armor'
    ? new Set<string>(['Mask', 'Armor'])
    : new Set<string>([variant.location])

  const layers = workingAttributes
    .filter((attribute) => SEARING_LAYER_SET.has(attribute.trait_type))
    .map((attribute) => {
      const layerName = attribute.trait_type as SearingLayerName
      let url = layerUrl(layerName, attribute.value)
      let seared = ''

      if (variant.makesBald && layerName === 'Hair') {
        url = layerUrl(layerName, 'None')
      }

      if (variant.location && affectedLayers.has(layerName)) {
        if (variant.location === 'Mask+Armor' && layerName === 'Armor') {
          url = layerUrl(layerName, 'None')
        } else if (variant.newTrait) {
          url = searingLayerUrl(variant.location, variant.newTrait)
          seared = variant.newTrait
        }
      }

      return {
        trait_type: layerName,
        value: attribute.value,
        url,
        position: SEARING_LAYERS.indexOf(layerName),
        seared,
      }
    })
    .sort((a, b) => a.position - b.position)

  return {
    alignment,
    variant,
    layers,
  }
}

export function validateSearingLayerResolution(resolution: SearingLayerResolution): void {
  if (!resolution.variant.location.trim()) {
    throw new Error('Searing map is missing a resolved layer location')
  }

  if (!resolution.variant.newTrait.trim()) {
    throw new Error('Searing map is missing a resolved new_trait')
  }

  if (resolution.layers.length === 0) {
    throw new Error('Character metadata does not contain any composable WAGDIE layers')
  }

  const searedLayer = resolution.layers.find((layer) => layer.seared)
  if (!searedLayer) {
    throw new Error('Resolved layer list does not contain a seared layer')
  }
}
