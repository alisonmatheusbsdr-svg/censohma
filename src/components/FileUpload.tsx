import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Upload, FileSpreadsheet, X, ChevronDown, Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CleaningReport } from '@/lib/types';

interface FileUploadProps {
  onFileLoaded: (data: ArrayBuffer) => void;
  cleaningReport?: CleaningReport | null;
}

export function FileUpload({ onFileLoaded, cleaningReport }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onFileLoaded(e.target.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const totalRemoved = cleaningReport
    ? cleaningReport.issues.reduce((sum, i) => sum + i.count, 0)
    : 0;

  return (
    <Card className="h-full border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          Arquivo Oficial (SoulMV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {fileName ? (
            <div className="flex items-center justify-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-success" />
              <span className="text-sm font-medium">{fileName}</span>
              <button onClick={e => { e.stopPropagation(); setFileName(null); }} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Arraste o arquivo .xls/.csv ou clique para selecionar
              </p>
            </>
          )}
        </div>

        {/* Compact cleaning summary */}
        {cleaningReport && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>
                <span className="font-semibold text-foreground">{cleaningReport.patientCount}</span> pacientes
                {' · '}
                <span className="font-semibold text-foreground">{totalRemoved}</span> linhas removidas
                {' · '}
                {cleaningReport.sectorsFound.length} setor(es)
              </span>
              <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
                {cleaningReport.issues.map((issue) => (
                  <div key={issue.type} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{issueLabel(issue.type)}</span>
                    <span className="font-semibold tabular-nums">{issue.count}</span>
                  </div>
                ))}
                {cleaningReport.sectorsFound.length > 0 && (
                  <div className="pt-1 border-t border-border/40 space-y-1">
                    {cleaningReport.sectorsFound
                      .sort((a, b) => b.count - a.count)
                      .map(s => (
                        <div key={s.name} className="flex justify-between text-xs">
                          <span>{s.name}</span>
                          <span className="text-muted-foreground">{s.count} pac.</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

const ISSUE_LABELS: Record<string, string> = {
  empty_row: 'Linhas vazias removidas',
  header_row: 'Cabeçalhos repetidos',
  footer_row: 'Rodapés de totais',
  vacant_bed: 'Leitos vagos ignorados',
  name_merged: 'Nomes reunificados',
  summary_section: 'Seções de resumo',
  continuation_row: 'Linhas de continuação',
};

function issueLabel(type: string) {
  return ISSUE_LABELS[type] ?? type;
}
