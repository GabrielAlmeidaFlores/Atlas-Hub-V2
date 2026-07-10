import { useEffect, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Globe, MapPin, Building2 } from "lucide-react";
import { api } from "@/services/api";
import type { Incorporadora, Projeto } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageSpinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatCurrency } from "@/lib/utils";

interface IncorporadoraDetalhe {
  incorporadora: Incorporadora;
  projetos: Projeto[];
}

export default function AdminIncorporadoraDetalhePage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<IncorporadoraDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id === undefined) return;
    void api.get<IncorporadoraDetalhe>(`/admin/incorporadoras/${id}`)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <PageSpinner />;
  if (data === null) return <div className="p-8 text-center text-[#6B7280]">Incorporadora não encontrada</div>;

  const { incorporadora: inc, projetos } = data;
  const aprovados = projetos.filter((p) => p.status === "APROVADO" || p.status === "OFERTA_CRIADA").length;
  const reprovados = projetos.filter((p) => p.status === "REPROVADO").length;

  return (
    <div className="animate-in">
      <PageHeader
        title={inc.razaoSocial || "Incorporadora"}
        description={`CNPJ: ${inc.cnpj || "—"}`}
        breadcrumb={
          <Link to="/admin/incorporadoras" className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-navy">
            <ArrowLeft className="h-3 w-3" /> Incorporadoras
          </Link>
        }
      />

      <div className="page-content">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            {/* Dados cadastrais */}
            <div className="card p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                  <Building2 className="h-4 w-4 text-navy" />
                </div>
                <h2 className="font-semibold text-[#111827]">Dados Cadastrais</h2>
              </div>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {[
                  { icon: Building2, label: "Razão Social", value: inc.razaoSocial || "—" },
                  { icon: Building2, label: "CNPJ", value: inc.cnpj || "—" },
                  { icon: Building2, label: "Responsável", value: inc.nomeResponsavel || "—" },
                  { icon: Building2, label: "CPF", value: inc.cpfResponsavel || "—" },
                  { icon: Building2, label: "Cargo", value: inc.cargoResponsavel || "—" },
                  { icon: Mail, label: "E-mail", value: inc.email },
                  { icon: Phone, label: "Telefone", value: inc.telefone || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5 rounded-lg bg-[#F9FAFB] px-3 py-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
                    <div><p className="text-xs text-[#9CA3AF]">{label}</p><p className="font-medium text-[#374151]">{value}</p></div>
                  </div>
                ))}
                {inc.endereco !== undefined && (
                  <div className="col-span-2 flex items-start gap-2.5 rounded-lg bg-[#F9FAFB] px-3 py-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
                    <div><p className="text-xs text-[#9CA3AF]">Endereço</p><p className="font-medium text-[#374151]">{inc.endereco}</p></div>
                  </div>
                )}
                {inc.site !== undefined && (
                  <div className="flex items-start gap-2.5 rounded-lg bg-[#F9FAFB] px-3 py-2.5">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
                    <div><p className="text-xs text-[#9CA3AF]">Site</p><a href={inc.site} target="_blank" rel="noopener noreferrer" className="font-medium text-navy hover:underline">{inc.site}</a></div>
                  </div>
                )}
              </dl>
              {inc.descricao !== undefined && (
                <div className="mt-4 rounded-xl bg-[#F9FAFB] p-3">
                  <p className="text-xs text-[#9CA3AF]">Descrição</p>
                  <p className="mt-1 text-sm text-[#374151]">{inc.descricao}</p>
                </div>
              )}
            </div>

            {/* Projetos */}
            <div className="card overflow-hidden">
              <div className="border-b border-[#E5E7EB] px-5 py-4">
                <h2 className="font-semibold text-[#111827]">Projetos Submetidos</h2>
              </div>
              {projetos.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-[#9CA3AF]">Nenhum projeto submetido</p>
              ) : (
                <div className="divide-y divide-[#F3F4F6]">
                  {projetos.map((p) => (
                    <Link key={p.id} to={`/admin/curadoria/${p.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-[#FAFAFA] transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#111827]">{p.nome}</p>
                        <p className="mt-0.5 text-xs text-[#9CA3AF]">{p.criadoEm !== undefined ? formatDate(p.criadoEm) : "—"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {p.valorCaptar !== undefined && (
                          <span className="hidden text-sm font-medium text-[#374151] sm:block">{formatCurrency(p.valorCaptar)}</span>
                        )}
                        <StatusBadge status={p.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold text-[#111827]">Resumo</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-[#6B7280]">Cadastro</dt><dd className="font-medium">{formatDate(inc.criadoEm)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#6B7280]">Total de projetos</dt><dd className="font-bold text-[#111827]">{String(projetos.length)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#6B7280]">Aprovados</dt><dd className="font-semibold text-green-600">{String(aprovados)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#6B7280]">Reprovados</dt><dd className="font-semibold text-red-600">{String(reprovados)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#6B7280]">E-mail confirmado</dt><dd>{inc.emailConfirmado ? <span className="text-green-600">✓ Sim</span> : <span className="text-[#9CA3AF]">Não</span>}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
