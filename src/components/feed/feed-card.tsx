import type { CSSProperties } from "preact";
import rulesetCatchIcon from "../../assets/icons/RulesetCatch.png";
import rulesetManiaIcon from "../../assets/icons/RulesetMania.png";
import rulesetOsuIcon from "../../assets/icons/RulesetOsu.png";
import rulesetTaikoIcon from "../../assets/icons/RulesetTaiko.png";
import { getKnownUserGroupById } from "../../constants/user-groups";
import type { FeedEventViewEntryDto } from "../../dto/feed";
import { AppIcon } from "../icons/app-icon";
import {
  buildActorLabel,
  buildMapFooter,
  buildBeatmapCoverCardUrl,
  buildBeatmapLegacyThumbnailUrl,
  formatRelativeTime,
  getEventTheme,
} from "../../utils/feed-utils";

interface FeedCardProps {
  event: FeedEventViewEntryDto;
  index: number;
}

function getGroupRelation(
  eventType: FeedEventViewEntryDto["eventType"],
): string {
  if (eventType === "GroupAdd") {
    return "was added to";
  }

  if (eventType === "GroupRemove") {
    return "was removed from";
  }

  return "moved within";
}

const buildOsuAvatarUrl = (userId: number): string =>
  `https://a.ppy.sh/${userId}`;

const MODE_ICON_BY_RULESET: Record<"osu" | "taiko" | "catch" | "mania", string> = {
  osu: rulesetOsuIcon,
  taiko: rulesetTaikoIcon,
  catch: rulesetCatchIcon,
  mania: rulesetManiaIcon,
};

const MODE_TOOLTIP_BY_RULESET: Record<"osu" | "taiko" | "catch" | "mania", string> = {
  osu: "osu!standard",
  taiko: "osu!taiko",
  catch: "osu!catch",
  mania: "osu!mania",
};

const normalizeRuleset = (value: string): "osu" | "taiko" | "catch" | "mania" | null => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "osu" || normalized === "osu!") {
    return "osu";
  }

  if (normalized === "taiko") {
    return "taiko";
  }

  if (normalized === "catch" || normalized === "fruits" || normalized === "ctb") {
    return "catch";
  }

  if (normalized === "mania") {
    return "mania";
  }

  return null;
};

export function FeedCard({ event, index }: FeedCardProps) {
  const theme = getEventTheme(event.eventType);
  const relative = formatRelativeTime(event.createdAt);
  const createdTime = event.createdAt
    ? new Date(event.createdAt).toLocaleString("pt-BR")
    : "Data indisponivel";

  const mapData = event.map;
  const groupData = event.group;
  const eventModes = mapData?.modes ?? groupData?.playmodes ?? [];
  const knownGroup = groupData ? getKnownUserGroupById(groupData.groupId) : null;
  const groupAvatarUrl =
    groupData?.userId && groupData.userId > 0
      ? event.actor?.avatarUrl || buildOsuAvatarUrl(groupData.userId)
      : null;

  const cardHref = mapData?.beatmapsetUrl ?? event.primaryUrl;
  const mapperHref = mapData?.mapperUserId
    ? `https://osu.ppy.sh/users/${mapData.mapperUserId}`
    : null;
  const cardBackground = mapData
    ? `url("${buildBeatmapCoverCardUrl(mapData.setId)}"), url("${buildBeatmapLegacyThumbnailUrl(mapData.setId)}")`
    : "none";

  const cardStyle = {
    "--event-color": theme.color,
    "--card-image": cardBackground,
    animationDelay: `${Math.min(index * 45, 500)}ms`,
  } as CSSProperties;

  const actorLabel = buildActorLabel(event);
  const fallbackQuote = buildMapFooter(event);
  const quoteText =
    mapData?.message?.trim() ||
    (fallbackQuote && fallbackQuote !== actorLabel ? fallbackQuote : null);
  const visibleModes = [...new Set(eventModes.map(normalizeRuleset).filter(Boolean))] as Array<
    "osu" | "taiko" | "catch" | "mania"
  >;

  return (
    <article class={`feed-card${mapData ? " feed-card--with-image" : ""}`} style={cardStyle}>
      <div class="feed-card__line" aria-hidden="true"></div>
      <a
        class="feed-card__stretched-link"
        href={cardHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Open event details"
      ></a>

      <div class="feed-card__content">
        <header class="feed-card__header">
          <div class="feed-card__event">
            <span class="event-icon" aria-hidden="true">
              <AppIcon name={theme.icon} />
            </span>

            <div class="event-meta">
              <p class="event-title">{theme.label}</p>
              <time
                class="event-time"
                title={createdTime}
                dateTime={event.createdAt ?? undefined}
              >
                {relative}
              </time>
            </div>
          </div>

          {visibleModes.length > 0 && (
            <div class="card-rulesets" aria-label="Rulesets">
              {visibleModes.map((mode) => (
                <span
                  class="card-ruleset has-tooltip"
                  key={mode}
                  title={MODE_TOOLTIP_BY_RULESET[mode]}
                  aria-label={MODE_TOOLTIP_BY_RULESET[mode]}
                  data-tooltip={MODE_TOOLTIP_BY_RULESET[mode]}
                >
                  <img src={MODE_ICON_BY_RULESET[mode]} alt="" width="18" height="18" />
                </span>
              ))}
            </div>
          )}
        </header>

        {mapData && (
          <>
            <a
              class="map-title"
              href={mapData.beatmapsetUrl}
              target="_blank"
              rel="noreferrer"
            >
              {mapData.beatmapsetTitle}
            </a>

            <p class="map-subtitle">
              Mapped by{" "}
              {mapperHref ? (
                <a href={mapperHref} target="_blank" rel="noreferrer">
                  {mapData.mapperName}
                </a>
              ) : (
                <span>{mapData.mapperName}</span>
              )}
            </p>

            {mapData.rankedHistory.length > 0 && (
              <div class="history-block">
                <p class="history-label">Ranked History</p>
                <div class="history-row">
                {mapData.rankedHistory
                  .map((entry, index) => {
                    const actionTheme = getEventTheme(entry.action);
                    const historyActor = entry.username?.trim() || "Unknown";
                    const historyTooltip = `${actionTheme.label} by ${historyActor}`;
                    const style = {
                      "--history-color": actionTheme.color,
                    } as CSSProperties;

                    return (
                      <span
                        class="history-chip has-tooltip"
                        style={style}
                        key={`${entry.action}:${entry.userId ?? entry.username ?? "unknown"}:${index}`}
                        title={historyTooltip}
                        aria-label={historyTooltip}
                        data-tooltip={historyTooltip}
                      >
                        <AppIcon
                          name={actionTheme.icon}
                          className="history-chip__icon"
                          strokeWidth={2.8}
                        />
                        {historyActor}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {(actorLabel || quoteText) && (
              <div class="quote-block">
                {event.actor?.avatarUrl && (
                  <img
                    class="quote-block__avatar"
                    src={event.actor.avatarUrl}
                    alt=""
                    loading="lazy"
                    width="22"
                    height="22"
                  />
                )}

                <div class="quote-block__content">
                  {actorLabel && (
                    <p class="quote-block__author">{actorLabel}</p>
                  )}
                  {quoteText && <p class="quote-block__text">{quoteText}</p>}
                </div>
              </div>
            )}
          </>
        )}

        {groupData && (
          <div class="group-event">
            <a class="group-actor" href={groupData.userUrl} target="_blank" rel="noreferrer">
              {groupAvatarUrl ? (
                <img
                  class="group-actor__avatar"
                  src={groupAvatarUrl}
                  alt=""
                  loading="lazy"
                  width="34"
                  height="34"
                />
              ) : (
                <span class="group-actor__avatar group-actor__avatar--fallback" aria-hidden="true">
                  <AppIcon name="users" />
                </span>
              )}

              <span class="group-actor__meta">
                <span class="group-actor__name">{groupData.userName}</span>
                {event.actor?.badge ? (
                  <span class="group-actor__badge">[{event.actor.badge}]</span>
                ) : null}
              </span>
            </a>

            <p class="group-summary">
              <span class="group-summary__verb">{getGroupRelation(event.eventType)}</span>{" "}
              <a href={groupData.groupUrl} target="_blank" rel="noreferrer">
                {groupData.groupName?.trim() || knownGroup?.name || `Group #${groupData.groupId}`}
              </a>
              {knownGroup?.badge ? (
                <span class="group-badge-chip">[{knownGroup.badge}]</span>
              ) : null}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
