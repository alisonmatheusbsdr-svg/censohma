

# Reestruturacao da pagina principal

## Objetivo

Simplificar o layout removendo elementos redundantes e colocando os resultados da comparacao em destaque, logo apos a area de entrada de dados.

## O que muda

### `src/pages/Index.tsx`

**Remover:**
1. **Preview Tables** (linhas 111-117) — os dados ja aparecem no Censo Consolidado apos a comparacao, tornando o preview redundante
2. **CleaningReportPanel** visivel por padrao (linhas 106-109) — mover para dentro de um Collapsible discreto dentro do componente FileUpload, ou remover da pagina principal

**Reorganizar a ordem dos elementos:**

```text
1. Header (manter)
2. Area de entrada (FileUpload + ManualPaste) — manter lado a lado
3. Botoes (Comparar + Exportar) — mover para logo abaixo da entrada
4. KPI Cards — mover para depois dos botoes, so aparecer quando houver resultado
5. ResultCards (abas: Consolidado, Retirar, Admissoes, etc.) — destaque principal
```

**Detalhes:**
- KPI Cards so renderizam quando `result` existe (evita mostrar zeros sem contexto)
- Cleaning Report fica como um pequeno texto/link colapsavel abaixo do FileUpload (ex: "429 linhas processadas, 238 vazias removidas — ver detalhes"), sem ocupar espaco vertical
- Botao "Comparar Dados" fica centralizado logo apos os inputs
- ResultCards ocupa toda a largura e fica como elemento principal da pagina

### `src/components/CleaningReportPanel.tsx`

Transformar em um resumo compacto inline (uma linha com numeros-chave) com um Collapsible para ver detalhes, em vez de um painel grande separado.

### Componentes removidos da pagina:
- `PreviewTable` — nao sera mais renderizado na Index (o componente continua existindo no projeto)

## Layout final

```text
┌─────────────────────────────────────────────┐
│ Header: HMA Census Manager                 │
├─────────────────────────────────────────────┤
│ [FileUpload]          │ [ManualPaste]       │
│  ↳ "97 pac. • 238     │                     │
│    vazias removidas"  │                     │
├─────────────────────────────────────────────┤
│     [Comparar Dados]  [Exportar Censo]      │
├─────────────────────────────────────────────┤
│ KPI: Total 97 │ Altas 18 │ Adm 4 │ Transf 2│  ← so com resultado
├─────────────────────────────────────────────┤
│ Tabs: Consolidado | Retirar | Admissoes ... │
│ ┌─────────────────────────────────────────┐ │
│ │ Tabela principal do censo consolidado   │ │
│ │ (altura generosa, scroll interno)       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Arquivos modificados

1. `src/pages/Index.tsx` — reorganizar ordem, remover PreviewTable e CleaningReportPanel standalone
2. `src/components/FileUpload.tsx` — adicionar resumo compacto do cleaning report como prop opcional (contagem inline)
3. `src/components/CleaningReportPanel.tsx` — criar versao compacta (uma linha + collapsible)

