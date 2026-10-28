import React from 'react';
import { 
  FileSpreadsheet, 
  Presentation, 
  Download, 
  Activity, 
  Database, 
  TableProperties, 
  Sliders, 
  CheckCircle2,
  FileCheck2
} from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickExportExcel: () => void;
  onQuickExportPPTX: () => void;
  coordinatorName: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onQuickExportExcel,
  onQuickExportPPTX,
  coordinatorName,
}) => {
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Executivo', icon: Activity },
    { id: 'sources', label: 'Conexão & Fontes', icon: Database },
    { id: 'audit', label: 'Auditoria Tabular', icon: TableProperties },
    { id: 'formulas', label: 'Motor de Fórmulas', icon: Sliders },
    { id: 'reporting', label: 'Relatórios & Exportação', icon: FileSpreadsheet },
    { id: 'tests', label: 'Testes de Governança', icon: CheckCircle2 },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 px-5 py-3 bg-[#0A3977] border-b border-[#082E60] text-white shadow-md">
      {/* Zone 1: Official Brand Logo & Wordmark */}
      <div className="flex items-center gap-3.5 shrink-0">
        <div className="bg-white/95 rounded-md px-2 py-1 shadow-sm flex items-center justify-center">
          <img
            src="/assets/aistudio/Logo_estacio_sem_fundo_83f2716c.png"
            alt="Logo Estácio"
            className="h-6 w-auto object-contain"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-wider text-[#FFB800] uppercase font-sans">
              PULSO ACADÊMICO
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.2 bg-white/10 text-white rounded border border-white/20">
              YDUQS
            </span>
          </div>
          <span className="text-[11px] text-white/80 font-medium tracking-tight">
            Gestão & Inteligência Educacional TI
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Clean single-line controls) */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white text-[#0A3977] shadow-sm font-bold'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Action & Profile */}
      <div className="flex items-center gap-3 shrink-0 relative">
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-[#FFB800] hover:bg-[#FFA500] rounded-md transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-900" />
            <span>Exportar Relatórios</span>
          </button>

          {showExportMenu && (
            <div 
              className="absolute right-0 mt-2 w-64 p-2 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 z-50 text-xs"
              onClick={() => setShowExportMenu(false)}
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                Saída Executiva Widescreen & Planilhas
              </div>
              <button
                onClick={onQuickExportExcel}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 mt-1 rounded hover:bg-slate-100 transition-colors text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">Planilha Analítica (.xlsx)</div>
                  <div className="text-[11px] text-slate-500">Sumário, auditoria e matriz de risco</div>
                </div>
              </button>
              <button
                onClick={onQuickExportPPTX}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 mt-1 rounded hover:bg-slate-100 transition-colors text-left"
              >
                <Presentation className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">Apresentação PowerPoint (.pptx)</div>
                  <div className="text-[11px] text-slate-500">16:9 Widescreen governança executiva</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Coordinator Profile Avatar */}
        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <img
            src="/src/assets/images/avatar_coordinator_1793208239960.jpg"
            alt={coordinatorName}
            className="w-7 h-7 rounded-full object-cover border border-slate-700"
            referrerPolicy="no-referrer"
          />
          <div className="text-left text-xs">
            <div className="font-medium text-slate-200 leading-none truncate max-w-[120px]">
              {coordinatorName.split(' ')[0]} {coordinatorName.split(' ').slice(-1)[0]}
            </div>
            <div className="text-[10px] text-slate-400 leading-none mt-1">Coordenação TI</div>
          </div>
        </div>
      </div>
    </header>
  );
};
