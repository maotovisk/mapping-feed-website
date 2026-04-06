import type { FeedEventViewEntryDto, FeedKey } from '../dto/feed'
import type { IconName } from './icon'

export type ActiveFeed = FeedKey

export interface FeedState {
  items: FeedEventViewEntryDto[]
  nextCursor: string | null
  initialLoading: boolean
  loadingMore: boolean
  error: string | null
  lastSyncedAt: number | null
}

export interface EventTheme {
  label: string
  color: string
  icon: IconName
}
