import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { api, getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { Admin } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { Users, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";

const COLUMNS = [
  { label: "Nome" },
  { label: "E-mail" },
  { label: "Perfil" },
  { label: "Status" },
  { label: "Criado em" },
  { label: "", align: "right" as const },
];

export default function AdminUsuariosPage(): ReactNode {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const [items, setItems] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", perfil: "ANALISTA" as "ANALISTA" | "ADMIN_MASTER" });

  async function load(): Promise<void> {
    const r = await api.get<{ items: Admin[] }>("/admin/usuarios");
    setItems(r.items);
  }

  useEffect(() => {
    void load().finally(() => setIsLoading(false));
  }, []);

  if (user?.perfil !== "ADMIN_MASTER") {
    return <Navigate to="/admin" replace />;
  }

  async function handleCreate(e: FormEvent): Promise<void> {
    e.preventDefault();
    setIsSaving(true);
    try {
      const created = await api.post<{ id: string; temporaryPassword: string }>("/admin/usuarios", form);
      addToast({
        type: "success",
        title: "Usuário criado",
        description: `Senha temporária: ${created.temporaryPassword} — copie e envie ao usuário (válida só no 1º acesso).`,
      });
      if (typeof navigator !== "undefined" && navigator.clipboard !== undefined) {
        void navigator.clipboard.writeText(created.temporaryPassword);
      }
      setForm({ nome: "", email: "", perfil: "ANALISTA" });
      setShowForm(false);
      await load();
    } catch (err) {
      addToast({ type: "error", title: "Erro ao criar", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDesativar(id: string, nome: string): Promise<void> {
    if (!window.confirm(`Desativar o usuário ${nome}?`)) return;
    try {
      await api.put(`/admin/usuarios/${id}/desativar`, {});
      addToast({ type: "success", title: "Usuário desativado" });
      await load();
    } catch (err) {
      addToast({ type: "error", title: "Erro ao desativar", description: getApiErrorMessage(err) });
    }
  }

  if (isLoading) return <SkeletonPage />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Usuários admin"
        description={`${String(items.length)} usuário${items.length !== 1 ? "s" : ""}`}
        action={
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
            <UserPlus className="h-4 w-4" />
            {showForm ? "Fechar" : "Novo usuário"}
          </button>
        }
      />

      <div className="page-content space-y-4">
        {showForm && (
          <form onSubmit={(e) => void handleCreate(e)} className="card p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Criar analista / admin master</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input className="input-base" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} required minLength={2} />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input type="email" className="input-base" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Perfil</label>
                <select className="input-base" value={form.perfil} onChange={(e) => setForm((p) => ({ ...p, perfil: e.target.value as "ANALISTA" | "ADMIN_MASTER" }))}>
                  <option value="ANALISTA">Analista</option>
                  <option value="ADMIN_MASTER">Admin master</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isSaving} className="btn btn-primary">
                {isSaving ? "Criando…" : "Criar usuário"}
              </button>
            </div>
          </form>
        )}

        {items.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum usuário" description="Crie o primeiro analista ou admin master" />
        ) : (
          <DataTable columns={COLUMNS} total={items.length} emptyMessage="Nenhum usuário.">
            {items.map((u) => (
              <tr key={u.id} className="table-row">
                <td className="font-medium text-foreground">{u.nome}</td>
                <td className="text-muted-foreground">{u.email}</td>
                <td className="text-foreground">{u.perfil === "ADMIN_MASTER" ? "Admin master" : "Analista"}</td>
                <td>
                  <span className={u.ativo ? "text-status-success" : "text-muted-foreground"}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="text-muted-foreground">{formatDate(u.criadoEm)}</td>
                <td className="text-right">
                  {u.ativo && u.id !== user?.id && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleDesativar(u.id, u.nome)}>
                      Desativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
