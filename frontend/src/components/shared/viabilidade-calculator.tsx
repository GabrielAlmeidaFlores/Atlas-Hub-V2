import { type ReactNode, type ChangeEvent } from "react";
import { buildViabilidade, type ViabilidadeInputs, type ViabilidadeProjeto } from "@/lib/viabilidade";
import { formatCurrency } from "@/lib/utils";

export interface ViabilidadeFormState {
  unidades: string;
  custoObra: string;
  precoMedioUnidade: string;
  prazoMeses: string;
  taxaDescontoInvestidor: string;
  valorTerreno: string;
  unidadesPermuta: string;
}

export const VIABILIDADE_FORM_EMPTY: ViabilidadeFormState = {
  unidades: "",
  custoObra: "",
  precoMedioUnidade: "",
  prazoMeses: "",
  taxaDescontoInvestidor: "",
  valorTerreno: "",
  unidadesPermuta: "",
};

export function viabilidadeToForm(v: ViabilidadeProjeto | undefined): ViabilidadeFormState {
  if (v === undefined) return VIABILIDADE_FORM_EMPTY;
  const i = v.inputs;
  return {
    unidades: String(i.unidades),
    custoObra: String(i.custoObra),
    precoMedioUnidade: String(i.precoMedioUnidade),
    prazoMeses: String(i.prazoMeses),
    taxaDescontoInvestidor: i.taxaDescontoInvestidor !== undefined ? String(i.taxaDescontoInvestidor) : "",
    valorTerreno: i.valorTerreno !== undefined ? String(i.valorTerreno) : "",
    unidadesPermuta: i.unidadesPermuta !== undefined ? String(i.unidadesPermuta) : "",
  };
}

export function formToViabilidade(form: ViabilidadeFormState): ViabilidadeProjeto | null {
  const unidades = parseFloat(form.unidades);
  const custoObra = parseFloat(form.custoObra);
  const precoMedioUnidade = parseFloat(form.precoMedioUnidade);
  const prazoMeses = parseInt(form.prazoMeses, 10);
  if (![unidades, custoObra, precoMedioUnidade, prazoMeses].every((n) => Number.isFinite(n) && n > 0)) {
    return null;
  }
  const inputs: ViabilidadeInputs = {
    unidades,
    custoObra,
    precoMedioUnidade,
    prazoMeses,
    ...(form.taxaDescontoInvestidor !== "" && Number.isFinite(parseFloat(form.taxaDescontoInvestidor))
      ? { taxaDescontoInvestidor: parseFloat(form.taxaDescontoInvestidor) }
      : {}),
    ...(form.valorTerreno !== "" && Number.isFinite(parseFloat(form.valorTerreno))
      ? { valorTerreno: parseFloat(form.valorTerreno) }
      : {}),
    ...(form.unidadesPermuta !== "" && Number.isFinite(parseFloat(form.unidadesPermuta))
      ? { unidadesPermuta: parseFloat(form.unidadesPermuta) }
      : {}),
  };
  return buildViabilidade(inputs);
}

interface Props {
  readonly value: ViabilidadeFormState;
  readonly onChange: (next: ViabilidadeFormState) => void;
  readonly readOnly?: boolean;
}

export function ViabilidadeCalculator({ value, onChange, readOnly = false }: Props): ReactNode {
  const computed = formToViabilidade(value);

  function set(field: keyof ViabilidadeFormState) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      onChange({ ...value, [field]: e.target.value });
    };
  }

  return (
    <div className="space-y-4 border border-border bg-muted/30 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Calculadora de viabilidade</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Estimativa simplificada (VGV, ROI, fluxo). Não substitui o estudo técnico assinado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="form-group">
          <label className="form-label">Nº de unidades</label>
          <input type="number" min={1} className="input-base" value={value.unidades} onChange={set("unidades")} disabled={readOnly} />
        </div>
        <div className="form-group">
          <label className="form-label">Custo de obra (R$)</label>
          <input type="number" min={0} className="input-base" value={value.custoObra} onChange={set("custoObra")} disabled={readOnly} />
        </div>
        <div className="form-group">
          <label className="form-label">Preço médio / unidade (R$)</label>
          <input type="number" min={0} className="input-base" value={value.precoMedioUnidade} onChange={set("precoMedioUnidade")} disabled={readOnly} />
        </div>
        <div className="form-group">
          <label className="form-label">Prazo (meses)</label>
          <input type="number" min={1} max={120} className="input-base" value={value.prazoMeses} onChange={set("prazoMeses")} disabled={readOnly} />
        </div>
        <div className="form-group">
          <label className="form-label">Taxa desconto investidor (% a.a., opcional)</label>
          <input type="number" min={0} max={100} step={0.1} className="input-base" value={value.taxaDescontoInvestidor} onChange={set("taxaDescontoInvestidor")} disabled={readOnly} />
        </div>
        <div className="form-group">
          <label className="form-label">Valor do terreno (R$, opcional)</label>
          <input type="number" min={0} className="input-base" value={value.valorTerreno} onChange={set("valorTerreno")} disabled={readOnly} />
        </div>
        <div className="form-group sm:col-span-2">
          <label className="form-label">Unidades em permuta (opcional)</label>
          <input type="number" min={0} className="input-base" value={value.unidadesPermuta} onChange={set("unidadesPermuta")} disabled={readOnly} />
        </div>
      </div>

      {computed !== null ? (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div className="bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">VGV</p>
            <p className="font-semibold text-navy">{formatCurrency(computed.outputs.vgv)}</p>
          </div>
          <div className="bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">Custo / unidade</p>
            <p className="font-semibold">{formatCurrency(computed.outputs.custoPorUnidade)}</p>
          </div>
          <div className="bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">Investimento total</p>
            <p className="font-semibold">{formatCurrency(computed.outputs.investimentoTotal)}</p>
          </div>
          <div className="bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">Retorno líquido</p>
            <p className="font-semibold text-status-success">{formatCurrency(computed.outputs.retornoLiquido)}</p>
          </div>
          <div className="bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className="font-semibold text-status-success">{String(computed.outputs.roiPercent)}%</p>
          </div>
          <div className="bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">Fluxo (meses)</p>
            <p className="font-semibold">{String(computed.outputs.fluxoMensal.length)}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Preencha unidades, custo de obra, preço médio e prazo para ver os resultados.</p>
      )}
    </div>
  );
}

export function ViabilidadeReadOnly({ data }: { readonly data: ViabilidadeProjeto }): ReactNode {
  const o = data.outputs;
  const i = data.inputs;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Calculada em {new Date(data.atualizadoEm).toLocaleString("pt-BR")} · estimativa simplificada
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Unidades</dt><dd className="font-medium">{String(i.unidades)}</dd></div>
        <div><dt className="text-muted-foreground">Custo obra</dt><dd className="font-medium">{formatCurrency(i.custoObra)}</dd></div>
        <div><dt className="text-muted-foreground">Preço médio</dt><dd className="font-medium">{formatCurrency(i.precoMedioUnidade)}</dd></div>
        <div><dt className="text-muted-foreground">VGV</dt><dd className="font-semibold text-navy">{formatCurrency(o.vgv)}</dd></div>
        <div><dt className="text-muted-foreground">ROI</dt><dd className="font-semibold text-status-success">{String(o.roiPercent)}%</dd></div>
        <div><dt className="text-muted-foreground">Retorno líquido</dt><dd className="font-semibold">{formatCurrency(o.retornoLiquido)}</dd></div>
      </dl>
    </div>
  );
}
