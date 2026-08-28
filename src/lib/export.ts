/**
 * Real file downloads for a prototype with synthetic figures.
 *
 * The data is mock; the file is not. Anything the app offers to export actually
 * lands in the downloads folder and opens in a spreadsheet, because an export
 * button that does nothing is the exact dead end the rest of this app refuses.
 */

/** Excel reads a file as the system codepage unless a UTF-8 BOM says otherwise —
 *  without it ₹ and Devanagari arrive as mojibake. */
const BOM = '﻿'

/**
 * RFC 4180: quote a field when it contains a comma, a quote or a newline, and
 * double any quote inside it. A leading =, +, - or @ is prefixed with a
 * quote-escaped tab so a spreadsheet reads it as text rather than a formula.
 */
function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const raw = String(value)
  const guarded = /^[=+\-@]/.test(raw) ? `\t${raw}` : raw
  return /[",\r\n\t]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  // CRLF, which is what RFC 4180 specifies and what Excel expects.
  return BOM + rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n'
}

/**
 * Hands the browser a file. The object URL is revoked on the next frame rather
 * than immediately — Safari cancels the download if the URL dies too early.
 */
export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  downloadFile(filename, toCsv(rows), 'text/csv')
}

/** Filenames a person can find again: no spaces, no colons, dated. */
export function exportName(parts: (string | number)[], ext: string) {
  const stamp = new Date().toISOString().slice(0, 10)
  return (
    [...parts, stamp]
      .map((p) => String(p).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
      .filter(Boolean)
      .join('-') + `.${ext}`
  )
}
