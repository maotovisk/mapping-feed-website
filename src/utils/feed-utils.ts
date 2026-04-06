import { EVENT_THEMES, MAP_FOOTER_TYPES } from "../constants/feed";
import type { FeedEventViewEntryDto } from "../dto/feed";
import type { EventType } from "../dto/feed";
import type { EventTheme } from "../types/feed";

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

export const eventKey = (event: FeedEventViewEntryDto): string =>
  `${event.feedType}:${event.eventId}`;

const parseTimestamp = (createdAt: string | null): number => {
  if (!createdAt) {
    return 0;
  }

  const timestamp = Date.parse(createdAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const sortEventsNewestFirst = (
  items: FeedEventViewEntryDto[],
): FeedEventViewEntryDto[] => {
  return [...items].sort((a, b) => {
    const timeDiff = parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt);
    if (timeDiff !== 0) {
      return timeDiff;
    }

    return b.eventId - a.eventId;
  });
};

export const mergeEvents = (
  current: FeedEventViewEntryDto[],
  incoming: FeedEventViewEntryDto[],
): FeedEventViewEntryDto[] => {
  if (incoming.length === 0) {
    return current;
  }

  const merged = [...current];
  const seen = new Set(current.map(eventKey));

  for (const item of incoming) {
    const key = eventKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }

  return sortEventsNewestFirst(merged);
};

const trimMessage = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
};

export const formatRelativeTime = (createdAt: string | null): string => {
  if (!createdAt) {
    return "just now";
  }

  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) {
    return "unknown";
  }

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);

  if (abs < 60) {
    return RELATIVE_TIME_FORMATTER.format(diffSeconds, "second");
  }

  if (abs < 3600) {
    return RELATIVE_TIME_FORMATTER.format(
      Math.round(diffSeconds / 60),
      "minute",
    );
  }

  if (abs < 86_400) {
    return RELATIVE_TIME_FORMATTER.format(
      Math.round(diffSeconds / 3600),
      "hour",
    );
  }

  return RELATIVE_TIME_FORMATTER.format(
    Math.round(diffSeconds / 86_400),
    "day",
  );
};

export const buildBeatmapCoverCardUrl = (setId: number): string =>
  `https://assets.ppy.sh/beatmaps/${setId}/covers/card@2x.jpg`;

export const buildBeatmapLegacyThumbnailUrl = (setId: number): string =>
  `https://b.ppy.sh/thumb/${setId}l.jpg`;

const isEventType = (value: string): value is EventType =>
  value in EVENT_THEMES;

export const getEventTheme = (eventType: string): EventTheme => {
  if (isEventType(eventType)) {
    return EVENT_THEMES[eventType];
  }

  return {
    label: eventType,
    color: "#95a5a6",
    icon: "layers",
  };
};

export const buildModesTag = (modes: string[]): string => {
  if (modes.length === 0) {
    return "[osu]";
  }

  return modes.map((mode) => `[${mode}]`).join("");
};

export const buildActorLabel = (
  event: FeedEventViewEntryDto,
): string | null => {
  const actorName = event.actor?.username?.trim();
  if (!actorName) {
    return null;
  }

  const badge = event.actor?.badge?.trim();
  return badge ? `${actorName} [${badge}]` : actorName;
};

export const buildMapFooter = (event: FeedEventViewEntryDto): string | null => {
  const actorLabel = buildActorLabel(event);
  if (!actorLabel) {
    return null;
  }

  if (
    (event.eventType === "NominationReset" ||
      event.eventType === "Disqualification") &&
    event.map?.message
  ) {
    return `${actorLabel} - "${trimMessage(event.map.message.trim(), 53)}"`;
  }

  if (MAP_FOOTER_TYPES.has(event.eventType)) {
    return actorLabel;
  }

  return null;
};
