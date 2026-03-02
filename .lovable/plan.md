

# Adicionar KPI Card de "Alertas de Dados"

## Mudanças

### 1. `src/components/KPICards.tsx`
- Adicionar prop `alerts: number` (quantidade de alertas)
- Adicionar novo card "Alertas" com ícone `AlertTriangle`, cor `text-amber-600`, e `filterKey: 'alertas'`

### 2. `src/pages/Index.tsx`
- Passar `alerts={result.alerts.length}` para `KPICards`

### 3. `src/components/ResultCards.tsx`
- Quando `activeFilter === 'alertas'`, selecionar a aba correspondente (se a lógica de KPI→aba for implementada futuramente, já fica mapeado)

## Mapeamento
| Card | filterKey |
|------|-----------|
| Alertas | `'alertas'` |

O card segue o mesmo padrão visual e de interação dos demais (clicável, toggle, ring quando ativo).

