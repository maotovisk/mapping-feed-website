import type { CSSProperties, RefObject } from "preact";
import { TEXT_STYLE } from "../../constants/typography";

interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  meta?: string;
}

interface MultiSelectDropdownProps<T extends string | number> {
  containerRef: RefObject<HTMLDivElement>;
  label: string;
  placeholder: string;
  selectedLabels: string[];
  selectedCount: number;
  open: boolean;
  onToggleOpen: () => void;
  options: Array<DropdownOption<T>>;
  selectedValues: ReadonlySet<T>;
  onToggleValue: (value: T) => void;
  ariaLabel: string;
  menuStyle: CSSProperties;
  emptyMessage?: string;
}

export function MultiSelectDropdown<T extends string | number>({
  containerRef,
  label,
  placeholder,
  selectedLabels,
  selectedCount,
  open,
  onToggleOpen,
  options,
  selectedValues,
  onToggleValue,
  ariaLabel,
  menuStyle,
  emptyMessage,
}: MultiSelectDropdownProps<T>) {
  return (
    <div
      class="relative z-40 mr-auto min-w-0 w-full max-w-[430px] flex-1 max-[960px]:max-w-none max-[960px]:basis-full"
      ref={containerRef}
    >
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-xl border border-[#8eafff57] bg-[#08122ccc] px-3 py-2.5 text-[#dce8ff] transition-colors hover:border-[#abc5ff94]"
        onClick={onToggleOpen}
        aria-expanded={open}
      >
        <span class={`shrink-0 text-[#a7bde8] ${TEXT_STYLE.filterLabel}`}>
          {label}
        </span>

        {selectedCount > 0 ? (
          <span class="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            {selectedLabels.map((selectedLabel, index) => (
              <span
                class="inline-flex max-w-[170px] items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-[#8eafff66] bg-[#416ad033] px-2.5 py-[3px] text-xs font-bold text-[#e7efff]"
                key={`${selectedLabel}:${index}`}
              >
                {selectedLabel}
              </span>
            ))}
            {selectedCount > selectedLabels.length && (
              <span class="inline-flex items-center rounded-full border border-[#93ace04d] bg-[#506dac33] px-2.5 py-[3px] text-xs font-bold text-[#b6c9ee]">
                +{selectedCount - selectedLabels.length}
              </span>
            )}
          </span>
        ) : (
          <span class={`min-w-0 flex-1 text-left text-[#dce8ff] ${TEXT_STYLE.body}`}>
            {placeholder}
          </span>
        )}
        <span class="shrink-0 text-sm text-[#9db5e9]" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          class="absolute right-0 top-[calc(100%+8px)] z-[70] flex w-[min(360px,86vw)] origin-top-right flex-col gap-2 overflow-y-auto rounded-[13px] border border-[#93b3ff5c] bg-[linear-gradient(180deg,rgba(11,21,48,0.992),rgba(8,16,37,0.992))] p-2 shadow-[0_18px_36px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(228,237,255,0.1)] backdrop-blur-[8px] animate-[dropdown-shell-in_420ms_cubic-bezier(0.16,1,0.3,1)] max-[960px]:left-0 max-[960px]:right-0 max-[960px]:w-auto"
          role="listbox"
          aria-label={ariaLabel}
          style={menuStyle}
        >
          {options.length === 0 && emptyMessage ? (
            <p class={`m-0 p-2.5 text-[#9eb2db] ${TEXT_STYLE.body}`}>
              {emptyMessage}
            </p>
          ) : null}

          {options.map((option) => {
            const selected = selectedValues.has(option.value);

            return (
              <button
                key={String(option.value)}
                type="button"
                class={`flex min-h-11 w-full items-center justify-between gap-2.5 rounded-[10px] border px-3.5 py-3 text-left text-[#d7e5ff] transition-colors animate-[dropdown-item-in_360ms_cubic-bezier(0.18,0.84,0.24,1)] ${
                  selected
                    ? "border-[#8daeff80] bg-[linear-gradient(110deg,rgba(76,123,241,0.24),rgba(135,86,255,0.2))]"
                    : "border-transparent bg-transparent hover:bg-[#6e90e324]"
                }`}
                onClick={() => {
                  onToggleValue(option.value);
                }}
              >
                <span class={`text-[#edf3ff] ${TEXT_STYLE.menuItem}`}>
                  {option.label}
                </span>
                {option.meta ? (
                  <span class="text-xs text-[#9fb7e5]">{option.meta}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
