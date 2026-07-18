import { api } from "@/services/api";

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_BYTES = 50 * 1024 * 1024;

export interface PresignResult {
  readonly url: string;
  readonly location: string;
}

function resolveMimeType(file: File): string {
  if (file.type !== "" && ALLOWED_MIME.has(file.type)) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  throw new Error("Formato inválido. Use PDF, JPG ou PNG.");
}

function assertFile(file: File, mimeType: string): void {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("Formato inválido. Use PDF, JPG ou PNG.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Arquivo muito grande. Máximo 50 MB.");
  }
}

export async function uploadToS3(
  presignPath: string,
  file: File,
): Promise<string> {
  const mimeType = resolveMimeType(file);
  assertFile(file, mimeType);
  const { url, location } = await api.post<PresignResult>(presignPath, {
    mimeType,
    fileName: file.name,
  });
  const put = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: file,
  });
  if (!put.ok) {
    throw new Error("Falha ao enviar o arquivo para o armazenamento.");
  }
  return location;
}

export async function uploadProjetoDocumento(
  projetoId: string,
  file: File,
): Promise<string> {
  return uploadToS3(`/projetos/${projetoId}/documentos/pre-sign`, file);
}

export async function uploadIncorporadoraDocumento(file: File): Promise<string> {
  return uploadToS3("/incorporadora/documentos/pre-sign", file);
}
