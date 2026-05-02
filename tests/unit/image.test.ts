import {
  getCharacterImageCandidates,
  getCharacterImageUrl,
  getIpfsUrl,
} from '@/lib/utils/image'

describe('getCharacterImageUrl', () => {
  it('uses the local static asset for normal unseared tokens', () => {
    expect(getCharacterImageUrl(1, {
      image: 'ipfs://bafkreiexample',
    }, 'https://example.com/db.png')).toBe('/images/characters/1.png')
  })

  it('uses infected image candidates before seared and local images when currently infected', () => {
    expect(getCharacterImageUrl(1, {
      isSeared: true,
      searImage: 'https://example.com/seared.png',
      infectedImage: 'https://cdn.example.com/infected.png',
    }, null, {
      infectionStatus: 'infected',
    })).toBe('https://cdn.example.com/infected.png')
  })

  it('uses searing materialization image before legacy sear image and local static image', () => {
    expect(getCharacterImageCandidates(1, {
      isSeared: true,
      searImage: 'https://example.com/legacy-seared.png',
      searing_materialization: {
        seared_image_url: 'https://storage.googleapis.com/seared-wagdie-images/1/tx-test-log-1.png',
      },
    })).toEqual([
      'https://storage.googleapis.com/seared-wagdie-images/1/tx-test-log-1.png',
      'https://example.com/legacy-seared.png',
      '/images/characters/1.png',
      '/images/placeholder-character.svg',
    ])
  })

  it('uses DB image URL as a seared candidate when metadata indicates the character is seared', () => {
    expect(getCharacterImageUrl(1, {
      isSeared: true,
    }, 'https://example.com/db-seared.png')).toBe('https://example.com/db-seared.png')
  })

  it('does not promote original metadata image when only isSeared is present', () => {
    expect(getCharacterImageUrl(1, {
      isSeared: true,
      image: 'ipfs://original-source-image',
    })).toBe('/images/characters/1.png')
  })

  it('falls back to the placeholder when a token has no usable dynamic or local image', () => {
    expect(getCharacterImageUrl(0, {
      image: 'ipfs://bafkreiexample',
    }, 'https://example.com/db.png')).toBe('/images/placeholder-character.svg')
  })

  it('still normalizes IPFS URLs for collector and utility callers', () => {
    expect(getIpfsUrl('ipfs://bafkreiexample')).toBe('https://ipfs.io/ipfs/bafkreiexample')
  })
})
