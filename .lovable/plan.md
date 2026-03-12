

# Pacientes da Clínica Cirúrgica como Dupla Checagem + Alerta

## Problema
Pacientes que estão no setor "Clínica Cirúrgica" na lista manual mas não aparecem no censo oficial são classificados como alta — quando na verdade podem estar internados pela clínica médica ocupando leitos cirúrgicos.

## Solução
Tratar pacientes do setor "Clínica Cirúrgica" de forma análoga aos da "Vermelha": separá-los dos candidatos a alta, classificá-los como **dupla checagem** (uncertainDischarges) e gerar um **alerta de dados** específico.

## Mudanças

### `src/lib/compareData.ts`
1. Adicionar detector `isCirurgica(sector)` com regex para identificar variações de "Clínica Cirúrgica" / "Cir" / "Cirurgica"
2. Na linha onde `candidateDischarges` é filtrado (linha 35), também excluir pacientes cirúrgicos
3. Pacientes cirúrgicos não encontrados no oficial entram em `uncertainDischarges` com `possibleMatch` como o próprio paciente (ou sem match), sinalizando necessidade de verificação manual
4. Gerar um alerta do tipo novo `'surgical_sector'` para cada paciente cirúrgico não encontrado, com mensagem tipo: `"Paciente [nome] está na Clínica Cirúrgica e não consta no censo oficial — verificar se pertence à Clínica Médica"`

### `src/lib/types.ts`
- Adicionar `'surgical_sector'` ao union type de `DataAlert.type`

### Visualização (sem mudanças)
Os pacientes já aparecerão automaticamente na aba "Verificar" (uncertainDischarges) e na aba "Alertas" por usarem as estruturas existentes.

