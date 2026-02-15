export interface Patient {
  prontuario: string;
  name: string;
  age: number | null;
  sector: string;
}

export interface ComparisonResult {
  discharges: Patient[];
  admissions: Patient[];
  transfers: { patient: Patient; oldSector: string; newSector: string }[];
  alerts: DataAlert[];
}

export interface DataAlert {
  type: 'duplicate_id' | 'homonym' | 'age_mismatch';
  message: string;
  patients: Patient[];
}

export interface ColumnMapping {
  prontuario: number | null;
  name: number | null;
  age: number | null;
  sector: number | null;
}
