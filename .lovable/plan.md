

# Correção: Normalização de Nomes de Setor (Roman vs. Arábico)

## Problema

A planilha manual usa "Clínica Médica 1" (número arábico) e o censo oficial retorna "Clínica Médica I" (número romano, vindo do `SECTOR_MAP`). Na comparação de setores em `compareData.ts`, o `.toLowerCase()` não resolve essa diferença, gerando falsas transferências.

## Solução

Criar uma função `normalizeSectorName` em `src/lib/cleanData.ts` e usá-la em `src/lib/compareData.ts` na comparação de setores.

---

## Arquivos a modificar

### 1. `src/lib/cleanData.ts` — adicionar função de normalização

Nova função exportada no final do arquivo:

```typescript
export function normalizeSectorForComparison(name: string): string {
  let n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // remove acentos
    .replace(/[_\s]+/g, " ")
    .trim();

  // Converter algarismos romanos finais para arábicos
  const romanMap: Record<string, string> = {
    'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5',
    'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10',
  };

  const parts = n.split(' ');
  const last = parts[parts.length - 1];
  if (romanMap[last]) {
    parts[parts.length - 1] = romanMap[last];
    n = parts.join(' ');
  }

  return n;
}
```

Exemplos de resultado:
- `"Clínica Médica I"` --> `"clinica medica 1"`
- `"Clínica Médica 1"` --> `"clinica medica 1"`
- `"Clínica Médica II"` --> `"clinica medica 2"`
- `"Cínica Médica 2"` --> `"cinica medica 2"` (typo do usuário preservado, mas o numeral bate)

### 2. `src/lib/compareData.ts` — usar normalização na comparação de setores

Linha 20 atual:
```typescript
if (manPatient && manPatient.sector.toLowerCase() !== offPatient.sector.toLowerCase()) {
```

Substituir por:
```typescript
if (manPatient && normalizeSectorForComparison(manPatient.sector) !== normalizeSectorForComparison(offPatient.sector)) {
```

Adicionar o import no topo do arquivo.

---

## O que NAO muda

- `parseOfficial.ts` — continua gerando "Clínica Médica I" (romano) normalmente
- `parseManual.ts` — continua lendo o setor como o usuário digitou
- `ResultCards.tsx` — exibe os nomes originais (não normalizados) para o usuário
- A normalização é aplicada **somente na comparação**, preservando os nomes legíveis na interface

