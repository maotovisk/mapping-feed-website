export type FeedKey = 'map' | 'group'

export type EventType =
  | 'Nomination'
  | 'NominationReset'
  | 'Qualification'
  | 'Disqualification'
  | 'Ranked'
  | 'Unranked'
  | 'GroupAdd'
  | 'GroupRemove'
  | 'GroupMove'

export type FeedType = 'Map' | 'Group'

export interface FeedEnvelopeDto {
  feed: FeedKey
  count: number
  nextCursor: string | null
  items: FeedEventViewEntryDto[]
}

export interface FeedEventActorDto {
  userId: number | null
  username: string | null
  avatarUrl: string | null
  badge: string | null
  color: string | null
}

export interface FeedMapHistoryActionDto {
  action: string
  userId: number | null
  username: string | null
  userColor: string | null
}

export interface FeedMapEventViewDataDto {
  setId: number
  beatmapsetUrl: string
  beatmapsetTitle: string
  mapperName: string
  mapperUserId: number | null
  modes: string[]
  message: string | null
  rankedHistory: FeedMapHistoryActionDto[]
}

export interface FeedGroupEventViewDataDto {
  userId: number
  userName: string
  groupId: number
  groupName: string
  groupColor: string | null
  playmodes: string[]
  userUrl: string
  groupUrl: string
}

export interface FeedEventViewEntryDto {
  eventId: number
  feedType: FeedType
  eventType: EventType
  createdAt: string | null
  primaryUrl: string
  actor: FeedEventActorDto | null
  map: FeedMapEventViewDataDto | null
  group: FeedGroupEventViewDataDto | null
}
