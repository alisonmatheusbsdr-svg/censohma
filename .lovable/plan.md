

# Ajustar visual "Vermelha" no Censo Consolidado

## Mudanças em `src/components/ResultCards.tsx`

1. **Badge**: trocar texto de "Na Vermelha" para "Vermelha", com estilo vermelho (borda vermelha, fundo vermelho claro ou sólido, texto vermelho/branco)
2. **Linha**: remover o `bg-orange-100 dark:bg-orange-950/30` do `rowClass` para pacientes com status `vermelha` — linha fica sem cor de fundo (igual a "Mantido")
3. Manter o texto sem tachado (já está assim)

