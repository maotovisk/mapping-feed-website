import type { FeedEventViewEntryDto, FeedKey } from '../dto/feed'
import type { IconName } from './icon'

export type ActiveFeed = FeedKey
export type RulesetFilter = 'osu' | 'taiko' | 'catch' | 'mania'
export type MapEventTypeFilter =
  | 'nominate'
  | 'nomination_reset'
  | 'qualify'
  | 'disqualify'
  | 'rank'
  | 'unrank'

export interface MapFeedFilters {
  ruleset: RulesetFilter | null
  eventTypes: MapEventTypeFilter[]
  text: string
}

export interface GroupFeedFilters {
  playmode: RulesetFilter | null
  groupIds: number[]
}

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
