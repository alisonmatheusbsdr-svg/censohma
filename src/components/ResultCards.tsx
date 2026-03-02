import { useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { TrendingDown, TrendingUp, ArrowRightLeft, AlertTriangle, ArrowRight, ClipboardList, Flame, HelpCircle } from 'lucide-react';
import type { ComparisonResult, Patient } from '@/lib/types';

interface ResultCardsProps {
  result: ComparisonResult;
  manualPatients: Patient[];
}

function patientLabel(name: string, age: number | null) {
  return age !== null ? `${name} (${age}a)` : name;
}

const ALERT_TYPE_LABEL: Record<string, string> = {
  duplicate_id: 'DUPLICADO',
  homonym: 'HOMÔNIMO',
  age_mismatch: 'IDADE',
};

const ALERT_TYPE_COLOR: Record<string, string> = {
  duplicate_id: 'bg-destructive text-destructive-foreground',
  homonym: 'bg-warning text-warning-foreground',
  age_mismatch: 'bg-transfer text-transfer-foreground',
};

type ConsolidatedPatient = Patient & { status: 'mantido' | 'retirar' | 'admissao' | 'vermelha' | 'verificar' };

export function ResultCards({ result, manualPatients }: ResultCardsProps) {
  const consolidatedList = useMemo<ConsolidatedPatient[]>(() => {
    const dischargeIds = new Set(result.discharges.map(p => p.prontuario));
    const uncertainIds = new Set(result.uncertainDischarges.map(u => u.patient.prontuario));
    const vermelhaIds = new Set(result.vermelha.map(p => p.prontuario));
    const transferMap = new Map(result.transfers.map(t => [t.patient.prontuario, t.newSector]));

    const list: ConsolidatedPatient[] = manualPatients.map(p => ({
      ...p,
      sector: transferMap.get(p.prontuario) ?? p.sector,
      status: dischargeIds.has(p.prontuario)
        ? 'retirar' as const
        : uncertainIds.has(p.prontuario)
          ? 'verificar' as const
          : vermelhaIds.has(p.prontuario)
            ? 'vermelha' as const
            : 'mantido' as const,
    }));

    result.admissions.forEach(p => {
      list.push({ ...p, status: 'admissao' as const });
    });

    return list;
  }, [manualPatients, result]);

  const totalDischargeTab = result.discharges.length + result.uncertainDischarges.length;

  return (
    <Tabs defaultValue="consolidado" className="w-full">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-muted p-1 mb-1">
        {/* Censo Consolidado */}
        <TabsTrigger
          value="consolidado"
          className="flex items-center gap-1.5 data-[state=active]:bg-background"
        >
          <ClipboardList className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Censo Consolidado</span>
          <Badge className="ml-0.5 h-4 px-1.5 text-[10px] bg-primary text-primary-foreground">
            {consolidatedList.filter(p => p.status !== 'retirar').length}
          </Badge>
        </TabsTrigger>
        {/* Retirar da Planilha */}
        <TabsTrigger
          value="retirar"
          className="flex items-center gap-1.5 data-[state=active]:bg-background"
        >
          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs font-medium">Retirar da Planilha</span>
          <Badge variant="destructive" className="ml-0.5 h-4 px-1.5 text-[10px]">
            {result.discharges.length}
          </Badge>
          {result.uncertainDischarges.length > 0 && (
            <Badge className="ml-0.5 h-4 px-1.5 text-[10px] bg-amber-500 text-white">
              {result.uncertainDischarges.length} ?
            </Badge>
          )}
        </TabsTrigger>

        {/* Admissões */}
        <TabsTrigger
          value="admissoes"
          className="flex items-center gap-1.5 data-[state=active]:bg-background"
        >
          <TrendingUp className="h-3.5 w-3.5 text-success" />
          <span className="text-xs font-medium">Admissões</span>
          <Badge className="ml-0.5 h-4 px-1.5 text-[10px] bg-success text-success-foreground">
            {result.admissions.length}
          </Badge>
        </TabsTrigger>

        {/* Mudança de Setor */}
        <TabsTrigger
          value="setor"
          className="flex items-center gap-1.5 data-[state=active]:bg-background"
        >
          <ArrowRightLeft className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-medium">Mudança de Setor</span>
          <Badge className="ml-0.5 h-4 px-1.5 text-[10px] bg-warning text-warning-foreground">
            {result.transfers.length}
          </Badge>
        </TabsTrigger>

        {/* Vermelha */}
        <TabsTrigger
          value="vermelha"
          className="flex items-center gap-1.5 data-[state=active]:bg-background"
        >
          <Flame className="h-3.5 w-3.5 text-orange-600" />
          <span className="text-xs font-medium">Vermelha</span>
          <Badge className="ml-0.5 h-4 px-1.5 text-[10px] bg-orange-500 text-white">
            {result.vermelha.length}
          </Badge>
        </TabsTrigger>

        {/* Alertas */}
        <TabsTrigger
          value="alertas"
          className="flex items-center gap-1.5 data-[state=active]:bg-background"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-medium">Alertas de Dados</span>
          <Badge className="ml-0.5 h-4 px-1.5 text-[10px] bg-warning text-warning-foreground">
            {result.alerts.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {/* ── Censo Consolidado ───────────────────────────────── */}
      <TabsContent value="consolidado" className="mt-0">
        <div className="rounded-md border border-primary/30 bg-card">
          <div className="px-4 py-2.5 border-b border-primary/20 bg-primary/5">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Visão consolidada do censo.</span>{' '}
              Mantém a ordem da planilha manual. Admissões aparecem ao final.
            </p>
          </div>
          <ScrollArea className="h-[32rem]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 text-xs">Prontuário</TableHead>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="w-16 text-xs text-center">Idade</TableHead>
                  <TableHead className="text-xs">Setor</TableHead>
                  <TableHead className="w-24 text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidatedList.map((p, i) => {
                  const rowClass =
                    p.status === 'retirar'
                      ? 'bg-destructive/10'
                      : p.status === 'admissao'
                        ? 'bg-warning/10'
                        : p.status === 'verificar'
                          ? 'bg-amber-50 dark:bg-amber-950/20'
                          : '';
                  const textClass = p.status === 'retirar' ? 'line-through text-muted-foreground' : '';
                  return (
                    <TableRow key={`${p.prontuario}-${i}`} className={rowClass}>
                      <TableCell className={`font-mono text-xs ${textClass}`}>
                        {p.prontuario}
                      </TableCell>
                      <TableCell className={`text-sm font-medium ${textClass}`}>
                        {p.name}
                      </TableCell>
                      <TableCell className={`text-xs text-center ${textClass}`}>
                        {p.age ?? '—'}
                      </TableCell>
                      <TableCell className={`text-xs ${textClass}`}>
                        {p.sector}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            p.status === 'retirar'
                              ? 'border-destructive/50 text-destructive bg-destructive/10'
                              : p.status === 'admissao'
                                ? 'border-warning/50 text-warning bg-warning/10'
                                : p.status === 'vermelha'
                                  ? 'border-red-500/50 text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/40'
                                  : p.status === 'verificar'
                                    ? 'border-amber-500/50 text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40'
                                    : 'border-success/50 text-success bg-success/10'
                          }`}
                        >
                          {p.status === 'retirar' ? 'Retirar' : p.status === 'admissao' ? 'Admissão' : p.status === 'vermelha' ? 'Vermelha' : p.status === 'verificar' ? 'Verificar' : 'Mantido'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </TabsContent>

      {/* ── Retirar da Planilha ─────────────────────────────── */}
      <TabsContent value="retirar" className="mt-0">
        <div className="rounded-md border border-destructive/30 bg-card">
          <div className="px-4 py-2.5 border-b border-destructive/20 bg-destructive/5">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-destructive">Paciente está na planilha manual</span>{' '}
              mas não aparece no censo oficial. Pode ter recebido alta ou transferência externa.
            </p>
          </div>
          <ScrollArea className="h-96">
            <div className="p-3">
              {/* Uncertain discharges - requires verification */}
              {result.uncertainDischarges.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <HelpCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Requer verificação ({result.uncertainDischarges.length})
                    </p>
                  </div>
                  <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
                    <ul className="space-y-0">
                      {result.uncertainDischarges.map((u, i) => (
                        <li key={i}>
                          <div className="py-2.5 px-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-semibold leading-tight">{u.patient.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{u.patient.sector} · Prontuário #{u.patient.prontuario}</p>
                              </div>
                              <Badge className="ml-2 text-[10px] bg-amber-500 text-white flex-shrink-0">
                                Verificar
                              </Badge>
                            </div>
                            <div className="mt-1.5 px-2 py-1.5 rounded bg-amber-100/60 dark:bg-amber-900/30">
                              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                <span className="font-medium">Possível match no oficial:</span>{' '}
                                {u.possibleMatch.name} · #{u.possibleMatch.prontuario} · {u.possibleMatch.sector}
                              </p>
                            </div>
                          </div>
                          {i < result.uncertainDischarges.length - 1 && <Separator className="bg-amber-200 dark:bg-amber-800" />}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Confirmed discharges */}
              {result.uncertainDischarges.length > 0 && result.discharges.length > 0 && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <p className="text-xs font-semibold text-destructive">
                    Altas confirmadas ({result.discharges.length})
                  </p>
                </div>
              )}

              {result.discharges.length === 0 && result.uncertainDischarges.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhum paciente para retirar da planilha
                </p>
              ) : (
                <ul className="space-y-0">
                  {result.discharges.map((p, i) => (
                    <li key={i}>
                      <div className="flex items-start justify-between py-2.5 px-1">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.sector}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-3 mt-0.5 font-mono">
                          #{p.prontuario}
                        </span>
                      </div>
                      {i < result.discharges.length - 1 && <Separator />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      {/* ── Admissões ───────────────────────────────────────── */}
      <TabsContent value="admissoes" className="mt-0">
        <div className="rounded-md border border-success/30 bg-card">
          <div className="px-4 py-2.5 border-b border-success/20 bg-success/5">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-success">Paciente aparece no censo oficial</span>{' '}
              mas não está na planilha manual. Deve ser incluído na planilha.
            </p>
          </div>
          <ScrollArea className="h-96">
            <div className="p-3">
              {result.admissions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhuma admissão identificada
                </p>
              ) : (
                <ul className="space-y-0">
                  {result.admissions.map((p, i) => (
                    <li key={i}>
                      <div className="flex items-start justify-between py-2.5 px-1">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.sector}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-3 mt-0.5 font-mono">
                          #{p.prontuario}
                        </span>
                      </div>
                      {i < result.admissions.length - 1 && <Separator />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      {/* ── Mudança de Setor ────────────────────────────────── */}
      <TabsContent value="setor" className="mt-0">
        <div className="rounded-md border border-warning/30 bg-card">
          <div className="px-4 py-2.5 border-b border-warning/20 bg-warning/5">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-warning">Mesmo prontuário em setores diferentes.</span>{' '}
              Atualizar o setor na planilha manual.
            </p>
          </div>
          <ScrollArea className="h-96">
            <div className="p-3">
              {result.transfers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhuma mudança de setor identificada
                </p>
              ) : (
                <ul className="space-y-0">
                  {result.transfers.map((t, i) => (
                    <li key={i}>
                      <div className="flex items-start justify-between py-2.5 px-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight truncate">
                            {patientLabel(t.patient.name, t.patient.age)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">{t.oldSector}</span>
                            <ArrowRight className="h-3 w-3 text-warning flex-shrink-0" />
                            <span className="text-xs font-medium text-warning">{t.newSector}</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-3 mt-0.5 font-mono">
                          #{t.patient.prontuario}
                        </span>
                      </div>
                      {i < result.transfers.length - 1 && <Separator />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      {/* ── Vermelha ──────────────────────────────────────── */}
      <TabsContent value="vermelha" className="mt-0">
        <div className="rounded-md border border-orange-400/30 bg-card">
          <div className="px-4 py-2.5 border-b border-orange-300/20 bg-orange-50 dark:bg-orange-950/20">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-orange-700 dark:text-orange-400">Pacientes na ala Vermelha.</span>{' '}
              Estão temporariamente na emergência e podem retornar à clínica médica.
            </p>
          </div>
          <ScrollArea className="h-96">
            <div className="p-3">
              {result.vermelha.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhum paciente na Vermelha
                </p>
              ) : (
                <ul className="space-y-0">
                  {result.vermelha.map((p, i) => (
                    <li key={i}>
                      <div className="flex items-start justify-between py-2.5 px-1">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Setor de origem: <span className="font-medium text-orange-700 dark:text-orange-400">{p.sector}</span>
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-3 mt-0.5 font-mono">
                          #{p.prontuario}
                        </span>
                      </div>
                      {i < result.vermelha.length - 1 && <Separator />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      {/* ── Alertas de Dados ────────────────────────────────── */}
      <TabsContent value="alertas" className="mt-0">
        <div className="rounded-md border border-warning/30 bg-card">
          <div className="px-4 py-2.5 border-b border-warning/20 bg-warning/5">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-warning">Inconsistências detectadas nos dados.</span>{' '}
              Verifique e corrija nas planilhas de origem.
            </p>
          </div>
          <ScrollArea className="h-96">
            <div className="p-3">
              {result.alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhum alerta de dados
                </p>
              ) : (
                <ul className="space-y-0">
                  {result.alerts.map((a, i) => (
                    <li key={i}>
                      <div className="py-2.5 px-1">
                        <div className="flex items-start gap-2 mb-1.5">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${
                              ALERT_TYPE_COLOR[a.type] ?? 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {ALERT_TYPE_LABEL[a.type] ?? a.type.toUpperCase()}
                          </span>
                          <p className="text-xs text-foreground leading-snug">{a.message}</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-0.5">
                          {a.patients
                            .map(p => `${patientLabel(p.name, p.age)} #${p.prontuario}`)
                            .join(' · ')}
                        </p>
                      </div>
                      {i < result.alerts.length - 1 && <Separator />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>
    </Tabs>
  );
}
