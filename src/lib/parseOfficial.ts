import * as XLSX from 'xlsx';
import type { Patient } from './types';

const DATE_REGEX = /(\d{2})\/(\d{2})\/(\d{4})/;
const SECTOR_REGEX = /Unidade de Interna[çc][ãa]o:\s*(.+)/i;

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
  return /^\d+$/.test(val.trim());
}

export function parseOfficialFile(data: ArrayBuffer): Patient[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const patients: Patient[] = [];
  let currentSector = 'Desconhecido';

  for (const row of rows) {
    if (!row || row.length === 0) continue;
    const rowStr = row.map((c: any) => String(c ?? '').trim());

    // Check for sector header
    const fullRow = rowStr.join(' ');
    const sectorMatch = fullRow.match(SECTOR_REGEX);
    if (sectorMatch) {
      currentSector = sectorMatch[1].trim();
      continue;
    }

    // Find date anchor
    let dateIdx = -1;
    let birthDate: Date | null = null;
    for (let i = 0; i < rowStr.length; i++) {
      const m = rowStr[i].match(DATE_REGEX);
      if (m) {
        dateIdx = i;
        birthDate = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
        break;
      }
    }
    if (dateIdx < 0) continue;

    // Extract name: text to the left of the date
    let name = '';
    let nameIdx = -1;
    for (let i = dateIdx - 1; i >= 0; i--) {
      if (rowStr[i].length > 2 && /[A-ZÀ-Ü]/.test(rowStr[i])) {
        name = rowStr[i];
        nameIdx = i;
        break;
      }
    }
    if (!name) continue;

    // Extract prontuário: number to the left of the name
    let prontuario = '';
    for (let i = nameIdx - 1; i >= 0; i--) {
      if (isNumericId(rowStr[i])) {
        prontuario = cleanProntuario(rowStr[i]);
        break;
      }
    }
    if (!prontuario) continue;

    // Calculate age
    let age: number | null = null;
    if (birthDate && !isNaN(birthDate.getTime())) {
      age = calculateAge(birthDate);
    }
    // Also check for explicit age column (right of date)
    if (age === null) {
      for (let i = dateIdx + 1; i < rowStr.length; i++) {
        const num = parseInt(rowStr[i]);
        if (!isNaN(num) && num >= 0 && num <= 120) {
          age = num;
          break;
        }
      }
    }

    patients.push({ prontuario, name, age, sector: currentSector });
  }

  return patients;
}
