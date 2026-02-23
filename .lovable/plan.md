
# Exportação em Excel (.xlsx) em vez de CSV

## O que muda

Dois pontos de download existentes serão convertidos de CSV para Excel (.xlsx):

1. **"Exportar Censo Consolidado"** (botao em `Index.tsx`) -- usa `generateConsolidatedCSV` de `compareData.ts`
2. **"Baixar Dados Limpos"** (botao no `CleaningReportPanel.tsx`) -- usa `downloadCleanCSV` local

O pacote `xlsx` (SheetJS) ja esta instalado no projeto, entao nao precisa de nova dependencia.

---

## Arquivos a modificar

### 1. `src/lib/compareData.ts`

Renomear `generateConsolidatedCSV` para `generateConsolidatedExcel` e alterar o retorno de `string` (CSV) para `ArrayBuffer` (Excel):

- Montar o array de dados consolidados (mesma logica atual: remover altas, atualizar setores, adicionar admissoes)
- Usar `XLSX.utils.json_to_sheet` para criar a planilha
- Usar `XLSX.write` com `bookType: 'xlsx'` para gerar o buffer
- Retornar o `ArrayBuffer`

### 2. `src/pages/Index.tsx`

Atualizar `handleExport`:

- Importar a funcao renomeada `generateConsolidatedExcel`
- Criar o `Blob` com tipo `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Nome do arquivo: `Censo_Consolidado.xlsx`

### 3. `src/components/CleaningReportPanel.tsx`

Converter `downloadCleanCSV` para `downloadCleanExcel`:

- Importar `XLSX` (ja disponivel)
- Montar array de objetos `{Prontuario, Nome, Idade, Setor}`
- Usar `XLSX.utils.json_to_sheet` + `XLSX.utils.book_new` + `XLSX.write`
- Gerar Blob com tipo Excel e baixar como `Dados_Limpos_Oficial.xlsx`

---

## Detalhes tecnicos

Padrao de geracao do arquivo Excel (aplicado nos dois pontos):

```typescript
import * as XLSX from 'xlsx';

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Dados');
const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
const blob = new Blob([buf], {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});
```

Nenhuma logica de comparacao ou limpeza muda -- apenas o formato de saida.
