import type { ReactNode } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Folder,
  Home,
  LayoutGrid,
  Megaphone,
  Rocket,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { BoardIcon } from "@/types";
import { cn } from "@/lib/utils";

export const BOARD_ICON_OPTIONS: readonly {
  readonly value: BoardIcon;
  readonly label: string;
  readonly Icon: LucideIcon;
}[] = [
  { value: "layout-grid", label: "Grid", Icon: LayoutGrid },
  { value: "briefcase", label: "Negócios", Icon: Briefcase },
  { value: "building-2", label: "Imóveis", Icon: Building2 },
  { value: "home", label: "Casa", Icon: Home },
  { value: "target", label: "Metas", Icon: Target },
  { value: "rocket", label: "Lançamento", Icon: Rocket },
  { value: "users", label: "Pessoas", Icon: Users },
  { value: "calendar", label: "Agenda", Icon: Calendar },
  { value: "bar-chart", label: "Indicadores", Icon: BarChart3 },
  { value: "wallet", label: "Financeiro", Icon: Wallet },
  { value: "megaphone", label: "Marketing", Icon: Megaphone },
  { value: "folder", label: "Projetos", Icon: Folder },
];

export function BoardIconGlyph({
  icon,
  className,
}: {
  readonly icon: BoardIcon | undefined;
  readonly className?: string;
}): ReactNode {
  const option = BOARD_ICON_OPTIONS.find((item) => item.value === icon);
  const Icon = option?.Icon ?? LayoutGrid;
  return <Icon className={cn("h-5 w-5", className)} />;
}
