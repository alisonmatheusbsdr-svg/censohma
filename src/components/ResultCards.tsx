import { useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TrendingDown, TrendingUp, ArrowRightLeft, AlertTriangle, ArrowRight } from 'lucide-react';
import type { ComparisonResult } from '@/lib/types';

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

export function ResultCards({ result }: { result: ComparisonResult }) {
  const defaultTab = useMemo(() => {
    const counts = {
      retirar: result.discharges.length,
      admissoes: result.admissions.length,
      setor: result.transfers.length,
      alertas: result.alerts.length,
    };
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [result]);

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-muted p-1 mb-1">
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
              {result.discharges.length === 0 ? (
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
