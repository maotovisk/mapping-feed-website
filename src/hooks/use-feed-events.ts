import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import {
  FEED_STATE_DEFAULT,
  INITIAL_LIMIT,
  PAGE_LIMIT,
  POLL_INTERVAL_MS,
  POLL_LIMIT,
} from '../constants/feed'
import type { FeedKey } from '../dto/feed'
import type {
  ActiveFeed,
  FeedState,
  GroupFeedFilters,
  MapFeedFilters,
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

export function useFeedEvents() {
  const [activeFeed, setActiveFeed] = useState<ActiveFeed>('map')
  const [mapState, setMapState] = useState<FeedState>(FEED_STATE_DEFAULT)
  const [groupState, setGroupState] = useState<FeedState>(FEED_STATE_DEFAULT)
  const [mapFilters, setMapFilters] = useState<MapFeedFilters>(
    MAP_FILTERS_DEFAULT,
  )
  const [groupFilters, setGroupFilters] = useState<GroupFeedFilters>(
    GROUP_FILTERS_DEFAULT,
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

      patchFeedState(feed, () => ({
        ...FEED_STATE_DEFAULT,
        initialLoading: true,
      }))

      try {
        const payload = await fetchFeedPage(feed, {
          limit: INITIAL_LIMIT,
          filters,
        })

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
          const didGrow = merged.length > previous.items.length

          return {
            ...previous,
            items: merged,
            nextCursor: previous.nextCursor ?? payload.nextCursor,
            error: null,
            lastSyncedAt: didGrow ? Date.now() : previous.lastSyncedAt,
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
