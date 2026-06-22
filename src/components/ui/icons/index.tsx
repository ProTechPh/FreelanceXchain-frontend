import {
  ShieldCheck,
  Brain,
  TrendUp,
  Globe,
  Lightning,
  Users,
  Lock,
  Link,
} from "@phosphor-icons/react";

export const Icons = {
  shield: ShieldCheck,
  brain: Brain,
  trendingUp: TrendUp,
  globe: Globe,
  zap: Lightning,
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
  return <IconComponent className={className} weight="light" />;
};
