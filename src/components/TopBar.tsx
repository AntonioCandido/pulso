import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Presentation, 
  Download, 
  Activity, 
  Database, 
  TableProperties, 
  Sliders, 
  CheckCircle2, 
  Printer,
  Menu,
  X,
  ChevronDown,
  User,
  ShieldCheck,
  Sparkles,
  GraduationCap
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileCard(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard Executivo', 
      line1: 'Dashboard',
      line2: 'Executivo',
      shortLabel: 'Dashboard',
      description: 'Visão consolidada de KPIs, metas e taxas de retenção',
      icon: Activity 
    },
    { 
      id: 'sources', 
      label: 'Conexão & Fontes', 
      line1: 'Conexão',
      line2: '& Fontes',
      shortLabel: 'Fontes',
      description: 'Conectores de BI, importação de relatórios PDF e auditoria',
      icon: Database 
    },
    { 
      id: 'audit', 
      label: 'Auditoria Tabular', 
      line1: 'Auditoria',
      line2: 'Tabular',
      shortLabel: 'Auditoria',
      description: 'Grade de revisão, memória de cálculos e prontuário da turma',
      icon: TableProperties 
    },
    { 
      id: 'formulas', 
      label: 'Motor de Fórmulas', 
      line1: 'Motor de',
      line2: 'Fórmulas',
      shortLabel: 'Fórmulas',
      description: 'Pesos e calibração das diretrizes do Pulso 2.0',
      icon: Sliders 
    },
    { 
      id: 'reporting', 
      label: 'Relatórios & Exportação', 
      line1: 'Relatórios',
      line2: '& Exportação',
      shortLabel: 'Relatórios',
      description: 'Geração de planilhas analíticas e apresentações em PPTX',
      icon: FileSpreadsheet 
    },
    { 
      id: 'tests', 
      label: 'Testes de Governança', 
      line1: 'Testes de',
      line2: 'Governança',
      shortLabel: 'Governança',
      description: 'Bateria automatizada de conformidade metodológica',
      icon: CheckCircle2 
    },
  ];

  const getInitials = (name: string) => {
    if (name.includes('Antônio') || name.includes('Antonio') || name.includes('Cândido') || name.includes('Candido')) {
      return 'AC';
    }
    const clean = name.replace(/^(Prof\.|Dr\.|Dra\.|Ms\.|Me\.)\s+/gi, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'AC';
  };

  const currentTabObj = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#072147] via-[#0A3977] to-[#082855] border-b border-blue-900/60 shadow-lg text-white backdrop-blur-md">
      {/* Primary Top Bar Row - Height tuned to h-16 sm:h-16.5 for two-line navigation items */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-16 sm:h-16.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* ========================================================================= */}
        {/* Zone 1: Brand & Identity                                                  */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Estácio Logo in Clean White Emblem */}
          <div className="bg-white rounded-lg px-2 py-0.5 sm:py-1 shadow-sm flex items-center justify-center border border-white/20 transition-transform hover:scale-[1.02]">
            <img
              src="/assets/aistudio/Logo_estacio_sem_fundo_83f2716c.png"
              alt="Estácio"
              className="h-5 sm:h-5.5 w-auto object-contain"
              onError={(e) => {
                // Graceful fallback if asset cannot be resolved
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Title & Product Identity */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black tracking-wider text-white uppercase font-sans flex items-center gap-1">
                <span>PULSO</span>
                <span className="text-[#FFB800]">ACADÊMICO</span>
              </span>
              <span className="hidden xs:inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 bg-cyan-400/20 text-cyan-200 rounded border border-cyan-300/30">
                Pulso 2.0
              </span>
              <span className="hidden sm:inline-flex items-center text-[9px] font-semibold px-1.5 py-0.2 bg-white/10 text-white/90 rounded border border-white/20">
                YDUQS
              </span>
            </div>
            <span className="text-[10px] text-blue-100/80 font-medium tracking-tight hidden md:block">
              Gestão & Inteligência Educacional TI
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Zone 2: Desktop Segmented Navigation (Visible on lg+ screens: >= 1024px)   */}
        {/* Apresentação do texto dos botões em duas linhas                            */}
        {/* ========================================================================= */}
        <nav className="hidden lg:flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.description}
                className={`flex items-center gap-2 px-2.5 xl:px-3 py-1.5 rounded-lg transition-all text-left cursor-pointer select-none ${
                  isActive
                    ? 'bg-white text-[#0A3977] shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0A3977]' : 'text-blue-200'}`} />
                <div className="flex flex-col text-left leading-tight">
                  <span className={`text-[11.5px] whitespace-nowrap leading-tight ${isActive ? 'font-black text-[#0A3977]' : 'font-semibold text-white'}`}>
                    {item.line1}
                  </span>
                  <span className={`text-[10px] whitespace-nowrap leading-tight mt-0.5 ${isActive ? 'font-bold text-[#0A3977]/80' : 'font-medium text-blue-200/80'}`}>
                    {item.line2}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* ========================================================================= */}
        {/* Zone 3: Coordinator Profile (Botão Exportar Relatórios movido para menu)   */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Coordinator Profile Pill with Monogram Badge */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileCard(!showProfileCard)}
              className="flex items-center gap-2 hover:bg-white/10 py-1 px-2 rounded-lg transition-colors cursor-pointer border border-white/15"
              title="Informações da Coordenação"
            >
              {/* High-contrast Resilient Monogram Avatar (AC) */}
              <div className="relative shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-600 to-[#0A3977] text-white font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-white/25">
                  {getInitials(coordinatorName)}
                </div>
                <span 
                  className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A3977] absolute -bottom-0.5 -right-0.5" 
                  title="Sessão de Governança Ativa" 
                />
              </div>

              {/* Name & Title - Display Prof. Antônio Cândido cleanly */}
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white leading-tight whitespace-nowrap">
                  {coordinatorName || 'Prof. Antônio Cândido'}
                </div>
                <div className="text-[10px] text-blue-200/80 leading-none mt-0.5">
                  Coordenação TI
                </div>
              </div>

              <ChevronDown className="w-3 h-3 text-blue-200 hidden md:block" />
            </button>

            {/* Profile Popover Details */}
            {showProfileCard && (
              <div 
                className="absolute right-0 mt-2 w-64 p-3 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs"
                onClick={() => setShowProfileCard(false)}
              >
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-[#0A3977] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {getInitials(coordinatorName)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">
                      {coordinatorName || 'Prof. Antônio Cândido'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Coordenador de Cursos TI
                    </div>
                  </div>
                </div>

                <div className="py-2.5 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Instituição:</span>
                    <strong className="text-slate-800">Estácio / YDUQS</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Modelo Apuração:</span>
                    <strong className="text-[#0A3977]">Pulso 2.0 Oficial</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">E-mail:</span>
                    <span className="text-slate-700 font-mono text-[10px]">antoniocandidorj@gmail.com</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Assinatura Digital de Governança TI</span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger (Visible on < lg screens: < 1024px) */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10"
            title="Abrir Menu de Navegação"
            aria-label="Abrir Menu"
          >
            {showMobileMenu ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* Zone 4: Tablet & Mobile Horizontal Tab Rail (Visible on < lg: < 1024px)    */}
      {/* Enables quick 1-tap switching without having to open the drawer           */}
      {/* ========================================================================= */}
      <div className="lg:hidden bg-[#061e40] border-t border-blue-900/50 px-2 sm:px-4 py-1.5 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-left rounded-lg whitespace-nowrap cursor-pointer shrink-0 transition-all ${
                isActive
                  ? 'bg-white text-[#0A3977] font-bold shadow-xs'
                  : 'text-white/75 hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#0A3977]' : 'text-blue-200'}`} />
              <div className="flex flex-col text-left leading-tight">
                <span className={`text-[11px] leading-tight ${isActive ? 'font-bold text-[#0A3977]' : 'font-semibold text-white'}`}>
                  {item.line1}
                </span>
                <span className={`text-[9.5px] leading-tight mt-0.5 ${isActive ? 'font-semibold text-[#0A3977]/80' : 'font-normal text-blue-200/80'}`}>
                  {item.line2}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* Zone 5: Mobile Navigation Drawer (Dropdown when Menu button is toggled)   */}
      {/* ========================================================================= */}
      {showMobileMenu && (
        <div className="lg:hidden bg-[#07244C] border-t border-blue-900/80 shadow-2xl p-4 animate-in slide-in-from-top-2 duration-150 space-y-4">
          
          {/* Mobile Profile Banner */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 text-white font-black text-xs flex items-center justify-center">
                {getInitials(coordinatorName)}
              </div>
              <div>
                <div className="font-bold text-white text-xs">{coordinatorName}</div>
                <div className="text-[10px] text-blue-200/80">Coordenação de Cursos TI · Estácio</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-400/20 text-cyan-200 rounded border border-cyan-300/30">
              Pulso 2.0
            </span>
          </div>

          {/* Vertical Navigation Cards */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-blue-200/70 uppercase tracking-wider px-1">
              Módulos do Sistema
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#0A3977] font-bold shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/90'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-blue-100 text-[#0A3977]' : 'bg-white/10 text-blue-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-slate-500' : 'text-blue-200/70'}`}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#0A3977] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Export Shortcuts in Mobile Drawer */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-[10px] font-bold text-blue-200/70 uppercase tracking-wider px-1">
              Ações Rápidas de Exportação
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setActiveTab('dashboard');
                  setTimeout(() => window.print(), 100);
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-cyan-300" />
                <span className="text-[10px] font-bold">PDF A4</span>
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onQuickExportExcel();
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span className="text-[10px] font-bold">Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onQuickExportPPTX();
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
              >
                <Presentation className="w-4 h-4 text-amber-300" />
                <span className="text-[10px] font-bold">Slides (.pptx)</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </header>
  );
};
