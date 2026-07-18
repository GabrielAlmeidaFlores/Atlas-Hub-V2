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

export function calcularViabilidade(inputs: ViabilidadeInputs): ViabilidadeOutputs {
  const unidades = Math.max(0, inputs.unidades);
  const custoObra = Math.max(0, inputs.custoObra);
  const preco = Math.max(0, inputs.precoMedioUnidade);
  const prazo = Math.max(1, Math.floor(inputs.prazoMeses));
  const unidadesPermuta = Math.max(0, inputs.unidadesPermuta ?? 0);
  const valorTerrenoInformado = Math.max(0, inputs.valorTerreno ?? 0);

  const vgv = unidades * preco;
  const custoPorUnidade = unidades > 0 ? custoObra / unidades : 0;
  const custoTerrenoEstimado =
    valorTerrenoInformado > 0
      ? valorTerrenoInformado
      : unidadesPermuta * preco;
  const investimentoTotal = custoObra + custoTerrenoEstimado;
  const retornoLiquido = vgv - investimentoTotal;
  const roiPercent = investimentoTotal > 0 ? (retornoLiquido / investimentoTotal) * 100 : 0;

  const fluxoMensal: { mes: number; valor: number }[] = [];
  const desembolsoMensal = prazo > 0 ? -(custoObra / prazo) : 0;
  for (let mes = 1; mes <= prazo; mes += 1) {
    fluxoMensal.push({ mes, valor: Math.round(desembolsoMensal * 100) / 100 });
  }
  if (fluxoMensal.length > 0) {
    const last = fluxoMensal[fluxoMensal.length - 1]!;
    fluxoMensal[fluxoMensal.length - 1] = {
      mes: last.mes,
      valor: Math.round((last.valor + vgv) * 100) / 100,
    };
  }

  return {
    vgv: Math.round(vgv * 100) / 100,
    custoPorUnidade: Math.round(custoPorUnidade * 100) / 100,
    custoTerrenoEstimado: Math.round(custoTerrenoEstimado * 100) / 100,
    investimentoTotal: Math.round(investimentoTotal * 100) / 100,
    retornoLiquido: Math.round(retornoLiquido * 100) / 100,
    roiPercent: Math.round(roiPercent * 10) / 10,
    fluxoMensal,
  };
}

export function buildViabilidade(inputs: ViabilidadeInputs): ViabilidadeProjeto {
  return {
    inputs,
    outputs: calcularViabilidade(inputs),
    atualizadoEm: new Date().toISOString(),
  };
}
