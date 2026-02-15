import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Patient } from '@/lib/types';

export function PreviewTable({ patients, title }: { patients: Patient[]; title: string }) {
  if (patients.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title} ({patients.length} pacientes)</h3>
      <ScrollArea className="max-h-48 border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Prontuário</TableHead>
              <TableHead className="text-xs">Nome</TableHead>
              <TableHead className="text-xs">Idade</TableHead>
              <TableHead className="text-xs">Setor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.slice(0, 50).map((p, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-mono">{p.prontuario}</TableCell>
                <TableCell className="text-xs">{p.name}</TableCell>
                <TableCell className="text-xs">{p.age !== null ? `${p.age}a` : '—'}</TableCell>
                <TableCell className="text-xs">{p.sector}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
