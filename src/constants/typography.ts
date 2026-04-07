export const TEXT_SIZE = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
} as const;

export const TEXT_STYLE = {
  heroTitle: "text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl",
  navLink: `${TEXT_SIZE.sm} font-medium tracking-normal`,
  tabLabel: `${TEXT_SIZE.sm} font-semibold tracking-normal`,
  filterLabel: `${TEXT_SIZE.xs} font-semibold uppercase tracking-wide`,
  menuItem: `${TEXT_SIZE.sm} font-medium`,
  body: `${TEXT_SIZE.sm} leading-normal`,
  caption: `${TEXT_SIZE.xs} leading-tight`,
  title: `${TEXT_SIZE.sm} font-semibold leading-tight`,
  cardHeading: "text-base font-semibold leading-snug sm:text-lg",
} as const;
