import type { CSSProperties } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Code2, GitBranch, MessageCircle } from "lucide-preact";
import { FeedList } from "./components/feed/feed-list";
import { FeedSwitch } from "./components/filters/feed-switch";
import { MultiSelectDropdown } from "./components/filters/multi-select-dropdown";
import { RulesetSelector } from "./components/filters/ruleset-selector";
import { AnimatedBackground } from "./components/layout/animated-background";
import { FeedLoadingState } from "./components/layout/feed-loading-state";
import { LiveStatusBadge } from "./components/layout/live-status-badge";
import { MAP_EVENT_TYPE_OPTIONS, MAP_EVENT_TYPE_ORDER, RULESET_OPTIONS } from "./constants/filters";
import { KNOWN_USER_GROUPS, getKnownUserGroupById } from "./constants/user-groups";
import { TEXT_STYLE } from "./constants/typography";
import { useFeedEvents } from "./hooks/use-feed-events";
import type { MapEventTypeFilter, RulesetFilter } from "./types/feed";
import { eventKey } from "./utils/feed-utils";

const BACKEND_REPO_URL =
  (import.meta.env.VITE_BACKEND_REPO_URL as string | undefined)?.trim() ||
  "https://github.com/maotovisk/mapping-feed";

const FRONTEND_REPO_URL =
  (import.meta.env.VITE_FRONTEND_REPO_URL as string | undefined)?.trim() ||
  "https://github.com/maotovisk/mappingfeed-website";
const PRELOADER_EXIT_MS = 280;
const MOBILE_LAYOUT_QUERY = "(max-width: 960px)";

const formatGroupTag = (
  groupId: number,
  groupName: string | null,
  groupBadge: string | null,
): string => {
  if (groupBadge?.trim()) {
    return groupBadge.trim();
  }

  if (groupName?.trim()) {
    return groupName.trim();
  }

  return `Group #${groupId}`;
};

export function App() {
  const {
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
  } = useFeedEvents();

  const [mapEventDropdownOpen, setMapEventDropdownOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPageFocused, setIsPageFocused] = useState(() =>
    typeof document === "undefined"
      ? true
      : document.visibilityState === "visible" && document.hasFocus(),
  );
  const [showLiveStatusBadge, setShowLiveStatusBadge] = useState(() =>
    typeof window === "undefined"
      ? true
      : !window.matchMedia(MOBILE_LAYOUT_QUERY).matches,
  );

  const mapDropdownRef = useRef<HTMLDivElement | null>(null);
  const groupDropdownRef = useRef<HTMLDivElement | null>(null);
  const baseTitleRef = useRef("");
  const seenEventKeysByFeedRef = useRef({
    map: new Set<string>(),
    group: new Set<string>(),
  });
  const hasSeededSeenByFeedRef = useRef({
    map: false,
    group: false,
  });
  const shouldShowInitialLoader =
    initialLoading && !activeError && visibleItems.length === 0;
  const [showInitialLoader, setShowInitialLoader] = useState(
    shouldShowInitialLoader,
  );
  const [initialLoaderExiting, setInitialLoaderExiting] = useState(false);

  useEffect(() => {
    if (shouldShowInitialLoader) {
      setShowInitialLoader(true);
      setInitialLoaderExiting(false);
      return;
    }

    if (!showInitialLoader) {
      return;
    }

    setInitialLoaderExiting(true);
    const timeoutId = window.setTimeout(() => {
      setShowInitialLoader(false);
      setInitialLoaderExiting(false);
    }, PRELOADER_EXIT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shouldShowInitialLoader, showInitialLoader]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_LAYOUT_QUERY);
    const syncLiveStatusBadgeVisibility = () => {
      setShowLiveStatusBadge(!mediaQuery.matches);
    };

    syncLiveStatusBadgeVisibility();
    mediaQuery.addEventListener("change", syncLiveStatusBadgeVisibility);

    return () => {
      mediaQuery.removeEventListener("change", syncLiveStatusBadgeVisibility);
    };
  }, []);

  useEffect(() => {
    if (!mapEventDropdownOpen && !groupDropdownOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (
        mapEventDropdownOpen &&
        mapDropdownRef.current &&
        !mapDropdownRef.current.contains(target)
      ) {
        setMapEventDropdownOpen(false);
      }

      if (
        groupDropdownOpen &&
        groupDropdownRef.current &&
        !groupDropdownRef.current.contains(target)
      ) {
        setGroupDropdownOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMapEventDropdownOpen(false);
        setGroupDropdownOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [groupDropdownOpen, mapEventDropdownOpen]);

  useEffect(() => {
    setMapEventDropdownOpen(false);
    setGroupDropdownOpen(false);
  }, [activeFeed]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    baseTitleRef.current = document.title;

    const updateFocusState = () => {
      const focused =
        document.visibilityState === "visible" && document.hasFocus();
      setIsPageFocused(focused);
      if (focused) {
        setUnreadCount(0);
      }
    };

    updateFocusState();
    window.addEventListener("focus", updateFocusState);
    window.addEventListener("blur", updateFocusState);
    document.addEventListener("visibilitychange", updateFocusState);

    return () => {
      window.removeEventListener("focus", updateFocusState);
      window.removeEventListener("blur", updateFocusState);
      document.removeEventListener("visibilitychange", updateFocusState);

      if (baseTitleRef.current) {
        document.title = baseTitleRef.current;
      }
    };
  }, []);

  useEffect(() => {
    const seenByFeed = seenEventKeysByFeedRef.current;
    const seededByFeed = hasSeededSeenByFeedRef.current;
    const activeSeenSet = seenByFeed[activeFeed];

    if (!seededByFeed[activeFeed]) {
      for (const item of visibleItems) {
        activeSeenSet.add(eventKey(item));
      }
      seededByFeed[activeFeed] = true;
      return;
    }

    let newlySeenCount = 0;
    for (const item of visibleItems) {
      const key = eventKey(item);
      if (activeSeenSet.has(key)) {
        continue;
      }

      activeSeenSet.add(key);
      newlySeenCount += 1;
    }

    if (!isPageFocused && newlySeenCount > 0) {
      setUnreadCount((previous) => previous + newlySeenCount);
    }
  }, [activeFeed, isPageFocused, visibleItems]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const baseTitle = baseTitleRef.current || document.title;
    document.title =
      unreadCount > 0 ? `(${unreadCount}) ${baseTitle}` : baseTitle;
  }, [unreadCount]);

  const gridLayerStyle = {
    backgroundImage:
      "linear-gradient(rgba(95, 117, 178, 0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(95, 117, 178, 0.065) 1px, transparent 1px)",
    backgroundSize: "92px 92px",
    maskImage:
      "linear-gradient(180deg, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.9) 24%, rgba(0, 0, 0, 0.9) 84%, rgba(0, 0, 0, 0.2))",
    opacity: 0.4,
  } as CSSProperties;

  const menuStyle = {
    maxHeight: "min(420px, calc(100vh - 220px))",
  } as CSSProperties;

  const groupOptions = useMemo(() => {
    if (activeFeed !== "group") {
      return [] as Array<{
        groupId: number;
        groupName: string;
        groupBadge: string | null;
      }>;
    }

    const unique = new Map<
      number,
      { groupName: string; groupBadge: string | null }
    >();

    for (const knownGroup of KNOWN_USER_GROUPS) {
      unique.set(knownGroup.id, {
        groupName: knownGroup.name,
        groupBadge: knownGroup.badge,
      });
    }

    for (const event of visibleItems) {
      const groupId = event.group?.groupId;
      if (!groupId || groupId <= 0) {
        continue;
      }

      const knownGroup = getKnownUserGroupById(groupId);
      const groupName =
        event.group?.groupName?.trim() ||
        knownGroup?.name ||
        `Group #${groupId}`;
      const groupBadge = knownGroup?.badge ?? null;

      unique.set(groupId, {
        groupName,
        groupBadge,
      });
    }

    for (const selectedGroupId of groupFilters.groupIds) {
      if (selectedGroupId > 0 && !unique.has(selectedGroupId)) {
        const knownGroup = getKnownUserGroupById(selectedGroupId);
        unique.set(selectedGroupId, {
          groupName: knownGroup?.name || `Group #${selectedGroupId}`,
          groupBadge: knownGroup?.badge ?? null,
        });
      }
    }

    return [...unique.entries()]
      .map(([groupId, value]) => ({
        groupId,
        groupName: value.groupName,
        groupBadge: value.groupBadge,
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [activeFeed, groupFilters.groupIds, visibleItems]);

  const groupNameById = useMemo(() => {
    return new Map(
      groupOptions.map((option) => [
        option.groupId,
        {
          groupName: option.groupName,
          groupBadge: option.groupBadge,
        },
      ]),
    );
  }, [groupOptions]);

  const groupDropdownOptions = useMemo(() => {
    return groupOptions.filter((option) => Boolean(option.groupBadge?.trim()));
  }, [groupOptions]);

  const mapEventTypeLabels = useMemo(() => {
    const labelByValue = new Map(
      MAP_EVENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
    );

    return mapFilters.eventTypes
      .map((value) => labelByValue.get(value) ?? value)
      .slice(0, 2);
  }, [mapFilters.eventTypes]);

  const groupLabels = useMemo(() => {
    return groupFilters.groupIds
      .map((groupId) => {
        const entry = groupNameById.get(groupId) ?? null;
        return formatGroupTag(
          groupId,
          entry?.groupName ?? null,
          entry?.groupBadge ?? null,
        );
      })
      .slice(0, 2);
  }, [groupFilters.groupIds, groupNameById]);

  const selectedMapEventTypes = useMemo(
    () => new Set(mapFilters.eventTypes),
    [mapFilters.eventTypes],
  );
  const selectedGroupIds = useMemo(
    () => new Set(groupFilters.groupIds),
    [groupFilters.groupIds],
  );

  const handleMapRulesetChange = (ruleset: RulesetFilter | null) => {
    setMapFilters((previous) => {
      if (previous.ruleset === ruleset) {
        return previous;
      }

      return {
        ...previous,
        ruleset,
      };
    });

    setGroupFilters((previous) => {
      if (previous.playmode === ruleset) {
        return previous;
      }

      return {
        ...previous,
        playmode: ruleset,
      };
    });
  };

  const handleMapEventTypeToggle = (eventType: MapEventTypeFilter) => {
    setMapFilters((previous) => {
      const nextEventTypes = previous.eventTypes.includes(eventType)
        ? previous.eventTypes.filter((type) => type !== eventType)
        : [...previous.eventTypes, eventType];

      nextEventTypes.sort((a, b) => {
        const aIndex = MAP_EVENT_TYPE_ORDER.get(a) ?? 0;
        const bIndex = MAP_EVENT_TYPE_ORDER.get(b) ?? 0;
        return aIndex - bIndex;
      });

      return {
        ...previous,
        eventTypes: nextEventTypes,
      };
    });
  };

  const handleGroupPlaymodeChange = (playmode: RulesetFilter | null) => {
    setMapFilters((previous) => {
      if (previous.ruleset === playmode) {
        return previous;
      }

      return {
        ...previous,
        ruleset: playmode,
      };
    });

    setGroupFilters((previous) => {
      if (previous.playmode === playmode) {
        return previous;
      }

      return {
        ...previous,
        playmode,
      };
    });
  };

  const handleGroupIdToggle = (groupId: number) => {
    setGroupFilters((previous) => {
      const nextGroupIds = previous.groupIds.includes(groupId)
        ? previous.groupIds.filter((id) => id !== groupId)
        : [...previous.groupIds, groupId];

      nextGroupIds.sort((a, b) => a - b);

      return {
        ...previous,
        groupIds: nextGroupIds,
      };
    });
  };

  const resetMapFilters = () => {
    setMapFilters({
      ruleset: null,
      eventTypes: [],
      text: "",
    });
    setGroupFilters((previous) => ({
      ...previous,
      playmode: null,
    }));
  };

  const resetGroupFilters = () => {
    setMapFilters((previous) => ({
      ...previous,
      ruleset: null,
    }));
    setGroupFilters((previous) => ({
      ...previous,
      playmode: null,
      groupIds: [],
    }));
  };

  const mapFiltersActive =
    mapFilters.ruleset !== null ||
    mapFilters.eventTypes.length > 0 ||
    Boolean(mapFilters.text.trim());
  const groupFiltersActive =
    groupFilters.playmode !== null || groupFilters.groupIds.length > 0;
  const showResetButton =
    activeFeed === "map" ? mapFiltersActive : groupFiltersActive;
  const activeRuleset =
    activeFeed === "map" ? mapFilters.ruleset : groupFilters.playmode;

  const lastSyncTooltip = useMemo(() => {
    if (!showLiveStatusBadge) {
      return "";
    }

    if (typeof activeLastSyncedAt !== "number") {
      return "Last fetch: --";
    }

    return `Last fetch: ${new Date(activeLastSyncedAt).toLocaleString()}`;
  }, [activeLastSyncedAt, showLiveStatusBadge]);
  const canRevealFeedList = visibleItems.length > 0 && !showInitialLoader;

  return (
    <div
      class="relative isolate min-h-screen overflow-hidden px-5 pb-14 pt-10 max-[960px]:px-3 max-[960px]:pt-6"
    >
      <AnimatedBackground />
      <div
        class="feed-grid-layer pointer-events-none fixed inset-0 z-[2]"
        style={gridLayerStyle}
        aria-hidden="true"
      ></div>

      <header
        class="relative z-30 mx-auto mb-4 flex w-full max-w-[1100px] flex-col items-center gap-3.5 animate-[header-enter_920ms_cubic-bezier(0.16,1,0.3,1)_both]"
      >
        <h1
          class={`m-0 text-center font-[var(--font-display)] ${TEXT_STYLE.heroTitle} text-[#ebf2ff]`}
        >
          osu! mapping feed
        </h1>

        <div
          class="flex flex-wrap items-center justify-center gap-2.5"
          aria-label="Project Links"
        >
          <a
            class={`inline-flex items-center gap-1.5 text-[#c5d6ff] transition-transform duration-150 hover:-translate-y-px hover:text-[#f0f5ff] ${TEXT_STYLE.navLink}`}
            href={BACKEND_REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <GitBranch class="h-3.5 w-3.5 shrink-0" />
            Backend
          </a>
          <span
            class="-translate-y-px text-sm font-extrabold text-[#8da8dd]"
            aria-hidden="true"
          >
            •
          </span>
          <a
            class={`inline-flex items-center gap-1.5 text-[#c5d6ff] transition-transform duration-150 hover:-translate-y-px hover:text-[#f0f5ff] ${TEXT_STYLE.navLink}`}
            href={FRONTEND_REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <Code2 class="h-3.5 w-3.5 shrink-0" />
            Frontend
          </a>
          <span
            class="-translate-y-px text-sm font-extrabold text-[#8da8dd]"
            aria-hidden="true"
          >
            •
          </span>
          <a
            class={`inline-flex items-center gap-1.5 text-[#c5d6ff] transition-transform duration-150 hover:-translate-y-px hover:text-[#f0f5ff] ${TEXT_STYLE.navLink}`}
            href="/invite"
          >
            <MessageCircle class="h-3.5 w-3.5 shrink-0" />
            Discord
          </a>
        </div>

        <div class="w-full">
          <FeedSwitch activeFeed={activeFeed} onChange={setActiveFeed} />
        </div>

        <section class="w-full" aria-label="Route filters">
          <div class="flex w-full items-start gap-2 max-[960px]:flex-wrap">
            {activeFeed === "map" ? (
              <MultiSelectDropdown
                containerRef={mapDropdownRef}
                label="Event type"
                placeholder="All event types"
                selectedLabels={mapEventTypeLabels}
                selectedCount={mapFilters.eventTypes.length}
                open={mapEventDropdownOpen}
                onToggleOpen={() => {
                  setMapEventDropdownOpen((previous) => !previous);
                  setGroupDropdownOpen(false);
                }}
                options={MAP_EVENT_TYPE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                selectedValues={selectedMapEventTypes}
                onToggleValue={handleMapEventTypeToggle}
                ariaLabel="Map event type filter"
                menuStyle={menuStyle}
              />
            ) : (
              <MultiSelectDropdown
                containerRef={groupDropdownRef}
                label="Groups"
                placeholder="All groups"
                selectedLabels={groupLabels}
                selectedCount={groupFilters.groupIds.length}
                open={groupDropdownOpen}
                onToggleOpen={() => {
                  setGroupDropdownOpen((previous) => !previous);
                  setMapEventDropdownOpen(false);
                }}
                options={groupDropdownOptions.map((option) => ({
                  value: option.groupId,
                  label: option.groupName,
                  meta: `#${option.groupId}`,
                }))}
                selectedValues={selectedGroupIds}
                onToggleValue={handleGroupIdToggle}
                ariaLabel="Group filter"
                menuStyle={menuStyle}
                emptyMessage="No acronym groups available."
              />
            )}

            <div class="ml-auto inline-flex flex-col items-end justify-end gap-2">
              <RulesetSelector
                options={RULESET_OPTIONS}
                selectedRuleset={activeRuleset}
                onChange={(nextRuleset) => {
                  if (activeFeed === "map") {
                    handleMapRulesetChange(nextRuleset);
                    return;
                  }

                  handleGroupPlaymodeChange(nextRuleset);
                }}
              />

              {showResetButton && (
                <button
                  type="button"
                  class="cursor-pointer rounded-full border border-[#90adf542] bg-[#0b183a61] px-3 py-1.5 text-[11px] font-medium tracking-normal text-[#bfd1f5] transition-colors hover:border-[#b6ccff63] hover:bg-[#0e1e487a] hover:text-[#d7e5ff]"
                  onClick={activeFeed === "map" ? resetMapFilters : resetGroupFilters}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>
      </header>

      <main class="relative z-10 mx-auto flex w-full max-w-[1100px] flex-col gap-4">
        {activeError && (
          <p class="m-0 rounded-[14px] border border-[#ea586452] bg-[#220a13a6] px-3.5 py-3 text-sm text-[#ffc3c8]">
            {activeError}
          </p>
        )}

        {showInitialLoader && (
          <div
            class={`feed-preloader-stage ${
              initialLoaderExiting
                ? "feed-preloader-stage-exit"
                : "feed-preloader-stage-enter"
            }`}
          >
            <FeedLoadingState variant="initial" />
          </div>
        )}

        {!initialLoading && visibleItems.length === 0 && !activeError && (
          <p class="m-0 rounded-[14px] border border-[#6f9cff47] bg-[#0d163293] px-3.5 py-3 text-sm text-[#d0ddff]">
            No events yet.
          </p>
        )}

        {canRevealFeedList && (
          <div
            key={activeFeed}
            class="feed-list-shell-enter feed-list-transition feed-list-transition-visible"
          >
            <FeedList
              activeFeed={activeFeed}
              hasMore={activeHasMore}
              loadingMore={activeLoadingMore}
              onLoadMore={loadOlderForActiveFeed}
              visibleItems={visibleItems}
            />
          </div>
        )}
      </main>

      {showLiveStatusBadge ? <LiveStatusBadge tooltip={lastSyncTooltip} /> : null}
    </div>
  );
}
