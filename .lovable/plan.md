

# Data e hora no nome dos arquivos exportados

## O que sera feito

Adicionar data e hora no formato `HH-MM DD-MM-AA` ao nome dos arquivos Excel exportados. O caractere `:` e `/` nao sao permitidos em nomes de arquivo, entao serao substituidos por `-`.

Formato final: `Censo_Consolidado 14-30 23-02-26.xlsx`

## Arquivo a modificar

### `src/pages/Index.tsx` — funcao `handleExport`

Gerar uma string com data/hora atual usando `new Date()` e concatenar ao nome do arquivo:

```text
const now = new Date();
const hh = String(now.getHours()).padStart(2, '0');
const mm = String(now.getMinutes()).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const mo = String(now.getMonth() + 1).padStart(2, '0');
const yy = String(now.getFullYear()).slice(-2);

a.download = `Censo_Consolidado ${hh}-${mm} ${dd}-${mo}-${yy}.xlsx`;
```

Nenhum outro arquivo muda.

