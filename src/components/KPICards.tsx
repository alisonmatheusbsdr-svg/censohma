import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingDown, TrendingUp, Activity, Flame } from 'lucide-react';

interface KPICardsProps {
  totalCensus: number;
  discharges: number;
  admissions: number;
  transfers: number;
  vermelha: number;
}

export function KPICards({ totalCensus, discharges, admissions, transfers, vermelha }: KPICardsProps) {
  const cards = [
    { label: 'Censo Total', value: totalCensus, icon: Users, color: 'text-primary' },
    { label: 'Altas', value: discharges, icon: TrendingDown, color: 'text-destructive' },
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
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
