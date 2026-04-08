import rulesetCatchIcon from "../assets/icons/RulesetCatch.png";
import rulesetManiaIcon from "../assets/icons/RulesetMania.png";
import rulesetOsuIcon from "../assets/icons/RulesetOsu.png";
import rulesetTaikoIcon from "../assets/icons/RulesetTaiko.png";
import type { MapEventTypeFilter, RulesetFilter } from "../types/feed";

export const RULESET_OPTIONS: Array<{
  value: RulesetFilter;
  label: string;
  iconSrc: string;
}> = [
  {
    value: "osu",
    label: "osu",
    iconSrc: rulesetOsuIcon,
  },
  {
    value: "taiko",
    label: "taiko",
    iconSrc: rulesetTaikoIcon,
  },
  {
    value: "catch",
    label: "catch",
    iconSrc: rulesetCatchIcon,
  },
  {
    value: "mania",
    label: "mania",
    iconSrc: rulesetManiaIcon,
  },
];

export const MAP_EVENT_TYPE_OPTIONS: Array<{
  value: MapEventTypeFilter;
  label: string;
}> = [
  {
    value: "nominate",
    label: "Nomination",
  },
  {
    value: "nomination_reset",
    label: "Nomination Reset",
  },
  {
    value: "qualify",
    label: "Qualified",
  },
  {
    value: "disqualify",
    label: "Disqualified",
  },
  {
    value: "rank",
    label: "Ranked",
  },
  {
    value: "unrank",
    label: "Unranked",
  },
];

export const MAP_EVENT_TYPE_ORDER = new Map(
  MAP_EVENT_TYPE_OPTIONS.map((option, index) => [option.value, index]),
);
