import type { ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardParticipant } from "../participants";

interface BoardNotificationRecipientsProps {
  readonly participants: readonly BoardParticipant[];
  readonly selectedEmails: readonly string[];
  readonly onChange: (email: string, checked: boolean) => void;
  readonly disabled?: boolean;
}

function triggerLabel(participants: readonly BoardParticipant[], selectedEmails: readonly string[]): string {
  if (selectedEmails.length === 0) return "Selecionar participantes";
  if (selectedEmails.length === 1) {
    const participant = participants.find((item) => item.email === selectedEmails[0]);
    return participant?.name ?? selectedEmails[0] ?? "1 participante";
  }
  return `${String(selectedEmails.length)} participantes selecionados`;
}

export function BoardNotificationRecipients({
  participants,
  selectedEmails,
  onChange,
  disabled = false,
}: BoardNotificationRecipientsProps): ReactNode {
  const unavailable = disabled || participants.length === 0;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "field flex w-full items-center justify-between gap-2 text-left text-sm outline-none",
            unavailable && "cursor-not-allowed opacity-60",
          )}
          disabled={unavailable}
          aria-label="Selecionar destinatários"
        >
          <span className={cn("truncate", selectedEmails.length === 0 && "text-muted-foreground")}>
            {triggerLabel(participants, selectedEmails)}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={4}
          align="start"
          avoidCollisions
          className="z-[120] max-h-72 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-[6px] border border-border bg-card p-1 text-foreground shadow-[0_10px_30px_rgb(15_23_42/0.16)]"
        >
          {participants.map((participant) => {
            const selected = selectedEmails.includes(participant.email);
            return (
              <DropdownMenu.CheckboxItem
                key={participant.email}
                checked={selected}
                onCheckedChange={(checked) => onChange(participant.email, checked === true)}
                onSelect={(event) => event.preventDefault()}
                className={cn(
                  "relative flex cursor-pointer select-none items-center gap-2 rounded-[4px] px-2 py-2 text-sm outline-none transition-colors",
                  "focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
              >
                <span className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                  selected ? "border-navy bg-navy text-white" : "border-border bg-card",
                )}>
                  <DropdownMenu.ItemIndicator>
                    <Check className="h-3 w-3" />
                  </DropdownMenu.ItemIndicator>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs text-foreground">{participant.name}</span>
                  {participant.name !== participant.email && (
                    <span className="block truncate text-[10px] text-muted-foreground">{participant.email}</span>
                  )}
                </span>
              </DropdownMenu.CheckboxItem>
            );
          })}
          {participants.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">Nenhum participante disponível.</p>}
          {selectedEmails.length > 0 && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={() => {
                  for (const email of selectedEmails) onChange(email, false);
                }}
                className="cursor-pointer rounded-[4px] px-2 py-2 text-xs text-muted-foreground outline-none focus:bg-muted focus:text-foreground"
              >
                Limpar seleção
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
