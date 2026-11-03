export function csvCell(value: string | number | boolean | undefined, protectFormula = true): string {
  const raw = value === undefined ? '' : String(value);
  const safe = protectFormula && /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
