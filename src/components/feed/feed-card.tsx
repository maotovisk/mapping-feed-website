import type { CSSProperties } from "preact";
import rulesetCatchIcon from "../../assets/icons/RulesetCatch.png";
import rulesetManiaIcon from "../../assets/icons/RulesetMania.png";
import rulesetOsuIcon from "../../assets/icons/RulesetOsu.png";
import rulesetTaikoIcon from "../../assets/icons/RulesetTaiko.png";
import { getKnownUserGroupById } from "../../constants/user-groups";
import { TEXT_STYLE } from "../../constants/typography";
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

const buildOsuAvatarUrl = (userId: number): string => `https://a.ppy.sh/${userId}`;

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

const normalizeBadge = (value: string | null | undefined): string | null => {
  const badge = value?.trim();
  return badge || null;
};

const buildBadgeStyle = (
  color: string | null | undefined,
): CSSProperties | undefined => {
  const normalizedColor = color?.trim();
  if (!normalizedColor) {
    return undefined;
  }

  return {
    border: `1px solid color-mix(in srgb, ${normalizedColor} 58%, transparent)`,
    background: `color-mix(in srgb, ${normalizedColor} 19%, rgba(14, 26, 57, 0.8))`,
    color: `color-mix(in srgb, ${normalizedColor} 78%, #edf4ff)`,
  };
};

const buildGroupAccentStyle = (
  color: string | null | undefined,
): CSSProperties | undefined => {
  const normalizedColor = color?.trim();
  if (!normalizedColor) {
    return undefined;
  }

  return {
    borderColor: `color-mix(in srgb, ${normalizedColor} 30%, rgba(147, 176, 232, 0.22))`,
    background: `linear-gradient(180deg, color-mix(in srgb, ${normalizedColor} 12%, rgba(13, 26, 58, 0.72)), rgba(8, 18, 43, 0.72))`,
  };
};

const buildHistoryStyle = (color: string): CSSProperties => {
  return {
    color: `color-mix(in srgb, ${color} 78%, #eef4ff)`,
    background: `color-mix(in srgb, ${color} 24%, rgba(10, 19, 44, 0.84))`,
    borderColor: `color-mix(in srgb, ${color} 62%, transparent)`,
  };
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
    borderColor: `color-mix(in srgb, ${theme.color} 50%, transparent)`,
    background: mapData
      ? `linear-gradient(128deg, color-mix(in srgb, ${theme.color} 30%, rgba(7, 16, 40, 0.96)) 0%, rgba(5, 12, 31, 0.92) 76%), rgba(7, 16, 38, 0.94)`
      : `linear-gradient(135deg, color-mix(in srgb, ${theme.color} 18%, rgba(8, 17, 42, 0.95)) 0%, rgba(6, 13, 32, 0.95) 70%), rgba(7, 16, 38, 0.94)`,
    animationDelay: `${Math.min(index * 45, 500)}ms`,
  } as CSSProperties;

  const imageOverlayStyle = {
    background:
      mapData
        ? `linear-gradient(112deg, color-mix(in srgb, ${theme.color} 34%, rgba(6, 14, 34, 0.74)) 0%, rgba(7, 15, 36, 0.76) 46%, rgba(5, 11, 30, 0.88) 100%), radial-gradient(120% 115% at 0% 0%, rgba(3, 8, 24, 0.26), rgba(5, 12, 30, 0.64))`
        : `radial-gradient(120% 100% at 0% 0%, rgba(7, 14, 34, 0.5), rgba(8, 15, 36, 0.9)), linear-gradient(100deg, rgba(4, 10, 28, 0.94) 0%, rgba(6, 14, 35, 0.82) 62%, rgba(4, 11, 28, 0.9) 100%)`,
  } as CSSProperties;

  const lineStyle = {
    background: theme.color,
    boxShadow: `0 0 24px color-mix(in srgb, ${theme.color} 64%, transparent)`,
  } as CSSProperties;

  const eventIconStyle = {
    background: `color-mix(in srgb, ${theme.color} 22%, rgba(9, 17, 36, 0.95))`,
    color: `color-mix(in srgb, ${theme.color} 85%, #d8e6ff)`,
    borderColor: `color-mix(in srgb, ${theme.color} 55%, transparent)`,
  } as CSSProperties;

  const actorLabel = buildActorLabel(event);
  const actorBadge = normalizeBadge(event.actor?.badge);
  const actorBadgeStyle = buildBadgeStyle(event.actor?.color);
  const fallbackQuote = buildMapFooter(event);
  const quoteText =
    mapData?.message?.trim() ||
    (fallbackQuote && fallbackQuote !== actorLabel ? fallbackQuote : null);
  const visibleModes = [...new Set(eventModes.map(normalizeRuleset).filter(Boolean))] as Array<
    "osu" | "taiko" | "catch" | "mania"
  >;
  const groupEventStyle = buildGroupAccentStyle(groupData?.groupColor);
  const openCard = () => {
    window.open(cardHref, "_blank", "noopener,noreferrer");
  };

  const handleCardClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a,button,input,textarea,select,label")) {
      return;
    }

    openCard();
  };

  const handleCardKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openCard();
  };

  return (
    <article
      class="group relative overflow-hidden rounded-[18px] border px-4 py-4 pl-[18px] shadow-[0_12px_30px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(178,194,255,0.08)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.45)] animate-[card-enter_820ms_cubic-bezier(0.16,1,0.3,1)_both]"
      style={cardStyle}
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {mapData && (
        <div
          class="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-95 transition-opacity duration-200 group-hover:opacity-100"
          style={{ backgroundImage: cardBackground }}
          aria-hidden="true"
        ></div>
      )}
      <div
        class="pointer-events-none absolute inset-0 z-[1]"
        style={imageOverlayStyle}
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none absolute bottom-[9px] left-0 top-[9px] z-[3] w-[5px] rounded-r-[8px]"
        style={lineStyle}
        aria-hidden="true"
      ></div>

      <div class="relative z-20 min-w-0">
        <header class="flex items-start justify-between gap-3">
          <div class="inline-flex min-w-0 items-center gap-2.5">
            <span
              class="inline-flex h-[31px] w-[31px] items-center justify-center rounded-[9px] border"
              style={eventIconStyle}
              aria-hidden="true"
            >
              <AppIcon name={theme.icon} className="h-[18px] w-[18px]" />
            </span>

            <div class="min-w-0">
              <p class={`m-0 text-[#edf4ff] ${TEXT_STYLE.title}`}>{theme.label}</p>
              <time class="text-xs text-[#96addf]" title={createdTime} dateTime={event.createdAt ?? undefined}>
                {relative}
              </time>
            </div>
          </div>

          {visibleModes.length > 0 && (
            <div class="inline-flex flex-wrap items-center justify-end gap-1.5" aria-label="Rulesets">
              {visibleModes.map((mode) => (
                <span
                  class="group/tooltip relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#a4bef956] bg-[#0a142eb8] shadow-[inset_0_1px_0_rgba(230,238,255,0.1)]"
                  key={mode}
                  aria-label={MODE_TOOLTIP_BY_RULESET[mode]}
                >
                  <img src={MODE_ICON_BY_RULESET[mode]} alt="" width="18" height="18" class="h-[18px] w-[18px] rounded-full" />
                  <span class="pointer-events-none absolute right-0 top-full z-40 mt-2 whitespace-nowrap rounded-lg border border-[#94b2ec57] bg-[#070f25f2] px-2 py-1 text-xs font-semibold text-[#dce8ff] opacity-0 translate-y-1 invisible transition-all duration-300 ease-out group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0">
                    {MODE_TOOLTIP_BY_RULESET[mode]}
                  </span>
                </span>
              ))}
            </div>
          )}
        </header>

        {mapData && (
          <>
            <a
              class={`relative z-30 mt-2.5 inline-block text-[#69b0ff] hover:underline ${TEXT_STYLE.cardHeading}`}
              href={mapData.beatmapsetUrl}
              target="_blank"
              rel="noreferrer"
            >
              {mapData.beatmapsetTitle}
            </a>

            <p class="m-0 mt-1.5 text-sm text-[#c3d1f3]">
              Mapped by{" "}
              {mapperHref ? (
                <a class="relative z-30 text-[#ecf2ff] no-underline hover:underline" href={mapperHref} target="_blank" rel="noreferrer">
                  {mapData.mapperName}
                </a>
              ) : (
                <span>{mapData.mapperName}</span>
              )}
            </p>

            {mapData.rankedHistory.length > 0 && (
              <div class="mt-2.5">
                <p class={`m-0 text-[#9db6e6] ${TEXT_STYLE.filterLabel}`}>Ranked History</p>
                <div class="mt-2.5 flex flex-wrap gap-[7px]">
                  {mapData.rankedHistory.map((entry, historyIndex) => {
                    const actionTheme = getEventTheme(entry.action);
                    const historyActor = entry.username?.trim() || "Unknown";
                    const historyTooltip = `${actionTheme.label} by ${historyActor}`;

                    return (
                      <span
                        class="group/tooltip relative inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-sm shadow-[inset_0_1px_0_rgba(245,248,255,0.12)]"
                        style={buildHistoryStyle(actionTheme.color)}
                        key={`${entry.action}:${entry.userId ?? entry.username ?? "unknown"}:${historyIndex}`}
                        aria-label={historyTooltip}
                      >
                        <AppIcon
                          name={actionTheme.icon}
                          className="h-[14px] w-[14px]"
                          strokeWidth={2.8}
                        />
                        {historyActor}
                        <span class="pointer-events-none absolute bottom-full left-0 z-40 mb-2 whitespace-nowrap rounded-lg border border-[#94b2ec57] bg-[#070f25f2] px-2 py-1 text-xs font-semibold text-[#dce8ff] opacity-0 translate-y-1 invisible transition-all duration-300 ease-out group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0">
                          {historyTooltip}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {(actorLabel || quoteText) && (
              <div class="mt-2.5 flex items-center gap-2 rounded-[14px] border border-[#99b0e952] bg-[linear-gradient(180deg,rgba(15,27,60,0.76),rgba(8,18,44,0.76))] px-2.5 py-2 text-[#d6e4ff]">
                {event.actor?.avatarUrl && (
                  <img
                    class="h-[22px] w-[22px] shrink-0 rounded-full border border-[#99b3ff73]"
                    src={event.actor.avatarUrl}
                    alt=""
                    loading="lazy"
                    width="22"
                    height="22"
                  />
                )}

                <div class="min-w-0">
                  {actorLabel && (
                    <p class="m-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#a8bde9]">
                      <span>{actorLabel}</span>
                      {actorBadge ? (
                          <span
                          class={`inline-flex max-w-full items-center whitespace-nowrap rounded-full px-1.5 py-px uppercase ${TEXT_STYLE.filterLabel}`}
                          style={actorBadgeStyle}
                        >
                          {actorBadge}
                        </span>
                      ) : null}
                    </p>
                  )}
                  {quoteText && <p class={`m-0 mt-0.5 break-words text-[#dce8ff] ${TEXT_STYLE.body}`}>{quoteText}</p>}
                </div>
              </div>
            )}
          </>
        )}

        {groupData && (
          <div
            class="mt-2.5 flex items-center gap-2.5 rounded-[14px] border border-[#93b0e83b] bg-[linear-gradient(180deg,rgba(13,26,58,0.72),rgba(8,18,43,0.72))] px-3 py-2.5"
            style={groupEventStyle}
          >
            <a class="inline-flex min-w-0 items-center gap-2.5 border-r border-[#819dd647] pr-2 no-underline" href={groupData.userUrl} target="_blank" rel="noreferrer">
              {groupAvatarUrl ? (
                <img
                  class="h-[34px] w-[34px] shrink-0 rounded-full border border-[#97b4f173] shadow-[0_0_0_2px_rgba(14,26,57,0.92)]"
                  src={groupAvatarUrl}
                  alt=""
                  loading="lazy"
                  width="34"
                  height="34"
                />
              ) : (
                <span class="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#97b4f173] bg-[#142756cc] text-[#aec5f3] shadow-[0_0_0_2px_rgba(14,26,57,0.92)]" aria-hidden="true">
                  <AppIcon name="users" className="h-[17px] w-[17px]" />
                </span>
              )}

              <span class="inline-flex min-w-0 flex-col items-start gap-0.5">
                <span class="whitespace-nowrap text-sm font-bold leading-tight text-[#edf4ff]">{groupData.userName}</span>
                {actorBadge ? (
                  <span
                    class={`mt-1 inline-flex max-w-full items-center whitespace-nowrap rounded-full px-1.5 py-px uppercase opacity-90 ${TEXT_STYLE.filterLabel}`}
                    style={actorBadgeStyle}
                  >
                    {actorBadge}
                  </span>
                ) : null}
              </span>
            </a>

            <p class="m-0 text-sm leading-normal text-[#c5d6f9]">
              <span class="text-[#9eb7e8]">{getGroupRelation(event.eventType)}</span>{" "}
              <a class="relative z-30 text-[#ecf2ff] no-underline hover:underline" href={groupData.groupUrl} target="_blank" rel="noreferrer">
                {groupData.groupName?.trim() || knownGroup?.name || `Group #${groupData.groupId}`}
              </a>
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
