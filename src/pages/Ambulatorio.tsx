import { useState, useCallback } from 'react';
import { Calendar, ArrowLeft, UploadCloud, FileType, Trash2, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { parsePdfToPatients } from '@/lib/parsePdf';
import { exportAmbulatorioToExcel } from '@/lib/exportData';
import type { AmbulatorioPatient, AmbulatorioResult } from '@/lib/types';

const Ambulatorio = () => {
  const [patients, setPatients] = useState<AmbulatorioPatient[]>([]);
  const [servico, setServico] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileProcess = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, envie apenas arquivos em formato PDF.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const extracted = await parsePdfToPatients(file);
      if (extracted.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "O PDF não parece conter listagem no formato padrão do sistema.",
          variant: "destructive"
        });
      } else {
        setPatients(extracted);
        toast({
          title: "Sucesso!",
          description: `${extracted.length} pacientes extraídos do relatório.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao ler PDF",
        description: error.message || "Falha na extração de dados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  }, []);

  const handleClear = () => {
    setPatients([]);
  };

  const handleSexChange = (index: number, value: string) => {
    setPatients(prev => {
      const newPatients = [...prev];
      newPatients[index] = { ...newPatients[index], sexo: value };
      return newPatients;
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Ambulatório HMA</h1>
              <p className="text-xs text-muted-foreground">Gerenciamento de Agendas e Consultas</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Hub
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full space-y-6">
        
        {/* Upload Area */}
        {patients.length === 0 && (
          <Card className="border-2 border-dashed border-border/60 bg-card/50">
            <div
              className={`p-16 flex flex-col items-center justify-center text-center transition-colors rounded-xl ${
                isDragOver ? "bg-primary/5 border-primary" : "hover:bg-accent/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
              onDrop={onDrop}
            >
              <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                {isLoading ? (
                  <FileType className="w-8 h-8 text-blue-500 animate-pulse" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-blue-500" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {isLoading ? "Processando PDF..." : "Carregar Relatório SOULMV"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Arraste e solte o "Relatório de Pacientes Agendados" em PDF aqui, ou clique no botão abaixo.
              </p>
              <div className="relative">
                <Button size="lg" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Selecionar PDF
                </Button>
                <input
                  type="file"
                  accept="application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  disabled={isLoading}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Results Area */}
        {patients.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Pacientes Extraídos ({patients.length})</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportAmbulatorioToExcel(patients)} className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px] font-semibold text-foreground">Prontuário</TableHead>
                    <TableHead className="font-semibold text-foreground">Nome do Paciente</TableHead>
                    <TableHead className="w-[150px] font-semibold text-foreground text-center">Data de Nasc.</TableHead>
                    <TableHead className="w-[100px] font-semibold text-foreground text-center">Idade</TableHead>
                    <TableHead className="w-[120px] font-semibold text-foreground text-center">Sexo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient, i) => (
                    <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{patient.prontuario}</TableCell>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{patient.dataNascimento}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-sm font-medium">
                          {patient.idade} anos
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <ToggleGroup 
                          type="single" 
                          value={patient.sexo || ""} 
                          onValueChange={(value) => handleSexChange(i, value)}
                          className="justify-center"
                        >
                          <ToggleGroupItem value="M" aria-label="Masculino" className="h-8 px-2.5 text-xs font-semibold data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800">
                            M
                          </ToggleGroupItem>
                          <ToggleGroupItem value="F" aria-label="Feminino" className="h-8 px-2.5 text-xs font-semibold data-[state=on]:bg-pink-100 data-[state=on]:text-pink-800">
                            F
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Ambulatorio;
