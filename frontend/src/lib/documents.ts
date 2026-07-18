import { api } from "@/services/api";

export async function resolveDocumentUrl(location: string): Promise<string> {
  if (!location.includes("atlas-hub-documents-")) return location;
  const { url } = await api.post<{ url: string }>("/documentos/download-url", { location });
  return url;
}

export async function openDocument(location: string): Promise<void> {
  const url = await resolveDocumentUrl(location);
  window.open(url, "_blank", "noopener,noreferrer");
}
