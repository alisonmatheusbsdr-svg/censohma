

# KPI Cards como Seletores de Aba

## Objetivo
Clicar num KPI card seleciona a aba correspondente na parte inferior. Sem filtragem — apenas navegação entre abas.

## Mudanças

### 1. `src/components/KPICards.tsx`
- Atualizar `filterKey` para corresponder aos valores das abas:
  - Censo Total → `'consolidado'`
  - Altas → `'retirar'`
  - Admissões → `'admissoes'`
  - Transferências → `'setor'`
  - Na Vermelha → `'vermelha'`
  - Alertas → `'alertas'`

### 2. `src/components/ResultCards.tsx`
- Tornar `Tabs` controlado: usar `activeFilter` como `value` e expor `onValueChange`
- Remover toda a lógica de `filteredList` — a tabela consolidada volta a mostrar todos os pacientes sempre
- Remover indicador "(filtrado)"
- Aceitar nova prop `onTabChange` para sincronizar quando o usuário clica diretamente numa aba

### 3. `src/pages/Index.tsx`
- Inicializar `activeFilter` como `'consolidado'` em vez de `null`
- Passar `onTabChange={setActiveFilter}` para `ResultCards`
- Atualizar props de `KPICards`: card ativo quando `activeFilter` bate com o `filterKey`

