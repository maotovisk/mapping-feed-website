import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import {
  FEED_STATE_DEFAULT,
  INITIAL_LIMIT,
  MIN_INITIAL_LOADING_MS,
  PAGE_LIMIT,
  POLL_INTERVAL_MS,
  POLL_LIMIT,
} from '../constants/feed'
import type { FeedKey } from '../dto/feed'
import type {
  ActiveFeed,
  FeedState,
  GroupFeedFilters,
  MapEventTypeFilter,
  MapFeedFilters,
  RulesetFilter,
} from '../types/feed'
import { fetchFeedPage } from '../services/feed-api.service'
import { mergeEvents, sortEventsNewestFirst } from '../utils/feed-utils'

const MAP_FILTERS_DEFAULT: MapFeedFilters = {
  ruleset: null,
  eventTypes: [],
  text: '',
}

const GROUP_FILTERS_DEFAULT: GroupFeedFilters = {
  playmode: null,
  groupIds: [],
}

const RULESET_VALUES: RulesetFilter[] = ['osu', 'taiko', 'catch', 'mania']
const MAP_EVENT_TYPE_VALUES: MapEventTypeFilter[] = [
  'nominate',
  'nomination_reset',
  'qualify',
  'disqualify',
  'rank',
  'unrank',
]

const RULESET_SET = new Set<RulesetFilter>(RULESET_VALUES)
const MAP_EVENT_TYPE_SET = new Set<MapEventTypeFilter>(MAP_EVENT_TYPE_VALUES)
const PREFERRED_RULESET_STORAGE_KEY = 'mappingfeed.preferred-ruleset'

const parseRuleset = (value: string | null): RulesetFilter | null => {
  if (!value) {
    return null
  }

  return RULESET_SET.has(value as RulesetFilter) ? (value as RulesetFilter) : null
}

const parseMapEventTypes = (value: string | null): MapEventTypeFilter[] => {
  if (!value) {
    return []
  }

  const unique = new Set<MapEventTypeFilter>()
  for (const raw of value.split(',')) {
    const eventType = raw.trim() as MapEventTypeFilter
    if (MAP_EVENT_TYPE_SET.has(eventType)) {
      unique.add(eventType)
    }
  }

  return MAP_EVENT_TYPE_VALUES.filter((eventType) => unique.has(eventType))
}

const parseGroupIds = (value: string | null): number[] => {
  if (!value) {
    return []
  }

  const unique = new Set<number>()
  for (const raw of value.split(',')) {
    const groupId = Number.parseInt(raw.trim(), 10)
    if (Number.isInteger(groupId) && groupId > 0) {
      unique.add(groupId)
    }
  }

  return [...unique].sort((a, b) => a - b)
}

const readInitialFiltersFromUrl = (): {
  activeFeed: ActiveFeed
  mapFilters: MapFeedFilters
  groupFilters: GroupFeedFilters
} => {
  if (typeof window === 'undefined') {
    return {
      activeFeed: 'map',
      mapFilters: MAP_FILTERS_DEFAULT,
      groupFilters: GROUP_FILTERS_DEFAULT,
    }
  }

  const params = new URLSearchParams(window.location.search)
  const feedParam = params.get('feed')
  const activeFeed: ActiveFeed = feedParam === 'group' ? 'group' : 'map'
  let preferredRuleset: RulesetFilter | null = null

  try {
    preferredRuleset = parseRuleset(
      window.localStorage.getItem(PREFERRED_RULESET_STORAGE_KEY),
    )
  } catch {
    preferredRuleset = null
  }

  const mapText = params.get('mq')?.trim() ?? ''
  const sharedRulesetFromUrl = parseRuleset(params.get('r'))
  const mapRulesetFromUrl = parseRuleset(params.get('mr'))
  const groupPlaymodeFromUrl = parseRuleset(params.get('gp'))
  const sharedRuleset =
    sharedRulesetFromUrl ??
    mapRulesetFromUrl ??
    groupPlaymodeFromUrl ??
    preferredRuleset

  return {
    activeFeed,
    mapFilters: {
      ruleset: sharedRuleset,
      eventTypes: parseMapEventTypes(params.get('me')),
      text: mapText,
    },
    groupFilters: {
      playmode: sharedRuleset,
      groupIds: parseGroupIds(params.get('gg')),
    },
  }
}

const INITIAL_URL_STATE = readInitialFiltersFromUrl()

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export function useFeedEvents() {
  const [activeFeed, setActiveFeed] = useState<ActiveFeed>(
    INITIAL_URL_STATE.activeFeed,
  )
  const [mapState, setMapState] = useState<FeedState>(FEED_STATE_DEFAULT)
  const [groupState, setGroupState] = useState<FeedState>(FEED_STATE_DEFAULT)
  const [mapFilters, setMapFilters] = useState<MapFeedFilters>(
    INITIAL_URL_STATE.mapFilters,
  )
  const [groupFilters, setGroupFilters] = useState<GroupFeedFilters>(
    INITIAL_URL_STATE.groupFilters,
  )

  const mapRef = useRef(mapState)
  const groupRef = useRef(groupState)
  const mapFiltersRef = useRef(mapFilters)
  const groupFiltersRef = useRef(groupFilters)
  const requestVersionRef = useRef<Record<FeedKey, number>>({
    map: 0,
    group: 0,
  })

  useEffect(() => {
    mapRef.current = mapState
  }, [mapState])

  useEffect(() => {
    groupRef.current = groupState
  }, [groupState])

  useEffect(() => {
    mapFiltersRef.current = mapFilters
  }, [mapFilters])

  useEffect(() => {
    groupFiltersRef.current = groupFilters
  }, [groupFilters])

  const patchFeedState = useCallback(
    (feed: FeedKey, updater: (previous: FeedState) => FeedState) => {
      if (feed === 'map') {
        setMapState(updater)
        return
      }

      setGroupState(updater)
    },
    [],
  )

  const getRequestVersion = useCallback((feed: FeedKey): number => {
    return requestVersionRef.current[feed]
  }, [])

  const bumpRequestVersion = useCallback((feed: FeedKey): number => {
    const nextVersion = requestVersionRef.current[feed] + 1
    requestVersionRef.current[feed] = nextVersion
    return nextVersion
  }, [])

  const getFiltersForFeed = useCallback(
    (feed: FeedKey): MapFeedFilters | GroupFeedFilters => {
      if (feed === 'map') {
        return mapFiltersRef.current
      }

      return groupFiltersRef.current
    },
    [],
  )

  const loadInitialFeed = useCallback(
    async (feed: FeedKey, filters: MapFeedFilters | GroupFeedFilters) => {
      const requestVersion = bumpRequestVersion(feed)
      const startedAt = Date.now()

      patchFeedState(feed, () => ({
        ...FEED_STATE_DEFAULT,
        initialLoading: true,
      }))

      try {
        const payload = await fetchFeedPage(feed, {
          limit: INITIAL_LIMIT,
          filters,
        })

        const elapsed = Date.now() - startedAt
        const remaining = Math.max(MIN_INITIAL_LOADING_MS - elapsed, 0)
        if (remaining > 0) {
          await sleep(remaining)
        }

        if (getRequestVersion(feed) !== requestVersion) {
          return
        }

        patchFeedState(feed, () => ({
          ...FEED_STATE_DEFAULT,
          items: sortEventsNewestFirst(payload.items),
          nextCursor: payload.nextCursor,
          error: null,
          lastSyncedAt: Date.now(),
        }))
      } catch (error) {
        const elapsed = Date.now() - startedAt
        const remaining = Math.max(MIN_INITIAL_LOADING_MS - elapsed, 0)
        if (remaining > 0) {
          await sleep(remaining)
        }

        if (getRequestVersion(feed) !== requestVersion) {
          return
        }

        patchFeedState(feed, () => ({
          ...FEED_STATE_DEFAULT,
          error: error instanceof Error ? error.message : `Failed to load ${feed} feed`,
        }))
      }
    },
    [bumpRequestVersion, getRequestVersion, patchFeedState],
  )

  const pollFeed = useCallback(
    async (feed: FeedKey) => {
      const requestVersion = getRequestVersion(feed)
      const filters = getFiltersForFeed(feed)

      try {
        const payload = await fetchFeedPage(feed, {
          limit: POLL_LIMIT,
          filters,
        })

        if (getRequestVersion(feed) !== requestVersion) {
          return
        }

        patchFeedState(feed, (previous) => {
          const merged = mergeEvents(previous.items, payload.items)

          return {
            ...previous,
            items: merged,
            nextCursor: previous.nextCursor ?? payload.nextCursor,
            error: null,
            lastSyncedAt: Date.now(),
          }
        })
      } catch (error) {
        if (getRequestVersion(feed) !== requestVersion) {
          return
        }

        patchFeedState(feed, (previous) => ({
          ...previous,
          error: error instanceof Error ? error.message : `Failed to refresh ${feed} feed`,
        }))
      }
    },
    [getFiltersForFeed, getRequestVersion, patchFeedState],
  )

  const loadOlder = useCallback(
    async (feed: FeedKey) => {
      const current = feed === 'map' ? mapRef.current : groupRef.current
      if (!current.nextCursor || current.loadingMore || current.initialLoading) {
        return
      }

      const requestVersion = getRequestVersion(feed)
      const filters = getFiltersForFeed(feed)

      patchFeedState(feed, (previous) => ({
        ...previous,
        loadingMore: true,
        error: null,
      }))

      try {
        const payload = await fetchFeedPage(feed, {
          limit: PAGE_LIMIT,
          cursor: current.nextCursor,
          filters,
        })

        if (getRequestVersion(feed) !== requestVersion) {
          return
        }

        patchFeedState(feed, (previous) => ({
          ...previous,
          loadingMore: false,
          items: mergeEvents(previous.items, payload.items),
          nextCursor: payload.nextCursor,
          error: null,
          lastSyncedAt: Date.now(),
        }))
      } catch (error) {
        if (getRequestVersion(feed) !== requestVersion) {
          return
        }

        patchFeedState(feed, (previous) => ({
          ...previous,
          loadingMore: false,
          error:
            error instanceof Error
              ? error.message
              : `Failed to load older ${feed} events`,
        }))
      }
    },
    [getFiltersForFeed, getRequestVersion, patchFeedState],
  )

  const loadOlderForActiveFeed = useCallback(async () => {
    await loadOlder(activeFeed)
  }, [activeFeed, loadOlder])

  useEffect(() => {
    void loadInitialFeed('map', mapFilters)
  }, [loadInitialFeed, mapFilters])

  useEffect(() => {
    void loadInitialFeed('group', groupFilters)
  }, [groupFilters, loadInitialFeed])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void pollFeed(activeFeed)
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [activeFeed, pollFeed])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const preferredRuleset =
      (activeFeed === 'map' ? mapFilters.ruleset : groupFilters.playmode) ??
      (activeFeed === 'map' ? groupFilters.playmode : mapFilters.ruleset)

    try {
      if (preferredRuleset) {
        window.localStorage.setItem(
          PREFERRED_RULESET_STORAGE_KEY,
          preferredRuleset,
        )
      } else {
        window.localStorage.removeItem(PREFERRED_RULESET_STORAGE_KEY)
      }
    } catch {
      // Ignore storage failures (private mode / permissions).
    }
  }, [activeFeed, groupFilters.playmode, mapFilters.ruleset])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams()
    params.set('feed', activeFeed)

    const sharedRuleset = mapFilters.ruleset ?? groupFilters.playmode
    if (sharedRuleset) {
      params.set('r', sharedRuleset)
    }

    if (mapFilters.eventTypes.length > 0) {
      params.set('me', mapFilters.eventTypes.join(','))
    }

    const mapText = mapFilters.text.trim()
    if (mapText) {
      params.set('mq', mapText)
    }

    if (groupFilters.groupIds.length > 0) {
      params.set('gg', groupFilters.groupIds.join(','))
    }

    const nextQuery = params.toString()
    const currentQuery = window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : window.location.search

    if (nextQuery === currentQuery) {
      return
    }

    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    window.history.replaceState(window.history.state, '', nextUrl)
  }, [activeFeed, groupFilters.groupIds, groupFilters.playmode, mapFilters.eventTypes, mapFilters.ruleset, mapFilters.text])

  const visibleItems = useMemo(() => {
    return activeFeed === 'map' ? mapState.items : groupState.items
  }, [activeFeed, groupState.items, mapState.items])

  const activeError =
    activeFeed === 'map' ? mapState.error : groupState.error

  const activeHasMore =
    activeFeed === 'map'
      ? Boolean(mapState.nextCursor)
      : Boolean(groupState.nextCursor)

  const activeLoadingMore =
    activeFeed === 'map' ? mapState.loadingMore : groupState.loadingMore

  const initialLoading =
    activeFeed === 'map' ? mapState.initialLoading : groupState.initialLoading
  const activeLastSyncedAt =
    activeFeed === 'map' ? mapState.lastSyncedAt : groupState.lastSyncedAt

  return {
    activeFeed,
    setActiveFeed,
    visibleItems,
    activeError,
    activeHasMore,
    activeLoadingMore,
    initialLoading,
    activeLastSyncedAt,
    loadOlderForActiveFeed,
    mapFilters,
    setMapFilters,
    groupFilters,
    setGroupFilters,
  }
}
