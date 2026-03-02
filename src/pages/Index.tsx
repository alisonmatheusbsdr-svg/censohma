import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { KPICards } from '@/components/KPICards';
import { FileUpload } from '@/components/FileUpload';
import { ManualPaste } from '@/components/ManualPaste';
import { ResultCards } from '@/components/ResultCards';
import { parseOfficialFile } from '@/lib/parseOfficial';
import { applyMapping } from '@/lib/parseManual';
import { comparePatients, generateConsolidatedExcel } from '@/lib/compareData';
import type { Patient, ColumnMapping, ComparisonResult, CleaningReport } from '@/lib/types';
import { ArrowDownToLine, GitCompare, Stethoscope, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const { toast } = useToast();
  const [officialPatients, setOfficialPatients] = useState<Patient[]>([]);
  const [cleaningReport, setCleaningReport] = useState<CleaningReport | null>(null);
  const [manualRows, setManualRows] = useState<string[][]>([]);
  const [manualMapping, setManualMapping] = useState<ColumnMapping>({ prontuario: null, name: null, age: null, sector: null });
  const [manualPatients, setManualPatients] = useState<Patient[]>([]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('consolidado');

  const handleOfficialFile = useCallback((data: ArrayBuffer) => {
    try {
      const { patients, report } = parseOfficialFile(data);
      setOfficialPatients(patients);
      setCleaningReport(report);
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
    const buf = generateConsolidatedExcel(manualPatients, result);
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    a.download = `Censo_Consolidado ${hh}-${mm} ${dd}-${mo}-${yy}.xlsx`;
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
        {/* Input Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUpload onFileLoaded={handleOfficialFile} cleaningReport={cleaningReport} />
          <ManualPaste onParsed={handleManualParsed} />
        </div>

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

        {/* KPIs — only after comparison */}
        {result && (
          <KPICards
            totalCensus={totalCensus}
            discharges={result.discharges.length}
            uncertainDischarges={result.uncertainDischarges.length}
            admissions={result.admissions.length}
            transfers={result.transfers.length}
            vermelha={result.vermelha.length}
            alerts={result.alerts.length}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        )}

        {/* Alert — verify surgical patients */}
        {result && (
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">Verifique os pacientes cirúrgicos</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400/80">
              Alguns pacientes de clínicas cirúrgicas podem estar ocupando leitos na sala da clínica médica. Confirme se todos os pacientes listados no censo consolidado estão realmente sob avaliação da clínica médica.
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {result && <ResultCards result={result} manualPatients={manualPatients} activeFilter={activeFilter} onTabChange={setActiveFilter} />}
      </main>
    </div>
  );
};

export default Index;
