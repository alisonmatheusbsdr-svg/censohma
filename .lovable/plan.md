

# Simplificar ManualPaste: fixar link + auto-sync por padrão

## Problema
O link da planilha e a aba são sempre os mesmos. O usuário não precisa digitar nada. O componente deve apenas ter um botão "Sincronizar" e mostrar o status, sem tabs, sem textarea, sem input de URL.

## Mudanças: `src/components/ManualPaste.tsx`

1. Fixar o link como constante: `const SHEET_ID = '1ZQctTfNpfxJ-KO0hJAdgEUQrLxg57J2JxJy7nH70M20'`
2. Remover estados `text`, `sheetUrl`, tabs (Colar/Google Sheets), textarea, input de URL
3. Simplificar a UI para:
   - Botão "Sincronizar" que faz fetch imediato
   - Toggle de auto-sync (60s)
   - Indicador de último sync
   - Contagem de linhas/colunas detectadas
   - Mapeamento de colunas (quando low confidence)
4. Fazer fetch automático no mount (`useEffect` inicial) para já carregar os dados ao abrir
5. Remover imports não usados (`Textarea`, `Input`, `Tabs`, `ClipboardPaste`)

O componente passa de "Lista Manual" para algo como "Censo Google Sheets" -- card simples com sync.

