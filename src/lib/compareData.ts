import * as XLSX from 'xlsx-js-style';
import type { Patient, ComparisonResult, DataAlert } from './types';
import { normalizeSectorForComparison } from './cleanData';

export function comparePatients(manual: Patient[], official: Patient[]): ComparisonResult {
  const manualMap = new Map<string, Patient>();
  const officialMap = new Map<string, Patient>();

  manual.forEach(p => manualMap.set(p.prontuario, p));
  official.forEach(p => officialMap.set(p.prontuario, p));

  // Discharges: in manual but NOT in official
  const discharges = manual.filter(p => !officialMap.has(p.prontuario));

  // Admissions: in official but NOT in manual
  const admissions = official.filter(p => !manualMap.has(p.prontuario));

  // Transfers: in both but different sector
  const transfers: ComparisonResult['transfers'] = [];
  for (const [id, offPatient] of officialMap) {
    const manPatient = manualMap.get(id);
    if (manPatient && normalizeSectorForComparison(manPatient.sector) !== normalizeSectorForComparison(offPatient.sector)) {
      transfers.push({
        patient: offPatient,
        oldSector: manPatient.sector,
        newSector: offPatient.sector,
      });
    }
  }

  // Alerts
  const alerts: DataAlert[] = [];

  // Duplicate IDs
  const checkDupes = (list: Patient[], label: string) => {
    const seen = new Map<string, Patient[]>();
    list.forEach(p => {
      const arr = seen.get(p.prontuario) || [];
      arr.push(p);
      seen.set(p.prontuario, arr);
    });
    for (const [id, patients] of seen) {
      if (patients.length > 1) {
        alerts.push({
          type: 'duplicate_id',
          message: `Prontuário ${id} duplicado na lista ${label} (${patients.length}x)`,
          patients,
        });
      }
    }
  };
  checkDupes(manual, 'Manual');
  checkDupes(official, 'Oficial');

  // Homonyms: same name, different ID
  const allPatients = [...manual, ...official];
  const nameGroups = new Map<string, Patient[]>();
  allPatients.forEach(p => {
    const key = p.name.toUpperCase().trim();
    const arr = nameGroups.get(key) || [];
    arr.push(p);
    nameGroups.set(key, arr);
  });
  for (const [, patients] of nameGroups) {
    const uniqueIds = new Set(patients.map(p => p.prontuario));
    if (uniqueIds.size > 1) {
      alerts.push({
        type: 'homonym',
        message: `Homônimo: "${patients[0].name}" com prontuários diferentes`,
        patients: patients.filter((p, i, arr) => arr.findIndex(x => x.prontuario === p.prontuario) === i),
      });
    }
  }

  // Age mismatch
  for (const [id, offPatient] of officialMap) {
    const manPatient = manualMap.get(id);
    if (manPatient && offPatient.age !== null && manPatient.age !== null) {
      if (Math.abs(offPatient.age - manPatient.age) > 1) {
        alerts.push({
          type: 'age_mismatch',
          message: `Idade divergente para ${offPatient.name}: Manual ${manPatient.age}a vs Oficial ${offPatient.age}a`,
          patients: [manPatient, offPatient],
        });
      }
    }
  }

  return { discharges, admissions, transfers, alerts };
}

export function generateConsolidatedExcel(manual: Patient[], result: ComparisonResult): ArrayBuffer {
  const dischargeIds = new Set(result.discharges.map(p => p.prontuario));
  const admissionIds = new Set(result.admissions.map(p => p.prontuario));
  const oldSectorMap = new Map(result.transfers.map(t => [t.patient.prontuario, t.oldSector]));

  const consolidated = manual.filter(p => !dischargeIds.has(p.prontuario));

  const transferMap = new Map(result.transfers.map(t => [t.patient.prontuario, t.newSector]));
  consolidated.forEach(p => {
    const newSector = transferMap.get(p.prontuario);
    if (newSector) p.sector = newSector;
  });

  consolidated.push(...result.admissions);

  const headers = ['Status', 'Prontuário', 'Nome', 'Idade', ' ', 'Setor', 'Mudança de Setor'];

  const rows = consolidated.map(p => [
    admissionIds.has(p.prontuario) ? 'Admissão' : 'Mantido',
    p.prontuario,
    p.name,
    p.age ?? '',
    '',
    p.sector,
    oldSectorMap.has(p.prontuario)
      ? `${oldSectorMap.get(p.prontuario)} → ${p.sector}`
      : '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const headerStyle = {
    font: { bold: true, color: { rgb: '000000' } },
    fill: { patternType: 'solid' as const, fgColor: { rgb: 'FFC000' } },
    alignment: { horizontal: 'center' as const },
  };

  const admissionStyle = {
    fill: { patternType: 'solid' as const, fgColor: { rgb: 'FFE0B2' } },
  };

  const transferCellStyle = {
    fill: { patternType: 'solid' as const, fgColor: { rgb: 'C6EFCE' } },
  };

  const colCount = headers.length;
  const rowCount = rows.length + 1; // +1 for header

  // Apply header styles (row 0)
  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) ws[addr].s = headerStyle;
  }

  // Apply row styles
  for (let r = 1; r < rowCount; r++) {
    const isAdmission = rows[r - 1][0] === 'Admissão';
    const hasTransfer = String(rows[r - 1][6]).length > 0;

    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;

      if (c === 6 && hasTransfer) {
        ws[addr].s = transferCellStyle;
      } else if (isAdmission) {
        ws[addr].s = admissionStyle;
      }
    }
  }

  // Auto column widths
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map(row => String(row[i]).length),
    );
    return { wch: maxLen + 2 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Censo');

  // ── Aba 2: Retirar da Planilha (altas) ─────────────────────────────────
  if (result.discharges.length > 0) {
    const dischargeHeaders = ['Prontuário', 'Nome', 'Idade', 'Setor'];
    const dischargeRows = result.discharges.map(p => [
      p.prontuario, p.name, p.age ?? '', p.sector,
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet([dischargeHeaders, ...dischargeRows]);

    const dischargeHeaderStyle = {
      font: { bold: true, color: { rgb: '9C0006' } },
      fill: { patternType: 'solid' as const, fgColor: { rgb: 'FFC7CE' } },
      alignment: { horizontal: 'center' as const },
    };

    const dischargeRowStyle = {
      fill: { patternType: 'solid' as const, fgColor: { rgb: 'FFF0F0' } },
    };

    const dColCount = dischargeHeaders.length;
    const dRowCount = dischargeRows.length + 1;

    for (let c = 0; c < dColCount; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws2[addr]) ws2[addr].s = dischargeHeaderStyle;
    }

    for (let r = 1; r < dRowCount; r++) {
      for (let c = 0; c < dColCount; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (ws2[addr]) ws2[addr].s = dischargeRowStyle;
      }
    }

    ws2['!cols'] = dischargeHeaders.map((h, i) => {
      const maxLen = Math.max(h.length, ...dischargeRows.map(row => String(row[i]).length));
      return { wch: maxLen + 2 };
    });

    XLSX.utils.book_append_sheet(wb, ws2, 'Retirar da Planilha');
  }

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
