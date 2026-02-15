
# HMA Census Manager — Intelligent Reconciliation

A clean, clinical-style web app for hospital census auditing. Upload the official SoulMV file and paste the manual spreadsheet to instantly identify patient movements and data discrepancies.

---

## 1. Home / Dashboard Page
- **KPI Cards** at the top: Total Census, Occupancy %, Discharges count, Admissions count (populated after comparison)
- **Split Input Area**: Left side for Official File upload (.xls/.csv), Right side for Manual List paste (textarea)
- **"Compare" button** to trigger the reconciliation

## 2. Smart File Parser (Official XLS/CSV)
- Uses `xlsx` (SheetJS) to read the uploaded file
- **Anchor Logic**: Finds dates (dd/mm/yyyy), then extracts Name (left of date), Prontuário/ID (left of name, strips leading zeros), Age (from birth date or explicit column), and Sector (from "Unidade de Internação:" headers)
- Handles sparse data, empty rows/columns gracefully
- Shows a preview table of parsed patients before comparison

## 3. Smart Paste Parser (Manual Textarea)
- Uses `papaparse` for text handling
- **Heuristic column detection**: Prontuário (large integer >1000), Age (0–120), Name (long uppercase text), Sector (keywords like "Clínica", "UTI", "Enfermaria")
- **Fallback column mapping**: If the parser is unsure, shows a UI for the user to manually assign columns (e.g., "Column A = ID, Column C = Age")
- Shows a preview table of parsed patients

## 4. Comparison Results — 4 Action Cards
After clicking "Compare", results display in color-coded cards:

- 🔴 **SAÍDAS / ALTAS (Discharges)**: Patients in Manual List but NOT in Official file — shows Name (Age), Prontuário, Old Sector
- 🟢 **ADMISSÕES (Admissions)**: Patients in Official file but NOT in Manual List — shows Name (Age), Prontuário, New Sector
- 🔄 **TRANSFERÊNCIAS (Transfers)**: Patients in both but with different Sectors — shows Name (Age), "From [Old] ➔ To [New]"
- ⚠️ **ALERTA DE DADOS (Data Integrity)**: Duplicate IDs, Homonyms (same name, different ID — shows Age to distinguish), Age mismatches (>1 year difference)

## 5. Smart Age Display
- Age is always shown next to the patient name in format: `MARIA SILVA (65a)` across all cards and tables

## 6. Export
- **"Download Consolidated Census"** button: Generates a CSV merging the Manual List + new Admissions − Discharges
- File named `Consolidated_Census.csv`

## 7. Design & UX
- Clean clinical style: white background, soft blue accents, professional typography
- Responsive layout optimized for desktop (primary use case)
- Portuguese (Brazil) labels throughout the interface
- Clear visual hierarchy with the 4 colored result cards
