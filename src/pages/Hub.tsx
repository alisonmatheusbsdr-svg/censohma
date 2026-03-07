import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, LayoutDashboard } from 'lucide-react';

const Hub = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">HMA Systems</h1>
              <p className="text-xs text-muted-foreground">Central de Aplicações Hospitalares</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Link to="/censo" className="block group">
            <div className="h-full bg-card rounded-xl border p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 group-hover:-translate-x-2 group-hover:translate-y-2 transition-transform duration-500">
                <Stethoscope className="w-32 h-32" />
              </div>
              <div className="p-4 rounded-xl bg-primary/10 w-16 h-16 flex items-center justify-center mb-6">
                <Stethoscope className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Censo HMA</h2>
              <p className="text-muted-foreground">
                Reconciliação inteligente de censo hospitalar. Gerencie leitos, altas, admissões e transferências em tempo real.
              </p>
            </div>
          </Link>

          <Link to="/ambulatorio" className="block group">
            <div className="h-full bg-card rounded-xl border p-8 transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 group-hover:-translate-x-2 group-hover:translate-y-2 transition-transform duration-500">
                <Calendar className="w-32 h-32" />
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 w-16 h-16 flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-500 transition-colors">Ambulatório</h2>
              <p className="text-muted-foreground">
                Módulo de análise e gerenciamento de agendas ambulatoriais. Acompanhe marcações, retornos e relatórios.
              </p>
            </div>
          </Link>

        </div>
      </main>
    </div>
  );
};

export default Hub;
