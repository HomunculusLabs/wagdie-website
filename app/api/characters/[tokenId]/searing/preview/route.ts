import { NextRequest, NextResponse } from 'next/server'
import { parseTokenIdParam } from '@/lib/api/params'
import { resolveSearingLayersForCharacter, validateSearingLayerResolution } from '@/lib/domain/searing/searing-layer-resolver'
import { CHARACTERS_TABLE } from '@/lib/db/tables'
import { searingMapMaterializationRepository } from '@/lib/repositories/searing-map-materialization-repository'
import { searingImageComposer } from '@/lib/services/searing-image-composer'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { CharacterMetadata } from '@/types/character'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
} as const

type PreviewCharacter = {
  token_id: number
  metadata: CharacterMetadata | null
}

function parseConcordId(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  const params = await context.params
  const tokenId = parseTokenIdParam(params.tokenId, { min: 1 })
  const concordId = parseConcordId(request.nextUrl.searchParams.get('concordId'))

  if (tokenId === null) {
    return NextResponse.json(
      { error: 'Invalid token ID' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (concordId === null) {
    return NextResponse.json(
      { error: 'concordId is required' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  try {
    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase admin client not configured' },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }

    const [characterResult, concord] = await Promise.all([
      admin
        .from(CHARACTERS_TABLE as never)
        .select('token_id, metadata')
        .eq('token_id', tokenId)
        .maybeSingle(),
      searingMapMaterializationRepository.findByConcordTokenId(concordId),
    ])

    if (characterResult.error) {
      throw new Error(`Failed to fetch character ${tokenId}: ${characterResult.error.message}`)
    }

    const character = characterResult.data as PreviewCharacter | null

    if (!character) {
      return NextResponse.json(
        { error: `Character ${tokenId} not found` },
        { status: 404, headers: NO_STORE_HEADERS }
      )
    }

    if (!concord) {
      return NextResponse.json(
        { error: `No searing map found for concord ${concordId}` },
        { status: 404, headers: NO_STORE_HEADERS }
      )
    }

    const resolution = resolveSearingLayersForCharacter(character.metadata, concord)
    validateSearingLayerResolution(resolution)
    const composed = await searingImageComposer.compose(resolution.layers)

    return new NextResponse(new Uint8Array(composed.image), {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        'Content-Type': 'image/png',
        'X-Searing-Location': resolution.variant.location,
        'X-Searing-Trait': resolution.variant.newTrait,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate searing preview',
      },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
