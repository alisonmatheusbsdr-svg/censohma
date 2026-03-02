import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingDown, TrendingUp, Activity, Flame, HelpCircle } from 'lucide-react';

interface KPICardsProps {
  totalCensus: number;
  discharges: number;
  uncertainDischarges: number;
  admissions: number;
  transfers: number;
  vermelha: number;
}

export function KPICards({ totalCensus, discharges, uncertainDischarges, admissions, transfers, vermelha }: KPICardsProps) {
  const cards = [
    { label: 'Censo Total', value: totalCensus, icon: Users, color: 'text-primary' },
    { label: 'Altas', value: discharges, icon: TrendingDown, color: 'text-destructive', extra: uncertainDischarges > 0 ? `+${uncertainDischarges} ?` : undefined },
    { label: 'Admissões', value: admissions, icon: TrendingUp, color: 'text-success' },
    { label: 'Transferências', value: transfers, icon: Activity, color: 'text-transfer' },
    { label: 'Na Vermelha', value: vermelha, icon: Flame, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map(c => (
        <Card key={c.label} className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-2xl font-bold">{c.value}</p>
                {c.extra && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5 rounded">
                    {c.extra}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
