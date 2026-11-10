import type { Perfil } from "@/types";

export function extractPerfil(groups: string[]): Perfil {
  if (groups.includes("ADMIN_MASTER")) return "ADMIN_MASTER";
  if (groups.includes("MARKETING")) return "MARKETING";
  if (groups.includes("ANALISTA")) return "ANALISTA";
  if (groups.includes("INVESTIDOR")) return "INVESTIDOR";
  return "INCORPORADORA";
}

export function homeForPerfil(perfil: Perfil | undefined): string {
  if (perfil === "INVESTIDOR") return "/investir";
  if (perfil === "INCORPORADORA") return "/dashboard";
  if (perfil === "MARKETING") return "/admin/boards";
  return "/admin";
}
