
# Diagnóstico e Correção: Setor "Desconhecido"

## Causa Raiz Identificada

Há dois problemas combinados que resultam em "Desconhecido" para todos os pacientes:

### Problema 1 — `detectBlockSector` olha apenas colunas 0 e 1 (CRÍTICO)

A função atual é:
```typescript
const bedCell  = row[0]?.trim() ?? '';   // só coluna 0
const leitoCell = row[1]?.trim() ?? '';  // só coluna 1
```

No arquivo `R_CENSO18.xls`, o SheetJS pode retornar as linhas com colunas deslocadas — especialmente quando há células mescladas no cabeçalho do relatório. Se a coluna "Enfermaria" estiver em `row[2]` ou `row[3]` ao invés de `row[0]`, nenhum código de leito é encontrado e a função retorna `'Desconhecido'` para o bloco inteiro.

### Problema 2 — Regex de `extractBedPrefix` não captura o número do setor (SECUNDÁRIO)

O regex atual: `/^(?:[A-Z]-)?([A-Z]+\d*[A-Z]*)/`

Para `E-CM1L24`:
- `(?:[A-Z]-)?` → consome `E-` ✅
- `([A-Z]+\d*[A-Z]*)` → captura `CM1L` (letras + dígitos + letras) ✅ teoricamente

Porém `CM1L` não está no `SECTOR_MAP`, que tem chave `CM1`. O filtro `.filter(k => candidate.startsWith(k))` deveria funcionar pois `CM1L`.startsWith(`CM1`) = true — mas se a candidata for algo inesperado como `ECM1L24` (sem o traço), o regex captura `ECM1L` e nenhuma chave do mapa começa assim.

### Problema 3 — O loop de busca de prefixo examina poucas colunas

Mesmo que os índices estejam certos, linhas de cabeçalho e linhas vazias são incluídas no bloco antes de serem filtradas, poluindo a contagem de frequência.

---

## Solução

### Correção em `src/lib/cleanData.ts` — função `detectBlockSector`

Em vez de olhar apenas `row[0]` e `row[1]`, a função deve **varrer todas as colunas de cada linha** em busca de qualquer célula que corresponda ao padrão de código de leito (`E-CM*`, `E-UTI*`, etc.):

```typescript
export function detectBlockSector(blockRows: string[][]): string {
  const freq: Record<string, number> = {};

  for (const row of blockRows) {
    // Skip empty rows and column headers
    if (isEmptyRow(row) || isColumnHeader(row)) continue;

    // Scan ALL cells in the row, not just columns 0 and 1
    for (const cell of row) {
      const trimmed = cell.trim();
      if (!trimmed) continue;
      const prefix = extractBedPrefix(trimmed);
      if (prefix) {
        freq[prefix] = (freq[prefix] ?? 0) + 1;
      }
    }
  }

  if (Object.keys(freq).length === 0) return 'Desconhecido';

  const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  return resolveSectorName(dominant);
}
```

### Correção em `src/lib/cleanData.ts` — função `extractBedPrefix`

Tornar o regex mais robusto para capturar o padrão exato do arquivo:

```typescript
export function extractBedPrefix(bedCode: string): string | null {
  const clean = bedCode.trim().toUpperCase();

  // Skip colour/special names (purely alphabetical, no digits)
  const COLOR_NAMES = ['AMARELA', 'VERDE', 'AZUL', 'VERMELHA', 'LARANJA', 'ROXA'];
  if (COLOR_NAMES.includes(clean)) return null;

  // Pattern: optional leading letter(s) + dash, then the meaningful part
  // Handles: "E-CM1L24" → strip "E-" → "CM1L24" → prefix "CM1"
  //          "E-CM2ADC" → strip "E-" → "CM2ADC" → prefix "CM2"
  //          "UTI-01"   → strip nothing → prefix "UTI"
  const stripped = clean.replace(/^[A-Z]{1,2}-/, ''); // remove leading "E-" or "EN-"

  // Extract the leading letters+digits block (e.g., "CM1" from "CM1L24")
  const m = stripped.match(/^([A-Z]+\d+|[A-Z]+)/);
  if (!m) return null;

  const candidate = m[1]; // e.g., "CM1", "CM2", "UTI1", "UTI"

  // Find the longest matching key in SECTOR_MAP
  const matchedKey = Object.keys(SECTOR_MAP)
    .filter((k) => candidate.startsWith(k) || k.startsWith(candidate))
    .sort((a, b) => b.length - a.length)[0];

  return matchedKey ?? candidate;
}
```

---

## Arquivos a Modificar

### `src/lib/cleanData.ts`

Duas mudanças cirúrgicas:

1. **`extractBedPrefix`**: Substituir o regex por uma abordagem de dois passos:
   - Primeiro: remover prefixo líder tipo `E-`, `EN-`
   - Segundo: extrair bloco `letras+dígitos` do início
   - Resultado: `E-CM1L24` → strip `E-` → `CM1L24` → extrai `CM1` ✅

2. **`detectBlockSector`**: Varrer **todas as colunas** de cada linha (não só colunas 0 e 1), com filtragem de linhas vazias e headers antes da contagem.

Nenhum outro arquivo precisa ser alterado — a correção é toda dentro de `cleanData.ts`.

---

## Por que apenas `cleanData.ts` precisa mudar

- `parseOfficial.ts` já chama `detectBlockSector(block.rows)` corretamente
- O setor já é passado para `processBlock` e atribuído a cada paciente
- A cadeia de chamadas está certa — apenas a lógica de detecção do prefixo estava restrita demais
