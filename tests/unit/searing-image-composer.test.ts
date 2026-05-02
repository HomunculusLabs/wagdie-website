import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { resolveSearingLayersForCharacter } from '@/lib/domain/searing/searing-layer-resolver'
import { SearingImageComposer } from '@/lib/services/searing-image-composer'
import type { ConcordSearingMap } from '@/lib/domain/searing/concord-searing-map'
import type { CharacterMetadata } from '@/types/character'

async function rawRgba(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer()
}

function changedPixelCount(a: Buffer, b: Buffer): number {
  const pixelCount = Math.min(a.length, b.length) / 4
  let changed = 0

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4
    if (
      a[offset] !== b[offset] ||
      a[offset + 1] !== b[offset + 1] ||
      a[offset + 2] !== b[offset + 2] ||
      a[offset + 3] !== b[offset + 3]
    ) {
      changed += 1
    }
  }

  return changed
}

describe('SearingImageComposer', () => {
  it('composes WAGDIE #5873 with Orb of the Void as a visible Front searing layer', async () => {
    const metadataPath = path.join(process.cwd(), 'public/metadata/characters/5873.json')
    const sourceImagePath = path.join(process.cwd(), 'public/images/characters/5873.png')
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8')) as CharacterMetadata
    const concord: ConcordSearingMap = {
      token_name: 'Orb of the Leorn',
      tokenId: '0',
      concordTokenId: 0,
      location: 'Front',
      new_trait: 'Orb of the Void',
      makesBald: false,
    }

    const resolution = resolveSearingLayersForCharacter(metadata, concord)
    const composed = await new SearingImageComposer().compose(resolution.layers)
    const original = await readFile(sourceImagePath)
    const changed = changedPixelCount(await rawRgba(original), await rawRgba(composed.image))

    expect(resolution.layers.at(-1)).toMatchObject({
      trait_type: 'Front',
      value: 'None',
      seared: 'Orb of the Void',
    })
    expect(composed.layerUrls).toContain('/images/wagdie-layers/Searing/Front/Orb%20of%20the%20Void.png')
    expect(changed).toBeGreaterThan(1000)
  })
})
