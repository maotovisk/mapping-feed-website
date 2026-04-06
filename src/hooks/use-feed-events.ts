import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import {
  FEED_STATE_DEFAULT,
  INITIAL_LIMIT,
  PAGE_LIMIT,
  POLL_INTERVAL_MS,
  POLL_LIMIT,
} from '../constants/feed'
import type { FeedKey } from '../dto/feed'
import type { ActiveFeed, FeedState } from '../types/feed'
import { fetchFeedPage } from '../services/feed-api.service'
import { mergeEvents, sortEventsNewestFirst } from '../utils/feed-utils'

export function useFeedEvents() {
  const [activeFeed, setActiveFeed] = useState<ActiveFeed>('map')
  const [mapState, setMapState] = useState<FeedState>(FEED_STATE_DEFAULT)
  const [groupState, setGroupState] = useState<FeedState>(FEED_STATE_DEFAULT)

  const mapRef = useRef(mapState)
  const groupRef = useRef(groupState)

  useEffect(() => {
    mapRef.current = mapState
  }, [mapState])

  useEffect(() => {
    groupRef.current = groupState
  }, [groupState])

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

  const loadInitialFeed = useCallback(
    async (feed: FeedKey) => {
      patchFeedState(feed, (previous) => ({
        ...previous,
        initialLoading: true,
        error: null,
      }))

      try {
        const payload = await fetchFeedPage(feed, { limit: INITIAL_LIMIT })

        patchFeedState(feed, (previous) => ({
          ...previous,
          initialLoading: false,
          items: sortEventsNewestFirst(payload.items),
          nextCursor: payload.nextCursor,
          error: null,
          lastSyncedAt: Date.now(),
        }))
      } catch (error) {
        patchFeedState(feed, (previous) => ({
          ...previous,
          initialLoading: false,
          error: error instanceof Error ? error.message : `Failed to load ${feed} feed`,
        }))
      }
    },
    [patchFeedState],
  )

  const pollFeed = useCallback(
    async (feed: FeedKey) => {
      try {
        const payload = await fetchFeedPage(feed, { limit: POLL_LIMIT })

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
        patchFeedState(feed, (previous) => ({
          ...previous,
          error: error instanceof Error ? error.message : `Failed to refresh ${feed} feed`,
        }))
      }
    },
    [patchFeedState],
  )

  const loadOlder = useCallback(
    async (feed: FeedKey) => {
      const current = feed === 'map' ? mapRef.current : groupRef.current
      if (!current.nextCursor || current.loadingMore || current.initialLoading) {
        return
      }

      patchFeedState(feed, (previous) => ({
        ...previous,
        loadingMore: true,
        error: null,
      }))

      try {
        const payload = await fetchFeedPage(feed, {
          limit: PAGE_LIMIT,
          cursor: current.nextCursor,
        })

        patchFeedState(feed, (previous) => ({
          ...previous,
          loadingMore: false,
          items: mergeEvents(previous.items, payload.items),
          nextCursor: payload.nextCursor,
          error: null,
          lastSyncedAt: Date.now(),
        }))
      } catch (error) {
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
    [patchFeedState],
  )

  const loadOlderForActiveFeed = useCallback(async () => {
    await loadOlder(activeFeed)
  }, [activeFeed, loadOlder])

  useEffect(() => {
    void Promise.all([loadInitialFeed('map'), loadInitialFeed('group')])
  }, [loadInitialFeed])

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

  return {
    activeFeed,
    setActiveFeed,
    visibleItems,
    activeError,
    activeHasMore,
    activeLoadingMore,
    initialLoading,
    loadOlderForActiveFeed,
  }
}
