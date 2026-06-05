/**
 * Lightweight client-side export helpers. CSV is generated with proper RFC-4180
 * escaping; an Excel-compatible export uses an HTML table with the .xls MIME so
 * spreadsheets open it natively without extra dependencies.
 */

function escapeCsv(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv<T extends object>(
  rows: T[],
  columns: { key: keyof T; label: string }[],
  filename: string,
) {
  const header = columns.map((c) => escapeCsv(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => escapeCsv(r[c.key])).join(",")).join("\n");
  const csv = `${header}\n${body}`;
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

export function exportToExcel<T extends object>(
  rows: T[],
  columns: { key: keyof T; label: string }[],
  filename: string,
) {
  const esc = (v: unknown) =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const thead = `<tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr>`;
  const tbody = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${esc(r[c.key])}</td>`).join("")}</tr>`)
    .join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">${thead}${tbody}</table></body></html>`;
  triggerDownload(new Blob([html], { type: "application/vnd.ms-excel" }), `${filename}.xls`);
}
