import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { parseTokenIdParam } from '@/lib/api/params'
import { jsonRaw, jsonRawError, withNoStoreHeaders } from '@/lib/api/responses'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const METADATA_DIR = path.join(process.cwd(), 'public/metadata/characters')
const CHARACTER_IMAGES_DIR = path.join(process.cwd(), 'public/images/characters')
const SUCCESS_CACHE_CONTROL = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
const METADATA_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function withCorsHeaders(headers?: HeadersInit): Headers {
  return new Headers({
    ...METADATA_CORS_HEADERS,
    ...Object.fromEntries(new Headers(headers)),
  })
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

async function getHostedCharacterImageUrl(tokenId: number, appOrigin: string): Promise<string | null> {
  const imagePath = path.join(CHARACTER_IMAGES_DIR, `${tokenId}.png`)

  try {
    await access(imagePath)
    return `${appOrigin}/images/characters/${tokenId}.png?v=metadata-20260509`
  } catch {
    return null
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: withCorsHeaders(),
  })
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  const params = await context.params
  const tokenId = parseTokenIdParam(params.tokenId, { min: 1 })

  if (tokenId === null) {
    return jsonRawError('Invalid token ID', 400, {
      headers: withCorsHeaders(withNoStoreHeaders()),
    })
  }

  try {
    const metadataPath = path.join(METADATA_DIR, `${tokenId}.json`)
    const metadataRaw = await readFile(metadataPath, 'utf8')
    const metadata = JSON.parse(metadataRaw) as Record<string, unknown>
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL
    const appOrigin = configuredAppUrl && !configuredAppUrl.includes('localhost')
      ? configuredAppUrl.replace(/\/$/, '')
      : 'https://fateofwagdie.com'
    const hostedImageUrl = await getHostedCharacterImageUrl(tokenId, appOrigin)
    const responseMetadata = {
      ...metadata,
      ...(hostedImageUrl ? { image: hostedImageUrl } : {}),
    }

    delete responseMetadata.animation_url

    return jsonRaw(responseMetadata, {
      headers: withCorsHeaders({
        'Cache-Control': SUCCESS_CACHE_CONTROL,
      }),
    })
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return jsonRawError('Metadata not found', 404, {
        headers: withCorsHeaders(withNoStoreHeaders()),
      })
    }

    console.error('Failed to load character metadata:', error)
    return jsonRawError('Failed to load metadata', 500, {
      headers: withCorsHeaders(withNoStoreHeaders()),
    })
  }
}
