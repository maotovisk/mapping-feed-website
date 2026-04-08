import { TEXT_STYLE } from "../../constants/typography";

interface FeedLoadingStateProps { 
  variant: "initial" | "more";
}

export function FeedLoadingState({ variant }: FeedLoadingStateProps) {
  if (variant === "more") {
    return (
      <div class="feed-loading-more m-0 px-0 py-2 text-center text-[#acc0ed]">
        <span class={`inline-flex items-center gap-1.5 ${TEXT_STYLE.body}`}>
          Loading older events
          <span class="feed-loading-dot" aria-hidden="true"></span>
          <span
            class="feed-loading-dot [animation-delay:90ms]"
            aria-hidden="true"
          ></span>
          <span
            class="feed-loading-dot [animation-delay:180ms]"
            aria-hidden="true"
          ></span>
        </span>
      </div>
    );
  }

  return (
    <div class="feed-preloader-center py-5">
      <div class="feed-preloader-mark" aria-hidden="true">
        <span class="feed-preloader-ring feed-preloader-ring-a"></span>
        <span class="feed-preloader-ring feed-preloader-ring-b"></span>
        <span class="feed-preloader-core"></span>
      </div>
      <div class="mt-3.5 text-center">
        <p class="m-0 mt-1 text-xs tracking-wide text-[#9fb6e6]">
          syncing feed
        </p>
      </div>
    </div>
  );
}
