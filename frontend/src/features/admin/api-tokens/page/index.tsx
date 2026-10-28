import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Check, Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { apiTokensApi, type ApiTokenCreated, type ApiTokenPermission, type ApiTokenSummary } from "@/services/api-tokens";
import { getApiErrorMessage } from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonPage } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDiscardGuard } from "@/components/ui/confirm-dialog/use-discard-guard";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

const COLUMNS = [
  { label: "Nome" },
  { label: "Permissão" },
  { label: "Token" },
  { label: "Criado em" },
  { label: "Expira em" },
  { label: "Último uso" },
  { label: "Status" },
  { label: "", align: "right" as const },
];

const PERMISSION_OPTIONS = [
  { value: "read", label: "Leitura" },
  { value: "write", label: "Leitura e escrita" },
];
const EXPIRY_OPTIONS = [
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
  { value: "180", label: "180 dias" },
  { value: "365", label: "365 dias" },
  { value: "never", label: "Sem expiração" },
];

function permissionLabel(permission: ApiTokenPermission): string {
  return permission === "write" ? "Leitura e escrita" : "Leitura";
}

function tokenStatus(token: ApiTokenSummary): { readonly label: string; readonly className: string } {
  if (token.revokedAt !== undefined) return { label: "Revogado", className: "text-muted-foreground" };
  if (token.expiresAt !== undefined && Date.parse(token.expiresAt) <= Date.now()) {
    return { label: "Expirado", className: "text-status-warning" };
  }
  return { label: "Ativo", className: "text-status-success" };
}

export default function AdminApiTokensPage(): ReactNode {
  const addToast = useToastStore((s) => s.addToast);
  const confirm = useConfirm();
  const [items, setItems] = useState<readonly ApiTokenSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createdToken, setCreatedToken] = useState<ApiTokenCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: "",
    permission: "read" as ApiTokenPermission,
    expires: "90",
  });

  const formDirty = form.name.length > 0 || form.permission !== "read" || form.expires !== "90";
  const closeDirty = formDirty || (createdToken !== null && !copied);
  const closeCreate = (): void => {
    setShowCreate(false);
    setCreatedToken(null);
    setCopied(false);
    setForm({ name: "", permission: "read", expires: "90" });
  };
  const requestClose = useDiscardGuard(closeDirty, closeCreate, createdToken !== null
    ? {
        title: "Sair sem copiar o token?",
        description: "O token só será exibido uma vez. Se sair agora, não será possível recuperá-lo.",
        confirmLabel: "Sair mesmo assim",
        cancelLabel: "Continuar aqui",
      }
    : {});

  async function load(): Promise<void> {
    const next = await apiTokensApi.list();
    setItems(next);
  }

  useEffect(() => {
    void load().finally(() => setIsLoading(false));
  }, []);

  async function handleCreate(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (form.name.trim().length === 0) return;
    setIsSaving(true);
    try {
      const created = await apiTokensApi.create({
        name: form.name.trim(),
        permission: form.permission,
        expiresInDays: form.expires === "never" ? null : Number(form.expires),
      });
      setCreatedToken(created);
      setCopied(false);
      setForm({ name: "", permission: "read", expires: "90" });
      addToast({ type: "success", title: "Token criado", description: "Copie o token agora; ele não será exibido novamente." });
      await load();
    } catch (err) {
      addToast({ type: "error", title: "Erro ao criar token", description: getApiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRevoke(token: ApiTokenSummary): Promise<void> {
    const confirmed = await confirm({
      title: "Revogar token",
      description: `Revogar o token “${token.name}”? Integrações que o utilizam perderão o acesso imediatamente.`,
      confirmLabel: "Revogar token",
    });
    if (!confirmed) return;
    try {
      await apiTokensApi.revoke(token.tokenId);
      addToast({ type: "success", title: "Token revogado" });
      await load();
    } catch (err) {
      addToast({ type: "error", title: "Erro ao revogar token", description: getApiErrorMessage(err) });
    }
  }

  async function copyToken(): Promise<void> {
    if (createdToken === null) return;
    try {
      if (navigator.clipboard === undefined) throw new Error("Área de transferência indisponível");
      await navigator.clipboard.writeText(createdToken.token);
      setCopied(true);
    } catch (err) {
      addToast({
        type: "error",
        title: "Não foi possível copiar",
        description: err instanceof Error ? err.message : "Copie o token manualmente.",
      });
    }
  }

  if (isLoading) return <SkeletonPage />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Tokens de API"
        description="Crie credenciais para integrações externas acessarem os endpoints administrativos."
        action={(
          <button type="button" className="btn btn-primary btn-sm rounded-[8px]" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Novo token
          </button>
        )}
      />

      <div className="page-content space-y-5">
        {items.length === 0 ? (
          <EmptyState icon={KeyRound} title="Nenhum token criado" description="Crie um token para liberar acesso programático aos endpoints." />
        ) : (
          <DataTable columns={COLUMNS} total={items.length} minWidth={1040} emptyMessage="Nenhum token criado.">
            {items.map((token) => {
              const status = tokenStatus(token);
              return (
                <tr key={token.tokenId} className="table-row">
                  <td className="font-medium text-foreground">{token.name}</td>
                  <td className="text-muted-foreground">{permissionLabel(token.permission)}</td>
                  <td className="font-mono text-xs text-muted-foreground">{token.prefix}…</td>
                  <td className="text-muted-foreground">{formatDateTime(token.createdAt)}</td>
                  <td className="text-muted-foreground">{token.expiresAt === undefined ? "Sem expiração" : formatDate(token.expiresAt)}</td>
                  <td className="text-muted-foreground">{token.lastUsedAt === undefined ? "Nunca" : formatDateTime(token.lastUsedAt)}</td>
                  <td className={cn("font-medium", status.className)}>{status.label}</td>
                  <td className="text-right">
                    {token.revokedAt === undefined && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-status-danger"
                        onClick={() => void handleRevoke(token)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Revogar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </div>

      <Modal
        open={showCreate}
        onOpenChange={(next) => { if (!next) void requestClose(); }}
        title={createdToken !== null ? "Token criado" : "Novo token de API"}
        description={createdToken !== null ? "Copie o token agora. Ele não será exibido novamente." : "O token herda as permissões do seu usuário admin."}
        className="max-w-2xl"
      >
        {createdToken !== null ? (
          <div className="space-y-5">
            <div className="rounded-[8px] border border-status-warning-border bg-status-warning-subtle p-3.5 text-xs leading-relaxed text-status-warning">
              Guarde este token em um local seguro. Ele não poderá ser exibido novamente.
            </div>
            <div className="space-y-3 rounded-[8px] border border-border bg-muted/20 p-4">
              <div className="grid gap-1 text-sm sm:grid-cols-[110px_minmax(0,1fr)]">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium text-foreground">{createdToken.name}</span>
                <span className="text-muted-foreground">Permissão</span>
                <span className="font-medium text-foreground">{permissionLabel(createdToken.permission)}</span>
              </div>
              <p className="break-all rounded-[6px] border border-border bg-card px-3 py-2 font-mono text-xs font-semibold text-foreground">{createdToken.token}</p>
              <button type="button" className="btn btn-outline btn-sm w-full" onClick={() => void copyToken()}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Token copiado" : "Copiar token"}
              </button>
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn btn-primary rounded-[8px]" onClick={() => void requestClose()}>Fechar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => void handleCreate(event)} className="space-y-5">
            <div className="form-group">
              <label className="form-label" htmlFor="token-name">Nome do token</label>
              <input
                id="token-name"
                className="input-base"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex.: Integração CRM"
                maxLength={80}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Permissão</label>
              <Select
                value={form.permission}
                onValueChange={(value) => setForm((current) => ({ ...current, permission: value as ApiTokenPermission }))}
                options={PERMISSION_OPTIONS}
                ariaLabel="Permissão"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expiração</label>
              <Select
                value={form.expires}
                onValueChange={(value) => setForm((current) => ({ ...current, expires: value }))}
                options={EXPIRY_OPTIONS}
                ariaLabel="Expiração"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn btn-secondary rounded-[8px]" onClick={() => void requestClose()}>Cancelar</button>
              <button type="submit" className="btn btn-primary rounded-[8px]" disabled={isSaving || form.name.trim().length === 0}>
                {isSaving ? "Criando…" : "Criar token"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
