

# Alerta de verificacao de pacientes cirurgicos

## O que sera feito

Adicionar um banner de alerta entre os KPI Cards e os ResultCards, visivel apenas apos a comparacao. O alerta orienta o usuario a verificar se todos os pacientes do censo consolidado estao realmente sendo avaliados pela clinica medica, ja que pacientes de clinicas cirurgicas podem estar fisicamente no mesmo setor.

## Arquivo a modificar

### `src/pages/Index.tsx`

Adicionar um componente `Alert` (shadcn) entre os KPIs e o `ResultCards`, renderizado condicionalmente quando `result` existe:

- Icone: `AlertTriangle` (lucide)
- Titulo: "Verifique os pacientes cirurgicos"
- Descricao: "Alguns pacientes de clinicas cirurgicas podem estar ocupando leitos na sala da clinica medica. Confirme se todos os pacientes listados no censo consolidado estao realmente sob avaliacao da clinica medica."
- Estilo: variante default do Alert com borda amarela/warning para chamar atencao sem ser agressivo

Nenhum outro arquivo muda. O componente `Alert` ja existe em `src/components/ui/alert.tsx`.

