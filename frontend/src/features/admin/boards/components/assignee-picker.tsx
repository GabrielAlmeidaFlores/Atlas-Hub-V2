import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardParticipant } from "../participants";
import { participantDisplayName, participantInitials } from "../participants";

interface AssigneePickerProps {
  readonly participants: readonly BoardParticipant[];
  readonly selectedEmails: readonly string[];
  readonly onChange: (emails: readonly string[]) => void;
  readonly disabled?: boolean;
}

export function AssigneePicker({ participants, selectedEmails, onChange, disabled = false }: AssigneePickerProps): ReactNode {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selected = participants.filter((participant) => selectedEmails.includes(participant.email));

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function toggle(email: string): void {
    onChange(selectedEmails.includes(email)
      ? selectedEmails.filter((item) => item !== email)
      : [...selectedEmails, email]);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          "field flex h-auto min-h-[2.75rem] w-full flex-wrap items-center gap-2 px-2.5 py-2 text-left",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onClick={() => { if (!disabled) setOpen((current) => !current); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        {selected.length === 0 && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserRound className="h-4 w-4" /> Nenhum responsável
          </span>
        )}
        {selected.map((participant) => (
          <span key={participant.email} className="inline-flex max-w-full shrink-0 items-center gap-1 rounded-full border border-border bg-muted/40 py-0.5 pl-1 pr-1.5 text-xs text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-100 text-[9px] font-bold text-navy">
              {participantInitials(participant.name)}
            </span>
            <span className="max-w-[150px] truncate">{participantDisplayName(participant.name)}</span>
            {!disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remover ${participant.name}`}
                onClick={(event) => { event.stopPropagation(); toggle(participant.email); }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    toggle(participant.email);
                  }
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </span>
        ))}
        {selected.length > 0 && !disabled && (
          <span className="ml-auto text-[10px] text-muted-foreground">+</span>
        )}
      </button>

      {open && !disabled && (
        <div className="absolute left-0 z-[120] mt-1 w-full overflow-hidden rounded-[6px] border border-border bg-card shadow-[0_10px_30px_rgb(15_23_42/0.16)]" role="listbox" aria-label="Participantes">
          <div className="max-h-56 overflow-y-auto p-1">
            {participants.length === 0 && (
              <p className="px-2.5 py-3 text-xs text-muted-foreground">Nenhum participante no quadro.</p>
            )}
            {participants.map((participant) => {
              const isSelected = selectedEmails.includes(participant.email);
              return (
                <button
                  key={participant.email}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(participant.email)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[4px] px-2.5 py-2 text-left text-sm",
                    isSelected ? "bg-navy-50 text-navy" : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    {participantInitials(participant.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{participantDisplayName(participant.name)}</span>
                    {participant.email !== participant.name && (
                      <span className="block truncate text-[10px] text-muted-foreground">{participant.email}</span>
                    )}
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-navy" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
