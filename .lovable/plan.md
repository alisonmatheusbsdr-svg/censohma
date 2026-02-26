

# Fix: Fixar aba "Confere Censo - CM" e corrigir importação

## Problema
O campo "Nome da Aba" ainda existe e é obrigatório. Se estiver vazio, a importação falha silenciosamente. A aba é sempre "Confere Censo - CM", então deve ser fixada.

## Mudanças: `src/components/ManualPaste.tsx`

1. Remover o estado `sheetName` e seu `useState`
2. Usar constante `const SHEET_NAME = 'Confere Censo - CM'` no lugar de `sheetName.trim()`
3. Remover a validação `if (!sheetName.trim())` no `handleImportSheet`
4. Remover `sheetName` do array de dependências do `useCallback`
5. Remover o bloco de UI do input "Nome da Aba" (Label + Input, ~6 linhas)

