import type { EventType } from '../dto/feed'
import type { EventTheme, FeedState } from '../types/feed'

export const EVENT_THEMES: Record<EventType, EventTheme> = {
  Nomination: {
    label: 'Nominated',
    color: '#3498db',
    icon: 'message-circle',
  },
  Qualification: {
    label: 'Qualified',
    color: '#ff5978',
    icon: 'heart',
  },
  Ranked: {
    label: 'Ranked',
    color: '#f1c40f',
    icon: 'sparkles',
  },
  NominationReset: {
    label: 'Nomination Reset',
    color: '#f39c12',
    icon: 'rotate-ccw',
  },
  Unranked: {
    label: 'Unranked',
    color: '#e67e22',
    icon: 'circle-slash',
  },
  Disqualification: {
    label: 'Disqualified',
    color: '#e74c3c',
    icon: 'heart-crack',
  },
  GroupAdd: {
    label: 'Added',
    color: '#57f287',
    icon: 'user-plus',
  },
  GroupRemove: {
    label: 'Removed',
    color: '#c9a4ff',
    icon: 'user-minus',
  },
  GroupMove: {
    label: 'Moved',
    color: '#3498db',
    icon: 'users',
  },
}

export const MAP_FOOTER_TYPES = new Set<EventType>([
  'Nomination',
  'Qualification',
  'Disqualification',
  'NominationReset',
])

export const INITIAL_LIMIT = 30
export const PAGE_LIMIT = 45
export const POLL_LIMIT = 25
export const POLL_INTERVAL_MS = 30_000

export const FEED_STATE_DEFAULT: FeedState = {
  items: [],
  nextCursor: null,
  initialLoading: false,
  loadingMore: false,
  error: null,
  lastSyncedAt: null,
}
