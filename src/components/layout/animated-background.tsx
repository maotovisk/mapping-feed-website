import type { CSSProperties } from "preact";

const BACKGROUND_ORBS = [
  {
    left: 14,
    top: 12,
    size: 420,
    opacity: 0.18,
    driftX: 34,
    driftY: 18,
    duration: 24,
    delay: -5,
  },
  {
    left: 70,
    top: 20,
    size: 360,
    opacity: 0.14,
    driftX: -28,
    driftY: 24,
    duration: 28,
    delay: -11,
  },
  {
    left: 34,
    top: 70,
    size: 300,
    opacity: 0.12,
    driftX: 18,
    driftY: -22,
    duration: 22,
    delay: -8,
  },
] as const;

export function AnimatedBackground() {
  return (
    <>
      <div
        class="animated-bg-aurora pointer-events-none fixed inset-0 -z-20"
        aria-hidden="true"
      ></div>
      <div class="animated-bg-orb-field fixed inset-0 -z-10" aria-hidden="true">
        {BACKGROUND_ORBS.map((orb, index) => (
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
                "--orb-delay": `${orb.delay}s`,
              } as CSSProperties
            }
          ></span>
        ))}
      </div>
    </>
  );
}
