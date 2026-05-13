import { NextRequest } from 'next/server'
import {
  LocationRoomNotFoundError,
  locationRoomService,
} from '@/lib/eliza/locationRooms/service'
import { jsonNoStore, jsonNoStoreError } from '@/lib/api/responses'

interface RouteContext {
  params: Promise<{ locationId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { locationId } = await context.params

  try {
    const room = await locationRoomService.getPublicRoom(locationId, {
      page: request.nextUrl.searchParams.get('page'),
      pageSize: request.nextUrl.searchParams.get('pageSize'),
    })

    return jsonNoStore(room)
  } catch (error) {
    if (error instanceof LocationRoomNotFoundError) {
      return jsonNoStoreError('Location not found', 404)
    }

    console.error('[Eliza Location Rooms] public read failed', error)
    return jsonNoStoreError('Failed to load location room', 500)
  }
}
