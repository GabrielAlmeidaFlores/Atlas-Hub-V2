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

export const TESOURARIA_CONTA_ID = "__TESOURARIA__";

export type SpeContaTipo = "TESOURARIA" | "SPE";
export type SpeContaStatus = "ATIVA" | "BLOQUEADA" | "ERRO";
export type LedgerTipo = "DEPOSIT" | "TRANSFER" | "INVOICE" | "TRANSACTION";
export type SolicitacaoStatus = "PENDENTE" | "APROVADA" | "EXECUTADA" | "REJEITADA" | "FALHOU";

export interface SpeConta {
  readonly projetoId: string;
  readonly tipo: SpeContaTipo;
  readonly workspaceId: string;
  readonly username: string;
  readonly status: SpeContaStatus;
  readonly cnpjSpe?: string;
  readonly razaoSocialSpe?: string;
  readonly pixKey?: string;
  readonly projetoNome?: string;
  readonly criadoEm: string;
  readonly atualizadoEm: string;
  readonly criadoPor: string;
  readonly saldoCents?: number | null;
}

export interface ProjetoElegivel {
  readonly id: string;
  readonly nome: string;
  readonly cidade: string;
  readonly estado: string;
  readonly valorCaptar?: number;
}

export interface FinanceiroContasResponse {
  readonly configured: boolean;
  readonly tesouraria: SpeConta | null;
  readonly items: SpeConta[];
  readonly elegiveis: ProjetoElegivel[];
}

export interface FinanceiroLedgerEntry {
  readonly projetoId: string;
  readonly starkId: string;
  readonly workspaceId: string;
  readonly tipo: LedgerTipo;
  readonly amount: number;
  readonly description: string;
  readonly criadoEm: string;
  readonly conciliado: boolean;
  readonly source: "webhook" | "sync";
  readonly tags?: string[];
}

export interface DestinoPix {
  readonly pixKey?: string;
  readonly name: string;
  readonly taxId: string;
  readonly bankCode: string;
  readonly branchCode: string;
  readonly accountNumber: string;
  readonly accountType: "checking" | "savings" | "salary" | "payment";
}

export interface FinanceiroSolicitacao {
  readonly id: string;
  readonly projetoId: string;
  readonly workspaceId: string;
  readonly amount: number;
  readonly description: string;
  readonly destino: DestinoPix;
  readonly status: SolicitacaoStatus;
  readonly solicitadoPor: string;
  readonly solicitadoPorNome: string;
  readonly solicitadoEm: string;
  readonly aprovadoPor?: string;
  readonly aprovadoPorNome?: string;
  readonly aprovadoEm?: string;
  readonly starkTransferId?: string;
  readonly erro?: string;
}

export interface FinanceiroAuditoriaEntry {
  readonly projetoId: string;
  readonly criadoEm: string;
  readonly id: string;
  readonly acao: string;
  readonly userId: string;
  readonly userName: string;
  readonly descricao: string;
  readonly solicitacaoId?: string;
  readonly workspaceId?: string;
}

export type CaptacaoEventoTipo =
  | "USER_ACTIVE"
  | "INVESTOR_CREATED"
  | "PURCHASE_APPROVED"
  | "PURCHASE_EXPIRED"
  | "OFFER_FINISHED_SUCCESS"
  | "OFFER_FINISHED_UNSUCCESS"
  | "OUTRO";

export type CaptacaoOfertaEncerramento = "FINISHED_SUCCESS" | "FINISHED_UNSUCCESS";

export type CaptacaoCompraStatus =
  | "PENDING"
  | "CANCELED"
  | "FAILED"
  | "FAILED_REFUND"
  | "APPROVED"
  | "EXPIRED"
  | "REFUNDED"
  | "COMPLETED"
  | "UNKNOWN";

export interface CaptacaoEvento {
  readonly id: string;
  readonly tipo: CaptacaoEventoTipo;
  readonly tipoOriginal: string;
  readonly recebidoEm: string;
  readonly occurredAt?: string;
  readonly ofertaId?: string;
  readonly purchaseId?: string;
  readonly investorId?: string;
  readonly status?: CaptacaoCompraStatus;
  readonly amountCents?: number;
  readonly projetoId?: string;
  readonly projetoNome?: string;
}

export interface CaptacaoCompra {
  readonly ofertaId: string;
  readonly purchaseId: string;
  readonly status: CaptacaoCompraStatus;
  readonly atualizadoEm: string;
  readonly recebidoEm: string;
  readonly investorId?: string;
  readonly amountCents?: number;
  readonly projetoId?: string;
  readonly projetoNome?: string;
}

export interface CaptacaoOfertaResumo {
  readonly ofertaId: string;
  readonly projetoId?: string;
  readonly projetoNome?: string;
  readonly valorCaptar?: number;
  readonly valorAprovadoCents: number;
  readonly comprasAprovadas: number;
  readonly comprasExpiradas: number;
  readonly investidores: number;
  readonly atualizadoEm?: string;
  readonly vinculada: boolean;
  readonly encerramento?: CaptacaoOfertaEncerramento;
  readonly encerradaEm?: string;
}

export interface CaptacaoListaResponse {
  readonly configured: boolean;
  readonly apiConfigured?: boolean;
  readonly ofertas: CaptacaoOfertaResumo[];
  readonly eventos: CaptacaoEvento[];
}

export interface CaptacaoOfertaDetalhe {
  readonly configured: boolean;
  readonly apiConfigured?: boolean;
  readonly ofertaId: string;
  readonly projeto: {
    readonly id: string;
    readonly nome: string;
    readonly cidade: string;
    readonly estado: string;
    readonly valorCaptar: number | null;
    readonly ofertaLink: string | null;
  } | null;
  readonly valorAprovadoCents: number;
  readonly comprasAprovadas: number;
  readonly encerramento?: CaptacaoOfertaEncerramento;
  readonly encerradaEm?: string;
  readonly compras: CaptacaoCompra[];
  readonly eventos: CaptacaoEvento[];
}
