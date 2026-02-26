import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Sheet, Loader2, RefreshCw } from 'lucide-react';
import { parseManualText, detectColumns } from '@/lib/parseManual';
import type { ColumnMapping } from '@/lib/types';

const SHEET_ID = '1ZQctTfNpfxJ-KO0hJAdgEUQrLxg57J2JxJy7nH70M20';
const SHEET_NAME = 'Confere Censo - CM';

interface ManualPasteProps {
  onParsed: (rows: string[][], mapping: ColumnMapping) => void;
}

export function ManualPaste({ onParsed }: ManualPasteProps) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ prontuario: null, name: null, age: null, sector: null });
  const [lowConfidence, setLowConfidence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const syncingRef = useRef(false);

  const processRows = (parsed: string[][]) => {
    const { mapping: detected, confidence, hasHeader } = detectColumns(parsed);
    const dataRows = hasHeader ? parsed.slice(1) : parsed;
    setRows(dataRows);
    setMapping(detected);
    setLowConfidence(confidence < 0.5);
    onParsed(dataRows, detected);
  };

  const handleSync = useCallback(async (silent = false) => {
    if (syncingRef.current) return;
    if (!silent) setLoading(true);
    setSheetError('');
    syncingRef.current = true;
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error('Falha ao acessar planilha');
      const csvText = await res.text();
      if (!csvText.trim()) throw new Error('Planilha vazia');
      processRows(parseManualText(csvText));
      setLastSync(new Date());
    } catch {
      if (!silent) {
        setSheetError('Não foi possível importar. Verifique se a planilha é pública.');
        setRows(null);
      }
    } finally {
      if (!silent) setLoading(false);
      syncingRef.current = false;
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    handleSync(true);
  }, [handleSync]);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      if (!syncingRef.current) handleSync(true);
    }, 2 * 60 * 60_000);
    return () => clearInterval(interval);
  }, [autoSync, handleSync]);

  const colCount = rows ? Math.max(...rows.map(r => r.length)) : 0;
  const colOptions = Array.from({ length: colCount }, (_, i) => i);

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    const newMapping = { ...mapping, [field]: value === 'none' ? null : parseInt(value) };
    setMapping(newMapping);
    if (rows) onParsed(rows, newMapping);
  };

  return (
    <Card className="h-full border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sheet className="h-4 w-4 text-primary" />
          Censo Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => handleSync(false)} disabled={loading} className="w-full gap-2" size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Sincronizando...' : 'Sincronizar'}
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="auto-sync" checked={autoSync} onCheckedChange={setAutoSync} />
            <Label htmlFor="auto-sync" className="text-xs cursor-pointer">Sync automático (2h)</Label>
          </div>
          {lastSync && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              {lastSync.toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>

        {sheetError && (
          <p className="text-xs text-destructive">{sheetError}</p>
        )}

        {lowConfidence && rows && rows.length > 0 && (
          <div className="space-y-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Mapeamento incerto — confirme as colunas:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['prontuario', 'name', 'age', 'sector'] as const).map(field => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">
                    {field === 'prontuario' ? 'Prontuário' : field === 'name' ? 'Nome' : field === 'age' ? 'Idade' : 'Setor'}
                  </Label>
                  <Select value={mapping[field]?.toString() ?? 'none'} onValueChange={v => updateMapping(field, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {colOptions.map(i => (
                        <SelectItem key={i} value={i.toString()}>
                          Coluna {String.fromCharCode(65 + i)} {rows![0]?.[i] ? `(${rows![0][i].substring(0, 15)})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {rows && rows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {rows.length} linhas detectadas • {colCount} colunas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
