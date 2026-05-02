import {
  resolveSearingLayersForCharacter,
  resolveSearingVariant,
} from '@/lib/domain/searing/searing-layer-resolver'
import type { ConcordSearingMap } from '@/lib/domain/searing/concord-searing-map'

const baseConcord: ConcordSearingMap = {
  token_name: 'Test Concord',
  tokenId: '42',
  concordTokenId: 42,
  location: 'Mask',
  new_trait: 'Bone Visage',
  makesBald: false,
}

const baseAttributes = [
  { trait_type: 'Background', value: 'Her Glory' },
  { trait_type: 'Back', value: 'Black Wings' },
  { trait_type: 'Body', value: 'Pale' },
  { trait_type: 'Armor', value: 'Chain' },
  { trait_type: 'Hair', value: 'Long' },
  { trait_type: 'Mask', value: 'None' },
  { trait_type: 'Front', value: 'Smoke' },
]

describe('searing layer resolver', () => {
  it('applies default searing layers without mutating the concord map', () => {
    const result = resolveSearingLayersForCharacter({ attributes: baseAttributes }, baseConcord)

    expect(result.variant).toMatchObject({ location: 'Mask', newTrait: 'Bone Visage', source: 'default' })
    expect(result.layers.map((layer) => layer.trait_type)).toEqual([
      'Background',
      'Back',
      'Body',
      'Armor',
      'Hair',
      'Mask',
      'Front',
    ])
    expect(result.layers.find((layer) => layer.trait_type === 'Mask')?.url).toBe(
      '/images/wagdie-layers/Searing/Mask/Bone%20Visage.png'
    )
    expect(baseConcord.location).toBe('Mask')
  })

  it('selects alignment-specific variants from legacy alt traits', () => {
    const concord: ConcordSearingMap = {
      ...baseConcord,
      alt_1: {
        traits: [{ Alignment: 'Lawful Good' }],
        location: 'Armor',
        new_trait: 'Radiant Plate',
        makesBald: true,
      },
    }

    const variant = resolveSearingVariant(concord, 'Lawful Good')
    expect(variant).toEqual({
      location: 'Armor',
      newTrait: 'Radiant Plate',
      makesBald: true,
      source: 'alt_1',
    })

    const result = resolveSearingLayersForCharacter({ attributes: baseAttributes }, concord)
    expect(result.layers.find((layer) => layer.trait_type === 'Hair')?.url).toBe(
      '/images/wagdie-layers/Hair/None.png'
    )
    expect(result.layers.find((layer) => layer.trait_type === 'Armor')?.url).toBe(
      '/images/wagdie-layers/Searing/Armor/Radiant%20Plate.png'
    )
    expect(concord.location).toBe('Mask')
  })

  it('does not treat Back as affected by a Background sear', () => {
    const concord: ConcordSearingMap = {
      ...baseConcord,
      location: 'Background',
      new_trait: 'New Dawn',
    }

    const result = resolveSearingLayersForCharacter({ attributes: baseAttributes }, concord)

    expect(result.layers.find((layer) => layer.trait_type === 'Background')?.url).toBe(
      '/images/wagdie-layers/Searing/Background/New%20Dawn.png'
    )
    expect(result.layers.find((layer) => layer.trait_type === 'Back')?.url).toBe(
      '/images/wagdie-layers/Back/Black%20Wings.png'
    )
  })

  it('adds a missing Front trait and places Orb of the Void as the final searing layer', () => {
    const concord: ConcordSearingMap = {
      ...baseConcord,
      token_name: 'Orb of the Leorn',
      concordTokenId: 587300,
      location: 'Front',
      new_trait: 'Orb of the Void',
    }
    const attributesWithoutFront = baseAttributes.filter((attribute) => attribute.trait_type !== 'Front')

    const result = resolveSearingLayersForCharacter({ attributes: attributesWithoutFront }, concord)

    expect(result.variant).toMatchObject({ location: 'Front', newTrait: 'Orb of the Void' })
    expect(result.layers.map((layer) => layer.trait_type)).toEqual([
      'Background',
      'Back',
      'Body',
      'Armor',
      'Hair',
      'Mask',
      'Front',
    ])
    expect(result.layers.at(-1)).toMatchObject({
      trait_type: 'Front',
      value: 'None',
      seared: 'Orb of the Void',
      url: '/images/wagdie-layers/Searing/Front/Orb%20of%20the%20Void.png',
    })
  })

  it('preserves the legacy Mask+Armor behavior', () => {
    const concord: ConcordSearingMap = {
      ...baseConcord,
      location: 'Mask+Armor',
      new_trait: 'Merged Doom',
    }

    const result = resolveSearingLayersForCharacter({ attributes: baseAttributes }, concord)

    expect(result.layers.find((layer) => layer.trait_type === 'Mask')?.url).toBe(
      '/images/wagdie-layers/Searing/Mask%2BArmor/Merged%20Doom.png'
    )
    expect(result.layers.find((layer) => layer.trait_type === 'Armor')?.url).toBe(
      '/images/wagdie-layers/Armor/None.png'
    )
  })
})
