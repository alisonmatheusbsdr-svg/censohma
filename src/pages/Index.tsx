import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { KPICards } from '@/components/KPICards';
import { FileUpload } from '@/components/FileUpload';
import { ManualPaste } from '@/components/ManualPaste';
import { ResultCards } from '@/components/ResultCards';
import { PreviewTable } from '@/components/PreviewTable';
import { parseOfficialFile } from '@/lib/parseOfficial';
import { applyMapping } from '@/lib/parseManual';
import { comparePatients, generateConsolidatedCSV } from '@/lib/compareData';
import type { Patient, ColumnMapping, ComparisonResult } from '@/lib/types';
import { ArrowDownToLine, GitCompare, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [officialPatients, setOfficialPatients] = useState<Patient[]>([]);
  const [manualRows, setManualRows] = useState<string[][]>([]);
  const [manualMapping, setManualMapping] = useState<ColumnMapping>({ prontuario: null, name: null, age: null, sector: null });
  const [manualPatients, setManualPatients] = useState<Patient[]>([]);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const handleOfficialFile = useCallback((data: ArrayBuffer) => {
    try {
      const patients = parseOfficialFile(data);
      setOfficialPatients(patients);
      setResult(null);
      toast({ title: `${patients.length} pacientes detectados no arquivo oficial.` });
    } catch {
      toast({ title: 'Erro ao processar arquivo', description: 'Verifique o formato do arquivo.', variant: 'destructive' });
    }
  }, [toast]);

  const handleManualParsed = useCallback((rows: string[][], mapping: ColumnMapping) => {
    setManualRows(rows);
    setManualMapping(mapping);
    const patients = applyMapping(rows, mapping);
    setManualPatients(patients);
    setResult(null);
  }, []);

  const handleCompare = () => {
    if (officialPatients.length === 0 && manualPatients.length === 0) {
      toast({ title: 'Dados insuficientes', description: 'Carregue o arquivo oficial e cole a lista manual.', variant: 'destructive' });
      return;
    }
    const res = comparePatients(manualPatients, officialPatients);
    setResult(res);
  };

  const handleExport = () => {
    if (!result) return;
    const csv = generateConsolidatedCSV(manualPatients, result);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Consolidated_Census.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCensus = result
    ? manualPatients.length - result.discharges.length + result.admissions.length
    : manualPatients.length || officialPatients.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">HMA Census Manager</h1>
            <p className="text-xs text-muted-foreground">Reconciliação Inteligente de Censo Hospitalar</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <KPICards
          totalCensus={totalCensus}
          discharges={result?.discharges.length ?? 0}
          admissions={result?.admissions.length ?? 0}
          transfers={result?.transfers.length ?? 0}
        />

        {/* Input Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUpload onFileLoaded={handleOfficialFile} />
          <ManualPaste onParsed={handleManualParsed} />
        </div>

        {/* Preview Tables */}
        {(officialPatients.length > 0 || manualPatients.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PreviewTable patients={officialPatients} title="Preview — Arquivo Oficial" />
            <PreviewTable patients={manualPatients} title="Preview — Lista Manual" />
          </div>
        )}

        {/* Compare Button */}
        <div className="flex justify-center gap-3">
          <Button size="lg" onClick={handleCompare} className="gap-2">
            <GitCompare className="h-4 w-4" />
            Comparar Dados
          </Button>
          {result && (
            <Button size="lg" variant="outline" onClick={handleExport} className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Exportar Censo Consolidado
            </Button>
          )}
        </div>

        {/* Results */}
        {result && <ResultCards result={result} />}
      </main>
    </div>
  );
};

export default Index;
