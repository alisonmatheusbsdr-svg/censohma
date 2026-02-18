// ─── Types ────────────────────────────────────────────────────────────────────

export interface CleaningIssue {
  type:
    | 'empty_row'
    | 'header_row'
    | 'footer_row'
    | 'vacant_bed'
    | 'name_merged'
    | 'summary_section'
    | 'continuation_row';
  count: number;
  examples: string[];
}

export interface CleaningReport {
  originalRowCount: number;
  validRowCount: number;
  patientCount: number;
  issues: CleaningIssue[];
  sectorsFound: { name: string; count: number }[];
}

// ─── Row-level detectors ──────────────────────────────────────────────────────

/** True when every cell in the row is empty or whitespace-only. */
export function isEmptyRow(row: string[]): boolean {
  return row.every((c) => c.trim() === '');
}

/** True when the row looks like the repeated column-header line. */
export function isColumnHeader(row: string[]): boolean {
  const joined = row.join(' ').toLowerCase();
  return (
    joined.includes('enfermaria') &&
    joined.includes('leito') &&
    joined.includes('atend')
  );
}

/** True when the row is a block-footer ("Total de Leitos …"). */
export function isFooterRow(row: string[]): boolean {
  const joined = row.join(' ');
  return /total\s+de\s+leitos/i.test(joined);
}

/** True when the row marks the start of the summary section to be ignored. */
export function isSummarySection(row: string[]): boolean {
  const joined = row.join(' ');
  return /resumo\s+estat[íi]stico/i.test(joined);
}

/**
 * True when this row represents a vacant bed.
 * Heuristic: any cell equals exactly "V" (status column).
 */
export function isVacantBed(row: string[]): boolean {
  return row.some((c) => c.trim() === 'V');
}

/**
 * True when `currentRow` is a name-continuation of `prevRow`.
 * Criteria:
 *  - same "Atend" value (first large number) present in both rows
 *  - same "Paciente" value (second large number) present in both rows
 *  - no "/" character in the current row (marks the primary row)
 */
export function isContinuationRow(
  currentRow: string[],
  prevRow: string[] | null,
): boolean {
  if (!prevRow) return false;

  // A "/" in the row marks it as a primary row (internação date divider).
  const currentJoined = currentRow.join('|');
  if (currentJoined.includes('/')) {
    // "/" might be in the date too — only abort if "/" appears outside a date pattern
    // Strip dd/mm/yyyy occurrences, then check if "/" remains
    const noDateStr = currentJoined.replace(/\d{2}\/\d{2}\/\d{4}/g, '');
    if (noDateStr.includes('/')) return false;
  }

  // Extract numeric IDs (≥ 5 digits) from each row
  const bigNums = (r: string[]) =>
    r.flatMap((c) => (c.match(/\d{5,}/g) ?? [])).slice(0, 2);

  const curNums = bigNums(currentRow);
  const prevNums = bigNums(prevRow);

  if (curNums.length === 0 || prevNums.length === 0) return false;

  // At least the "Paciente" (last of the pair) must match
  return curNums[curNums.length - 1] === prevNums[prevNums.length - 1];
}

// ─── Sector detection ─────────────────────────────────────────────────────────

const SECTOR_MAP: Record<string, string> = {
  CM1: 'Clínica Médica I',
  CM2: 'Clínica Médica II',
  CM3: 'Clínica Médica III',
  UTI: 'UTI',
  UTIG: 'UTI Geral',
  UTIP: 'UTI Pediátrica',
  PED: 'Pediatria',
  MAT: 'Maternidade',
  CG: 'Clínica Geral',
  CC: 'Centro Cirúrgico',
  OBS: 'Observação',
  PS: 'Pronto-Socorro',
  NEO: 'Neonatologia',
  ONCO: 'Oncologia',
  ORTO: 'Ortopedia',
  CARD: 'Cardiologia',
};

/**
 * Extracts the meaningful prefix from a bed code.
 * "E-CM1L24"  → "CM1"
 * "E-CM2ADC"  → "CM2"
 * "UTI-01"    → "UTI"
 * "AMARELA"   → null  (special, inherit block sector)
 */
export function extractBedPrefix(bedCode: string): string | null {
  const clean = bedCode.trim().toUpperCase();

  // Skip purely alphabetical words that are colour/special names
  if (/^[A-Z]+$/.test(clean) && clean.length <= 8) {
    // Could be a colour name like AMARELA, VERDE, AZUL — not a structural code
    if (['AMARELA', 'VERDE', 'AZUL', 'VERMELHA', 'LARANJA', 'ROXA'].includes(clean)) {
      return null;
    }
  }

  // Pattern: optional "E-" prefix, then letters+digits group
  // Extract first alphabetic run after stripping leading "E-" or similar
  const m = clean.match(/^(?:[A-Z]-)?([A-Z]+\d*[A-Z]*)/);
  if (!m) return null;

  const candidate = m[1];
  // Prefer the longest matching key from SECTOR_MAP
  const matchedKey = Object.keys(SECTOR_MAP)
    .filter((k) => candidate.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];

  return matchedKey ?? candidate;
}

/** Maps a prefix to a human-readable sector name, with raw-code fallback. */
export function resolveSectorName(prefix: string): string {
  return SECTOR_MAP[prefix.toUpperCase()] ?? prefix;
}

/**
 * Given all rows of a block, returns the dominant sector name.
 * Counts non-null prefixes, excludes special/colour codes, picks most frequent.
 */
export function detectBlockSector(blockRows: string[][]): string {
  const freq: Record<string, number> = {};

  for (const row of blockRows) {
    // First cell is usually the "Enfermaria" / ward name
    const bedCell = row[0]?.trim() ?? '';
    // Also check second cell (Leito)
    const leitoCell = row[1]?.trim() ?? '';

    for (const cell of [bedCell, leitoCell]) {
      if (!cell) continue;
      const prefix = extractBedPrefix(cell);
      if (prefix) {
        freq[prefix] = (freq[prefix] ?? 0) + 1;
      }
    }
  }

  if (Object.keys(freq).length === 0) return 'Desconhecido';

  const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  return resolveSectorName(dominant);
}

// ─── Report builder ───────────────────────────────────────────────────────────

export function buildCleaningReport(
  originalRowCount: number,
  issues: CleaningIssue[],
  patientCount: number,
  sectorsFound: { name: string; count: number }[],
): CleaningReport {
  const removed = issues.reduce((s, i) => s + i.count, 0);
  return {
    originalRowCount,
    validRowCount: originalRowCount - removed,
    patientCount,
    issues,
    sectorsFound,
  };
}

/** Helper to increment or create an issue entry in a mutable array. */
export function addIssue(
  issues: CleaningIssue[],
  type: CleaningIssue['type'],
  example: string,
): void {
  const existing = issues.find((i) => i.type === type);
  if (existing) {
    existing.count += 1;
    if (existing.examples.length < 3) existing.examples.push(example);
  } else {
    issues.push({ type, count: 1, examples: [example] });
  }
}
