import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ClipboardPaste, AlertTriangle } from 'lucide-react';
import { parseManualText, detectColumns } from '@/lib/parseManual';
import type { ColumnMapping } from '@/lib/types';

interface ManualPasteProps {
  onParsed: (rows: string[][], mapping: ColumnMapping) => void;
}

export function ManualPaste({ onParsed }: ManualPasteProps) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ prontuario: null, name: null, age: null, sector: null });
  const [lowConfidence, setLowConfidence] = useState(false);

  const handleTextChange = (value: string) => {
    setText(value);
    if (!value.trim()) {
      setRows(null);
      setLowConfidence(false);
      return;
    }

    const parsed = parseManualText(value);
    setRows(parsed);

    const { mapping: detected, confidence } = detectColumns(parsed);
    setMapping(detected);
    setLowConfidence(confidence < 0.5);
    onParsed(parsed, detected);
  };

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
          <ClipboardPaste className="h-4 w-4 text-primary" />
          Lista Manual (Colar)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Cole aqui os dados da planilha manual (Ctrl+V)..."
          className="min-h-[140px] font-mono text-xs"
          value={text}
          onChange={e => handleTextChange(e.target.value)}
        />

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
                          Coluna {String.fromCharCode(65 + i)} {rows[0]?.[i] ? `(${rows[0][i].substring(0, 15)})` : ''}
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
