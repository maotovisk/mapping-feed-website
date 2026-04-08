import type { CSSProperties } from "preact";
import type { RulesetFilter } from "../../types/feed";
import { AppIcon } from "../icons/app-icon";

interface RulesetOption {
  value: RulesetFilter;
  label: string;
  iconSrc: string;
}

interface RulesetSelectorProps {
  options: RulesetOption[];
  selectedRuleset: RulesetFilter | null;
  onChange: (ruleset: RulesetFilter | null) => void;
}

export function RulesetSelector({
  options,
  selectedRuleset,
  onChange,
}: RulesetSelectorProps) {
  const activeRulesetIndex = selectedRuleset
    ? options.findIndex((option) => option.value === selectedRuleset) + 1
    : 0;

  const rulesetThumbStyle = {
    transform: `translateX(${Math.max(activeRulesetIndex, 0) * 36}px)`,
  } as CSSProperties;

  return (
    <div
      class="ruleset-selector-shell relative inline-grid grid-cols-5 overflow-hidden rounded-[14px] border border-[#94b4ff40] bg-[#081129b8] p-1"
      role="toolbar"
      aria-label="Mode Filter"
    >
      <span
        class="ruleset-selector-thumb pointer-events-none absolute left-1 top-1 z-0 h-9 w-9 rounded-[10px] bg-[linear-gradient(120deg,rgba(74,132,255,0.34),rgba(134,91,255,0.34))] shadow-[inset_0_1px_0_rgba(231,239,255,0.14),0_6px_16px_rgba(32,65,140,0.24)] transition-transform duration-300"
        style={rulesetThumbStyle}
        aria-hidden="true"
      ></span>
      <button
        type="button"
        class={`relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors ${
          selectedRuleset === null
            ? "text-[#f3f7ff]"
            : "text-[#bed0fa] hover:bg-[#7f9ee31a] hover:text-[#e2ecff]"
        }`}
        onClick={() => onChange(null)}
        title="All modes"
        aria-label="All modes"
      >
        <AppIcon name="layers" className="h-3.5 w-3.5" />
      </button>

      {options.map((option) => {
        const isSelected = selectedRuleset === option.value;

        return (
          <button
            key={option.value}
            type="button"
            class={`relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors ${
              isSelected
                ? "text-[#f3f7ff]"
                : "text-[#bed0fa] hover:bg-[#7f9ee31a] hover:text-[#e2ecff]"
            }`}
            onClick={() => onChange(option.value)}
            title={option.label}
            aria-label={option.label}
          >
            <img
              src={option.iconSrc}
              alt=""
              class="h-[18px] w-[18px] rounded-full shadow-[0_0_0_1px_rgba(178,202,255,0.24)]"
              width="16"
              height="16"
            />
          </button>
        );
      })}
    </div>
  );
}
