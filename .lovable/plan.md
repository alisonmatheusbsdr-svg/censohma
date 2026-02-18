
# Plano Final: Limpeza Inteligente de Dados + Detecção de Setor por Bloco

## Resumo do que muda

A funcionalidade atual tem um parser simples que não lida com a complexidade real do arquivo SoulMV. Vamos reescrever o parser do arquivo oficial com um pipeline de limpeza de 3 camadas e adicionar um painel de diagnóstico visual.

---

## Confirmações da análise do arquivo real (R_CENSO18.xls + imagem)

**Estrutura de colunas confirmada (da esquerda para a direita):**

```text
Enfermaria | Leito | S | Atend | Paciente | Nome | Data_Nasc | Convênio | ...
```

- **Atend** (ex: 4122448) → número do episódio, IGNORAR
- **Paciente** (ex: 1047948) → prontuário real, USAR ESTE
- **Data** (ex: 28/07/1963) → data de nascimento → calcular idade por `hoje - nascimento`
- **Nome** aparece ENTRE Paciente e Data de Nascimento
- Nomes longos (ex: "ADEILDO DA SILVA PEREEIRA") são partidos em 2 linhas com o mesmo Atend + Paciente

**Estrutura de blocos confirmada:**
- Cada bloco começa com `Unidade de Internação :`
- Cada bloco termina com `Total de Leitos: XX`
- O setor real é determinado pelo prefixo predominante dos leitos no bloco (CM1 → Clínica Médica I)
- A partir de `Resumo Estatístico`, tudo é ignorado

---

## Arquivos a criar / modificar

### 1. NOVO — `src/lib/cleanData.ts`

Funções puras e tipos para o pipeline de limpeza:

**Tipos exportados:**
```typescript
interface CleaningIssue {
  type: 'empty_row' | 'header_row' | 'footer_row' | 'vacant_bed' |
        'name_merged' | 'summary_section' | 'continuation_row';
  count: number;
  examples: string[];
}

export interface CleaningReport {
  originalRowCount: number;
  validRowCount: number;
  patientCount: number;
  issues: CleaningIssue[];
  sectorsFound: { name: string; count: number }[];
}
```

**Funções de detecção de linha:**
- `isEmptyRow(row)` → todas as células são `''` ou só espaços
- `isColumnHeader(row)` → linha contém `"Enfermaria"` E `"Leito"` E `"Atend"`
- `isFooterRow(row)` → linha contém `"Total de Leitos"` (marca fim de bloco)
- `isSummarySection(row)` → linha contém `"Resumo Estatístico"` (tudo após isso é ignorado)
- `isVacantBed(row)` → status da célula é `"V"` (vago)
- `isContinuationRow(currentRow, prevRow)` → mesmo Atend + Paciente que a linha anterior, sem `/` na posição da coluna de internação

**Funções de detecção de setor:**
- `extractBedPrefix(bedCode)` → extrai prefixo de `"E-CM1L24"` → `"CM1"`, de `"E-CM2ADC"` → `"CM2"`
- `resolveSectorName(prefix)` → mapeia prefixo → nome legível:
  - `CM1` → `Clínica Médica I`
  - `CM2` → `Clínica Médica II`
  - `UTI` → `UTI`
  - `PED` → `Pediatria`
  - `CG` → `Clínica Geral`
  - `MAT` → `Maternidade`
  - Não encontrado → usa o código bruto como fallback
- `detectBlockSector(blockRows)` → conta prefixos não-especiais (ignora `AMARELA`, leitos alfanuméricos puros) e retorna o mais frequente

**Função de relatório:**
- `buildCleaningReport(original, issues, patients, sectors)` → monta o objeto `CleaningReport`

---

### 2. MODIFICADO — `src/lib/parseOfficial.ts`

Reescrita completa com algoritmo de **dois passes**:

**Retorno muda de `Patient[]` para `{ patients: Patient[], report: CleaningReport }`**

**Passe 1 — Segmentação em blocos:**
```text
Para cada linha da planilha:
  Se contém "Resumo Estatístico" → PARAR (ignorar tudo após)
  Se contém "Unidade de Internação" → iniciar novo bloco
  Se contém "Total de Leitos" → encerrar bloco atual
  Senão → adicionar linha ao bloco corrente
```

**Passe 2 — Processamento por bloco:**
```text
Para cada bloco:
  1. Detectar setor dominante via prefixo de leito (detectBlockSector)
  2. Para cada linha do bloco:
     a. Ignorar se: vazia, header de coluna, rodapé de total, leito vago (V)
     b. Procurar data no formato dd/mm/yyyy → esta É a data de nascimento
     c. À esquerda da data: Nome (texto longo) → Paciente (segundo número) → Atend (primeiro número, ignorar)
     d. Calcular idade: hoje - data de nascimento
     e. Verificar se é linha de continuação (mesmo Atend/Paciente da anterior, sem "/"):
        - SE sim: concatenar fragmento ao nome do registro anterior, descartar linha
     f. Criar registro Patient com setor do bloco
  3. Retornar pacientes do bloco + contadores para o relatório
```

**Lógica de extração de Prontuário (corrigida):**
```text
À esquerda do Nome, há dois números: [Atend] [Paciente]
O prontuário correto é o SEGUNDO número (Paciente = menor, mais à direita antes do nome)
O parser vai coletar todos os IDs numéricos à esquerda do nome e pegar o ÚLTIMO antes do nome
```

---

### 3. NOVO — `src/components/CleaningReport.tsx`

Card colapsável exibido após o upload do arquivo, antes da PreviewTable:

**Layout visual:**
```text
┌─────────────────────────────────────────────────────┐
│  ✨ Limpeza Automática Concluída              [∨]   │
│                                                     │
│  Linhas brutas no arquivo:           390            │
│  Linhas vazias removidas:            198            │
│  Cabeçalhos/rodapés removidos:        12            │
│  Leitos vagos ignorados:               1            │
│  Nomes partidos reunificados:          3            │
│  Seções de resumo ignoradas:          62            │
│                                                     │
│  Setores detectados:                                │
│    Clínica Médica I   ••••••••••  54 pacientes      │
│    Clínica Médica II  ████████    30 pacientes      │
│                                                     │
│  Total de pacientes válidos:          84            │
│                                                     │
│  [ Baixar Dados Limpos (.csv) ]                     │
└─────────────────────────────────────────────────────┘
```

- Cor do card: azul claro discreto (não conflita com os cards de resultado)
- Colapsável: clicando no título, o card fecha e mostra só o resumo `"84 pacientes extraídos de 2 setores"`
- Botão "Baixar Dados Limpos" gera CSV com os pacientes limpos para auditoria

---

### 4. MODIFICADO — `src/lib/types.ts`

Adicionar o tipo `CleaningReport` exportado (ou manter em `cleanData.ts` e importar de lá):
```typescript
export interface CleaningIssue {
  type: string;
  count: number;
  examples: string[];
}

export interface CleaningReport {
  originalRowCount: number;
  validRowCount: number;
  patientCount: number;
  issues: CleaningIssue[];
  sectorsFound: { name: string; count: number }[];
}
```

---

### 5. MODIFICADO — `src/pages/Index.tsx`

- Adicionar estado: `const [cleaningReport, setCleaningReport] = useState<CleaningReport | null>(null)`
- Atualizar `handleOfficialFile`:
  ```typescript
  const { patients, report } = parseOfficialFile(data);
  setOfficialPatients(patients);
  setCleaningReport(report);
  ```
- Renderizar `<CleaningReportPanel>` após a área de input, antes do `<PreviewTable>`

---

## O que NÃO muda

- `src/lib/compareData.ts` — lógica de comparação inalterada
- `src/lib/parseManual.ts` — parser de texto manual inalterado
- `src/components/ResultCards.tsx` — cards de resultado inalterados
- `src/components/PreviewTable.tsx` — tabela de preview inalterada
- `src/components/ManualPaste.tsx` — área de colagem inalterada
- `src/components/KPICards.tsx` — KPIs inalterados
- Design geral da aplicação

---

## Regras de limpeza completas para SoulMV

| Problema | Critério | Ação |
|---|---|---|
| Linha vazia | Todas as células são `''` ou espaço | Remover |
| Header de coluna | Contém `"Enfermaria"` + `"Leito"` + `"Atend"` | Remover |
| Rodapé de totais | Contém `"Total de Leitos"` | Encerrar bloco |
| Seção de resumo | Contém `"Resumo Estatístico"` | Parar todo processamento |
| Leito vago | Status `"V"` | Ignorar (não é paciente) |
| Continuação de nome | Mesmo Atend+Paciente da linha anterior, sem `/` | Concatenar ao nome anterior |
| Prontuário errado | Primeiro número = Atend | Usar segundo número = Paciente |
| Setor desconhecido | `AMARELA` e leitos especiais | Herdar setor do bloco |
| Prefixo não mapeado | Código não está na tabela | Usar código bruto como fallback |

---

## Sequência de implementação

1. Criar `src/lib/cleanData.ts` — todas as funções puras e tipos
2. Reescrever `src/lib/parseOfficial.ts` — dois passes, retorno com relatório
3. Criar `src/components/CleaningReport.tsx` — painel de diagnóstico
4. Modificar `src/lib/types.ts` — adicionar tipos de limpeza
5. Modificar `src/pages/Index.tsx` — conectar tudo e exibir painel
