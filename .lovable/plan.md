

# Ajuste na Exportação do Censo Consolidado

## Estrutura atual das colunas

| Prontuario | Nome | Idade | Setor |

## Nova estrutura das colunas

| Status | Prontuario | Nome | Idade | *(vazia)* | Setor | Mudanca de Setor |

---

## Detalhes de cada nova coluna

### Coluna A — "Status"
- **Mantido** — paciente que ja estava na lista manual e permanece
- **Admissao** — paciente novo vindo do censo oficial

### Coluna entre Idade e Setor — em branco
- Cabecalho vazio, celulas vazias — serve como separador visual

### Coluna apos Setor — "Mudanca de Setor"
- Se o paciente teve transferencia: exibe `"Setor Anterior → Setor Novo"` (ex: `"Clinica Medica I → Clinica Medica II"`)
- Se nao houve mudanca: celula vazia

---

## Arquivo a modificar

### `src/lib/compareData.ts` — funcao `generateConsolidatedExcel`

Alterar o mapeamento de dados (linhas 92-114):

1. Criar um `Set` com os IDs das admissoes para identificar o status
2. Criar um `Map` com o setor anterior dos transferidos (antes de sobrescrever)
3. Montar cada linha com as 7 colunas na ordem correta:

```text
{
  'Status':             admissionIds.has(p.prontuario) ? 'Admissão' : 'Mantido',
  'Prontuário':         p.prontuario,
  'Nome':               p.name,
  'Idade':              p.age ?? '',
  '':                   '',          // coluna vazia separadora
  'Setor':              p.sector,
  'Mudança de Setor':   oldSectorMap.get(p.prontuario)
                          ? `${oldSectorMap.get(p.prontuario)} → ${p.sector}`
                          : '',
}
```

Nenhum outro arquivo muda — a logica de comparacao e a interface permanecem iguais.

