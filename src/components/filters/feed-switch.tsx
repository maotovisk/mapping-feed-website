import { TEXT_STYLE } from "../../constants/typography";
import type { ActiveFeed } from "../../types/feed";
import { AppIcon } from "../icons/app-icon";

interface FeedSwitchProps {
  activeFeed: ActiveFeed;
  onChange: (feed: ActiveFeed) => void;
}

export function FeedSwitch({ activeFeed, onChange }: FeedSwitchProps) {
  const feedThumbStyle = {
    transform: `translateX(${activeFeed === "group" ? "100%" : "0%"})`,
  };

  return (
    <div
      class="feed-switch-shell group/feed relative mx-auto grid w-fit min-w-[230px] grid-cols-2 overflow-hidden rounded-full border border-[#b3ccff33] bg-[#081023c7] p-1.5 transition-colors duration-300 hover:border-[#c2d4ff52]"
      role="tablist"
      aria-label="Feed Filter"
    >
      <span
        class="feed-switch-thumb pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 z-0 w-[calc((100%-0.75rem)/2)] rounded-full bg-gradient-to-r from-[#5285ff66] to-[#8355ff66] shadow-[inset_0_1px_0_rgba(229,236,255,0.14),0_8px_20px_rgba(36,68,147,0.24)] transition-transform duration-300"
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
        onClick={() => onChange("map")}
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
        onClick={() => onChange("group")}
      >
        <AppIcon name="users" className="h-4 w-4" />
        Groups
      </button>
    </div>
  );
}
