

# Fix: Auto-detect delimiter e headers para Google Sheets CSV

## Problema
O Google Sheets exporta CSV com vírgulas e aspas. O `parseManualText` força delimitador `\t`, resultando em 1 coluna.

A planilha tem headers claros: **Prontuário**, **NOME**, **IDADE**, **SETOR**.

## Mudanças

### 1. `src/lib/parseManual.ts`

- **`parseManualText`**: Remover `delimiter: '\t'` do PapaParse para auto-detectar (vírgula, tab, etc.)
- **`detectColumns`**: Adicionar detecção por header na primeira linha antes da heurística por conteúdo:
  - Normalizar headers (lowercase, remover acentos)
  - Mapear: "prontuario"→prontuario, "nome"/"paciente"→name, "idade"→age, "setor"/"unidade"→sector
  - Se headers detectados, retornar `confidence: 1.0` e flag `hasHeader: true`
- Alterar retorno de `detectColumns` para incluir `hasHeader: boolean`

### 2. `src/components/ManualPaste.tsx`

- Ao chamar `processRows`, se `hasHeader` for true, remover primeira linha antes de passar para `onParsed`

