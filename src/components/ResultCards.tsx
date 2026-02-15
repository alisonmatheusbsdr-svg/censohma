import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingDown, TrendingUp, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import type { ComparisonResult } from '@/lib/types';

function patientLabel(name: string, age: number | null) {
  return age !== null ? `${name} (${age}a)` : name;
}

export function ResultCards({ result }: { result: ComparisonResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Discharges */}
      <Card className="border-l-4 border-l-destructive">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Saídas / Altas
            <Badge variant="destructive" className="ml-auto">{result.discharges.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-60">
            {result.discharges.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma alta identificada</p>
            ) : (
              <ul className="space-y-1.5">
                {result.discharges.map((p, i) => (
                  <li key={i} className="text-sm flex justify-between items-start">
                    <span className="font-medium">{patientLabel(p.name, p.age)}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      #{p.prontuario} • {p.sector}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Admissions */}
      <Card className="border-l-4 border-l-success">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Admissões
            <Badge className="ml-auto bg-success text-success-foreground">{result.admissions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-60">
            {result.admissions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma admissão identificada</p>
            ) : (
              <ul className="space-y-1.5">
                {result.admissions.map((p, i) => (
                  <li key={i} className="text-sm flex justify-between items-start">
                    <span className="font-medium">{patientLabel(p.name, p.age)}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      #{p.prontuario} • {p.sector}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Transfers */}
      <Card className="border-l-4 border-l-transfer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-transfer" />
            Transferências
            <Badge className="ml-auto bg-transfer text-transfer-foreground">{result.transfers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-60">
            {result.transfers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma transferência identificada</p>
            ) : (
              <ul className="space-y-1.5">
                {result.transfers.map((t, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{patientLabel(t.patient.name, t.patient.age)}</span>
                    <span className="text-xs text-muted-foreground block">
                      {t.oldSector} ➔ {t.newSector}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Data Alerts */}
      <Card className="border-l-4 border-l-warning">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Alerta de Dados
            <Badge className="ml-auto bg-warning text-warning-foreground">{result.alerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-60">
            {result.alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum alerta de dados</p>
            ) : (
              <ul className="space-y-1.5">
                {result.alerts.map((a, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium">{a.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.patients.map(p => `${patientLabel(p.name, p.age)} #${p.prontuario}`).join(' | ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
