import * as XLSX from 'xlsx-js-style';
import type { AmbulatorioPatient } from './types';

export const exportAmbulatorioToExcel = (patients: AmbulatorioPatient[]) => {
  // Define header row - "Sexo", "Cidade", "UF" are empty spaces for manual filling
  const header = ['Prontuário', 'Nome do Paciente', 'Data de Nasc.', 'Idade', 'Sexo', 'Cidade', 'UF'];

  // Helper function: AMANDA KELLY PESSOA DA SILVA -> AMANDA.K.P.S.
  const anonymizeName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    
    // First name stays the same
    const firstName = parts[0];
    
    // The rest of the parts are initials (ignoring small connectors like DE, DA, DO, DOS, DAS)
    const connectors = new Set(['DE', 'DA', 'DO', 'DOS', 'DAS', 'E']);
    
    const initials = parts.slice(1)
      .filter(part => !connectors.has(part.toUpperCase()))
      .map(part => part[0].toUpperCase())
      .join('.');
      
    return `${firstName}.${initials}.`;
  };

  // Map patient data to rows (appending empty strings for the manual columns)
  const data = patients.map((p) => [
    p.prontuario,
    anonymizeName(p.name),
    p.dataNascimento,
    p.idade,
    p.sexo || '', // Sexo from UI or empty
    '', // Cidade
    '', // UF
  ]);

  // Combine header and data
  const exportData = [header, ...data];

  // Create a new workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(exportData);

  // Apply styling to Header (Row 1)
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "2563EB" } }, // Tailwind blue-600
    alignment: { horizontal: "center", vertical: "center" }
  };

  for (let c = 0; c < header.length; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: c });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = headerStyle;
  }

  // Set column widths based on content size
  ws['!cols'] = [
    { wch: 15 }, // Prontuario
    { wch: 45 }, // Name
    { wch: 15 }, // DOB
    { wch: 8 },  // Idade
    { wch: 8 },  // Sexo
    { wch: 25 }, // Cidade
    { wch: 6 },  // UF
  ];

  // Add Data Validation (Dropdown) for the "Sexo" column
  // In the header array, 'Sexo' is at index 4 (0-based) -> Column E
  const numRows = exportData.length;
  if (!ws['!dataValidation']) ws['!dataValidation'] = [];

  // xlsx-js-style and sheetjs require `formula1` string for list validation
  ws['!dataValidation'].push({
    sqref: `E2:E${numRows}`,
    type: "list",
    allowBlank: true,
    showDropDown: true,
    formula1: '"M,F"' // Note the specific quoting: outer string contains quoted comma-separated values
  });

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Ambulatório HMA");

  // Generate binary Excel file and trigger download
  XLSX.writeFile(wb, generateFileName());
};

const generateFileName = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    return `Ambulatorio_HMA_${dd}-${mo}-${yy}_${hh}-${mm}.xlsx`;
};
