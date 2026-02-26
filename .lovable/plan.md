

# Auto-sync Google Sheets

## Abordagem

Adicionar um toggle de "Sync automático" na aba Google Sheets. Quando ativado, refaz o fetch a cada 60 segundos usando `setInterval`. Mostra indicador de último sync.

## Mudanças: `src/components/ManualPaste.tsx`

1. Adicionar estado `autoSync` (boolean, default false) e `lastSync` (Date | null)
2. Adicionar um `Switch` com label "Sync automático" abaixo do botão Importar
3. `useEffect` que, quando `autoSync` é true e `sheetUrl` é válido, cria um `setInterval` de 60s chamando `handleImportSheet` silenciosamente (sem alterar `loading` visual, apenas um indicador sutil)
4. Mostrar texto "Último sync: HH:MM:SS" quando `lastSync` existe
5. Atualizar `lastSync` após cada fetch bem-sucedido (manual ou automático)
6. Limpar o interval no cleanup do `useEffect`

Nenhum outro arquivo muda. Nenhuma dependência nova (Switch já existe em `@/components/ui/switch`).

