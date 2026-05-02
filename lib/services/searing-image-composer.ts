import { readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import type { SearingLayer } from '../domain/searing/searing-layer-resolver'

type SharpInstance = {
  composite: (inputs: Array<{ input: Buffer }>) => SharpInstance
  png: () => SharpInstance
  toBuffer: () => Promise<Buffer>
}

type SharpFactory = (input?: Buffer) => SharpInstance

const dynamicImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>
const requireFromHere = createRequire(import.meta.url)

let layerFilenameIndex: Promise<Map<string, string[]>> | null = null

async function loadSharp(): Promise<SharpFactory> {
  try {
    const mod = await dynamicImport<unknown>('sharp')
    const sharpModule = mod as { default?: SharpFactory }
    return (typeof mod === 'function' ? mod : sharpModule.default) as SharpFactory
  } catch (error) {
    try {
      const mod = requireFromHere('sharp') as { default?: SharpFactory } | SharpFactory
      return (typeof mod === 'function' ? mod : mod.default) as SharpFactory
    } catch {
      throw new Error(
        `sharp is required for searing image composition but could not be loaded: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}

function publicFilePath(url: string): string | null {
  if (!url.startsWith('/')) return null

  const decoded = decodeURIComponent(url.replace(/^\/+/, ''))
  return path.join(process.cwd(), 'public', decoded.replace(/^public\//, ''))
}

function layerRoot(): string {
  return path.join(process.cwd(), 'public', 'images', 'wagdie-layers')
}

async function buildLayerFilenameIndex(): Promise<Map<string, string[]>> {
  const root = layerRoot()
  const index = new Map<string, string[]>()

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(entryPath)
        continue
      }

      if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.png') continue

      const key = path.basename(entry.name, '.png')
      const matches = index.get(key) ?? []
      matches.push(entryPath)
      index.set(key, matches)
    }
  }

  await walk(root)
  return index
}

function fallbackLayerNameFromUrl(url: string): string | null {
  if (!url.startsWith('/')) return null
  const decoded = decodeURIComponent(url)
  const filename = path.basename(decoded)
  return path.extname(filename).toLowerCase() === '.png'
    ? path.basename(filename, '.png')
    : null
}

async function findLocalLayerByFilename(url: string): Promise<string | null> {
  const layerName = fallbackLayerNameFromUrl(url)
  if (!layerName) return null

  layerFilenameIndex ??= buildLayerFilenameIndex()
  const matches = (await layerFilenameIndex).get(layerName) ?? []
  if (matches.length === 0) return null

  const searingMatch = matches.find((match) => match.includes(`${path.sep}Searing${path.sep}`))
  return searingMatch ?? matches[0]
}

async function downloadLayer(url: string): Promise<Buffer> {
  const localPath = publicFilePath(url)
  if (localPath) {
    try {
      return await readFile(localPath)
    } catch (error) {
      const fallbackPath = await findLocalLayerByFilename(url)
      if (fallbackPath) {
        return readFile(fallbackPath)
      }

      throw new Error(
        `Failed to read local searing layer ${url} at ${localPath}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download searing layer ${url}: ${response.status} ${response.statusText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

export type SearingImageCompositionResult = {
  image: Buffer
  layerUrls: string[]
}

export class SearingImageComposer {
  async compose(layers: SearingLayer[]): Promise<SearingImageCompositionResult> {
    if (layers.length === 0) {
      throw new Error('Cannot compose searing image without layers')
    }

    const layerUrls = layers.map((layer) => layer.url)
    const layerImages = await Promise.all(layerUrls.map(downloadLayer))
    const baseImage = layerImages.shift()

    if (!baseImage) {
      throw new Error('Cannot compose searing image without a base layer')
    }

    const sharp = await loadSharp()
    const image = await sharp(baseImage)
      .composite(layerImages.map((input) => ({ input })))
      .png()
      .toBuffer()

    return { image, layerUrls }
  }
}

export const searingImageComposer = new SearingImageComposer()
