import type { FeedEnvelopeDto, FeedEventViewEntryDto, FeedKey } from '../dto/feed'

const API_ROOT = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api'
).replace(/\/+$/, '')

const FEED_ENDPOINT: Record<FeedKey, string> = {
  map: `${API_ROOT}/events/map`,
  group: `${API_ROOT}/events/group`,
}

interface FeedRequest {
  limit: number
  cursor?: string | null
}

function normalizeEnvelope(
  feed: FeedKey,
  payload: Partial<FeedEnvelopeDto> | null,
): FeedEnvelopeDto {
  return {
    feed,
    count: Number(payload?.count ?? 0),
    nextCursor: typeof payload?.nextCursor === 'string' ? payload.nextCursor : null,
    items: Array.isArray(payload?.items) ? (payload.items as FeedEventViewEntryDto[]) : [],
  }
}

export async function fetchFeedPage(
  feed: FeedKey,
  request: FeedRequest,
): Promise<FeedEnvelopeDto> {
  const params = new URLSearchParams()
  params.set('limit', String(request.limit))

  if (request.cursor) {
    params.set('cursor', request.cursor)
  }

  const response = await fetch(`${FEED_ENDPOINT[feed]}?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to load ${feed} feed (${response.status})`)
  }

  const payload = (await response.json()) as Partial<FeedEnvelopeDto>
  return normalizeEnvelope(feed, payload)
}
