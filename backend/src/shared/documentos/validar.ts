import { getIncorporadora } from '../db/index.js';
import { listCatalogo } from '../db/documento-catalogo.js';
import type { DocumentoArquivo, Projeto } from '../core/types/index.js';
import type { ValidationField } from '../http/validators.js';

function documentosEmpresa(incorporadora: Awaited<ReturnType<typeof getIncorporadora>>): Record<string, DocumentoArquivo> {
  if (incorporadora?.documentosEmpresa !== undefined) return { ...incorporadora.documentosEmpresa };
  const docs: Record<string, DocumentoArquivo> = {};
  if (incorporadora?.contratoSocialUrl !== undefined && incorporadora.contratoSocialUrl !== '') {
    docs['empresa.contratoSocial'] = { url: incorporadora.contratoSocialUrl };
  }
  if (incorporadora?.comprovanteCnpjUrl !== undefined && incorporadora.comprovanteCnpjUrl !== '') {
    docs['empresa.cartaoCnpj'] = { url: incorporadora.comprovanteCnpjUrl };
  }
  return docs;
}

export async function documentosFaltando(projeto: Projeto): Promise<ValidationField[]> {
  const catalogo = await listCatalogo({ onlyActive: true, noCache: true });
  const incorporadora = await getIncorporadora(projeto.incorporadoraId);
  const empresaDocs = documentosEmpresa(incorporadora);
  const projetoDocs = projeto.documentosChecklist ?? {};

  const fields: ValidationField[] = [];
  for (const item of catalogo) {
    if (!item.obrigatorio) continue;
    const docs = item.scope === 'EMPRESA' ? empresaDocs : projetoDocs;
    if ((docs[item.key]?.url ?? '') === '') {
      fields.push({
        field: item.scope === 'EMPRESA' ? `documentosEmpresa.${item.key}` : `documentosChecklist.${item.key}`,
        message: `Documento obrigatório ausente: ${item.label}`,
      });
    }
  }
  return fields;
}
