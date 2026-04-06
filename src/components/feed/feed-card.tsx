import type { CSSProperties } from "preact";
import type { FeedEventViewEntryDto } from "../../dto/feed";
import { AppIcon } from "../icons/app-icon";
import {
  buildActorLabel,
  buildMapFooter,
  buildModesTag,
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

export function FeedCard({ event, index }: FeedCardProps) {
  const theme = getEventTheme(event.eventType);
  const relative = formatRelativeTime(event.createdAt);
  const createdTime = event.createdAt
    ? new Date(event.createdAt).toLocaleString("pt-BR")
    : "Data indisponivel";

  const mapData = event.map;
  const groupData = event.group;

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
              )}{" "}
              <strong>{buildModesTag(mapData.modes)}</strong>
            </p>

            {mapData.rankedHistory.length > 0 && (
              <div class="history-row">
                {mapData.rankedHistory
                  .filter((entry) => Boolean(entry.username?.trim()))
                  .map((entry) => {
                    const actionTheme = getEventTheme(entry.action);
                    const style = {
                      "--history-color": actionTheme.color,
                    } as CSSProperties;

                    return (
                      <span
                        class="history-chip"
                        style={style}
                        key={`${entry.action}:${entry.userId ?? entry.username}`}
                      >
                        <AppIcon
                          name={actionTheme.icon}
                          className="history-chip__icon"
                          strokeWidth={2.8}
                        />
                        {entry.username?.trim()}
                      </span>
                    );
                  })}
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
          <>
            <p class="group-summary">
              <a href={groupData.userUrl} target="_blank" rel="noreferrer">
                {groupData.userName}
              </a>{" "}
              {getGroupRelation(event.eventType)}{" "}
              <a href={groupData.groupUrl} target="_blank" rel="noreferrer">
                {groupData.groupName}
              </a>
            </p>

            {groupData.playmodes.length > 0 && (
              <p class="group-modes">for [{groupData.playmodes.join(", ")}]</p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
