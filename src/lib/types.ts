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

export interface Patient {
  prontuario: string;
  name: string;
  age: number | null;
  sector: string;
}

export interface ComparisonResult {
  discharges: Patient[];
  uncertainDischarges: { patient: Patient; possibleMatch: Patient }[];
  admissions: Patient[];
  transfers: { patient: Patient; oldSector: string; newSector: string }[];
  vermelha: Patient[];
  alerts: DataAlert[];
}

export interface AmbulatorioPatient {
  prontuario: string;
  name: string;
  dataNascimento: string;
  idade: number;
  sexo?: 'M' | 'F' | string;
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
