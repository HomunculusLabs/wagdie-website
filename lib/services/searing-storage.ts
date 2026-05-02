type StorageFile = {
  save: (buffer: Buffer, options?: Record<string, unknown>) => Promise<void>
}

type StorageBucket = {
  file: (name: string) => StorageFile
}

type StorageClient = {
  bucket: (name: string) => StorageBucket
}

type StorageConstructor = new () => StorageClient

const dynamicImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '')
}

function sanitizeObjectSegment(value: string): string {
  return value
    .trim()
    .replace(/\.png$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'seared'
}

function encodeObjectPath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

async function loadStorageConstructor(): Promise<StorageConstructor> {
  try {
    const mod = await dynamicImport<{ Storage?: StorageConstructor; default?: { Storage?: StorageConstructor } }>(
      '@google-cloud/storage'
    )
    const Storage = mod.Storage || mod.default?.Storage
    if (!Storage) {
      throw new Error('Storage export not found')
    }
    return Storage
  } catch (error) {
    throw new Error(
      `@google-cloud/storage is required for searing image uploads but could not be loaded: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export class SearingStorageService {
  private readonly bucketName: string
  private readonly prefix: string

  constructor(options: { bucketName?: string; prefix?: string } = {}) {
    this.bucketName = options.bucketName || process.env.SEARING_GCS_BUCKET || process.env.GCS_BUCKET_NAME || process.env.GCS_BUCKET || 'seared-wagdie-images'
    this.prefix = trimSlashes(options.prefix ?? process.env.SEARING_GCS_PREFIX ?? '')
  }

  objectNameForToken(tokenId: number, options: { version?: string } = {}): string {
    const version = options.version ? sanitizeObjectSegment(options.version) : null
    const objectPath = version ? `${tokenId}/${version}.png` : `${tokenId}.png`
    return this.prefix ? `${this.prefix}/${objectPath}` : objectPath
  }

  publicUrlForObject(objectName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${encodeObjectPath(objectName)}`
  }

  async uploadSearedImage(
    tokenId: number,
    image: Buffer,
    options: { version?: string } = {}
  ): Promise<string> {
    const objectName = this.objectNameForToken(tokenId, options)
    const Storage = await loadStorageConstructor()
    const storage = new Storage()
    const file = storage.bucket(this.bucketName).file(objectName)

    await file.save(image, {
      contentType: 'image/png',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })

    return this.publicUrlForObject(objectName)
  }
}

export const searingStorageService = new SearingStorageService()
