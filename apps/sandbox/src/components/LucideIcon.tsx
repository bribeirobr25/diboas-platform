/**
 * The Sandbox's single icon door (build rule: LucideIcon only, never raw
 * lucide-react imports scattered through components, never emoji as icons).
 * Named imports keep the bundle tree-shaken.
 */

import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Car,
  Check,
  ChevronRight,
  Clock,
  FastForward,
  FlaskConical,
  Gift,
  Globe,
  Lock,
  Mail,
  Megaphone,
  Moon,
  Sun,
  GraduationCap,
  Heart,
  Home,
  List,
  Pencil,
  Plane,
  Plus,
  Repeat,
  Shield,
  ShieldCheck,
  Sprout,
  TreePalm,
  TrendingUp,
  User,
  Wallet,
  X,
  type LucideIcon as LucideIconType,
} from 'lucide-react';

const ICONS: Record<string, LucideIconType> = {
  'arrow-left': ArrowLeft,
  'bar-chart': BarChart3,
  briefcase: Briefcase,
  car: Car,
  check: Check,
  'chevron-right': ChevronRight,
  clock: Clock,
  lock: Lock,
  mail: Mail,
  megaphone: Megaphone,
  moon: Moon,
  sun: Sun,
  'fast-forward': FastForward,
  flask: FlaskConical,
  gift: Gift,
  globe: Globe,
  'graduation-cap': GraduationCap,
  heart: Heart,
  home: Home,
  list: List,
  pencil: Pencil,
  plane: Plane,
  plus: Plus,
  repeat: Repeat,
  shield: Shield,
  'shield-check': ShieldCheck,
  sprout: Sprout,
  palmtree: TreePalm,
  'trending-up': TrendingUp,
  user: User,
  wallet: Wallet,
  x: X,
};

export type IconName = keyof typeof ICONS;

export function LucideIcon({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sprout;
  return <Icon size={size} className={className} aria-hidden />;
}
