import Papa from 'papaparse';
import type { Patient, ColumnMapping } from './types';

const SECTOR_KEYWORDS = /cl[ií]nica|uti|enfermaria|cirurgia|obstetr|pediatr|emerg|centro|leito/i;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

const HEADER_MAP: Record<string, keyof ColumnMapping> = {
  prontuario: 'prontuario', pront: 'prontuario', id: 'prontuario',
  nome: 'name', name: 'name', paciente: 'name',
  idade: 'age', age: 'age',
  setor: 'sector', sector: 'sector', unidade: 'sector',
};

export function detectColumns(rows: string[][]): { mapping: ColumnMapping; confidence: number; hasHeader: boolean } {
  const empty = { mapping: { prontuario: null, name: null, age: null, sector: null } as ColumnMapping, confidence: 0, hasHeader: false };
  if (rows.length === 0) return empty;

  // Try header-based detection on first row
  const firstRow = rows[0];
  const headerMapping: ColumnMapping = { prontuario: null, name: null, age: null, sector: null };
  let headerHits = 0;
  for (let c = 0; c < firstRow.length; c++) {
    const norm = normalize(firstRow[c] || '');
    const field = HEADER_MAP[norm];
    if (field && headerMapping[field] === null) {
      headerMapping[field] = c;
      headerHits++;
    }
  }
  if (headerHits >= 2 && headerMapping.prontuario !== null && headerMapping.name !== null) {
    return { mapping: headerMapping, confidence: 1, hasHeader: true };
  }

  // Fallback: heuristic-based detection
  const colCount = Math.max(...rows.map(r => r.length));
  const scores: ColumnMapping = { prontuario: null, name: null, age: null, sector: null };
  const colScores: { prontuario: number; name: number; age: number; sector: number }[] = [];

  for (let c = 0; c < colCount; c++) {
    const s = { prontuario: 0, name: 0, age: 0, sector: 0 };
    const sampleRows = rows.slice(0, Math.min(20, rows.length));

    for (const row of sampleRows) {
      const val = (row[c] || '').trim();
      if (!val) continue;

      const num = parseInt(val);
      if (!isNaN(num) && /^\d+$/.test(val)) {
        if (num > 1000) s.prontuario += 2;
        if (num >= 0 && num <= 120) s.age += 1;
      }

      if (val.length > 5 && /^[A-ZÀ-Ü\s]+$/.test(val)) s.name += 2;
      if (SECTOR_KEYWORDS.test(val)) s.sector += 3;
    }
    colScores.push(s);
  }

  const fields: (keyof ColumnMapping)[] = ['prontuario', 'name', 'age', 'sector'];
  const assigned = new Set<number>();
  let totalScore = 0;

  const fieldMaxes = fields.map(f => ({
    field: f,
    maxScore: Math.max(...colScores.map(cs => cs[f])),
  })).sort((a, b) => b.maxScore - a.maxScore);

  for (const { field } of fieldMaxes) {
    let bestCol = -1;
    let bestScore = 0;
    for (let c = 0; c < colScores.length; c++) {
      if (assigned.has(c)) continue;
      if (colScores[c][field] > bestScore) {
        bestScore = colScores[c][field];
        bestCol = c;
      }
    }
    if (bestCol >= 0 && bestScore > 0) {
      scores[field] = bestCol;
      assigned.add(bestCol);
      totalScore += bestScore;
    }
  }

  const confidence = scores.prontuario !== null && scores.name !== null ? (totalScore / (rows.length * 2)) : 0;
  return { mapping: scores, confidence: Math.min(confidence, 1), hasHeader: false };
}

export function parseManualText(text: string): string[][] {
  const result = Papa.parse(text.trim(), { skipEmptyLines: true });
  let rows = result.data as string[][];

  // If tab parsing yields single-column rows, try space splitting
  if (rows.length > 0 && rows[0].length <= 1) {
    rows = text.trim().split('\n').map(line =>
      line.trim().split(/\s{2,}/).map(s => s.trim()).filter(Boolean)
    ).filter(r => r.length > 0);
  }

  return rows;
}

export function applyMapping(rows: string[][], mapping: ColumnMapping): Patient[] {
  const patients: Patient[] = [];

  for (const row of rows) {
    const prontuario = mapping.prontuario !== null ? (row[mapping.prontuario] || '').replace(/^0+/, '') || '0' : '';
    const name = mapping.name !== null ? (row[mapping.name] || '').trim() : '';
    const ageStr = mapping.age !== null ? (row[mapping.age] || '').trim() : '';
    const sector = mapping.sector !== null ? (row[mapping.sector] || '').trim() : 'Desconhecido';

    if (!prontuario || !name) continue;

    const age = ageStr ? parseInt(ageStr) : null;
    patients.push({
      prontuario,
      name: name.toUpperCase(),
      age: age !== null && !isNaN(age) && age >= 0 && age <= 120 ? age : null,
      sector,
    });
  }

  return patients;
}
