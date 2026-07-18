export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATUS_TRANSITION"
  | "INTERNAL_ERROR";

export type Perfil = "INCORPORADORA" | "ANALISTA" | "ADMIN_MASTER";

export type StatusProjeto =
  | "RASCUNHO"
  | "SUBMETIDO"
  | "EM_ANALISE"
  | "AJUSTE_SOLICITADO"
  | "REPROVADO"
  | "APROVADO"
  | "OFERTA_CRIADA";

export type ModeloInvestimento = "VENDA" | "RENDA" | "MISTO";
export type TipoOferta = "PUBLICA" | "PRIVADA";
export type ModeloRetorno = "SCP" | "NOTA_COMERCIAL";
export type TipoImovel = "RESIDENCIAL" | "COMERCIAL" | "MISTO";

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly perfil: Perfil;
}

export interface Incorporadora {
  readonly id: string;
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly nomeResponsavel: string;
  readonly cpfResponsavel: string;
  readonly cargoResponsavel: string;
  readonly email: string;
  readonly telefone: string;
  readonly emailConfirmado: boolean;
  readonly criadoEm: string;
  readonly atualizadoEm: string;
  readonly endereco?: string;
  readonly site?: string;
  readonly descricao?: string;
  readonly historicoAnterior?: string;
  readonly contratoSocialUrl?: string;
  readonly comprovanteCnpjUrl?: string;
}

export interface Admin {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly perfil: "ANALISTA" | "ADMIN_MASTER";
  readonly ativo: boolean;
  readonly criadoPor: string;
  readonly criadoEm: string;
}

export interface MembroEquipe {
  readonly nome: string;
  readonly cargo: string;
  readonly bio: string;
  readonly fotoUrl?: string;
  readonly linkedin?: string;
}

export interface DocumentosProjeto {
  readonly matriculaUrl?: string;
  readonly alvaraUrl?: string;
  readonly memorialUrl?: string;
  readonly plantaUrl?: string;
  readonly viabilidadeUrl?: string;
  readonly orcamentoUrl?: string;
  readonly projeto3dUrl?: string;
  readonly contratoSpeUrl?: string;
  readonly cndUrl?: string;
  readonly outrosUrls?: string[];
}

export interface Projeto {
  readonly id: string;
  readonly incorporadoraId: string;
  readonly status: StatusProjeto;
  readonly revisao: number;
  readonly nome: string;
  readonly modelo: ModeloInvestimento;
  readonly tipoImovel: TipoImovel;
  readonly cidade: string;
  readonly estado: string;
  readonly endereco: string;
  readonly descricao: string;
  readonly fotosUrls?: string[];
  readonly videoUrl?: string;
  readonly valorTotal?: number;
  readonly valorCaptar?: number;
  readonly prazoObra?: number;
  readonly prazoRetorno?: number;
  readonly rentabilidadeEstimada?: number;
  readonly modeloRetorno?: ModeloRetorno;
  readonly planoSaida?: string;
  readonly tipoOferta?: TipoOferta;
  readonly parcelado?: boolean;
  readonly numParcelas?: number;
  readonly percentualEntrada?: number;
  readonly documentos?: DocumentosProjeto;
  readonly viabilidade?: ViabilidadeProjeto;
  readonly equipe?: MembroEquipe[];
  readonly analistaId?: string;
  readonly analistaNome?: string;
  readonly ofertaId?: string;
  readonly ofertaLink?: string;
  readonly ofertaConfirmadaEm?: string;
  readonly textoAjuste?: string;
  readonly justificativaReprovacao?: string;
  readonly criadoEm: string;
  readonly atualizadoEm: string;
  readonly submetidoEm?: string;
  readonly aprovadoEm?: string;
  readonly reprovadoEm?: string;
  readonly historico?: AuditoriaEntry[];
}

export interface ViabilidadeInputs {
  readonly unidades: number;
  readonly custoObra: number;
  readonly precoMedioUnidade: number;
  readonly prazoMeses: number;
  readonly taxaDescontoInvestidor?: number;
  readonly valorTerreno?: number;
  readonly unidadesPermuta?: number;
}

export interface ViabilidadeOutputs {
  readonly vgv: number;
  readonly custoPorUnidade: number;
  readonly custoTerrenoEstimado: number;
  readonly investimentoTotal: number;
  readonly retornoLiquido: number;
  readonly roiPercent: number;
  readonly fluxoMensal: readonly { readonly mes: number; readonly valor: number }[];
}

export interface ViabilidadeProjeto {
  readonly inputs: ViabilidadeInputs;
  readonly outputs: ViabilidadeOutputs;
  readonly atualizadoEm: string;
}

export interface Scorecard {
  readonly projetoId: string;
  readonly revisao: number;
  readonly analistaId: string;
  readonly analistaNome: string;
  readonly localizacaoNota?: number;
  readonly localizacaoComentario?: string;
  readonly financeiraNota?: number;
  readonly financeiraComentario?: string;
  readonly documentacaoNota?: number;
  readonly documentacaoComentario?: string;
  readonly equipeNota?: number;
  readonly equipeComentario?: string;
  readonly riscoNota?: number;
  readonly riscoComentario?: string;
  readonly notaGeral?: number;
  readonly parecer?: string;
  readonly decisao?: "APROVADO" | "REPROVADO" | "AJUSTE_SOLICITADO" | "RASCUNHO";
  readonly criadoEm: string;
  readonly atualizadoEm: string;
}

export interface Notificacao {
  readonly userId: string;
  readonly criadoEm: string;
  readonly id: string;
  readonly tipo: "PROJETO_SUBMETIDO" | "ANALISE_INICIADA" | "AJUSTE_SOLICITADO" | "REPROVADO" | "APROVADO" | "OFERTA_CRIADA";
  readonly titulo: string;
  readonly mensagem: string;
  readonly lida: boolean;
  readonly projetoId?: string;
  readonly projetoNome?: string;
}

export interface AuditoriaEntry {
  readonly projetoId: string;
  readonly criadoEm: string;
  readonly acao: string;
  readonly userId: string;
  readonly userName: string;
  readonly descricao: string;
  readonly statusAnterior?: StatusProjeto;
  readonly statusNovo?: StatusProjeto;
}

export interface NotaInterna {
  readonly projetoId: string;
  readonly criadoEm: string;
  readonly analistaId: string;
  readonly analistaNome: string;
  readonly texto: string;
}

export interface DashboardMetricas {
  readonly metricas: Record<StatusProjeto, number>;
  readonly total: number;
}
