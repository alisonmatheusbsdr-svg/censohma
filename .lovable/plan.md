

# Formatacao Visual do Excel Exportado

## O que sera feito

Substituir o pacote `xlsx` pelo `xlsx-js-style` (fork compativel com mesma API, mesma versao 0.18.5) para adicionar estilos as celulas do Excel exportado.

## Estilos baseados na imagem de referencia

### Cabecalhos (linha 1)
- Fundo amarelo dourado (`FFC000`)
- Fonte em negrito
- Alinhamento centralizado

### Linhas de "Mantido"
- Fundo branco (sem preenchimento especial)

### Linhas de "Admissao"
- Fundo laranja claro (`FFF2CC` ou `FFE0B2`) para toda a linha
- Texto "ADM" na coluna Status (ou "Admissao", como ja esta)

### Coluna "Mudanca de Setor"
- Quando preenchida, destaque com fundo verde claro (`C6EFCE`) para indicar transferencia

### Largura automatica das colunas
- Calcular a largura maxima do conteudo de cada coluna e aplicar via `ws['!cols']`

---

## Dependencia

### Substituir `xlsx` por `xlsx-js-style`

- Remover `xlsx` do `package.json`
- Adicionar `xlsx-js-style`
- A API e identica (`import * as XLSX from 'xlsx-js-style'`), entao todos os imports existentes (`parseOfficial.ts`, `CleaningReportPanel.tsx`) precisam atualizar o import de `'xlsx'` para `'xlsx-js-style'`

## Arquivos a modificar

### 1. `package.json`
- Trocar `"xlsx": "^0.18.5"` por `"xlsx-js-style": "^1.2.0"`

### 2. `src/lib/compareData.ts`
- Alterar import para `import * as XLSX from 'xlsx-js-style'`
- Apos criar a worksheet, iterar pelas celulas para aplicar estilos:
  - Linha 0 (cabecalho): fundo amarelo + negrito
  - Linhas de admissao: fundo laranja
  - Celulas com mudanca de setor: fundo verde claro
- Calcular e aplicar `ws['!cols']` com larguras automaticas baseadas no conteudo

### 3. `src/lib/parseOfficial.ts`
- Alterar import de `'xlsx'` para `'xlsx-js-style'`

### 4. `src/components/CleaningReportPanel.tsx`
- Alterar import de `'xlsx'` para `'xlsx-js-style'`

---

## Detalhes tecnicos da estilizacao

```text
// Estilo do cabecalho
headerStyle = {
  font: { bold: true, color: { rgb: "000000" } },
  fill: { patternType: "solid", fgColor: { rgb: "FFC000" } },
  alignment: { horizontal: "center" }
}

// Estilo da linha de admissao
admissionStyle = {
  fill: { patternType: "solid", fgColor: { rgb: "FFE0B2" } }
}

// Estilo da celula de mudanca de setor
transferStyle = {
  fill: { patternType: "solid", fgColor: { rgb: "C6EFCE" } }
}

// Largura automatica
ws['!cols'] = headers.map((_, colIdx) => {
  const maxLen = Math.max(
    headerLen,
    ...dataRows.map(row => String(row[colIdx]).length)
  );
  return { wch: maxLen + 2 };
});
```

A logica de comparacao, limpeza e interface nao muda -- apenas o formato visual do arquivo exportado.

