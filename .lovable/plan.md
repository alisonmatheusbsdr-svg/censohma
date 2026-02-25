

# Aba "Censo Consolidado" na visualizacao de resultados

## O que sera feito

Adicionar uma nova aba **"Censo Consolidado"** como primeira aba nos resultados, mostrando a visao unificada de todos os pacientes com indicacao visual de status. Esta aba sera a aba padrao (aberta por padrao apos a comparacao).

## Logica de montagem da lista

1. Manter a **ordem dos pacientes da lista manual** (texto colado pelo usuario)
2. Pacientes **mantidos**: fundo branco, sem destaque
3. Pacientes para **retirar** (alta): fundo vermelho claro, texto tachado (line-through)
4. Pacientes de **admissao**: adicionados ao **final** da lista, fundo laranja
5. Pacientes com **mudanca de setor**: mostrar setor atualizado (do oficial)

## Layout da aba (formato tabela)

```text
Prontuario | Nome                    | Idade | Setor           | Status
123456     | Jose Maria da Silva     | 70    | Clinica Medica 1| Mantido
632145     | Maria Jose da Silva     | 84    | Clinica Medica 2| Retirar    ← fundo rosa, texto tachado
854796     | Aline Dantas Barreto    | 70    | Clinica Medica 2| Admissao   ← fundo laranja
```

## Arquivos a modificar

### 1. `src/components/ResultCards.tsx`

- Adicionar nova aba "Censo Consolidado" como primeira TabsTrigger com icone `ClipboardList` e badge com total de pacientes
- Definir `defaultValue="consolidado"` (sempre abrir nesta aba)
- Novo TabsContent que recebe `manualPatients` e `result`
- Montar a lista consolidada com `useMemo`:
  - Comecar com todos os pacientes manuais na ordem original
  - Para cada um, determinar status: se esta em `dischargeIds` → "Retirar", se esta em `transferMap` → atualizar setor, senao → "Mantido"
  - Ao final, adicionar admissoes com status "Admissao"
- Renderizar como tabela (Table component do shadcn) com colunas: Prontuario, Nome, Idade, Setor, Status
- Estilos por linha:
  - Retirar: `bg-red-50 line-through text-muted-foreground`
  - Admissao: `bg-orange-50`
  - Mantido: sem classe extra
- Badge de status com cores correspondentes

### 2. `src/pages/Index.tsx`

- Passar `manualPatients` como prop adicional para `ResultCards`

### Detalhes tecnicos

O componente `ResultCards` passara a receber:
```text
interface ResultCardsProps {
  result: ComparisonResult;
  manualPatients: Patient[];
}
```

A lista consolidada sera computada com `useMemo` dentro do componente:
```text
const consolidatedList = useMemo(() => {
  const dischargeIds = new Set(result.discharges.map(p => p.prontuario));
  const admissionIds = new Set(result.admissions.map(p => p.prontuario));
  const transferMap = new Map(result.transfers.map(t => [t.patient.prontuario, t.newSector]));

  const list = manualPatients.map(p => ({
    ...p,
    sector: transferMap.get(p.prontuario) ?? p.sector,
    status: dischargeIds.has(p.prontuario) ? 'retirar' : 'mantido',
  }));

  result.admissions.forEach(p => {
    list.push({ ...p, status: 'admissao' });
  });

  return list;
}, [manualPatients, result]);
```

Nenhum outro arquivo muda.

