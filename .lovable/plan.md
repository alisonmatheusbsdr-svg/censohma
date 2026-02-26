

# Nova aba "Vermelha" - Pacientes aguardando retorno

## Contexto
Pacientes com setor "Vermelha" na planilha manual não devem ser classificados como "Retirar" quando ausentes do censo oficial. Eles estão temporariamente na emergência e podem retornar à clínica médica. Precisam de uma aba dedicada com sinalização própria.

## Mudanças

### 1. `src/lib/types.ts`
- Adicionar campo `vermelha: Patient[]` ao `ComparisonResult`

### 2. `src/lib/compareData.ts`
- Na função `comparePatients`: antes de montar `discharges`, separar pacientes cujo setor na planilha manual é "Vermelha" (case-insensitive, incluindo variações como "vermelho", "verm"). Esses pacientes que não aparecem no censo oficial vão para `vermelha` em vez de `discharges`
- Na função `generateConsolidatedExcel`: pacientes da Vermelha permanecem no censo consolidado (não são removidos como as altas). Adicionar uma 3a aba "Vermelha" no Excel exportado com estilo próprio (cabeçalho laranja/vermelho)

### 3. `src/components/ResultCards.tsx`
- Adicionar nova aba "Vermelha" com ícone (ex: `Flame` ou `HeartPulse`) e badge contador
- Conteúdo da aba: lista dos pacientes com setor de origem (CM I / CM II, extraído da planilha), indicando que estão aguardando retorno
- No censo consolidado: pacientes da Vermelha recebem status `'vermelha'` com badge laranja-avermelhado "Na Vermelha" (sem tachado, sem sugestão de remoção)
- Remover esses pacientes da contagem/listagem da aba "Retirar da Planilha"

### 4. `src/components/KPICards.tsx`
- Adicionar KPI card para "Na Vermelha" com contagem

### 5. `src/pages/Index.tsx`
- Passar `result.vermelha.length` para o KPICards

## Lógica de identificação
Paciente é considerado "na Vermelha" se:
- `sector` na planilha manual contém "vermelha" ou "vermelho" (normalizado, case-insensitive)
- E não aparece no censo oficial (seria classificado como alta, mas na verdade está na emergência)

