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
import { MessageCircle, Server } from "lucide-preact";
import { FeedCard } from "./components/feed/feed-card";
import { AppIcon } from "./components/icons/app-icon";
import { useFeedEvents } from "./hooks/use-feed-events";
import type { MapEventTypeFilter, RulesetFilter } from "./types/feed";
import { eventKey } from "./utils/feed-utils";
import "./app.css";

const BACKEND_REPO_URL =
  (import.meta.env.VITE_BACKEND_REPO_URL as string | undefined)?.trim() ||
  "https://github.com/maotovisk/mapping-feed";

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
  description: string;
}> = [
  {
    value: "nominate",
    label: "Nomination",
    description: "nominated",
  },
  {
    value: "nomination_reset",
    label: "Nomination Reset",
    description: "nomination reset",
  },
  {
    value: "qualify",
    label: "Qualified",
    description: "qualified",
  },
  {
    value: "disqualify",
    label: "Disqualified",
    description: "disqualified",
  },
  {
    value: "rank",
    label: "Ranked",
    description: "ranked",
  },
  {
    value: "unrank",
    label: "Unranked",
    description: "unranked",
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
    loadOlderForActiveFeed,
    mapFilters,
    setMapFilters,
    groupFilters,
    setGroupFilters,
  } = useFeedEvents();

  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0 });
  const [mapEventDropdownOpen, setMapEventDropdownOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

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

  const pageStyle = {
    "--cursor-x": `${cursorGlow.x}px`,
    "--cursor-y": `${cursorGlow.y}px`,
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
    mapFilters.ruleset !== null || mapFilters.eventTypes.length > 0;
  const groupFiltersActive =
    groupFilters.playmode !== null || groupFilters.groupIds.length > 0;

  return (
    <div class="page" style={pageStyle}>
      <div class="noise" aria-hidden="true"></div>

      <header class="hero-shell">
        <h1>osu! mapping feed</h1>
        <div class="hero-links" aria-label="Project Links">
          <a
            class="hero-link"
            href={BACKEND_REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <Server class="hero-link__icon" />
            Backend
          </a>
          <a class="hero-link" href="/invite">
            <MessageCircle class="hero-link__icon" />
            Discord
          </a>
        </div>

        <div class="hero-toolbar">
          <div class="feed-filter" role="tablist" aria-label="Feed Filter">
            <button
              type="button"
              role="tab"
              class={activeFeed === "map" ? "is-active" : ""}
              aria-selected={activeFeed === "map"}
              onClick={() => setActiveFeed("map")}
            >
              <AppIcon name="map" />
              Maps
            </button>

            <button
              type="button"
              role="tab"
              class={activeFeed === "group" ? "is-active" : ""}
              aria-selected={activeFeed === "group"}
              onClick={() => setActiveFeed("group")}
            >
              <AppIcon name="users" />
              Groups
            </button>
          </div>
        </div>

        <section class="route-filters" aria-label="Route filters">
          <div class="route-filters__row">
            {activeFeed === "map" ? (
              <div
                class={`tag-dropdown route-filters__primary${mapEventDropdownOpen ? " is-open" : ""}`}
                ref={mapDropdownRef}
              >
                <button
                  type="button"
                  class="tag-dropdown__trigger"
                  onClick={() => {
                    setMapEventDropdownOpen((previous) => !previous);
                    setGroupDropdownOpen(false);
                  }}
                  aria-expanded={mapEventDropdownOpen}
                >
                  <span class="tag-dropdown__heading">Event type</span>

                  {mapFilters.eventTypes.length > 0 ? (
                    <span class="tag-dropdown__tags">
                      {mapEventTypeLabels.map((label, index) => (
                        <span class="tag-pill" key={`${label}:${index}`}>
                          {label}
                        </span>
                      ))}
                      {mapFilters.eventTypes.length >
                        mapEventTypeLabels.length && (
                        <span class="tag-pill tag-pill--muted">
                          +
                          {mapFilters.eventTypes.length -
                            mapEventTypeLabels.length}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span class="tag-dropdown__placeholder">
                      All event types
                    </span>
                  )}
                  <span class="tag-dropdown__chevron" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {mapEventDropdownOpen && (
                  <div
                    class="tag-dropdown__menu"
                    role="listbox"
                    aria-label="Map event type filter"
                  >
                    {MAP_EVENT_TYPE_OPTIONS.map((option) => {
                      const selected = mapFilters.eventTypes.includes(
                        option.value,
                      );

                      return (
                        <button
                          key={option.value}
                          type="button"
                          class={`tag-dropdown__option${selected ? " is-selected" : ""}`}
                          onClick={() => {
                            handleMapEventTypeToggle(option.value);
                          }}
                        >
                          <span class="tag-dropdown__option-main">
                            {option.label}
                          </span>
                          <span class="tag-dropdown__option-side">
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div
                class={`tag-dropdown route-filters__primary${groupDropdownOpen ? " is-open" : ""}`}
                ref={groupDropdownRef}
              >
                <button
                  type="button"
                  class="tag-dropdown__trigger"
                  onClick={() => {
                    setGroupDropdownOpen((previous) => !previous);
                    setMapEventDropdownOpen(false);
                  }}
                  aria-expanded={groupDropdownOpen}
                >
                  <span class="tag-dropdown__heading">Groups</span>

                  {groupFilters.groupIds.length > 0 ? (
                    <span class="tag-dropdown__tags">
                      {groupLabels.map((label, index) => (
                        <span class="tag-pill" key={`${label}:${index}`}>
                          {label}
                        </span>
                      ))}
                      {groupFilters.groupIds.length > groupLabels.length && (
                        <span class="tag-pill tag-pill--muted">
                          +{groupFilters.groupIds.length - groupLabels.length}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span class="tag-dropdown__placeholder">All groups</span>
                  )}
                  <span class="tag-dropdown__chevron" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {groupDropdownOpen && (
                  <div
                    class="tag-dropdown__menu"
                    role="listbox"
                    aria-label="Group filter"
                  >
                    {groupDropdownOptions.length === 0 && (
                      <p class="tag-dropdown__empty">
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
                          class={`tag-dropdown__option${selected ? " is-selected" : ""}`}
                          onClick={() => {
                            handleGroupIdToggle(option.groupId);
                          }}
                        >
                          <span class="tag-dropdown__option-main">
                            {option.groupName}
                          </span>
                          <span class="tag-dropdown__option-side">
                            #{option.groupId}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div class="route-filters__controls">
              <div
                class="ruleset-filter"
                role="toolbar"
                aria-label="Mode Filter"
              >
                <button
                  type="button"
                  class={
                    activeFeed === "map"
                      ? mapFilters.ruleset === null
                        ? "is-active"
                        : ""
                      : groupFilters.playmode === null
                        ? "is-active"
                        : ""
                  }
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
                  <AppIcon name="layers" />
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
                      class={isSelected ? "is-active" : ""}
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
                        class="ruleset-filter__icon"
                        width="16"
                        height="16"
                      />
                    </button>
                  );
                })}
              </div>

              {activeFeed === "map" && mapFiltersActive && (
                <button
                  type="button"
                  class="filters-reset"
                  onClick={resetMapFilters}
                >
                  Reset
                </button>
              )}

              {activeFeed === "group" && groupFiltersActive && (
                <button
                  type="button"
                  class="filters-reset"
                  onClick={resetGroupFilters}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>
      </header>

      <main class="feed-shell">
        {activeError && <p class="error-message">{activeError}</p>}

        {initialLoading && visibleItems.length === 0 && (
          <p class="empty-message">Loading latest events...</p>
        )}

        {!initialLoading && visibleItems.length === 0 && !activeError && (
          <p class="empty-message">No events yet.</p>
        )}

        <section class="feed-list" aria-live="polite">
          {visibleItems.map((event, index) => (
            <FeedCard event={event} key={eventKey(event)} index={index} />
          ))}
        </section>

        {activeHasMore && (
          <div
            class="infinite-sentinel"
            ref={loadMoreRef}
            aria-hidden="true"
          ></div>
        )}
        {activeLoadingMore && (
          <p class="loading-more">Loading older events...</p>
        )}
      </main>
    </div>
  );
}
