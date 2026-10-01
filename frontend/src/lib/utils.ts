import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatMoneyInput(raw: string): string {
  const hasComma = raw.includes(",");
  const intRaw = (hasComma ? raw.slice(0, raw.indexOf(",")) : raw).replace(/\D/g, "");
  const decRaw = hasComma ? raw.slice(raw.indexOf(",") + 1).replace(/\D/g, "").slice(0, 2) : "";
  if (intRaw.length === 0 && !hasComma) return "";
  const intDigits = intRaw.replace(/^0+(?=\d)/, "").slice(0, 12);
  const grouped = (intDigits.length === 0 ? "0" : intDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return hasComma ? `${grouped},${decRaw}` : grouped;
}

export function parseMoneyInput(value: string): number {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === ",") return Number.NaN;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : Number.NaN;
}

export function formatMoneyFromNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  const [intPart, decPart] = Math.abs(value).toFixed(2).split(".");
  const formatted = formatMoneyInput(decPart === "00" ? intPart ?? "0" : `${intPart ?? "0"},${decPart ?? "00"}`);
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function modulo11(digits: readonly number[], weights: readonly number[]): number {
  const sum = digits.reduce((acc, digit, index) => acc + digit * (weights[index] ?? 0), 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const nums = [...digits].map((d) => Number(d));
  const d1 = modulo11(nums.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (nums[12] !== d1) return false;
  const d2 = modulo11(nums.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return nums[13] === d2;
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const nums = [...digits].map((d) => Number(d));
  const d1Sum = nums.slice(0, 9).reduce((acc, n, i) => acc + n * (10 - i), 0);
  const d1 = (d1Sum * 10) % 11 % 10;
  if (nums[9] !== d1) return false;
  const d2Sum = nums.slice(0, 10).reduce((acc, n, i) => acc + n * (11 - i), 0);
  const d2 = (d2Sum * 10) % 11 % 10;
  return nums[10] === d2;
}

export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) return formatCpf(digits);
  return formatCnpj(digits);
}

export function isValidCpfCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatCelular(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function parseDate(isoString: string | null | undefined): Date | null {
  if (isoString === null || isoString === undefined || isoString === "") return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDate(isoString: string): string {
  const date = parseDate(isoString);
  if (date === null) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function formatDateTime(isoString: string): string {
  const date = parseDate(isoString);
  if (date === null) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}% a.a.`;
}

export function timeAgo(isoString: string): string {
  const date = parseDate(isoString);
  if (date === null) return "—";
  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff)) return "—";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${String(minutes)}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${String(hours)}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${String(days)}d atrás`;
  return formatDate(isoString);
}
