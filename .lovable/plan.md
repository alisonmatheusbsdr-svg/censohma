

# KPI Cards como Filtros

## Objetivo
Tornar os KPI cards clicáveis para que filtrem a tabela do censo consolidado, mostrando apenas os pacientes da categoria selecionada. Clicar novamente no mesmo card remove o filtro.

## Mudanças

### 1. `src/pages/Index.tsx` — Estado de filtro
- Adicionar estado `activeFilter: string | null` (valores: `'altas'`, `'admissoes'`, `'transferencias'`, `'vermelha'`, ou `null` para sem filtro)
- Passar `activeFilter` e `setActiveFilter` para `KPICards` e `ResultCards`

### 2. `src/components/KPICards.tsx` — Cards clicáveis
- Receber `activeFilter` e `onFilterChange` como props
- Tornar cada card clicável com `cursor-pointer` e efeito hover
- Card ativo recebe borda/destaque visual (ex: `ring-2 ring-primary`)
- Clicar no card ativo desativa o filtro (toggle)
- Card "Censo Total" limpa qualquer filtro ativo

### 3. `src/components/ResultCards.tsx` — Filtragem da tabela
- Receber `activeFilter` como prop
- Quando filtro ativo, filtrar `consolidatedList` para mostrar apenas pacientes do status correspondente
- Manter as abas funcionando normalmente; o filtro age sobre a aba "Censo Consolidado"

## Mapeamento filtro → status
| Card | Filtra status |
|------|--------------|
| Censo Total | `null` (sem filtro) |
| Altas | `'retirar'` + `'verificar'` |
| Admissões | `'admissao'` |
| Transferências | pacientes com transferência |
| Na Vermelha | `'vermelha'` |

