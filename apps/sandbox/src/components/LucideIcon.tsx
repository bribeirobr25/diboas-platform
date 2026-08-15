/**
 * The Sandbox's single icon door (build rule: LucideIcon only, never raw
 * lucide-react imports scattered through components, never emoji as icons).
 * Named imports keep the bundle tree-shaken.
 */

import {
  ArrowLeft,
  ArrowRightLeft,
  BarChart3,
  Bell,
  BookOpen,
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
  Info,
  KeyRound,
  List,
  Pencil,
  Plane,
  Plus,
  Repeat,
  Shield,
  ShieldCheck,
  Sprout,
  Target,
  TreePalm,
  TrendingUp,
  User,
  Wallet,
  X,
  type LucideIcon as LucideIconType,
} from 'lucide-react';

const ICONS: Record<string, LucideIconType> = {
  'arrow-left': ArrowLeft,
  'arrow-right-left': ArrowRightLeft,
  'bar-chart': BarChart3,
  bell: Bell,
  'book-open': BookOpen,
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
  info: Info,
  key: KeyRound,
  list: List,
  pencil: Pencil,
  plane: Plane,
  plus: Plus,
  repeat: Repeat,
  shield: Shield,
  'shield-check': ShieldCheck,
  sprout: Sprout,
  target: Target,
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
