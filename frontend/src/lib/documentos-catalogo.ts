import { api } from "@/services/api";
import type { DocumentoArquivo, DocumentoCategoria, DocumentoCatalogoItem, DocumentoScope } from "@/types";

const TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { items: DocumentoCatalogoItem[]; expiresAt: number }>();

export function clearCatalogoCache(): void {
  cache.clear();
}

export async function fetchCatalogo(scope?: DocumentoScope): Promise<DocumentoCatalogoItem[]> {
  const cacheKey = scope ?? "ALL";
  const hit = cache.get(cacheKey);
  if (hit !== undefined && Date.now() < hit.expiresAt) return hit.items;
  const query = scope !== undefined ? `?scope=${scope}` : "";
  const { items } = await api.get<{ items: DocumentoCatalogoItem[] }>(`/documentos/catalogo${query}`);
  cache.set(cacheKey, { items, expiresAt: Date.now() + TTL_MS });
  return items;
}

export type DocumentoStatus = "pendente" | "ok" | "vencendo" | "vencido";

export function documentoStatus(
  item: DocumentoCatalogoItem,
  arquivo: DocumentoArquivo | undefined,
): DocumentoStatus {
  if (arquivo === undefined || arquivo.url === "") return "pendente";
  if (item.validadeDias === undefined || arquivo.emitidoEm === undefined) return "ok";
  const emitido = new Date(arquivo.emitidoEm);
  if (Number.isNaN(emitido.getTime())) return "ok";
  const vencimento = new Date(emitido);
  vencimento.setDate(vencimento.getDate() + item.validadeDias);
  const dias = Math.ceil((vencimento.getTime() - Date.now()) / 86_400_000);
  if (dias < 0) return "vencido";
  if (dias <= 5) return "vencendo";
  return "ok";
}

export function obrigatoriosFaltando(
  items: DocumentoCatalogoItem[],
  valores: Record<string, DocumentoArquivo>,
): DocumentoCatalogoItem[] {
  return items.filter((i) => i.obrigatorio && (valores[i.key]?.url ?? "") === "");
}

export interface EmpresaDocsLegado {
  readonly documentosEmpresa?: Record<string, DocumentoArquivo>;
  readonly contratoSocialUrl?: string;
  readonly comprovanteCnpjUrl?: string;
}

export function empresaDocsComFallback(d: EmpresaDocsLegado): Record<string, DocumentoArquivo> {
  if (d.documentosEmpresa !== undefined) return { ...d.documentosEmpresa };
  const docs: Record<string, DocumentoArquivo> = {};
  if (d.contratoSocialUrl !== undefined && d.contratoSocialUrl !== "") {
    docs["empresa.contratoSocial"] = { url: d.contratoSocialUrl };
  }
  if (d.comprovanteCnpjUrl !== undefined && d.comprovanteCnpjUrl !== "") {
    docs["empresa.cartaoCnpj"] = { url: d.comprovanteCnpjUrl };
  }
  return docs;
}

export const CATEGORIA_LABELS: Record<DocumentoCategoria, string> = {
  EPROJ: "Empresa / EProj",
  SOCIO_ADMIN: "Sócios e administradores",
  PROPRIETARIO: "Proprietário do terreno",
  IMOVEL: "Imóvel",
};

export const CATEGORIA_ORDER: DocumentoCategoria[] = ["EPROJ", "SOCIO_ADMIN", "PROPRIETARIO", "IMOVEL"];
