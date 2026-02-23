import * as XLSX from 'xlsx-js-style';
import type { Patient } from './types';
import type { CleaningReport, CleaningIssue } from './cleanData';
import {
  isEmptyRow,
  isColumnHeader,
  isFooterRow,
  isSummarySection,
  isVacantBed,
  isContinuationRow,
  detectBlockSector,
  buildCleaningReport,
  addIssue,
} from './cleanData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DATE_REGEX = /(\d{2})\/(\d{2})\/(\d{4})/;

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function cleanProntuario(val: string): string {
  return val.replace(/^0+/, '') || '0';
}

function isNumericId(val: string): boolean {
  return /^\d{4,}$/.test(val.trim());
}

// ─── Block segmentation ───────────────────────────────────────────────────────

interface Block {
  rows: string[][];
}

function segmentIntoBlocks(allRows: string[][]): Block[] {
  const blocks: Block[] = [];
  let current: string[][] = [];
  let inBlock = false;

  for (const row of allRows) {
    const joined = row.join(' ');

    // Stop everything at summary section
    if (isSummarySection(row)) break;

    // Start of a new block
    if (/unidade\s+de\s+interna[çc][ãa]o/i.test(joined)) {
      if (current.length > 0) {
        blocks.push({ rows: current });
        current = [];
      }
      inBlock = true;
      continue; // don't add the header line itself
    }

    // End of current block
    if (isFooterRow(row)) {
      if (current.length > 0) {
        blocks.push({ rows: current });
        current = [];
      }
      inBlock = false;
      continue; // skip the footer row
    }

    if (inBlock) {
      current.push(row);
    }
  }

  // Flush any trailing block without a footer
  if (current.length > 0) {
    blocks.push({ rows: current });
  }

  return blocks;
}

// ─── Patient extraction from a single block ───────────────────────────────────

function processBlock(
  block: Block,
  sector: string,
  issues: CleaningIssue[],
): Patient[] {
  const patients: Patient[] = [];
  let prevRow: string[] | null = null;

  for (const row of block.rows) {
    const rowStr = row.map((c) => String(c ?? '').trim());
    const rowText = rowStr.join(' | ');

    // Skip empty rows
    if (isEmptyRow(rowStr)) {
      addIssue(issues, 'empty_row', rowText.slice(0, 60));
      continue;
    }

    // Skip column headers
    if (isColumnHeader(rowStr)) {
      addIssue(issues, 'header_row', rowText.slice(0, 60));
      continue;
    }

    // Skip vacant beds
    if (isVacantBed(rowStr)) {
      addIssue(issues, 'vacant_bed', rowText.slice(0, 60));
      continue;
    }

    // Check if continuation row (same patient, name fragment)
    if (isContinuationRow(rowStr, prevRow)) {
      // Find name fragment: longest text-only token in the row
      const fragment = rowStr
        .filter((c) => c.length > 1 && /[A-ZÀ-Ü]/i.test(c) && !/^\d+$/.test(c))
        .join(' ')
        .trim();

      if (fragment && patients.length > 0) {
        const last = patients[patients.length - 1];
        // Only append if the fragment is not already part of the name
        if (!last.name.includes(fragment)) {
          last.name = `${last.name} ${fragment}`.trim();
        }
      }
      addIssue(issues, 'name_merged', rowText.slice(0, 60));
      // Don't update prevRow — keep the original row as reference
      continue;
    }

    // Find birth date (anchor)
    let dateIdx = -1;
    let birthDate: Date | null = null;
    for (let i = 0; i < rowStr.length; i++) {
      const m = rowStr[i].match(DATE_REGEX);
      if (m) {
        dateIdx = i;
        birthDate = new Date(
          parseInt(m[3]),
          parseInt(m[2]) - 1,
          parseInt(m[1]),
        );
        break;
      }
    }

    // If no date found, try to still extract if row has large numeric IDs + a name
    // (handles status R = Reservado — no birth date but valid patient)
    if (dateIdx < 0) {
      const bigIds = rowStr.filter((c) => isNumericId(c));
      const nameCandidate = rowStr.find(
        (c) =>
          c.length > 3 &&
          /[A-ZÀ-Ü]{2,}/i.test(c) &&
          !isNumericId(c) &&
          c !== 'R' &&
          c !== 'O',
      );
      if (bigIds.length >= 2 && nameCandidate) {
        const prontuario = cleanProntuario(bigIds[bigIds.length - 1]);
        patients.push({ prontuario, name: nameCandidate, age: null, sector });
        prevRow = rowStr;
      }
      continue;
    }

    // Extract name: largest text token to the left of the date
    let name = '';
    let nameIdx = -1;
    for (let i = dateIdx - 1; i >= 0; i--) {
      if (
        rowStr[i].length > 2 &&
        /[A-ZÀ-Ü]/i.test(rowStr[i]) &&
        !isNumericId(rowStr[i])
      ) {
        name = rowStr[i];
        nameIdx = i;
        break;
      }
    }
    if (!name) {
      prevRow = rowStr;
      continue;
    }

    // Extract prontuário: collect all numeric IDs to the left of the name,
    // then take the LAST one (= "Paciente" field, not "Atend")
    const numericIds: string[] = [];
    for (let i = nameIdx - 1; i >= 0; i--) {
      if (isNumericId(rowStr[i])) {
        numericIds.push(rowStr[i]);
      }
    }
    // numericIds[0] is closest to name = "Paciente"; numericIds[1] = "Atend"
    if (numericIds.length === 0) {
      prevRow = rowStr;
      continue;
    }
    const prontuario = cleanProntuario(numericIds[0]);

    // Calculate age
    let age: number | null = null;
    if (birthDate && !isNaN(birthDate.getTime())) {
      age = calculateAge(birthDate);
    }

    patients.push({ prontuario, name, age, sector });
    prevRow = rowStr;
  }

  return patients;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function parseOfficialFile(data: ArrayBuffer): {
  patients: Patient[];
  report: CleaningReport;
} {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
  });

  const originalRowCount = allRows.length;

  // Normalise all cells to trimmed strings
  const stringRows: string[][] = allRows.map((row) =>
    (row as any[]).map((c) => String(c ?? '').trim()),
  );

  // ── Pass 1: segment into blocks ──────────────────────────────────────────
  const blocks = segmentIntoBlocks(stringRows);

  // ── Pass 2: extract patients per block ───────────────────────────────────
  const issues: CleaningIssue[] = [];
  const allPatients: Patient[] = [];
  const sectorCounts: Record<string, number> = {};

  // Count summary section rows (everything after "Resumo Estatístico")
  let summaryStart = stringRows.findIndex((r) => isSummarySection(r));
  if (summaryStart >= 0) {
    const summaryCount = stringRows.length - summaryStart;
    addIssue(issues, 'summary_section', `${summaryCount} linhas ignoradas após Resumo Estatístico`);
  }

  for (const block of blocks) {
    const sector = detectBlockSector(block.rows);
    const patients = processBlock(block, sector, issues);

    allPatients.push(...patients);
    sectorCounts[sector] = (sectorCounts[sector] ?? 0) + patients.length;
  }

  const sectorsFound = Object.entries(sectorCounts).map(([name, count]) => ({
    name,
    count,
  }));

  const report = buildCleaningReport(
    originalRowCount,
    issues,
    allPatients.length,
    sectorsFound,
  );

  return { patients: allPatients, report };
}
