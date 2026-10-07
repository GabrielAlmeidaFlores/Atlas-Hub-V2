export interface CepResult {
  readonly cep: string;
  readonly endereco: string;
  readonly cidade: string;
  readonly estado: string;
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export async function buscarCep(cep: string): Promise<CepResult> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("Informe um CEP com 8 dígitos.");
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) throw new Error("Não foi possível consultar o CEP agora. Tente novamente.");
  const data = (await response.json()) as {
    erro?: boolean | string;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };
  if (data.erro === true || data.erro === "true") throw new Error("CEP não encontrado.");
  return {
    cep: data.cep ?? cep,
    endereco: [data.logradouro, data.bairro].filter((part) => part !== undefined && part !== "").join(", "),
    cidade: data.localidade ?? "",
    estado: data.uf ?? "",
  };
}
