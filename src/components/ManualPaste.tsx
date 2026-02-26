import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ClipboardPaste, AlertTriangle, Sheet, Loader2, RefreshCw } from 'lucide-react';
import { parseManualText, detectColumns } from '@/lib/parseManual';
import type { ColumnMapping } from '@/lib/types';

const SHEET_NAME = 'Confere Censo - CM';

interface ManualPasteProps {
  onParsed: (rows: string[][], mapping: ColumnMapping) => void;
}

export function ManualPaste({ onParsed }: ManualPasteProps) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ prontuario: null, name: null, age: null, sector: null });
  const [lowConfidence, setLowConfidence] = useState(false);

  // Google Sheets state
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [autoSync, setAutoSync] = useState(false);
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

  const handleTextChange = (value: string) => {
    setText(value);
    if (!value.trim()) {
      setRows(null);
      setLowConfidence(false);
      return;
    }
    processRows(parseManualText(value));
  };

  const handleImportSheet = useCallback(async (silent = false) => {
    setSheetError('');
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      if (!silent) setSheetError('Link inválido. Cole o link completo da planilha Google.');
      return;
    }

    if (!silent) setLoading(true);
    syncingRef.current = true;
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error('Falha ao acessar planilha');
      const csvText = await res.text();
      if (!csvText.trim()) throw new Error('Planilha vazia');
      processRows(parseManualText(csvText));
      setLastSync(new Date());
    } catch {
      if (!silent) {
        setSheetError('Não foi possível importar. Verifique se a planilha é pública e o nome da aba está correto.');
        setRows(null);
      }
    } finally {
      if (!silent) setLoading(false);
      syncingRef.current = false;
    }
  }, [sheetUrl]);

  useEffect(() => {
    if (!autoSync || !sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)) return;
    const interval = setInterval(() => {
      if (!syncingRef.current) handleImportSheet(true);
    }, 60_000);
    return () => clearInterval(interval);
  }, [autoSync, sheetUrl, handleImportSheet]);

  const colCount = rows ? Math.max(...rows.map(r => r.length)) : 0;
  const colOptions = Array.from({ length: colCount }, (_, i) => i);

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    const newMapping = { ...mapping, [field]: value === 'none' ? null : parseInt(value) };
    setMapping(newMapping);
    if (rows) onParsed(rows, newMapping);
  };

  const sharedFooter = (
    <>
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
    </>
  );

  return (
    <Card className="h-full border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardPaste className="h-4 w-4 text-primary" />
          Lista Manual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs defaultValue="paste">
          <TabsList className="w-full">
            <TabsTrigger value="paste" className="flex-1 gap-1.5 text-xs">
              <ClipboardPaste className="h-3.5 w-3.5" />
              Colar
            </TabsTrigger>
            <TabsTrigger value="sheets" className="flex-1 gap-1.5 text-xs">
              <Sheet className="h-3.5 w-3.5" />
              Google Sheets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-3">
            <Textarea
              placeholder="Cole aqui os dados da planilha manual (Ctrl+V)..."
              className="min-h-[140px] font-mono text-xs"
              value={text}
              onChange={e => handleTextChange(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="sheets" className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Link da Planilha</Label>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="text-xs"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
              />
            </div>
            <Button onClick={() => handleImportSheet(false)} disabled={loading} className="w-full gap-2" size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sheet className="h-4 w-4" />}
              {loading ? 'Importando...' : 'Importar'}
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch id="auto-sync" checked={autoSync} onCheckedChange={setAutoSync} />
                <Label htmlFor="auto-sync" className="text-xs cursor-pointer">Sync automático</Label>
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
          </TabsContent>
        </Tabs>

        {sharedFooter}
      </CardContent>
    </Card>
  );
}
