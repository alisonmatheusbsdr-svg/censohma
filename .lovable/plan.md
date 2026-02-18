
# Plano: Reformulação dos Resultados da Comparação

## O que muda e por quê

Atualmente os 4 cards de resultado ficam num grid 2×2 com scroll interno limitado a `max-h-60` (≈240px). Com listas longas, o usuário não consegue ver todos os registros confortavelmente.

A proposta substitui o grid de cards por um layout de **abas (Tabs)** com painel de scroll generoso, além de renomear as categorias para a terminologia solicitada.

---

## Nova terminologia das 4 categorias

| Antes | Depois | Lógica (não muda) |
|---|---|---|
| Saídas / Altas | Retirar da Planilha | Está no manual, não está no censo oficial |
| Admissões | Admissões | Está no censo oficial, não está no manual |
| Transferências | Mudança de Setor | Mesmo prontuário, setor diferente entre manual e oficial |
| Alerta de Dados | Alerta de Dados | Duplicatas, homônimos, divergência de idade |

---

## Nova estrutura visual — Tabs com lista rolável

```text
┌──────────────────────────────────────────────────────────────────┐
│  Retirar da Planilha (12) │ Admissões (5) │ Mudança de Setor (3) │ Alertas (2) │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ● JOAO PAULO DE ALBUQUERQUE SILVA            #859419            │
│    Clínica Médica I                                              │
│  ─────────────────────────────────────────────────────────       │
│  ● MARIA ROSA DE LIMA                         #1044478           │
│    Clínica Médica I                                              │
│  ─────────────────────────────────────────────────────────       │
│  ... (scroll)                                                    │
│                                                                  │
│                                                          h-96    │
└──────────────────────────────────────────────────────────────────┘
```

Cada aba exibe:
- **Contador** no badge da própria aba (sempre visível)
- **Lista com scroll** de altura fixa `h-96` (≈384px — o dobro do atual)
- **Informações completas** por paciente: nome, prontuário, setor
- Para **Mudança de Setor**: mostra `Setor Anterior → Setor Novo` com ícone de seta
- Para **Alertas**: mostra o tipo do alerta com badge colorido + lista de pacientes envolvidos
- Mensagem vazia estilizada quando não há registros na categoria

---

## Detalhamento visual de cada aba

### Aba 1 — Retirar da Planilha
```text
[ícone vermelho] Paciente está no manual mas não aparece no censo oficial.
                 Pode ter recebido alta ou transferência externa.

• JOAO PAULO...           #859419 • Clínica Médica I
• MARIA ROSA DE LIMA      #1044478 • Clínica Médica I
```

### Aba 2 — Admissões
```text
[ícone verde] Paciente aparece no censo oficial mas não está no manual.
              Deve ser incluído na planilha.

• ADEILDO DA SILVA        #1051245 • Clínica Médica II
```

### Aba 3 — Mudança de Setor
```text
[ícone laranja] Mesmo prontuário encontrado em setores diferentes.
                Atualizar o setor na planilha manual.

• DIELSON ELIAS DOS SANTOS    #1051245
  Clínica Médica I  →  Clínica Médica II
```

### Aba 4 — Alertas de Dados
```text
[badge: DUPLICADO] Prontuário 859419 duplicado na lista Manual (2x)
  → JOAO PAULO... #859419 | JOAO PAULO... #859419

[badge: HOMÔNIMO] "MARIA JOSE" com prontuários diferentes
  → MARIA JOSE #123 | MARIA JOSE #456
```

---

## Arquivos a modificar

### `src/components/ResultCards.tsx` — reescrever completamente

Substituir o grid de 4 cards independentes por um único componente `Tabs` do Radix UI (já disponível no projeto via `@radix-ui/react-tabs`):

- Importar `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` de `@/components/ui/tabs`
- 4 triggers, cada um com ícone + label + badge de contagem
- Dentro de cada `TabsContent`: `ScrollArea` com altura `h-96`
- Cores dos triggers por categoria:
  - Retirar da Planilha: badge vermelho (`destructive`)
  - Admissões: badge verde (`success`)
  - Mudança de Setor: badge laranja (`warning`)
  - Alertas: badge amarelo (`warning`)
- Default tab: a que tiver mais registros (ou `retirar` por padrão)

### Nenhum outro arquivo muda

- `compareData.ts` — lógica de comparação está correta, não muda
- `types.ts` — tipos `ComparisonResult` estão corretos, não mudam
- `Index.tsx` — já passa `result` para `ResultCards`, não muda
- `KPICards.tsx` — não muda

---

## Sequência de implementação

1. Reescrever `src/components/ResultCards.tsx` com a estrutura de Tabs
2. Ajustar labels, ícones e cores de cada aba
3. Garantir que o scroll funciona corretamente dentro de cada TabsContent
