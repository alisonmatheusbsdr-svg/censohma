

# Integracao Google Sheets no ManualPaste

## Arquivo: `src/components/ManualPaste.tsx`

Adicionar um toggle (Tabs) no topo do card com dois modos: **Colar** e **Google Sheets**.

No modo Google Sheets:
- Input de URL pre-preenchido com valor default vazio
- Input de nome da aba (default vazio)
- Botao "Importar" com loading state
- Logica de fetch:
  - Extrair sheet ID via regex: `url.match(/\/d\/([a-zA-Z0-9-_]+)/)`
  - Fetch CSV: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  - Passar resultado pelo `parseManualText` + `detectColumns` + `onParsed` existentes
- Mostrar erro se fetch falhar (planilha nao publica ou link invalido)
- Apos importar com sucesso, mostrar contagem de linhas/colunas como no modo colar

O modo Colar permanece identico ao atual. O mapeamento incerto e a contagem de linhas sao compartilhados entre os dois modos.

Nenhum outro arquivo muda. Nenhuma dependencia nova.

