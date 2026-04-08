import { TEXT_STYLE } from "../../constants/typography";

interface LiveStatusBadgeProps {
  tooltip: string;
}

export function LiveStatusBadge({ tooltip }: LiveStatusBadgeProps) {
  return (
    <div
      class="live-status-badge group/live fixed bottom-[max(12px,env(safe-area-inset-bottom,0px))] right-[clamp(12px,2.2vw,28px)] z-[18] inline-flex min-h-[30px] max-w-[min(92vw,380px)] items-center gap-1.5 rounded-[10px] border border-[#5bb9874d] bg-[#071825c7] px-2.5 py-1.5 text-[#c7f9dd] shadow-[0_6px_16px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(226,255,241,0.08)] backdrop-blur-[6px]"
      role="status"
      aria-live="polite"
      title={tooltip}
    >
      <span
        class="h-[7px] w-[7px] shrink-0 rounded-full bg-[#4ade80] shadow-[0_0_0_3px_color-mix(in_srgb,#4ade80_22%,transparent)]"
        aria-hidden="true"
      ></span>
      <span
        class={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#c7f9dd] ${TEXT_STYLE.caption}`}
      >
        live updated
      </span>
      <span class="pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg border border-[#85d7ab66] bg-[#041120f7] px-2 py-1 text-xs font-semibold text-[#d7ffe8] opacity-0 invisible translate-y-1 transition-all duration-200 ease-out group-hover/live:visible group-hover/live:opacity-100 group-hover/live:translate-y-0">
        {tooltip}
      </span>
    </div>
  );
}
