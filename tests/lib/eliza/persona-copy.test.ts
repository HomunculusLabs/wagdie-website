import {
  buildNeutralDefaultPersonality,
  neutralizeLegacyDefaultPersonaSeedsDeep,
  neutralizeLegacyDefaultPersonaSeedText,
} from '@/lib/eliza/persona-copy'

describe('persona copy helpers', () => {
  it('builds neutral default personality copy', () => {
    expect(buildNeutralDefaultPersonality('123')).toBe(
      'A mysterious character whose story is still being written. Character #123.'
    )
  })

  it('neutralizes the exact legacy generated default seed', () => {
    expect(
      neutralizeLegacyDefaultPersonaSeedText(
        'A mysterious character from the world of WAGDIE. Character #4040.'
      )
    ).toBe('A mysterious character whose story is still being written. Character #4040.')
  })

  it('neutralizes embedded exact legacy generated default seed text', () => {
    expect(
      neutralizeLegacyDefaultPersonaSeedText(
        'Use the existing draft: A mysterious character from the world of WAGDIE. Character #4040.'
      )
    ).toBe(
      'Use the existing draft: A mysterious character whose story is still being written. Character #4040.'
    )
  })

  it('does not rewrite arbitrary user-authored WAGDIE mentions', () => {
    const userAuthored = 'This character once carved WAGDIE into a shield.'

    expect(neutralizeLegacyDefaultPersonaSeedText(userAuthored)).toBe(userAuthored)
  })

  it('deep-neutralizes arrays and plain objects without mutating the input', () => {
    const input = {
      bio: ['A mysterious character from the world of WAGDIE. Character #17.'],
      nested: {
        lore: ['Keep this WAGDIE reference because it is not the generated seed.'],
      },
    }

    const output = neutralizeLegacyDefaultPersonaSeedsDeep(input)

    expect(output).toEqual({
      bio: ['A mysterious character whose story is still being written. Character #17.'],
      nested: {
        lore: ['Keep this WAGDIE reference because it is not the generated seed.'],
      },
    })
    expect(input.bio[0]).toBe('A mysterious character from the world of WAGDIE. Character #17.')
  })
})
