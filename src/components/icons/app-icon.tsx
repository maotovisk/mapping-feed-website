import type { IconName } from "../../types/icon";
import {
  CircleSlash,
  Clock3,
  Heart,
  HeartCrack,
  Layers,
  Map,
  MessageCircle,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-preact";

interface AppIconProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}

export function AppIcon({ name, className, strokeWidth = 2.35 }: AppIconProps) {
  const Icon =
    {
      "message-circle": MessageCircle,
      "rotate-ccw": RotateCcw,
      heart: Heart,
      "heart-crack": HeartCrack,
      sparkles: Sparkles,
      "circle-slash": CircleSlash,
      "user-plus": UserPlus,
      "user-minus": UserMinus,
      users: Users,
      clock: Clock3,
      refresh: RefreshCcw,
      layers: Layers,
      map: Map,
    }[name] ?? Layers;

  return (
    <Icon
      class={className}
      size={24}
      strokeWidth={strokeWidth}
      role="img"
      aria-hidden="true"
      focusable="false"
    />
  );
}
