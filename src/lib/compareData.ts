import * as XLSX from 'xlsx';
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
  const consolidated = manual.filter(p => !dischargeIds.has(p.prontuario));

  const transferMap = new Map(result.transfers.map(t => [t.patient.prontuario, t.newSector]));
  consolidated.forEach(p => {
    const newSector = transferMap.get(p.prontuario);
    if (newSector) p.sector = newSector;
  });

  consolidated.push(...result.admissions);

  const data = consolidated.map(p => ({
    'Prontuário': p.prontuario,
    'Nome': p.name,
    'Idade': p.age ?? '',
    'Setor': p.sector,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Censo');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
