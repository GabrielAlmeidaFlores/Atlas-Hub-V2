import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { api, getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import type { Admin } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonPage } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDiscardGuard } from "@/components/ui/confirm-dialog/use-discard-guard";
import { cn, formatDate } from "@/lib/utils";
import { Check, Copy, MailCheck, MailX, Users, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";

interface CreatedInvite {
  readonly nome: string;
  readonly email: string;
  readonly perfil: "ANALISTA" | "ADMIN_MASTER";
  readonly temporaryPassword: string;
  readonly emailSent: boolean;
}

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
  const confirm = useConfirm();
  const [items, setItems] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", perfil: "ANALISTA" as "ANALISTA" | "ADMIN_MASTER" });
  const formDirty = form.nome.length > 0 || form.email.length > 0 || form.perfil !== "ANALISTA";
  const closeForm = (): void => {
    setShowForm(false);
    setCreatedInvite(null);
    setCopied(false);
    setForm({ nome: "", email: "", perfil: "ANALISTA" });
  };
  const closeDirty = formDirty || (createdInvite !== null && !createdInvite.emailSent && !copied);
  const requestClose = useDiscardGuard(closeDirty, closeForm, createdInvite !== null && !createdInvite.emailSent
    ? {
        title: "Sair sem copiar a senha?",
        description: "O e-mail não foi enviado e a senha temporária ainda não foi copiada. Se sair agora, o usuário pode ficar sem acesso.",
        confirmLabel: "Sair mesmo assim",
        cancelLabel: "Continuar aqui",
      }
    : {});

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
      const created = await api.post<{ id: string; temporaryPassword: string; emailSent: boolean }>("/admin/usuarios", form);
      setCreatedInvite({
        nome: form.nome,
        email: form.email,
        perfil: form.perfil,
        temporaryPassword: created.temporaryPassword,
        emailSent: created.emailSent,
      });
      setCopied(false);
      addToast({
        type: created.emailSent ? "success" : "warning",
        title: "Usuário criado",
        description: created.emailSent
          ? `Convite enviado para ${form.email}.`
          : "O e-mail não pôde ser enviado. Copie a senha temporária e envie manualmente.",
      });
      setForm({ nome: "", email: "", perfil: "ANALISTA" });
      await load();
    } catch (err) {
      addToast({ type: "error", title: "Erro ao criar", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function copyPassword(): Promise<void> {
    if (createdInvite === null) return;
    try {
      if (navigator.clipboard === undefined) throw new Error("Área de transferência indisponível");
      await navigator.clipboard.writeText(createdInvite.temporaryPassword);
      setCopied(true);
    } catch (err) {
      addToast({
        type: "error",
        title: "Não foi possível copiar",
        description: err instanceof Error ? err.message : "Copie a senha manualmente.",
      });
    }
  }

  async function handleDesativar(id: string, nome: string): Promise<void> {
    const confirmed = await confirm({
      title: "Desativar usuário",
      description: `Desativar o usuário ${nome}? Ele perderá o acesso à plataforma.`,
      confirmLabel: "Desativar",
    });
    if (!confirmed) return;
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
        description={`${String(items.length)} usuário${items.length !== 1 ? "s" : ""} — analistas e admin masters da equipe Atlas`}
        action={
          <button type="button" className="btn btn-primary btn-sm rounded-[8px]" onClick={() => setShowForm(true)}>
            <UserPlus className="h-4 w-4" />
            Novo usuário
          </button>
        }
      />

      <div className="page-content space-y-5">
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

      <Modal
        open={showForm}
        onOpenChange={(next) => { if (!next) void requestClose(); }}
        title={createdInvite !== null ? "Convite criado" : "Criar analista / admin master"}
        description={createdInvite !== null ? "Confira o envio e a senha temporária abaixo." : "O usuário receberá um convite por e-mail e definirá uma nova senha no primeiro acesso."}
        className="max-w-xl"
      >
        {createdInvite !== null ? (
          <div className="space-y-5">
            <div className={cn("flex items-start gap-3 rounded-[8px] border p-3.5", createdInvite.emailSent ? "border-status-success-border bg-status-success-subtle" : "border-status-warning-border bg-status-warning-subtle")}>
              {createdInvite.emailSent ? <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-status-success" /> : <MailX className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />}
              <div>
                <p className={cn("text-sm font-semibold", createdInvite.emailSent ? "text-status-success" : "text-status-warning")}>
                  {createdInvite.emailSent ? "Convite enviado" : "E-mail não enviado"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground">
                  {createdInvite.emailSent
                    ? `O convite foi enviado para ${createdInvite.email}.`
                    : "Não foi possível enviar o convite. Copie a senha temporária abaixo e envie ao usuário."}
                </p>
              </div>
            </div>
            <div className="space-y-3 rounded-[8px] border border-border bg-muted/20 p-4">
              <div className="grid gap-2 text-sm sm:grid-cols-[130px_minmax(0,1fr)]">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium text-foreground">{createdInvite.nome}</span>
                <span className="text-muted-foreground">E-mail</span>
                <span className="truncate font-medium text-foreground">{createdInvite.email}</span>
                <span className="text-muted-foreground">Perfil</span>
                <span className="font-medium text-foreground">{createdInvite.perfil === "ADMIN_MASTER" ? "Admin Master" : "Analista"}</span>
                <span className="text-muted-foreground">Senha temporária</span>
                <span className="break-all rounded-[6px] border border-border bg-card px-3 py-2 font-mono text-sm font-semibold text-foreground">{createdInvite.temporaryPassword}</span>
              </div>
              <button type="button" className="btn btn-outline btn-sm w-full" onClick={() => void copyPassword()}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiada" : "Copiar senha temporária"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">No primeiro acesso, o usuário será solicitado a definir uma nova senha.</p>
            <div className="flex justify-end">
              <button type="button" className="btn btn-primary rounded-[8px]" onClick={() => void requestClose()}>Fechar</button>
            </div>
          </div>
        ) : (
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="form-group sm:col-span-2">
              <label className="form-label">Nome</label>
              <input className="input-base" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} required minLength={2} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input type="email" className="input-base" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Perfil</label>
              <Select
                value={form.perfil}
                onValueChange={(value) => setForm((p) => ({ ...p, perfil: value as "ANALISTA" | "ADMIN_MASTER" }))}
                options={[
                  { value: "ANALISTA", label: "Analista" },
                  { value: "ADMIN_MASTER", label: "Admin master" },
                ]}
                ariaLabel="Perfil"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => void requestClose()}>
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary rounded-[8px]">
              {isSaving ? "Criando…" : "Criar usuário"}
            </button>
          </div>
        </form>
        )}
      </Modal>
    </div>
  );
}
