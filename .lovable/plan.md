

# Aba separada para pacientes de Alta no Excel

## O que sera feito

Adicionar uma segunda aba (sheet) no arquivo Excel exportado chamada **"Retirar da Planilha"**, contendo apenas os pacientes que receberam alta (presentes na lista manual mas ausentes no censo oficial).

## Estrutura do arquivo Excel

### Aba 1 — "Censo" (ja existe, sem alteracao)
Mantidos e Admissoes com a formatacao atual.

### Aba 2 — "Retirar da Planilha" (nova)
| Prontuario | Nome | Idade | Setor |

- Cabecalhos com fundo vermelho claro (`FFC7CE`) e fonte em negrito
- Linhas com fundo rosa claro (`FFF0F0`) para reforcar visualmente que sao pacientes a remover

## Arquivo a modificar

### `src/lib/compareData.ts` — funcao `generateConsolidatedExcel`

Apos criar a aba "Censo" (codigo existente), adicionar:

1. Montar os dados das altas a partir de `result.discharges`
2. Criar uma segunda worksheet com `XLSX.utils.aoa_to_sheet`
3. Aplicar estilos de cabecalho (vermelho) e linhas (rosa claro)
4. Aplicar largura automatica das colunas
5. Adicionar ao workbook com `XLSX.utils.book_append_sheet(wb, ws2, 'Retirar da Planilha')`

### Logica resumida

```text
// Dados da aba de altas
const dischargeHeaders = ['Prontuário', 'Nome', 'Idade', 'Setor'];
const dischargeRows = result.discharges.map(p => [
  p.prontuario, p.name, p.age ?? '', p.sector
]);

const ws2 = XLSX.utils.aoa_to_sheet([dischargeHeaders, ...dischargeRows]);

// Estilo cabecalho vermelho
dischargeHeaderStyle = {
  font: { bold: true, color: { rgb: "9C0006" } },
  fill: { patternType: "solid", fgColor: { rgb: "FFC7CE" } },
  alignment: { horizontal: "center" }
}

// Estilo linhas rosa claro
dischargeRowStyle = {
  fill: { patternType: "solid", fgColor: { rgb: "FFF0F0" } }
}

XLSX.utils.book_append_sheet(wb, ws2, 'Retirar da Planilha');
```

Nenhum outro arquivo muda. A aba "Censo" permanece identica.

