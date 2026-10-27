import type { BoardView } from "@/types";

export interface BoardParticipant {
  readonly email: string;
  readonly name: string;
  readonly isOwner: boolean;
}

export function boardParticipants(board: BoardView): readonly BoardParticipant[] {
  const ownerEmail = board.board.createdByEmail?.trim().toLowerCase() ?? "";
  const members = board.board.members ?? [];
  const participants: BoardParticipant[] = [];
  if (ownerEmail.length > 0) {
    participants.push({ email: ownerEmail, name: ownerEmail, isOwner: true });
  }
  for (const member of members) {
    const email = member.email.trim().toLowerCase();
    if (email.length === 0 || participants.some((item) => item.email === email)) continue;
    participants.push({ email, name: member.name.trim().length > 0 ? member.name : member.email, isOwner: false });
  }
  return participants;
}

export function participantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0] ?? "?").slice(0, 2).toUpperCase();
  return `${(parts[0] ?? "").charAt(0)}${(parts[1] ?? "").charAt(0)}`.toUpperCase();
}

export function participantDisplayName(name: string): string {
  if (!name.includes("@")) return name;
  return name.split("@")[0] ?? name;
}
