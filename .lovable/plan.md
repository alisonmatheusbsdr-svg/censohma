

# Dupla Checagem para Retiradas (Altas)

## Problema

A comparação atual usa apenas o prontuário como chave. Se houver qualquer diferença na extração do prontuário entre as fontes (zeros à esquerda, espaços, parsing), um paciente que está no censo oficial é incorretamente classificado como "Retirar".

## Solução: Verificação por nome como segunda camada

Antes de classificar um paciente como "Retirar", o sistema faz uma segunda checagem por similaridade de nome contra a lista oficial. Se encontrar um nome muito parecido, o paciente é marcado como "incerto" em vez de alta confirmada.

## Mudanças

### 1. `src/lib/compareData.ts` - Lógica de dupla checagem

- Criar função `normalizeNameForMatch(name)` que remove acentos, converte para maiúsculo, remove espaços extras
- Após identificar os pacientes "não encontrados no oficial" por prontuário, fazer uma segunda passagem:
  - Para cada candidato a "retirar", buscar no censo oficial se existe algum paciente com nome idêntico (normalizado) ou muito similar (ex: contém o mesmo sobrenome principal)
  - Se encontrar match por nome: mover para uma nova categoria `uncertainDischarges` com referência ao paciente oficial encontrado (possível match)
  - Se não encontrar match por nome: manter como `discharge` confirmado
- Adicionar `uncertainDischarges` ao `ComparisonResult` com tipo `{ patient: Patient; possibleMatch: Patient }[]`

### 2. `src/lib/types.ts` - Novo tipo

- Adicionar `uncertainDischarges: { patient: Patient; possibleMatch: Patient }[]` ao `ComparisonResult`

### 3. `src/components/ResultCards.tsx` - UI para altas incertas

- Na aba "Retirar da Planilha", separar em duas seções:
  - **"Requer verificação"** (topo, com fundo amarelo): mostra altas incertas com o possível match encontrado no oficial, para o usuário confirmar se é o mesmo paciente
  - **"Altas confirmadas"** (abaixo): mostra apenas as altas onde não houve nenhum match por nome
- No censo consolidado: altas incertas recebem badge amarelo "Verificar" em vez do vermelho "Retirar"

### 4. `src/components/KPICards.tsx` - Atualizar contadores

- O KPI de "Retirar" mostra apenas as confirmadas
- Adicionar indicador visual se houver altas incertas pendentes de verificação

### 5. `src/lib/compareData.ts` - Excel export

- Na aba "Retirar da Planilha", altas incertas aparecem com destaque amarelo e coluna extra mostrando o possível match

## Lógica de matching por nome

```text
Manual: "LUIZ KERN" (pront: 12345) → não encontrado no oficial por prontuário
Oficial: "LUIZ KERN" (pront: 12346) → match por nome!
→ Resultado: alta INCERTA, não confirmada. Mostrar ao usuário para verificar.
```

A normalização do nome remove acentos, converte para maiúsculo e compara tokens (sobrenomes). Um match é considerado se o nome normalizado é idêntico OU se pelo menos 2 tokens coincidem (nome + sobrenome).

