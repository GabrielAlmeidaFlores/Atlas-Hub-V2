import type { BoardColumnColor, BoardLabelColor } from "@/types";

export const LABEL_COLOR_CLASSES: Record<BoardLabelColor, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  orange: "bg-orange-500",
  red: "bg-rose-500",
  purple: "bg-violet-500",
  blue: "bg-blue-600",
  sky: "bg-sky-500",
  lime: "bg-lime-500",
  pink: "bg-pink-500",
  gray: "bg-slate-500",
};

export const COLUMN_COLOR_CLASSES: Record<BoardColumnColor, string> = {
  slate: "border-slate-200 bg-slate-50",
  blue: "border-sky-200 bg-sky-50",
  green: "border-emerald-200 bg-emerald-50",
  amber: "border-amber-200 bg-amber-50",
  rose: "border-rose-200 bg-rose-50",
  violet: "border-violet-200 bg-violet-50",
  teal: "border-teal-200 bg-teal-50",
  orange: "border-orange-200 bg-orange-50",
};

export const COLUMN_COLOR_LABELS: Record<BoardColumnColor, string> = {
  slate: "Cinza",
  blue: "Azul",
  green: "Verde",
  amber: "Âmbar",
  rose: "Rosa",
  violet: "Violeta",
  teal: "Verde-água",
  orange: "Laranja",
};

export const LABEL_TEXT_CLASSES: Record<BoardLabelColor, string> = {
  green: "text-white",
  yellow: "text-navy",
  orange: "text-white",
  red: "text-white",
  purple: "text-white",
  blue: "text-white",
  sky: "text-navy",
  lime: "text-navy",
  pink: "text-white",
  gray: "text-white",
};

export const LABEL_COLOR_LABELS: Record<BoardLabelColor, string> = {
  green: "Verde",
  yellow: "Amarelo",
  orange: "Laranja",
  red: "Vermelho",
  purple: "Roxo",
  blue: "Azul",
  sky: "Céu",
  lime: "Lima",
  pink: "Rosa",
  gray: "Cinza",
};
