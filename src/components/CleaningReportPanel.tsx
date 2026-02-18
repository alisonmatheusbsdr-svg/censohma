import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CleaningReport, CleaningIssue } from '@/lib/types';

// ─── Label map for issue types ────────────────────────────────────────────────

const ISSUE_LABELS: Record<CleaningIssue['type'], string> = {
  empty_row: 'Linhas vazias removidas',
  header_row: 'Cabeçalhos repetidos removidos',
  footer_row: 'Rodapés de totais removidos',
  vacant_bed: 'Leitos vagos ignorados',
  name_merged: 'Nomes partidos reunificados',
  summary_section: 'Seções de resumo ignoradas',
  continuation_row: 'Linhas de continuação processadas',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function SectorBar({ name, count, max }: { name: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground">{count} pacientes</span>
      </div>
      <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/50 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function downloadCleanCSV(report: CleaningReport, patients: { prontuario: string; name: string; age: number | null; sector: string }[]) {
  const header = 'Prontuario,Nome,Idade,Setor\n';
  const rows = patients
    .map((p) => `${p.prontuario},"${p.name.replace(/"/g, '""')}",${p.age ?? ''},${p.sector}`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Dados_Limpos_Oficial.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  report: CleaningReport;
  patients: { prontuario: string; name: string; age: number | null; sector: string }[];
}

export function CleaningReportPanel({ report, patients }: Props) {
  const [open, setOpen] = useState(true);

  const maxCount = Math.max(...report.sectorsFound.map((s) => s.count), 1);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Limpeza Automática Concluída</span>
          {!open && (
            <span className="text-xs text-muted-foreground ml-2">
              {report.patientCount} pacientes extraídos de {report.sectorsFound.length} setor(es)
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="px-5 pb-5 space-y-5">
          {/* Row counts */}
          <div className="space-y-0">
            <StatRow label="Linhas brutas no arquivo" value={report.originalRowCount} />
            {report.issues.map((issue) => (
              <StatRow
                key={issue.type}
                label={ISSUE_LABELS[issue.type] ?? issue.type}
                value={issue.count}
              />
            ))}
          </div>

          {/* Sectors */}
          {report.sectorsFound.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Setores detectados
              </p>
              <div className="space-y-3">
                {report.sectorsFound
                  .sort((a, b) => b.count - a.count)
                  .map((s) => (
                    <SectorBar key={s.name} name={s.name} count={s.count} max={maxCount} />
                  ))}
              </div>
            </div>
          )}

          {/* Total + download */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <p className="text-sm">
              <span className="text-muted-foreground">Total de pacientes válidos: </span>
              <span className="font-bold text-primary text-base">{report.patientCount}</span>
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadCleanCSV(report, patients)}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar Dados Limpos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
