import {
  Shield,
  Brain,
  TrendingUp,
  Globe,
  Zap,
  Users,
  Lock,
  Link,
  type LucideIcon,
} from "lucide-react";

export const Icons = {
  shield: Shield,
  brain: Brain,
  trendingUp: TrendingUp,
  globe: Globe,
  zap: Zap,
  users: Users,
  lock: Lock,
  link: Link,
};

export type IconName = keyof typeof Icons;

interface IconProps {
  name: IconName;
  className?: string;
}

export const Icon = ({ name, className }: IconProps) => {
  const IconComponent = Icons[name];
  return <IconComponent className={className} />;
};
