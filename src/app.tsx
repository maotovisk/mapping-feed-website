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
import { eventKey, formatRelativeTime } from "./utils/feed-utils";

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
  const [syncClock, setSyncClock] = useState(() => Date.now());

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const mapDropdownRef = useRef<HTMLDivElement | null>(null);
  const groupDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCursorGlow({
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.35,
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
    const intervalId = window.setInterval(() => {
      setSyncClock(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const bgGlowStyle = {
    background: `
      radial-gradient(780px circle at ${cursorGlow.x}px ${cursorGlow.y}px, rgba(111, 96, 255, 0.2), transparent 58%),
      radial-gradient(620px circle at 8% 0%, rgba(39, 120, 255, 0.22), transparent 62%),
      radial-gradient(720px circle at 84% 7%, rgba(120, 59, 255, 0.2), transparent 64%),
      linear-gradient(180deg, #050b1a 0%, #060e1f 56%, #071225 100%)
    `,
  } as CSSProperties;

  const gridLayerStyle = {
    backgroundImage:
      "linear-gradient(rgba(158, 186, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(158, 186, 255, 0.06) 1px, transparent 1px)",
    backgroundSize: "72px 72px",
    maskImage:
      "linear-gradient(180deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 1) 25%)",
  } as CSSProperties;

  const noiseStyle = {
    backgroundImage:
      "radial-gradient(rgba(255, 255, 255, 0.18) 0.35px, transparent 0.35px)",
    backgroundSize: "3px 3px",
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
  };

  const resetGroupFilters = () => {
    setGroupFilters({
      playmode: null,
      groupIds: [],
    });
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

  const syncStatus = useMemo(() => {
    const feedLabel = activeFeed === "map" ? "Maps" : "Groups";
    const hasSynced = typeof activeLastSyncedAt === "number";
    const relativeSyncTime = hasSynced
      ? formatRelativeTime(new Date(activeLastSyncedAt).toISOString())
      : null;
    const text = relativeSyncTime
      ? `last updated at ${relativeSyncTime}`
      : "last updated at --";
    const title = activeError
      ? activeError
      : initialLoading && !hasSynced
        ? `${feedLabel} feed is syncing`
        : `${feedLabel} feed`;

    return {
      text,
      title,
    };
  }, [activeError, activeFeed, activeLastSyncedAt, initialLoading, syncClock]);

  return (
    <div class="relative min-h-screen overflow-hidden px-5 pb-14 pt-10 max-[960px]:px-3 max-[960px]:pt-6">
      <div
        class="pointer-events-none fixed inset-0 -z-20"
        style={bgGlowStyle}
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none fixed inset-0 -z-10"
        style={gridLayerStyle}
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none fixed inset-0 z-10 opacity-25 mix-blend-soft-light"
        style={noiseStyle}
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
        class="fixed bottom-[max(12px,env(safe-area-inset-bottom,0px))] right-[clamp(12px,2.2vw,28px)] z-[18] inline-flex min-h-[30px] max-w-[min(92vw,380px)] items-center gap-1.5 rounded-[10px] border border-[#8ea5d63d] bg-[#080f23a8] px-2.5 py-1.5 text-[#bdceef] shadow-[0_6px_16px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(238,245,255,0.06)] backdrop-blur-[6px]"
        role="status"
        aria-live="polite"
        title={syncStatus.title}
      >
        <span
          class="h-[7px] w-[7px] shrink-0 rounded-full bg-[#93a5ca] shadow-[0_0_0_3px_color-mix(in_srgb,#93a5ca_16%,transparent)]"
          aria-hidden="true"
        ></span>
        <span class={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#c2d4fa] ${TEXT_STYLE.caption}`}>
          {syncStatus.text}
        </span>
      </div>
    </div>
  );
}
