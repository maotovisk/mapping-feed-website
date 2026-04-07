import type { CSSProperties } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import rulesetCatchIcon from "./assets/icons/RulesetCatch.png";
import rulesetManiaIcon from "./assets/icons/RulesetMania.png";
import rulesetOsuIcon from "./assets/icons/RulesetOsu.png";
import rulesetTaikoIcon from "./assets/icons/RulesetTaiko.png";
import {
  KNOWN_USER_GROUPS,
  getKnownUserGroupById,
} from "./constants/user-groups";
import { TEXT_STYLE } from "./constants/typography";
import { Code2, GitBranch, MessageCircle } from "lucide-preact";
import { FeedCard } from "./components/feed/feed-card";
import { AppIcon } from "./components/icons/app-icon";
import { useFeedEvents } from "./hooks/use-feed-events";
import type { MapEventTypeFilter, RulesetFilter } from "./types/feed";
import { eventKey } from "./utils/feed-utils";

const BACKEND_REPO_URL =
  (import.meta.env.VITE_BACKEND_REPO_URL as string | undefined)?.trim() ||
  "https://github.com/maotovisk/mapping-feed";

const FRONTEND_REPO_URL =
  (import.meta.env.VITE_FRONTEND_REPO_URL as string | undefined)?.trim() ||
  "https://github.com/maotovisk/mappingfeed-website";

const RULESET_OPTIONS: Array<{
  value: RulesetFilter;
  label: string;
  iconSrc: string;
}> = [
  {
    value: "osu",
    label: "osu",
    iconSrc: rulesetOsuIcon,
  },
  {
    value: "taiko",
    label: "taiko",
    iconSrc: rulesetTaikoIcon,
  },
  {
    value: "catch",
    label: "catch",
    iconSrc: rulesetCatchIcon,
  },
  {
    value: "mania",
    label: "mania",
    iconSrc: rulesetManiaIcon,
  },
];

const MAP_EVENT_TYPE_OPTIONS: Array<{
  value: MapEventTypeFilter;
  label: string;
}> = [
  {
    value: "nominate",
    label: "Nomination",
  },
  {
    value: "nomination_reset",
    label: "Nomination Reset",
  },
  {
    value: "qualify",
    label: "Qualified",
  },
  {
    value: "disqualify",
    label: "Disqualified",
  },
  {
    value: "rank",
    label: "Ranked",
  },
  {
    value: "unrank",
    label: "Unranked",
  },
];

const MAP_EVENT_TYPE_ORDER = new Map(
  MAP_EVENT_TYPE_OPTIONS.map((option, index) => [option.value, index]),
);

const BACKGROUND_AMBIENT_ORBS = [
  {
    left: 8,
    top: 16,
    size: 260,
    opacity: 0.36,
    driftX: 26,
    driftY: -18,
    duration: 38,
    pulseDuration: 32,
    delay: -6,
  },
  {
    left: 22,
    top: 74,
    size: 300,
    opacity: 0.28,
    driftX: -30,
    driftY: 22,
    duration: 44,
    pulseDuration: 36,
    delay: -13,
  },
  {
    left: 34,
    top: 34,
    size: 220,
    opacity: 0.33,
    driftX: 18,
    driftY: 24,
    duration: 34,
    pulseDuration: 30,
    delay: -9,
  },
  {
    left: 48,
    top: 82,
    size: 280,
    opacity: 0.31,
    driftX: -24,
    driftY: -14,
    duration: 41,
    pulseDuration: 39,
    delay: -16,
  },
  {
    left: 62,
    top: 20,
    size: 320,
    opacity: 0.34,
    driftX: 34,
    driftY: 12,
    duration: 46,
    pulseDuration: 35,
    delay: -11,
  },
  {
    left: 74,
    top: 58,
    size: 250,
    opacity: 0.27,
    driftX: -22,
    driftY: 20,
    duration: 37,
    pulseDuration: 33,
    delay: -4,
  },
  {
    left: 88,
    top: 30,
    size: 290,
    opacity: 0.3,
    driftX: 20,
    driftY: -20,
    duration: 43,
    pulseDuration: 40,
    delay: -19,
  },
  {
    left: 14,
    top: 48,
    size: 240,
    opacity: 0.29,
    driftX: -16,
    driftY: -24,
    duration: 35,
    pulseDuration: 31,
    delay: -8,
  },
] as const;

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

  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0 });
  const [mapEventDropdownOpen, setMapEventDropdownOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPageFocused, setIsPageFocused] = useState(() =>
    typeof document === "undefined"
      ? true
      : document.visibilityState === "visible" && document.hasFocus(),
  );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    setCursorGlow({
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.45,
    });

    let animationFrame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(() => {
        setCursorGlow({ x: event.clientX, y: event.clientY });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !activeHasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        if (activeLoadingMore || initialLoading) {
          return;
        }

        void loadOlderForActiveFeed();
      },
      {
        root: null,
        rootMargin: "700px 0px 700px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [
    activeHasMore,
    activeLoadingMore,
    initialLoading,
    loadOlderForActiveFeed,
  ]);

  useEffect(() => {
    const hasOpenDropdown = mapEventDropdownOpen || groupDropdownOpen;
    if (!hasOpenDropdown) {
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

  const cursorGlowStyle = {
    background: `
      radial-gradient(300px circle at ${cursorGlow.x}px ${cursorGlow.y}px, rgba(47, 69, 146, 0.28), rgba(16, 28, 72, 0.2) 40%, transparent 72%),
      radial-gradient(500px circle at ${cursorGlow.x}px ${cursorGlow.y}px, rgba(24, 43, 104, 0.2), transparent 72%)
    `,
  } as CSSProperties;

  const gridLayerStyle = {
    backgroundImage:
      "linear-gradient(rgba(95, 117, 178, 0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(95, 117, 178, 0.065) 1px, transparent 1px)",
    backgroundSize: "76px 76px",
    maskImage:
      "linear-gradient(180deg, rgba(0, 0, 0, 0.14), rgba(0, 0, 0, 0.92) 24%, rgba(0, 0, 0, 0.92) 84%, rgba(0, 0, 0, 0.18))",
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
  const activeRulesetIndex = activeRuleset
    ? RULESET_OPTIONS.findIndex((option) => option.value === activeRuleset) + 1
    : 0;
  const rulesetThumbStyle = {
    transform: `translateX(${Math.max(activeRulesetIndex, 0) * 36}px)`,
  } as CSSProperties;
  const feedThumbStyle = {
    transform: `translateX(${activeFeed === "group" ? "100%" : "0%"})`,
  } as CSSProperties;

  const lastSyncTooltip = useMemo(() => {
    if (typeof activeLastSyncedAt !== "number") {
      return "Last fetch: --";
    }

    return `Last fetch: ${new Date(activeLastSyncedAt).toLocaleString()}`;
  }, [activeLastSyncedAt]);

  return (
    <div class="relative min-h-screen overflow-hidden px-5 pb-14 pt-10 max-[960px]:px-3 max-[960px]:pt-6">
      <div
        class="animated-bg-aurora pointer-events-none fixed inset-0 -z-20"
        aria-hidden="true"
      ></div>
      <div
        class="animated-bg-cursor-orb pointer-events-none fixed inset-0 -z-10 opacity-95"
        style={cursorGlowStyle}
        aria-hidden="true"
      ></div>
      <div class="animated-bg-orb-field fixed inset-0 -z-10" aria-hidden="true">
        {BACKGROUND_AMBIENT_ORBS.map((orb, index) => (
          <span
            key={`ambient-orb-${index}`}
            class="animated-bg-floating-orb"
            style={
              {
                left: `${orb.left}%`,
                top: `${orb.top}%`,
                width: `${orb.size}px`,
                height: `${orb.size}px`,
                "--orb-opacity": `${orb.opacity}`,
                "--orb-drift-x": `${orb.driftX}px`,
                "--orb-drift-y": `${orb.driftY}px`,
                "--orb-duration": `${orb.duration}s`,
                "--orb-pulse-duration": `${orb.pulseDuration}s`,
                "--orb-delay": `${orb.delay}s`,
              } as CSSProperties
            }
          ></span>
        ))}
      </div>
      <div
        class="pointer-events-none fixed inset-0 -z-10 opacity-56"
        style={gridLayerStyle}
        aria-hidden="true"
      ></div>

      <header class="relative z-30 mx-auto mb-4 flex w-full max-w-[1100px] animate-[header-enter_920ms_cubic-bezier(0.16,1,0.3,1)_both] flex-col items-center gap-3.5">
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
          <div
            class="group/feed relative mx-auto grid w-fit min-w-[230px] grid-cols-2 overflow-hidden rounded-full border border-[#b3ccff33] bg-[#081023c7] p-1.5 transition-colors duration-300 hover:border-[#c2d4ff52]"
            role="tablist"
            aria-label="Feed Filter"
          >
            <span
              class="pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 z-0 w-[calc((100%-0.75rem)/2)] rounded-full bg-gradient-to-r from-[#5285ff66] to-[#8355ff66] shadow-[inset_0_1px_0_rgba(229,236,255,0.14),0_8px_20px_rgba(36,68,147,0.24)] transition-transform duration-300"
              style={feedThumbStyle}
              aria-hidden="true"
            ></span>
            <button
              type="button"
              role="tab"
              class={`relative z-10 inline-flex min-w-[106px] items-center justify-center gap-2 rounded-full px-4 py-2.5 transition-colors ${TEXT_STYLE.tabLabel} ${
                activeFeed === "map"
                  ? "text-[#f4f7ff]"
                  : "text-[#d5e1ff] hover:bg-[#88a7f61a] hover:text-[#eaf1ff]"
              }`}
              aria-selected={activeFeed === "map"}
              onClick={() => setActiveFeed("map")}
            >
              <AppIcon name="map" className="h-4 w-4" />
              Maps
            </button>

            <button
              type="button"
              role="tab"
              class={`relative z-10 inline-flex min-w-[106px] items-center justify-center gap-2 rounded-full px-4 py-2.5 transition-colors ${TEXT_STYLE.tabLabel} ${
                activeFeed === "group"
                  ? "text-[#f4f7ff]"
                  : "text-[#d5e1ff] hover:bg-[#88a7f61a] hover:text-[#eaf1ff]"
              }`}
              aria-selected={activeFeed === "group"}
              onClick={() => setActiveFeed("group")}
            >
              <AppIcon name="users" className="h-4 w-4" />
              Groups
            </button>
          </div>
        </div>

        <section class="w-full" aria-label="Route filters">
          <div class="flex w-full items-start gap-2 max-[960px]:flex-wrap">
            {activeFeed === "map" ? (
              <div
                class="relative z-40 mr-auto min-w-0 w-full max-w-[430px] flex-1 max-[960px]:max-w-none max-[960px]:basis-full"
                ref={mapDropdownRef}
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-2.5 rounded-xl border border-[#8eafff57] bg-[#08122ccc] px-3 py-2.5 text-[#dce8ff] transition-colors hover:border-[#abc5ff94]"
                  onClick={() => {
                    setMapEventDropdownOpen((previous) => !previous);
                    setGroupDropdownOpen(false);
                  }}
                  aria-expanded={mapEventDropdownOpen}
                >
                  <span class={`shrink-0 text-[#a7bde8] ${TEXT_STYLE.filterLabel}`}>
                    Event type
                  </span>

                  {mapFilters.eventTypes.length > 0 ? (
                    <span class="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                      {mapEventTypeLabels.map((label, index) => (
                        <span
                          class="inline-flex max-w-[170px] items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-[#8eafff66] bg-[#416ad033] px-2.5 py-[3px] text-xs font-bold text-[#e7efff]"
                          key={`${label}:${index}`}
                        >
                          {label}
                        </span>
                      ))}
                      {mapFilters.eventTypes.length >
                        mapEventTypeLabels.length && (
                        <span class="inline-flex items-center rounded-full border border-[#93ace04d] bg-[#506dac33] px-2.5 py-[3px] text-xs font-bold text-[#b6c9ee]">
                          +
                          {mapFilters.eventTypes.length -
                            mapEventTypeLabels.length}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span class={`min-w-0 flex-1 text-left text-[#dce8ff] ${TEXT_STYLE.body}`}>
                      All event types
                    </span>
                  )}
                  <span
                    class="shrink-0 text-sm text-[#9db5e9]"
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {mapEventDropdownOpen && (
                  <div
                    class="absolute right-0 top-[calc(100%+8px)] z-[70] flex w-[min(360px,86vw)] origin-top-right animate-[dropdown-shell-in_540ms_cubic-bezier(0.16,1,0.3,1)] flex-col gap-2 overflow-y-auto rounded-[13px] border border-[#93b3ff5c] bg-[linear-gradient(180deg,rgba(11,21,48,0.992),rgba(8,16,37,0.992))] p-2 shadow-[0_18px_36px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(228,237,255,0.1)] backdrop-blur-[8px] max-[960px]:left-0 max-[960px]:right-0 max-[960px]:w-auto"
                    role="listbox"
                    aria-label="Map event type filter"
                    style={menuStyle}
                  >
                    {MAP_EVENT_TYPE_OPTIONS.map((option) => {
                      const selected = mapFilters.eventTypes.includes(
                        option.value,
                      );

                      return (
                        <button
                          key={option.value}
                          type="button"
                          class={`flex min-h-11 w-full animate-[dropdown-item-in_460ms_cubic-bezier(0.18,0.84,0.24,1)] items-center justify-between gap-2.5 rounded-[10px] border px-3.5 py-3 text-left text-[#d7e5ff] transition-colors ${
                            selected
                              ? "border-[#8daeff80] bg-[linear-gradient(110deg,rgba(76,123,241,0.24),rgba(135,86,255,0.2))]"
                              : "border-transparent bg-transparent hover:bg-[#6e90e324]"
                          }`}
                          onClick={() => {
                            handleMapEventTypeToggle(option.value);
                          }}
                        >
                          <span class={`text-[#edf3ff] ${TEXT_STYLE.menuItem}`}>
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div
                class="relative z-40 mr-auto min-w-0 w-full max-w-[430px] flex-1 max-[960px]:max-w-none max-[960px]:basis-full"
                ref={groupDropdownRef}
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-2.5 rounded-xl border border-[#8eafff57] bg-[#08122ccc] px-3 py-2.5 text-[#dce8ff] transition-colors hover:border-[#abc5ff94]"
                  onClick={() => {
                    setGroupDropdownOpen((previous) => !previous);
                    setMapEventDropdownOpen(false);
                  }}
                  aria-expanded={groupDropdownOpen}
                >
                  <span class={`shrink-0 text-[#a7bde8] ${TEXT_STYLE.filterLabel}`}>
                    Groups
                  </span>

                  {groupFilters.groupIds.length > 0 ? (
                    <span class="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                      {groupLabels.map((label, index) => (
                        <span
                          class="inline-flex max-w-[170px] items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-[#8eafff66] bg-[#416ad033] px-2.5 py-[3px] text-xs font-bold text-[#e7efff]"
                          key={`${label}:${index}`}
                        >
                          {label}
                        </span>
                      ))}
                      {groupFilters.groupIds.length > groupLabels.length && (
                        <span class="inline-flex items-center rounded-full border border-[#93ace04d] bg-[#506dac33] px-2.5 py-[3px] text-xs font-bold text-[#b6c9ee]">
                          +{groupFilters.groupIds.length - groupLabels.length}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span class={`min-w-0 flex-1 text-left text-[#dce8ff] ${TEXT_STYLE.body}`}>
                      All groups
                    </span>
                  )}
                  <span
                    class="shrink-0 text-sm text-[#9db5e9]"
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {groupDropdownOpen && (
                  <div
                    class="absolute right-0 top-[calc(100%+8px)] z-[70] flex w-[min(360px,86vw)] origin-top-right animate-[dropdown-shell-in_540ms_cubic-bezier(0.16,1,0.3,1)] flex-col gap-2 overflow-y-auto rounded-[13px] border border-[#93b3ff5c] bg-[linear-gradient(180deg,rgba(11,21,48,0.992),rgba(8,16,37,0.992))] p-2 shadow-[0_18px_36px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(228,237,255,0.1)] backdrop-blur-[8px] max-[960px]:left-0 max-[960px]:right-0 max-[960px]:w-auto"
                    role="listbox"
                    aria-label="Group filter"
                    style={menuStyle}
                  >
                    {groupDropdownOptions.length === 0 && (
                      <p class={`m-0 p-2.5 text-[#9eb2db] ${TEXT_STYLE.body}`}>
                        No acronym groups available.
                      </p>
                    )}

                    {groupDropdownOptions.map((option) => {
                      const selected = groupFilters.groupIds.includes(
                        option.groupId,
                      );

                      return (
                        <button
                          key={option.groupId}
                          type="button"
                          class={`flex min-h-11 w-full animate-[dropdown-item-in_460ms_cubic-bezier(0.18,0.84,0.24,1)] items-center justify-between gap-2.5 rounded-[10px] border px-3.5 py-3 text-left text-[#d7e5ff] transition-colors ${
                            selected
                              ? "border-[#8daeff80] bg-[linear-gradient(110deg,rgba(76,123,241,0.24),rgba(135,86,255,0.2))]"
                              : "border-transparent bg-transparent hover:bg-[#6e90e324]"
                          }`}
                          onClick={() => {
                            handleGroupIdToggle(option.groupId);
                          }}
                        >
                          <span class={`text-[#edf3ff] ${TEXT_STYLE.menuItem}`}>
                            {option.groupName}
                          </span>
                          <span class="text-xs text-[#9fb7e5]">
                            #{option.groupId}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div class="ml-auto inline-flex flex-col items-end justify-end gap-2">
              <div
                class="relative inline-grid grid-cols-5 overflow-hidden rounded-[14px] border border-[#94b4ff40] bg-[#081129b8] p-1"
                role="toolbar"
                aria-label="Mode Filter"
              >
                <span
                  class="pointer-events-none absolute left-1 top-1 z-0 h-9 w-9 rounded-[10px] bg-[linear-gradient(120deg,rgba(74,132,255,0.34),rgba(134,91,255,0.34))] shadow-[inset_0_1px_0_rgba(231,239,255,0.14),0_6px_16px_rgba(32,65,140,0.24)] transition-transform duration-300"
                  style={rulesetThumbStyle}
                  aria-hidden="true"
                ></span>
                <button
                  type="button"
                  class={`relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors ${
                    activeFeed === "map"
                      ? mapFilters.ruleset === null
                        ? "text-[#f3f7ff]"
                        : "text-[#bed0fa] hover:bg-[#7f9ee31a] hover:text-[#e2ecff]"
                      : groupFilters.playmode === null
                        ? "text-[#f3f7ff]"
                        : "text-[#bed0fa] hover:bg-[#7f9ee31a] hover:text-[#e2ecff]"
                  }`}
                  onClick={() => {
                    if (activeFeed === "map") {
                      handleMapRulesetChange(null);
                      return;
                    }

                    handleGroupPlaymodeChange(null);
                  }}
                  title="All modes"
                  aria-label="All modes"
                >
                  <AppIcon name="layers" className="h-3.5 w-3.5" />
                </button>

                {RULESET_OPTIONS.map((option) => {
                  const isSelected =
                    activeFeed === "map"
                      ? mapFilters.ruleset === option.value
                      : groupFilters.playmode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      class={`relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors ${
                        isSelected
                          ? "text-[#f3f7ff]"
                          : "text-[#bed0fa] hover:bg-[#7f9ee31a] hover:text-[#e2ecff]"
                      }`}
                      onClick={() => {
                        if (activeFeed === "map") {
                          handleMapRulesetChange(option.value);
                          return;
                        }

                        handleGroupPlaymodeChange(option.value);
                      }}
                      title={option.label}
                      aria-label={option.label}
                    >
                      <img
                        src={option.iconSrc}
                        alt=""
                        class="h-[18px] w-[18px] rounded-full shadow-[0_0_0_1px_rgba(178,202,255,0.24)]"
                        width="16"
                        height="16"
                      />
                    </button>
                  );
                })}
              </div>

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

        {initialLoading && visibleItems.length === 0 && (
          <p class="m-0 rounded-[14px] border border-[#6f9cff47] bg-[#0d163293] px-3.5 py-3 text-sm text-[#d0ddff]">
            Loading latest events...
          </p>
        )}

        {!initialLoading && visibleItems.length === 0 && !activeError && (
          <p class="m-0 rounded-[14px] border border-[#6f9cff47] bg-[#0d163293] px-3.5 py-3 text-sm text-[#d0ddff]">
            No events yet.
          </p>
        )}

        <section
          key={activeFeed}
          class="flex animate-[tab-content-in_640ms_cubic-bezier(0.16,1,0.3,1)] flex-col gap-3"
          aria-live="polite"
        >
          {visibleItems.map((event, index) => (
            <FeedCard event={event} key={eventKey(event)} index={index} />
          ))}
        </section>

        {activeHasMore && (
          <div class="h-0.5 w-full" ref={loadMoreRef} aria-hidden="true"></div>
        )}
        {activeLoadingMore && (
          <p class="m-0 px-0 py-2 text-center text-sm text-[#acc0ed]">
            Loading older events...
          </p>
        )}
      </main>

      <div
        class="group/live fixed bottom-[max(12px,env(safe-area-inset-bottom,0px))] right-[clamp(12px,2.2vw,28px)] z-[18] inline-flex min-h-[30px] max-w-[min(92vw,380px)] items-center gap-1.5 rounded-[10px] border border-[#5bb9874d] bg-[#071825c7] px-2.5 py-1.5 text-[#c7f9dd] shadow-[0_6px_16px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(226,255,241,0.08)] backdrop-blur-[6px]"
        role="status"
        aria-live="polite"
        title={lastSyncTooltip}
      >
        <span
          class="h-[7px] w-[7px] shrink-0 rounded-full bg-[#4ade80] shadow-[0_0_0_3px_color-mix(in_srgb,#4ade80_22%,transparent)]"
          aria-hidden="true"
        ></span>
        <span
          class={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#c7f9dd] ${TEXT_STYLE.caption}`}
        >
          live updated
        </span>
        <span class="pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg border border-[#85d7ab66] bg-[#041120f7] px-2 py-1 text-xs font-semibold text-[#d7ffe8] opacity-0 invisible translate-y-1 transition-all duration-200 ease-out group-hover/live:visible group-hover/live:opacity-100 group-hover/live:translate-y-0">
          {lastSyncTooltip}
        </span>
      </div>
    </div>
  );
}
