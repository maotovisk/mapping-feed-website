import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { memo } from "preact/compat";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import type { FeedEventViewEntryDto } from "../../dto/feed";
import type { ActiveFeed } from "../../types/feed";
import { eventKey } from "../../utils/feed-utils";
import { FeedLoadingState } from "../layout/feed-loading-state";
import { FeedCard } from "./feed-card";

interface FeedListProps {
  activeFeed: ActiveFeed;
  visibleItems: FeedEventViewEntryDto[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => Promise<void>;
}

const LOAD_MORE_SCROLL_THRESHOLD_PX = 24;
const LOAD_MORE_ROW_HEIGHT_PX = 92;
const VIRTUAL_ROW_GAP_PX = 12;
const VIRTUAL_OVERSCAN_ROWS = 6;

const buildVirtualItemKey = (
  activeFeed: ActiveFeed,
  item: FeedEventViewEntryDto,
): string => `${activeFeed}:${eventKey(item)}`;

const estimateFeedCardHeight = (
  event: FeedEventViewEntryDto | undefined,
): number => {
  if (!event) {
    return LOAD_MORE_ROW_HEIGHT_PX;
  }

  if (event.group) {
    return 186;
  }

  let estimatedHeight = 232;

  if (event.map?.rankedHistory.length) {
    estimatedHeight += 48;
  }

  if (event.map?.message?.trim()) {
    estimatedHeight += 56;
  }

  return estimatedHeight;
};

function FeedListComponent({
  activeFeed,
  visibleItems,
  hasMore,
  loadingMore,
  onLoadMore,
}: FeedListProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const loadRequestPendingRef = useRef(false);
  const previousFeedRef = useRef<ActiveFeed>(activeFeed);
  const previousVisibleItemKeysRef = useRef<string[]>([]);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [pendingAnimatedKeys, setPendingAnimatedKeys] = useState<string[]>([]);
  const rowCount = visibleItems.length + (hasMore ? 1 : 0);
  const pendingAnimatedKeySet = useMemo(
    () => new Set(pendingAnimatedKeys),
    [pendingAnimatedKeys],
  );

  const updateScrollMargin = useCallback(() => {
    if (!containerRef.current || typeof window === "undefined") {
      return;
    }

    const nextScrollMargin =
      containerRef.current.getBoundingClientRect().top + window.scrollY;
    setScrollMargin((previous) =>
      Math.abs(previous - nextScrollMargin) < 1 ? previous : nextScrollMargin,
    );
  }, []);

  useLayoutEffect(() => {
    updateScrollMargin();
  }, [updateScrollMargin, activeFeed, rowCount]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      updateScrollMargin();
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateScrollMargin]);

  useEffect(() => {
    if (
      typeof ResizeObserver === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateScrollMargin();
    });

    observer.observe(document.body);

    return () => {
      observer.disconnect();
    };
  }, [updateScrollMargin]);

  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: rowCount,
    estimateSize: (index) => estimateFeedCardHeight(visibleItems[index]),
    gap: VIRTUAL_ROW_GAP_PX,
    overscan: VIRTUAL_OVERSCAN_ROWS,
    scrollMargin,
    getItemKey: (index) => {
      if (index >= visibleItems.length) {
        return `${activeFeed}:load-more`;
      }

      return `${activeFeed}:${eventKey(visibleItems[index])}`;
    },
  });

  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, activeFeed, rowCount]);

  useEffect(() => {
    const currentItemKeys = visibleItems.map((item) =>
      buildVirtualItemKey(activeFeed, item),
    );

    if (previousFeedRef.current !== activeFeed) {
      previousFeedRef.current = activeFeed;
      previousVisibleItemKeysRef.current = currentItemKeys;
      setPendingAnimatedKeys([]);
      return;
    }

    if (previousVisibleItemKeysRef.current.length === 0) {
      previousVisibleItemKeysRef.current = currentItemKeys;
      return;
    }

    const previousKeySet = new Set(previousVisibleItemKeysRef.current);
    const nextAnimatedKeys = currentItemKeys.filter((key) => !previousKeySet.has(key));
    previousVisibleItemKeysRef.current = currentItemKeys;

    if (nextAnimatedKeys.length === 0) {
      return;
    }

    setPendingAnimatedKeys((previous) => {
      const merged = new Set(previous);
      for (const key of nextAnimatedKeys) {
        merged.add(key);
      }

      return [...merged];
    });
  }, [activeFeed, visibleItems]);

  useEffect(() => {
    if (!loadingMore) {
      loadRequestPendingRef.current = false;
    }
  }, [loadingMore, activeFeed]);

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop =
    virtualRows.length > 0
      ? Math.max(virtualRows[0]!.start - scrollMargin, 0)
      : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? Math.max(
          virtualizer.getTotalSize() -
            (virtualRows[virtualRows.length - 1]!.end - scrollMargin),
          0,
        )
      : 0;

  const handleItemAnimationEnd = (itemKey: string) => {
    setPendingAnimatedKeys((previous) =>
      previous.filter((key) => key !== itemKey),
    );
  };

  useEffect(() => {
    if (!hasMore || loadingMore || loadRequestPendingRef.current) {
      return;
    }

    if (typeof window === "undefined" || window.scrollY < LOAD_MORE_SCROLL_THRESHOLD_PX) {
      return;
    }

    const lastVirtualRow = virtualRows[virtualRows.length - 1];
    if (!lastVirtualRow || lastVirtualRow.index < rowCount - 1) {
      return;
    }

    loadRequestPendingRef.current = true;
    void onLoadMore();
  }, [hasMore, loadingMore, onLoadMore, rowCount, virtualRows]);

  return (
    <section ref={containerRef} aria-live="polite">
      {paddingTop > 0 && (
        <div
          aria-hidden="true"
          style={{ height: `${paddingTop}px` }}
        ></div>
      )}

      {virtualRows.map((virtualRow, visibleIndex) => {
        const isLoadMoreRow = virtualRow.index >= visibleItems.length;
        const virtualItem = isLoadMoreRow ? null : visibleItems[virtualRow.index];
        const virtualItemKey =
          virtualItem === null
            ? null
            : buildVirtualItemKey(activeFeed, virtualItem);

        return (
          <div
            class={
              virtualItemKey !== null && pendingAnimatedKeySet.has(virtualItemKey)
                ? "feed-virtual-row-enter"
                : undefined
            }
            data-index={virtualRow.index}
            key={virtualRow.key}
            ref={virtualizer.measureElement}
            onAnimationEnd={
              virtualItemKey === null
                ? undefined
                : () => {
                    handleItemAnimationEnd(virtualItemKey);
                  }
            }
            style={
              visibleIndex === 0
                ? undefined
                : { marginTop: `${VIRTUAL_ROW_GAP_PX}px` }
            }
          >
            {isLoadMoreRow ? (
              <div class="min-h-[92px]">
                {loadingMore ? (
                  <FeedLoadingState variant="more" />
                ) : (
                  <div class="h-[92px]" aria-hidden="true"></div>
                )}
              </div>
            ) : (
              <FeedCard event={virtualItem!} />
            )}
          </div>
        );
      })}

      {paddingBottom > 0 && (
        <div
          aria-hidden="true"
          style={{ height: `${paddingBottom}px` }}
        ></div>
      )}
    </section>
  );
}

export const FeedList = memo(FeedListComponent);
