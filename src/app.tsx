import type { CSSProperties } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { FeedCard } from "./components/feed/feed-card";
import { AppIcon } from "./components/icons/app-icon";
import { useFeedEvents } from "./hooks/use-feed-events";
import { eventKey } from "./utils/feed-utils";
import "./app.css";

const BACKEND_REPO_URL =
  (import.meta.env.VITE_BACKEND_REPO_URL as string | undefined)?.trim() ||
  "https://github.com/maotovisk/mapping-feed";

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
  } = useFeedEvents();

  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0 });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  const pageStyle = {
    "--cursor-x": `${cursorGlow.x}px`,
    "--cursor-y": `${cursorGlow.y}px`,
  } as CSSProperties;

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
            <svg class="hero-link__icon" role="img" aria-hidden="true">
              <use href="/icons.svg#github-icon"></use>
            </svg>
            Backend
          </a>
          <a class="hero-link" href="/invite">
            <svg class="hero-link__icon" role="img" aria-hidden="true">
              <use href="/icons.svg#discord-icon"></use>
            </svg>
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
              <AppIcon name="sparkles" />
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
