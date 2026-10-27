import { useCallback } from "react";
import { useConfirm } from "./index";

export interface DiscardGuardOptions {
  readonly title?: string;
  readonly description?: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

export function useDiscardGuard(
  dirty: boolean,
  onClose: () => void,
  options: DiscardGuardOptions = {},
): () => Promise<void> {
  const confirm = useConfirm();
  return useCallback(async (): Promise<void> => {
    if (!dirty) {
      onClose();
      return;
    }
    const confirmed = await confirm({
      title: options.title ?? "Descartar alterações?",
      description: options.description ?? "Você tem alterações não salvas. Se sair agora, elas serão perdidas.",
      confirmLabel: options.confirmLabel ?? "Sair sem salvar",
      cancelLabel: options.cancelLabel ?? "Continuar editando",
    });
    if (confirmed) onClose();
  }, [dirty, onClose, confirm, options.title, options.description, options.confirmLabel, options.cancelLabel]);
}
