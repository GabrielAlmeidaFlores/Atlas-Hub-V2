/** Machine-readable error codes returned by all API endpoints. */
export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_STATUS_TRANSITION'
  | 'INTERNAL_ERROR';

/** Cognito group — determines which portal the user accesses. */
export type Perfil = 'INCORPORADORA' | 'ANALISTA' | 'ADMIN_MASTER';

/** All possible statuses of a project. */
export type StatusProjeto =
  | 'RASCUNHO'
  | 'SUBMETIDO'
  | 'EM_ANALISE'
  | 'AJUSTE_SOLICITADO'
  | 'REPROVADO'
  | 'APROVADO'
  | 'OFERTA_CRIADA';

export type ModeloInvestimento = 'VENDA' | 'RENDA' | 'MISTO';
export type TipoOferta = 'PUBLICA' | 'PRIVADA';
export type ModeloRetorno = 'SCP' | 'NOTA_COMERCIAL';
export type TipoImovel = 'RESIDENCIAL' | 'COMERCIAL' | 'MISTO';

/** Incorporadora record stored in AtlasIncorporadoras DynamoDB table. */
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

/** Admin record stored in AtlasAdmins DynamoDB table. */
export interface Admin {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly perfil: 'ANALISTA' | 'ADMIN_MASTER';
  readonly ativo: boolean;
  readonly criadoPor: string;
  readonly criadoEm: string;
}

/** Membro da equipe de um projeto. */
export interface MembroEquipe {
  readonly nome: string;
  readonly cargo: string;
  readonly bio: string;
  readonly fotoUrl?: string;
  readonly linkedin?: string;
}

/** Documentos enviados no projeto. */
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

/** Project record stored in AtlasProjetos DynamoDB table. */
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
}

/** Scorecard entry stored in AtlasScorecard DynamoDB table. */
export interface Scorecard {
  readonly projetoId: string;
  readonly revisao: number;
  readonly analistaId: string;
  readonly analistaNome: string;
  readonly localizacaoNota?: number | undefined;
  readonly localizacaoComentario?: string | undefined;
  readonly financeiraNota?: number | undefined;
  readonly financeiraComentario?: string | undefined;
  readonly documentacaoNota?: number | undefined;
  readonly documentacaoComentario?: string | undefined;
  readonly equipeNota?: number | undefined;
  readonly equipeComentario?: string | undefined;
  readonly riscoNota?: number | undefined;
  readonly riscoComentario?: string | undefined;
  readonly notaGeral?: number | undefined;
  readonly parecer?: string | undefined;
  readonly decisao?: 'APROVADO' | 'REPROVADO' | 'AJUSTE_SOLICITADO' | 'RASCUNHO' | undefined;
  readonly criadoEm: string;
  readonly atualizadoEm: string;
}

/** Notification stored in AtlasNotificacoes DynamoDB table. */
export interface Notificacao {
  readonly userId: string;
  readonly criadoEm: string;
  readonly id: string;
  readonly tipo: 'PROJETO_SUBMETIDO' | 'ANALISE_INICIADA' | 'AJUSTE_SOLICITADO' | 'REPROVADO' | 'APROVADO' | 'OFERTA_CRIADA';
  readonly titulo: string;
  readonly mensagem: string;
  readonly lida: boolean;
  readonly projetoId?: string;
  readonly projetoNome?: string;
  readonly ttl?: number;
}

/** Audit log entry stored in AtlasAuditoria DynamoDB table. */
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

/** Internal note stored in AtlasNotas DynamoDB table. */
export interface NotaInterna {
  readonly projetoId: string;
  readonly criadoEm: string;
  readonly analistaId: string;
  readonly analistaNome: string;
  readonly texto: string;
}
