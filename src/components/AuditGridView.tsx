import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp,
  ArrowDown,
  Edit3, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert,
  Flame,
  Info,
  RotateCcw,
  Clock,
  Users,
  BookOpen,
  Activity,
  CheckSquare,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Scale,
  Copy,
  Check,
  Target,
  GraduationCap,
  School,
  CheckCircle,
  ListChecks,
  Calendar,
  Sparkles
} from 'lucide-react';
import { DisciplineMetric, AcademicCourse, LHIStatus, ARSLevel, FormulaWeights } from '../types';
import { 
  calculateLHI, 
  calculateARS, 
  getLHIStatus, 
  getARSLevel, 
  getRecommendedPedagogicalAction,
  getDetailedPedagogicalDiagnostic,
  DetailedPedagogicalDiagnostic
} from '../utils/calculations';

interface AuditGridViewProps {
  disciplines: DisciplineMetric[];
  onUpdateDiscipline: (updated: DisciplineMetric) => void;
  onBatchUpdateDisciplines: (updatedItems: DisciplineMetric[]) => void;
  weights: FormulaWeights;
  initialCourseFilter?: AcademicCourse | null;
  initialRiskOnly?: boolean;
}

// Semantic visual tokens for ARS Risk Levels
const getARSRiskTheme = (level: ARSLevel, arsScore: number) => {
  if (level === 'Crítico' || arsScore >= 65) {
    return {
      label: 'Risco Crítico',
      shortLabel: 'Crítico',
      rangeText: '≥ 65 pts',
      textColor: 'text-rose-700',
      subTextColor: 'text-rose-600',
      bgTint: 'bg-rose-50/80',
      rowHover: 'hover:bg-rose-50/40',
      borderTint: 'border-rose-200',
      barColor: 'bg-rose-600',
      barTrack: 'bg-rose-100',
      icon: Flame,
      iconColor: 'text-rose-600',
    };
  }
  if (level === 'Alto' || arsScore >= 45) {
    return {
      label: 'Risco Alto',
      shortLabel: 'Alto',
      rangeText: '45 – 64 pts',
      textColor: 'text-orange-700',
      subTextColor: 'text-orange-600',
      bgTint: 'bg-orange-50/80',
      rowHover: 'hover:bg-orange-50/35',
      borderTint: 'border-orange-200',
      barColor: 'bg-orange-500',
      barTrack: 'bg-orange-100',
      icon: ShieldAlert,
      iconColor: 'text-orange-600',
    };
  }
  if (level === 'Moderado' || arsScore >= 25) {
    return {
      label: 'Risco Moderado',
      shortLabel: 'Moderado',
      rangeText: '25 – 44 pts',
      textColor: 'text-amber-700',
      subTextColor: 'text-amber-600',
      bgTint: 'bg-amber-50/80',
      rowHover: 'hover:bg-amber-50/30',
      borderTint: 'border-amber-200',
      barColor: 'bg-amber-500',
      barTrack: 'bg-amber-100',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    };
  }
  return {
    label: 'Risco Baixo',
    shortLabel: 'Baixo',
    rangeText: '< 25 pts',
    textColor: 'text-emerald-700',
    subTextColor: 'text-emerald-600',
    bgTint: 'bg-emerald-50/75',
    rowHover: 'hover:bg-emerald-50/25',
    borderTint: 'border-emerald-200',
    barColor: 'bg-emerald-500',
    barTrack: 'bg-emerald-100',
    icon: ShieldCheck,
    iconColor: 'text-emerald-600',
  };
};

// Semantic visual tokens for LHI Health Status
const getLHIHealthTheme = (status: LHIStatus, lhiScore: number) => {
  if (status === 'Excelente' || lhiScore >= 85) {
    return {
      textColor: 'text-teal-700',
      subTextColor: 'text-teal-600',
      bgTint: 'bg-teal-50/70',
      barColor: 'bg-teal-600',
      barTrack: 'bg-teal-100',
    };
  }
  if (status === 'Saudável' || lhiScore >= 70) {
    return {
      textColor: 'text-emerald-700',
      subTextColor: 'text-emerald-600',
      bgTint: 'bg-emerald-50/60',
      barColor: 'bg-emerald-500',
      barTrack: 'bg-emerald-100',
    };
  }
  if (status === 'Alerta' || lhiScore >= 55) {
    return {
      textColor: 'text-amber-700',
      subTextColor: 'text-amber-600',
      bgTint: 'bg-amber-50/70',
      barColor: 'bg-amber-500',
      barTrack: 'bg-amber-100',
    };
  }
  return {
    textColor: 'text-rose-700',
    subTextColor: 'text-rose-600',
    bgTint: 'bg-rose-50/70',
    barColor: 'bg-rose-600',
    barTrack: 'bg-rose-100',
  };
};

export const AuditGridView: React.FC<AuditGridViewProps> = ({
  disciplines,
  onUpdateDiscipline,
  onBatchUpdateDisciplines,
  weights,
  initialCourseFilter = null,
  initialRiskOnly = false,
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>(initialCourseFilter || 'ALL');
  const [lhiFilter, setLhiFilter] = useState<string>('ALL');
  const [arsFilter, setArsFilter] = useState<string>(initialRiskOnly ? 'RISK_HIGH' : 'ALL');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<keyof DisciplineMetric>('ars');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default desc for risk

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal / Drawer state for editing
  const [editingItem, setEditingItem] = useState<DisciplineMetric | null>(null);
  const [auditNote, setAuditNote] = useState('');

  // Detail drawer state
  const [viewingDetailItem, setViewingDetailItem] = useState<DisciplineMetric | null>(null);

  // Calculation verification panel state (RF04 - Formula transparency)
  const [selectedCalcDiscipline, setSelectedCalcDiscipline] = useState<DisciplineMetric | null>(null);
  const [copiedFormula, setCopiedFormula] = useState<boolean>(false);
  const [calcViewMode, setCalcViewMode] = useState<'both' | 'lhi' | 'ars'>('both');

  // Risk distribution counts across the current base (filtered by course/search/semester so cards stay contextual)
  const riskCounts = useMemo(() => {
    const counts = {
      ALL: disciplines.length,
      Baixo: 0,
      Moderado: 0,
      Alto: 0,
      Crítico: 0,
    };
    disciplines.forEach((d) => {
      const level = getARSLevel(d.ars);
      counts[level] = (counts[level] || 0) + 1;
    });
    return counts;
  }, [disciplines]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    return disciplines
      .filter((item) => {
        // Search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchName = item.name.toLowerCase().includes(term);
          const matchCode = item.code.toLowerCase().includes(term);
          const matchClass = item.classCode.toLowerCase().includes(term);
          const matchProf = item.professor.toLowerCase().includes(term);
          if (!matchName && !matchCode && !matchClass && !matchProf) return false;
        }

        // Course filter
        if (courseFilter !== 'ALL' && item.course !== courseFilter) return false;

        // LHI filter
        if (lhiFilter !== 'ALL' && item.lhiStatus !== lhiFilter) return false;

        // ARS filter
        const effectiveArsLevel = getARSLevel(item.ars);
        if (arsFilter === 'RISK_HIGH') {
          if (item.ars < 45 && item.failureRate < 25) return false;
        } else if (arsFilter !== 'ALL' && effectiveArsLevel !== arsFilter) {
          return false;
        }

        // Semester filter
        if (semesterFilter !== 'ALL' && item.semester.toString() !== semesterFilter) return false;

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [disciplines, searchTerm, courseFilter, lhiFilter, arsFilter, semesterFilter, sortField, sortAsc]);

  // Summary metrics of filtered data
  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) {
      return { totalStudents: 0, avgLhi: 0, avgArs: 0, avgFailure: 0 };
    }
    const totalStudents = filteredData.reduce((acc, item) => acc + item.totalStudents, 0);
    const avgLhi = Number((filteredData.reduce((acc, item) => acc + item.lhi, 0) / filteredData.length).toFixed(1));
    const avgArs = Number((filteredData.reduce((acc, item) => acc + item.ars, 0) / filteredData.length).toFixed(1));
    const avgFailure = Number((filteredData.reduce((acc, item) => acc + item.failureRate, 0) / filteredData.length).toFixed(1));
    return { totalStudents, avgLhi, avgArs, avgFailure };
  }, [filteredData]);

  const handleSort = (field: keyof DisciplineMetric) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const renderSortIcon = (field: keyof DisciplineMetric) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-blue-200/60 group-hover:text-white transition-colors shrink-0" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-amber-300 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-300 shrink-0" />
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((d) => d.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Live preview calculations when editing an item
  const liveEditPreview = useMemo(() => {
    if (!editingItem) return null;
    const lhi = calculateLHI(
      editingItem.learningScore,
      editingItem.attendanceRate,
      editingItem.failureRate,
      editingItem.lmsAdherenceRate,
      weights.lhi
    );
    const ars = calculateARS(
      editingItem.failureRate,
      editingItem.attendanceRate,
      editingItem.learningScore,
      editingItem.dropoutRiskRate,
      weights.ars
    );
    const lhiStatus = getLHIStatus(lhi);
    const arsLevel = getARSLevel(ars);
    return { lhi, ars, lhiStatus, arsLevel };
  }, [editingItem, weights]);

  // Inline audit submission (preserves originalValues from source before first edit)
  const handleSaveAuditEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !liveEditPreview) return;

    const currentInList = disciplines.find((d) => d.id === editingItem.id);
    const preservedOriginals = currentInList?.originalValues || {
      learningScore: currentInList?.learningScore ?? editingItem.learningScore,
      failureRate: currentInList?.failureRate ?? editingItem.failureRate,
      attendanceRate: currentInList?.attendanceRate ?? editingItem.attendanceRate,
      lmsAdherenceRate: currentInList?.lmsAdherenceRate ?? editingItem.lmsAdherenceRate,
    };

    const updated: DisciplineMetric = {
      ...editingItem,
      originalValues: preservedOriginals,
      lhi: liveEditPreview.lhi,
      ars: liveEditPreview.ars,
      lhiStatus: liveEditPreview.lhiStatus,
      arsLevel: liveEditPreview.arsLevel,
      recommendedAction: getRecommendedPedagogicalAction({
        ...editingItem,
        lhi: liveEditPreview.lhi,
        ars: liveEditPreview.ars,
      }),
      isManuallyAdjusted: true,
      auditNote: auditNote || 'Ajuste auditado pela Coordenação de Curso.',
      sourceType: 'Ajuste Manual',
      lastUpdated:
        new Date().toLocaleDateString('pt-BR') +
        ' ' +
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdateDiscipline(updated);
    setEditingItem(null);
    setAuditNote('');
  };

  const handleMarkTutoringBatch = () => {
    const updated = disciplines.map((item) => {
      if (selectedIds.has(item.id)) {
        return {
          ...item,
          recommendedAction: 'Convocação para Programa de Monitoria / Tutoria Prioritária TI.',
          auditNote: 'Turma sinalizada em lote para tutoria pedagógica intensiva.',
          isManuallyAdjusted: true,
        };
      }
      return item;
    });
    onBatchUpdateDisciplines(updated);
    setSelectedIds(new Set());
  };

  const sortFieldLabels: Partial<Record<keyof DisciplineMetric, string>> = {
    name: 'Disciplina',
    course: 'Curso',
    totalStudents: 'Alunos',
    learningScore: 'Aprendizagem',
    failureRate: 'Reprovação',
    attendanceRate: 'Frequência',
    studyHoursPerWeek: 'Dedicação',
    lhi: 'LHI (Saúde)',
    ars: 'ARS (Risco)',
  };

  const hasActiveFilters =
    searchTerm !== '' || courseFilter !== 'ALL' || arsFilter !== 'ALL' || lhiFilter !== 'ALL' || semesterFilter !== 'ALL';

  return (
    <div className="space-y-5">
      {/* Executive Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="font-bold text-[#0A3977]">RF04</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-600">Auditoria e Governança Tabular</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {filteredData.length} {filteredData.length === 1 ? 'turma listada' : 'turmas listadas'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500">
                Perfil Ativo: <strong className="text-slate-700">{weights.presetName || 'Padrão Estácio'}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Grid Interativo de Auditoria e Revisão de Dados
            </h1>
          </div>

          {/* Right Quick Summary & Batch Action */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <CheckSquare className="w-4 h-4 text-[#0A3977]" />
                <span className="font-bold text-[#0A3977] tabular-nums">
                  {selectedIds.size} {selectedIds.size === 1 ? 'selecionada' : 'selecionadas'}
                </span>
                <button
                  onClick={handleMarkTutoringBatch}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0A3977] hover:bg-blue-800 rounded transition-colors cursor-pointer whitespace-nowrap"
                >
                  Marcar Tutoria em Lote
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Discentes Monitorados</span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">{summaryStats.totalStudents}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-500 block text-[10px]">LHI Médio (Saúde)</span>
                  <span className={`font-bold text-sm tabular-nums ${getLHIHealthTheme(getLHIStatus(summaryStats.avgLhi), summaryStats.avgLhi).textColor}`}>
                    {summaryStats.avgLhi}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-500 block text-[10px]">ARS Médio (Risco)</span>
                  <span className={`font-bold text-sm tabular-nums ${getARSRiskTheme(getARSLevel(summaryStats.avgArs), summaryStats.avgArs).textColor}`}>
                    {summaryStats.avgArs} · {getARSLevel(summaryStats.avgArs)}
                  </span>
                </div>
              </div>
            )}

            {/* Calculation Verification Panel trigger button */}
            <button
              onClick={() => setSelectedCalcDiscipline(filteredData[0] || disciplines[0] || null)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#0A3977] bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Abrir Painel de Verificação e Memória de Cálculo (Transparência LHI/ARS)"
            >
              <Calculator className="w-4 h-4 text-[#0A3977]" />
              <span className="hidden sm:inline">Verificar Cálculos</span>
              <span className="text-[10px] bg-blue-100 text-[#0A3977] font-bold px-1.5 py-0.5 rounded">
                LHI / ARS
              </span>
            </button>
          </div>
        </div>

        {/* Interactive Risk Level Matrix Strip (Click to Filter by ARS Risk Level) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-700">
              Filtro Rápido por Escala de Risco Acadêmico (ARS — Academic Risk Score)
            </span>
            <span className="text-[11px] text-slate-500">
              Clique em uma faixa para filtrar as disciplinas por severidade
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Todos */}
            <button
              type="button"
              onClick={() => setArsFilter('ALL')}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                arsFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50/70 hover:bg-slate-100/80 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${arsFilter === 'ALL' ? 'text-white' : 'text-slate-700'}`}>
                  Todas as Turmas
                </span>
                <span className={`text-base font-extrabold tabular-nums ${arsFilter === 'ALL' ? 'text-amber-300' : 'text-slate-900'}`}>
                  {riskCounts.ALL}
                </span>
              </div>
              <div className={`text-[11px] mt-1 ${arsFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
                Visão global (0 – 100 pts)
              </div>
              <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden mt-2 flex">
                <div className="bg-emerald-500 h-full" style={{ width: `${riskCounts.ALL ? (riskCounts.Baixo / riskCounts.ALL) * 100 : 25}%` }} />
                <div className="bg-amber-500 h-full" style={{ width: `${riskCounts.ALL ? (riskCounts.Moderado / riskCounts.ALL) * 100 : 25}%` }} />
                <div className="bg-orange-500 h-full" style={{ width: `${riskCounts.ALL ? (riskCounts.Alto / riskCounts.ALL) * 100 : 25}%` }} />
                <div className="bg-rose-600 h-full" style={{ width: `${riskCounts.ALL ? (riskCounts.Crítico / riskCounts.ALL) * 100 : 25}%` }} />
              </div>
            </button>

            {/* Risco Baixo */}
            <button
              type="button"
              onClick={() => setArsFilter(arsFilter === 'Baixo' ? 'ALL' : 'Baixo')}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                arsFilter === 'Baixo'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50/60 hover:bg-emerald-50 text-emerald-950 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={`w-3.5 h-3.5 ${arsFilter === 'Baixo' ? 'text-white' : 'text-emerald-600'}`} />
                  <span className="text-xs font-bold">Risco Baixo</span>
                </div>
                <span className="text-base font-extrabold tabular-nums">{riskCounts.Baixo}</span>
              </div>
              <div className={`text-[11px] mt-1 flex items-center justify-between ${arsFilter === 'Baixo' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                <span>ARS &lt; 25 pts</span>
                <span className="tabular-nums font-semibold">
                  {riskCounts.ALL ? Math.round((riskCounts.Baixo / riskCounts.ALL) * 100) : 0}%
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${arsFilter === 'Baixo' ? 'bg-emerald-800' : 'bg-emerald-200/70'}`}>
                <div
                  className={`h-full rounded-full ${arsFilter === 'Baixo' ? 'bg-white' : 'bg-emerald-500'}`}
                  style={{ width: `${riskCounts.ALL ? (riskCounts.Baixo / riskCounts.ALL) * 100 : 0}%` }}
                />
              </div>
            </button>

            {/* Risco Moderado */}
            <button
              type="button"
              onClick={() => setArsFilter(arsFilter === 'Moderado' ? 'ALL' : 'Moderado')}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                arsFilter === 'Moderado'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50/70 hover:bg-amber-50 text-amber-950 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className={`w-3.5 h-3.5 ${arsFilter === 'Moderado' ? 'text-white' : 'text-amber-600'}`} />
                  <span className="text-xs font-bold">Risco Moderado</span>
                </div>
                <span className="text-base font-extrabold tabular-nums">{riskCounts.Moderado}</span>
              </div>
              <div className={`text-[11px] mt-1 flex items-center justify-between ${arsFilter === 'Moderado' ? 'text-amber-50' : 'text-amber-700'}`}>
                <span>ARS 25 – 44 pts</span>
                <span className="tabular-nums font-semibold">
                  {riskCounts.ALL ? Math.round((riskCounts.Moderado / riskCounts.ALL) * 100) : 0}%
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${arsFilter === 'Moderado' ? 'bg-amber-700' : 'bg-amber-200/70'}`}>
                <div
                  className={`h-full rounded-full ${arsFilter === 'Moderado' ? 'bg-white' : 'bg-amber-500'}`}
                  style={{ width: `${riskCounts.ALL ? (riskCounts.Moderado / riskCounts.ALL) * 100 : 0}%` }}
                />
              </div>
            </button>

            {/* Risco Alto */}
            <button
              type="button"
              onClick={() => setArsFilter(arsFilter === 'Alto' ? 'ALL' : 'Alto')}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                arsFilter === 'Alto'
                  ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                  : 'bg-orange-50/70 hover:bg-orange-50 text-orange-950 border-orange-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className={`w-3.5 h-3.5 ${arsFilter === 'Alto' ? 'text-white' : 'text-orange-600'}`} />
                  <span className="text-xs font-bold">Risco Alto</span>
                </div>
                <span className="text-base font-extrabold tabular-nums">{riskCounts.Alto}</span>
              </div>
              <div className={`text-[11px] mt-1 flex items-center justify-between ${arsFilter === 'Alto' ? 'text-orange-100' : 'text-orange-700'}`}>
                <span>ARS 45 – 64 pts</span>
                <span className="tabular-nums font-semibold">
                  {riskCounts.ALL ? Math.round((riskCounts.Alto / riskCounts.ALL) * 100) : 0}%
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${arsFilter === 'Alto' ? 'bg-orange-800' : 'bg-orange-200/70'}`}>
                <div
                  className={`h-full rounded-full ${arsFilter === 'Alto' ? 'bg-white' : 'bg-orange-500'}`}
                  style={{ width: `${riskCounts.ALL ? (riskCounts.Alto / riskCounts.ALL) * 100 : 0}%` }}
                />
              </div>
            </button>

            {/* Risco Crítico */}
            <button
              type="button"
              onClick={() => setArsFilter(arsFilter === 'Crítico' ? 'ALL' : 'Crítico')}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                arsFilter === 'Crítico'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-rose-50/70 hover:bg-rose-50 text-rose-950 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className={`w-3.5 h-3.5 ${arsFilter === 'Crítico' ? 'text-white' : 'text-rose-600'}`} />
                  <span className="text-xs font-bold">Risco Crítico</span>
                </div>
                <span className="text-base font-extrabold tabular-nums">{riskCounts.Crítico}</span>
              </div>
              <div className={`text-[11px] mt-1 flex items-center justify-between ${arsFilter === 'Crítico' ? 'text-rose-100' : 'text-rose-700'}`}>
                <span>ARS &ge; 65 pts</span>
                <span className="tabular-nums font-semibold">
                  {riskCounts.ALL ? Math.round((riskCounts.Crítico / riskCounts.ALL) * 100) : 0}%
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${arsFilter === 'Crítico' ? 'bg-rose-800' : 'bg-rose-200/70'}`}>
                <div
                  className={`h-full rounded-full ${arsFilter === 'Crítico' ? 'bg-white' : 'bg-rose-600'}`}
                  style={{ width: `${riskCounts.ALL ? (riskCounts.Crítico / riskCounts.ALL) * 100 : 0}%` }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por disciplina, código (TI-101), turma ou docente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-[#0A3977] text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Course filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-[#0A3977] font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">Todos os Cursos de TI</option>
              <option value="Ciência da Computação">Ciência da Computação</option>
              <option value="Engenharia de Software">Engenharia de Software</option>
              <option value="Análise e Desenv. de Sistemas">Análise e Desenv. de Sistemas</option>
              <option value="Sistemas de Informação">Sistemas de Informação</option>
              <option value="Segurança da Informação">Segurança da Informação</option>
            </select>
          </div>

          {/* ARS Risk Filter */}
          <div>
            <select
              value={arsFilter}
              onChange={(e) => setArsFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-[#0A3977] font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">Qualquer Nível de Risco (ARS)</option>
              <option value="RISK_HIGH">Apenas Risco Alto / Crítico</option>
              <option value="Baixo">Risco Baixo (&lt; 25)</option>
              <option value="Moderado">Risco Moderado (25 - 44)</option>
              <option value="Alto">Risco Alto (45 - 64)</option>
              <option value="Crítico">Risco Crítico (&ge; 65)</option>
            </select>
          </div>

          {/* LHI Health Filter */}
          <div>
            <select
              value={lhiFilter}
              onChange={(e) => setLhiFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-[#0A3977] font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">Qualquer Saúde (LHI)</option>
              <option value="Excelente">LHI Excelente (&ge; 85)</option>
              <option value="Saudável">LHI Saudável (70 - 84)</option>
              <option value="Alerta">LHI em Alerta (55 - 69)</option>
              <option value="Crítico">LHI Crítico (&lt; 55)</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-[#0A3977] font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">Todos os Semestres</option>
              <option value="1">1º Semestre</option>
              <option value="2">2º Semestre</option>
              <option value="3">3º Semestre</option>
              <option value="4">4º Semestre</option>
              <option value="5">5º Semestre</option>
              <option value="6">6º Semestre</option>
            </select>
          </div>
        </div>

        {/* Active Filters Kicker & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>Ordenação ativa:</span>
            <span className="font-bold text-[#0A3977]">
              {sortFieldLabels[sortField] || String(sortField)}
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-medium text-slate-600">
              {sortAsc ? 'Ordem Crescente ↑' : 'Ordem Decrescente ↓'}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCourseFilter('ALL');
                setArsFilter('ALL');
                setLhiFilter('ALL');
                setSemesterFilter('ALL');
              }}
              className="text-[#0A3977] hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Todos os Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabular Grid Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0A3977] text-white font-semibold select-none border-b border-[#072957]">
                <th className="py-3 px-3 w-9 text-center">
                  <input
                    type="checkbox"
                    checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                    onChange={toggleSelectAll}
                    className="rounded border-blue-300 text-amber-400 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3 cursor-pointer group hover:bg-[#0d458f] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Disciplina & Turma</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('course')}
                  className="py-3 px-3 cursor-pointer group hover:bg-[#0d458f] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Curso</span>
                    {renderSortIcon('course')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalStudents')}
                  className="py-3 px-3 text-right cursor-pointer group hover:bg-[#0d458f] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Alunos</span>
                    {renderSortIcon('totalStudents')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('learningScore')}
                  className="py-3 px-3 text-right cursor-pointer group hover:bg-[#0d458f] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Aprendizagem</span>
                    {renderSortIcon('learningScore')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('failureRate')}
                  className="py-3 px-3 text-right cursor-pointer group hover:bg-[#0d458f] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Reprovação</span>
                    {renderSortIcon('failureRate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('attendanceRate')}
                  className="py-3 px-3 text-right cursor-pointer group hover:bg-[#0d458f] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Frequência</span>
                    {renderSortIcon('attendanceRate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('studyHoursPerWeek')}
                  className="py-3 px-3 text-right cursor-pointer group hover:bg-[#0d458f] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Dedicação</span>
                    {renderSortIcon('studyHoursPerWeek')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lhi')}
                  className="py-3 px-3 text-right cursor-pointer group hover:bg-[#0d458f] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>LHI (Saúde)</span>
                    {renderSortIcon('lhi')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('ars')}
                  className="py-3 px-4 text-right cursor-pointer group bg-[#072d61] hover:bg-[#0d458f] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-amber-300 font-bold">ARS (Nível de Risco)</span>
                    {renderSortIcon('ars')}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-xs text-slate-500">
                    {disciplines.length === 0 ? (
                      <div>
                        <div className="font-semibold text-slate-700 text-sm mb-1">Base de dados limpa (0 registros)</div>
                        <div className="text-slate-400">
                          Todas as informações foram zeradas. Utilize o conector de BI ou relatórios PDF na aba Fontes para carregar novos dados.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="font-semibold text-slate-700 text-sm">
                          Nenhuma disciplina encontrada com os filtros selecionados.
                        </div>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setCourseFilter('ALL');
                            setArsFilter('ALL');
                            setLhiFilter('ALL');
                            setSemesterFilter('ALL');
                          }}
                          className="text-[#0A3977] font-semibold hover:underline cursor-pointer"
                        >
                          Limpar filtros e exibir todas as turmas
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const isSelected = selectedIds.has(item.id);
                  const effectiveArsLevel = getARSLevel(item.ars);
                  const effectiveLhiStatus = getLHIStatus(item.lhi);
                  const riskTheme = getARSRiskTheme(effectiveArsLevel, item.ars);
                  const healthTheme = getLHIHealthTheme(effectiveLhiStatus, item.lhi);
                  const RiskIcon = riskTheme.icon;

                  // Semantic colors for individual metrics
                  const learningColor =
                    item.learningScore >= 60
                      ? 'text-emerald-700'
                      : item.learningScore >= 45
                      ? 'text-amber-700'
                      : 'text-rose-700';
                  const learningBar =
                    item.learningScore >= 60
                      ? 'bg-emerald-500'
                      : item.learningScore >= 45
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                  const failureColor =
                    item.failureRate >= 25
                      ? 'text-rose-700'
                      : item.failureRate >= 15
                      ? 'text-amber-700'
                      : 'text-emerald-700';
                  const failureBar =
                    item.failureRate >= 25
                      ? 'bg-rose-600'
                      : item.failureRate >= 15
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                  const attendanceColor =
                    item.attendanceRate >= 80
                      ? 'text-emerald-700'
                      : item.attendanceRate >= 75
                      ? 'text-amber-700'
                      : 'text-rose-700';
                  const attendanceBar =
                    item.attendanceRate >= 80
                      ? 'bg-emerald-500'
                      : item.attendanceRate >= 75
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70'
                          : idx % 2 === 1
                          ? 'bg-slate-50/35'
                          : 'bg-white'
                      } ${riskTheme.rowHover}`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          className="rounded border-slate-300 text-[#0A3977] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Disciplina & Turma */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 tracking-tight">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-semibold text-[#0A3977]">{item.code}</span>
                          <span aria-hidden="true">·</span>
                          <span>Turma {item.classCode}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600">{item.professor}</span>
                          {item.isManuallyAdjusted && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700 font-semibold">Auditado</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Curso */}
                      <td className="py-3.5 px-3 text-slate-800 whitespace-nowrap">
                        <div className="font-medium">{item.course}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.semester}º Semestre · {item.shift}
                        </div>
                      </td>

                      {/* Alunos */}
                      <td className="py-3.5 px-3 text-right tabular-nums">
                        <span className="font-semibold text-slate-800">{item.totalStudents}</span>
                        <div className="text-[10px] text-slate-400">alunos</div>
                      </td>

                      {/* Aprendizagem */}
                      <td className="py-3.5 px-3 text-right tabular-nums">
                        <div className={`font-bold ${learningColor}`}>{item.learningScore}%</div>
                        <div className="w-16 ml-auto h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${learningBar}`}
                            style={{ width: `${Math.min(100, Math.max(0, item.learningScore))}%` }}
                          />
                        </div>
                      </td>

                      {/* Reprovação */}
                      <td className="py-3.5 px-3 text-right tabular-nums">
                        <div className={`font-bold ${failureColor}`}>{item.failureRate}%</div>
                        <div className="w-16 ml-auto h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${failureBar}`}
                            style={{ width: `${Math.min(100, Math.max(0, item.failureRate * 2))}%` }}
                          />
                        </div>
                      </td>

                      {/* Frequência */}
                      <td className="py-3.5 px-3 text-right tabular-nums">
                        <div className={`font-bold ${attendanceColor}`}>{item.attendanceRate}%</div>
                        <div className="w-16 ml-auto h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${attendanceBar}`}
                            style={{ width: `${Math.min(100, Math.max(0, item.attendanceRate))}%` }}
                          />
                        </div>
                      </td>

                      {/* Dedicação */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.studyTimeFormatted ? item.studyTimeFormatted : `${item.studyHoursPerWeek}h`}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">hh:mm acum.</div>
                      </td>

                      {/* LHI (Saúde) with semantic status color - Clickable for formula audit */}
                      <td 
                        onClick={() => setSelectedCalcDiscipline(item)}
                        className={`py-3.5 px-3 text-right tabular-nums ${healthTheme.bgTint} cursor-pointer group hover:brightness-95 transition-all`}
                        title="Clique para auditar a memória de cálculo da fórmula LHI"
                      >
                        <div className={`font-extrabold text-sm ${healthTheme.textColor} group-hover:underline`}>
                          {item.lhi.toFixed(1)}
                        </div>
                        <div className={`text-[11px] font-semibold ${healthTheme.subTextColor}`}>
                          {effectiveLhiStatus}
                        </div>
                        <div className={`w-16 ml-auto h-1 rounded-full overflow-hidden mt-1 ${healthTheme.barTrack}`}>
                          <div
                            className={`h-full rounded-full ${healthTheme.barColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, item.lhi))}%` }}
                          />
                        </div>
                      </td>

                      {/* ARS (Risco) with dedicated semantic color highlight - Clickable for formula audit */}
                      <td 
                        onClick={() => setSelectedCalcDiscipline(item)}
                        className={`py-3.5 px-4 text-right tabular-nums ${riskTheme.bgTint} cursor-pointer group hover:brightness-95 transition-all`}
                        title="Clique para auditar a memória de cálculo da fórmula ARS"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <RiskIcon className={`w-3.5 h-3.5 shrink-0 ${riskTheme.iconColor}`} />
                          <span className={`font-extrabold text-sm ${riskTheme.textColor} group-hover:underline`}>
                            {item.ars.toFixed(1)}
                          </span>
                        </div>
                        <div className={`text-[11px] font-bold ${riskTheme.subTextColor}`}>
                          {riskTheme.label}
                        </div>
                        <div className={`w-20 ml-auto h-1.5 rounded-full overflow-hidden mt-1 ${riskTheme.barTrack}`}>
                          <div
                            className={`h-full rounded-full ${riskTheme.barColor}`}
                            style={{ width: `${Math.min(100, Math.max(8, item.ars))}%` }}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedCalcDiscipline(item)}
                            className="p-1.5 text-[#0A3977] bg-blue-50/70 hover:bg-blue-100 hover:text-blue-900 rounded-md transition-colors cursor-pointer"
                            title="Verificar Memória de Cálculo (Fórmulas LHI e ARS)"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem({ ...item });
                              setAuditNote(item.auditNote || '');
                            }}
                            className="p-1.5 text-slate-600 hover:text-[#0A3977] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Auditar / Ajustar Indicadores"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingDetailItem(item)}
                            className="p-1.5 text-slate-600 hover:text-[#0A3977] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Visualizar Prontuário Pedagógico"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Semantic Risk & Health Governance Legend Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700">Escala de Risco (ARS):</span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              Baixo (&lt; 25)
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
              Moderado (25 – 44)
            </span>
            <span className="flex items-center gap-1.5 text-orange-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-xs bg-orange-500 inline-block" />
              Alto (45 – 64)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" />
              Crítico (&ge; 65)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700">Escala de Saúde (LHI):</span>
            <span className="text-rose-700 font-semibold">Crítico (&lt; 55)</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-semibold">Alerta (55 – 69)</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">Saudável (70 – 84)</span>
            <span aria-hidden="true">·</span>
            <span className="text-teal-700 font-semibold">Excelente (&ge; 85)</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Audit & Inline Review Editor */}
      {editingItem && liveEditPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Auditoria de Indicador: {editingItem.code}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingItem.name} ({editingItem.classCode})
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAuditEdit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Grau de Aprendizagem (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingItem.learningScore}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        learningScore: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-[#0A3977] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Taxa de Reprovação (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingItem.failureRate}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        failureRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-[#0A3977] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Frequência Média (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingItem.attendanceRate}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        attendanceRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-[#0A3977] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Adesão Plataforma LMS (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingItem.lmsAdherenceRate}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        lmsAdherenceRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-[#0A3977] tabular-nums"
                  />
                </div>
              </div>

              {/* Live Preview of Recalculated LHI and ARS */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 block">Simulação LHI (Saúde)</span>
                  <span className={`text-sm font-extrabold tabular-nums ${getLHIHealthTheme(liveEditPreview.lhiStatus, liveEditPreview.lhi).textColor}`}>
                    {liveEditPreview.lhi.toFixed(1)} · {liveEditPreview.lhiStatus}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Simulação ARS (Nível de Risco)</span>
                  <span className={`text-sm font-extrabold tabular-nums ${getARSRiskTheme(liveEditPreview.arsLevel, liveEditPreview.ars).textColor}`}>
                    {liveEditPreview.ars.toFixed(1)} · Risco {liveEditPreview.arsLevel}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Justificativa da Auditoria / Parecer Pedagógico
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Revisão de menções pós-recurso discente e inclusão de frequências abonadas."
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-[#0A3977]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-[#0A3977] hover:bg-blue-800 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Salvar e Recalcular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Detail Pedagogical Drawer */}
      {viewingDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 animate-in fade-in zoom-in duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Prontuário Pedagógico de Turma
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewingDetailItem.name} ({viewingDetailItem.code}) · {viewingDetailItem.classCode}
                </p>
              </div>
              <button
                onClick={() => setViewingDetailItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500">Curso:</span>
                  <div className="font-semibold text-slate-900">{viewingDetailItem.course}</div>
                </div>
                <div>
                  <span className="text-slate-500">Docente Responsável:</span>
                  <div className="font-semibold text-slate-900">{viewingDetailItem.professor}</div>
                </div>
                <div>
                  <span className="text-slate-500">Matrículas Ativas:</span>
                  <div className="font-semibold text-slate-900 tabular-nums">{viewingDetailItem.totalStudents} discentes</div>
                </div>
                <div>
                  <span className="text-slate-500">Origem dos Dados:</span>
                  <div className="font-semibold text-slate-900">{viewingDetailItem.sourceType}</div>
                </div>
                <div className="col-span-2 pt-1.5 border-t border-slate-200/80">
                  <span className="text-slate-500">Arquivo / Fonte de Origem:</span>
                  <div className="font-mono font-semibold text-slate-800 break-all">
                    {viewingDetailItem.sourceFileOrUrl || 'Não informado na fonte'}
                  </div>
                </div>
              </div>

              {viewingDetailItem.originalValues && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-[11px] space-y-1">
                  <div className="font-bold text-[#0A3977]">
                    Valores Originais Extraídos da Fonte (Preservados antes do ajuste manual):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 tabular-nums pt-1">
                    <div>
                      <span className="text-slate-500 block">Aprendizagem:</span>
                      <strong>{viewingDetailItem.originalValues.learningScore}%</strong>
                      <span className="text-slate-400"> → {viewingDetailItem.learningScore}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Reprovação:</span>
                      <strong>{viewingDetailItem.originalValues.failureRate}%</strong>
                      <span className="text-slate-400"> → {viewingDetailItem.failureRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Frequência:</span>
                      <strong>{viewingDetailItem.originalValues.attendanceRate}%</strong>
                      <span className="text-slate-400"> → {viewingDetailItem.attendanceRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Adesão LMS:</span>
                      <strong>{viewingDetailItem.originalValues.lmsAdherenceRate}%</strong>
                      <span className="text-slate-400"> → {viewingDetailItem.lmsAdherenceRate}%</span>
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                const detailRisk = getARSRiskTheme(getARSLevel(viewingDetailItem.ars), viewingDetailItem.ars);
                const detailHealth = getLHIHealthTheme(getLHIStatus(viewingDetailItem.lhi), viewingDetailItem.lhi);
                const infreq = Number(Math.max(0, 100 - viewingDetailItem.attendanceRate).toFixed(1));
                const learnDeficit = Number(Math.max(0, 100 - viewingDetailItem.learningScore).toFixed(1));
                const contribFail = Number((viewingDetailItem.failureRate * weights.ars.failureRate).toFixed(1));
                const contribInfreq = Number((infreq * weights.ars.infrequency).toFixed(1));
                const contribLearn = Number((learnDeficit * weights.ars.learningDeficit).toFixed(1));
                const contribDrop = Number((viewingDetailItem.dropoutRiskRate * weights.ars.dropoutRisk).toFixed(1));

                return (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className={`p-3 rounded-lg border ${detailHealth.bgTint} border-slate-200`}>
                        <div className="text-[11px] text-slate-600 font-medium">LHI (Saúde Acadêmica)</div>
                        <div className={`text-base font-extrabold tabular-nums mt-0.5 ${detailHealth.textColor}`}>
                          {viewingDetailItem.lhi.toFixed(1)} · {getLHIStatus(viewingDetailItem.lhi)}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border ${detailRisk.bgTint} ${detailRisk.borderTint}`}>
                        <div className="text-[11px] text-slate-600 font-medium">ARS (Nível de Risco)</div>
                        <div className={`text-base font-extrabold tabular-nums mt-0.5 ${detailRisk.textColor}`}>
                          {viewingDetailItem.ars.toFixed(1)} · {detailRisk.label}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800">
                        Motivo / Justificativa do Nível de Risco (ARS = {viewingDetailItem.ars.toFixed(1)}):
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 tabular-nums">
                        <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                          <span>Reprovação ({viewingDetailItem.failureRate}%):</span>
                          <strong className="text-slate-900">+{contribFail} pts</strong>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                          <span>Infrequência ({infreq}%):</span>
                          <strong className="text-slate-900">+{contribInfreq} pts</strong>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                          <span>Déficit Aprend. ({learnDeficit}%):</span>
                          <strong className="text-slate-900">+{contribLearn} pts</strong>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                          <span>Evasão ({viewingDetailItem.dropoutRiskRate}%):</span>
                          <strong className="text-slate-900">+{contribDrop} pts</strong>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {(() => {
                const detailDiag = getDetailedPedagogicalDiagnostic(viewingDetailItem);
                return (
                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-950 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                          <span>Solução para o Problema / Intervenção Pedagógica:</span>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${detailDiag.priority.badgeBg} ${detailDiag.priority.badgeText} ${detailDiag.priority.badgeBorder}`}>
                          {detailDiag.priority.label}
                        </span>
                      </div>
                      <p className="font-semibold text-xs leading-relaxed text-amber-950">
                        {viewingDetailItem.recommendedAction}
                      </p>
                      <p className="text-[11px] text-amber-900/90 pt-1 leading-relaxed border-t border-amber-200/60">
                        {detailDiag.executiveSummary}
                      </p>
                    </div>

                    {/* 3 Action Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-[#0A3977]" />
                          <span>Eixo Docente</span>
                        </div>
                        <ul className="space-y-1 text-slate-600">
                          {detailDiag.actionPlan.faculty.map((act, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-[#0A3977] font-bold">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <School className="w-3.5 h-3.5 text-[#0A3977]" />
                          <span>Coordenação</span>
                        </div>
                        <ul className="space-y-1 text-slate-600">
                          {detailDiag.actionPlan.coordination.map((act, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-[#0A3977] font-bold">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Alunos & Monitoria</span>
                        </div>
                        <ul className="space-y-1 text-slate-600">
                          {detailDiag.actionPlan.students.map((act, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-emerald-700 font-bold">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {viewingDetailItem.auditNote && (
                <div>
                  <div className="font-semibold text-slate-800 mb-1">
                    Histórico de Auditoria / Observações da Fonte:
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px]">
                    &ldquo;{viewingDetailItem.auditNote}&rdquo; (Atualizado em {viewingDetailItem.lastUpdated})
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewingDetailItem(null)}
                className="px-4 py-1.5 bg-[#0A3977] text-white font-semibold rounded-md hover:bg-blue-800 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Calculation Verification & Formula Transparency Panel */}
      {selectedCalcDiscipline && (() => {
        const item = selectedCalcDiscipline;
        const currentIndex = filteredData.findIndex((d) => d.id === item.id);
        const hasPrev = currentIndex > 0;
        const hasNext = currentIndex >= 0 && currentIndex < filteredData.length - 1;

        // LHI Calculations Breakdown
        const passRate = Math.max(0, 100 - item.failureRate);
        const lhiLearnContrib = Number((item.learningScore * weights.lhi.learningScore).toFixed(2));
        const lhiAttendContrib = Number((item.attendanceRate * weights.lhi.attendance).toFixed(2));
        const lhiPassContrib = Number((passRate * weights.lhi.passRate).toFixed(2));
        const lhiLmsContrib = Number((item.lmsAdherenceRate * weights.lhi.lmsAdherence).toFixed(2));
        const lhiRawTotal = Number((lhiLearnContrib + lhiAttendContrib + lhiPassContrib + lhiLmsContrib).toFixed(2));
        const lhiStatus = getLHIStatus(item.lhi);
        const lhiHealthTheme = getLHIHealthTheme(lhiStatus, item.lhi);
        const isLhiConsistent = Math.abs(lhiRawTotal - item.lhi) < 0.25;

        // ARS Calculations Breakdown
        const infrequency = Number(Math.max(0, 100 - item.attendanceRate).toFixed(1));
        const learningDeficit = Number(Math.max(0, 100 - item.learningScore).toFixed(1));
        const arsFailContrib = Number((item.failureRate * weights.ars.failureRate).toFixed(2));
        const arsInfreqContrib = Number((infrequency * weights.ars.infrequency).toFixed(2));
        const arsDeficitContrib = Number((learningDeficit * weights.ars.learningDeficit).toFixed(2));
        const arsDropContrib = Number((item.dropoutRiskRate * weights.ars.dropoutRisk).toFixed(2));
        const arsRawTotal = Number((arsFailContrib + arsInfreqContrib + arsDeficitContrib + arsDropContrib).toFixed(2));
        const arsLevel = getARSLevel(item.ars);
        const arsRiskTheme = getARSRiskTheme(arsLevel, item.ars);
        const isArsConsistent = Math.abs(arsRawTotal - item.ars) < 0.25;

        // Comprehensive Pedagogical Diagnostic for this discipline
        const diag = getDetailedPedagogicalDiagnostic(item);

        const handleCopyMemory = () => {
          const text = [
            `=================================================================`,
            `PULSO 2.0 — MEMÓRIA DE CÁLCULO & AUDITORIA DE FÓRMULAS`,
            `Disciplina: ${item.name} (${item.code}) | Turma: ${item.classCode}`,
            `Docente: ${item.professor} | Curso: ${item.course}`,
            `Perfil de Pesos Ativo: ${weights.presetName || 'Padrão Estácio'}`,
            `=================================================================`,
            ``,
            `1. LHI (Learning Health Index — Índice de Saúde Acadêmica)`,
            `Fórmula: LHI = (w_apr × Aprendizagem) + (w_freq × Frequência) + (w_aprov × TaxaAprovação) + (w_lms × AdesãoLMS)`,
            `• Grau de Aprendizagem: ${item.learningScore}% × ${(weights.lhi.learningScore * 100).toFixed(0)}% = +${lhiLearnContrib} pts`,
            `• Frequência: ${item.attendanceRate}% × ${(weights.lhi.attendance * 100).toFixed(0)}% = +${lhiAttendContrib} pts`,
            `• Taxa de Aprovação (100 - ${item.failureRate}%): ${passRate.toFixed(1)}% × ${(weights.lhi.passRate * 100).toFixed(0)}% = +${lhiPassContrib} pts`,
            `• Adesão LMS: ${item.lmsAdherenceRate}% × ${(weights.lhi.lmsAdherence * 100).toFixed(0)}% = +${lhiLmsContrib} pts`,
            `Somatório: ${lhiLearnContrib} + ${lhiAttendContrib} + ${lhiPassContrib} + ${lhiLmsContrib} = ${lhiRawTotal} pts`,
            `LHI Final Apresentado: ${item.lhi.toFixed(1)} pts (${lhiStatus}) — ${isLhiConsistent ? 'Auditado com Sucesso' : 'Aviso: Divergência'}`,
            ``,
            `2. ARS (Academic Risk Score — Pontuação de Risco Acadêmico)`,
            `Fórmula: ARS = (w_rep × Reprovação) + (w_infreq × Infrequência) + (w_def × DéficitAprend.) + (w_eva × RiscoEvasão)`,
            `• Reprovação: ${item.failureRate}% × ${(weights.ars.failureRate * 100).toFixed(0)}% = +${arsFailContrib} pts`,
            `• Infrequência (100 - ${item.attendanceRate}%): ${infrequency}% × ${(weights.ars.infrequency * 100).toFixed(0)}% = +${arsInfreqContrib} pts`,
            `• Déficit de Aprendizagem (100 - ${item.learningScore}%): ${learningDeficit}% × ${(weights.ars.learningDeficit * 100).toFixed(0)}% = +${arsDeficitContrib} pts`,
            `• Risco de Evasão: ${item.dropoutRiskRate}% × ${(weights.ars.dropoutRisk * 100).toFixed(0)}% = +${arsDropContrib} pts`,
            `Somatório: ${arsFailContrib} + ${arsInfreqContrib} + ${arsDeficitContrib} + ${arsDropContrib} = ${arsRawTotal} pts`,
            `ARS Final Apresentado: ${item.ars.toFixed(1)} pts (${arsLevel}) — ${isArsConsistent ? 'Auditado com Sucesso' : 'Aviso: Divergência'}`,
            ``,
            `3. DIAGNÓSTICO PEDAGÓGICO E AÇÃO RECOMENDADA`,
            `Prioridade: ${diag.priority.label} (${diag.priority.timeline})`,
            `Diretriz Executiva: ${item.recommendedAction}`,
            `Síntese Contextual: ${diag.executiveSummary}`,
            ``,
            `Diagnóstico por Indicador:`,
            `• Aprendizagem: ${diag.indicatorsDiagnosis.learning.value} (${diag.indicatorsDiagnosis.learning.status}) - ${diag.indicatorsDiagnosis.learning.text}`,
            `• Reprovação: ${diag.indicatorsDiagnosis.failure.value} (${diag.indicatorsDiagnosis.failure.status}) - ${diag.indicatorsDiagnosis.failure.text}`,
            `• Assiduidade: ${diag.indicatorsDiagnosis.attendance.value} (${diag.indicatorsDiagnosis.attendance.status}) - ${diag.indicatorsDiagnosis.attendance.text}`,
            `• Engajamento LMS: ${diag.indicatorsDiagnosis.engagement.value} (${diag.indicatorsDiagnosis.engagement.status}) - ${diag.indicatorsDiagnosis.engagement.text}`,
            ``,
            `Plano Tático Operacional:`,
            `[Eixo Docente - ${item.professor}]`,
            ...diag.actionPlan.faculty.map((a, i) => `  ${i + 1}. ${a}`),
            `[Eixo Coordenação - ${item.course}]`,
            ...diag.actionPlan.coordination.map((a, i) => `  ${i + 1}. ${a}`),
            `[Eixo Discentes & Monitoria - ${item.totalStudents} alunos]`,
            ...diag.actionPlan.students.map((a, i) => `  ${i + 1}. ${a}`),
            ``,
            `Metas da Turma: Aprendizagem ${diag.targets.targetLearning} | Reprovação ${diag.targets.targetFailure} | Frequência ${diag.targets.targetAttendance} | LMS ${diag.targets.targetLms}`,
            `=================================================================`
          ].join('\n');

          navigator.clipboard.writeText(text);
          setCopiedFormula(true);
          setTimeout(() => setCopiedFormula(false), 2200);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150 text-xs">
              
              {/* Modal Top Navigation & Header */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-[#0A3977] via-[#0d478e] to-[#0A3977] text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Painel de Verificação de Cálculos (LHI & ARS)
                      </h2>
                      <span className="text-[10px] font-semibold bg-cyan-400/20 text-cyan-200 px-2 py-0.5 rounded border border-cyan-300/30">
                        Transparência Matemática RF04
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-100/90 mt-0.5">
                      Memória descritiva passo a passo com pesos e fatores oficiais do Pulso 2.0
                    </p>
                  </div>
                </div>

                {/* Right controls: Quick Switcher, Navigation, Copy, Close */}
                <div className="flex items-center gap-2">
                  {/* Discipline Quick Selector Dropdown */}
                  <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 border border-white/20">
                    <button
                      type="button"
                      disabled={!hasPrev}
                      onClick={() => hasPrev && setSelectedCalcDiscipline(filteredData[currentIndex - 1])}
                      className="p-1 hover:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Disciplina Anterior"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>

                    <select
                      value={item.id}
                      onChange={(e) => {
                        const target = disciplines.find((d) => d.id === e.target.value);
                        if (target) setSelectedCalcDiscipline(target);
                      }}
                      className="bg-transparent text-white text-[11px] font-medium py-1 px-1.5 focus:outline-hidden max-w-[200px] truncate cursor-pointer [&>option]:text-slate-900"
                    >
                      {filteredData.map((d, i) => (
                        <option key={d.id} value={d.id}>
                          {i + 1}. {d.name} ({d.code} - {d.classCode})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!hasNext}
                      onClick={() => hasNext && setSelectedCalcDiscipline(filteredData[currentIndex + 1])}
                      className="p-1 hover:bg-white/20 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Próxima Disciplina"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Copy Memory Button */}
                  <button
                    type="button"
                    onClick={handleCopyMemory}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-[11px] transition-colors cursor-pointer"
                    title="Copiar texto da memória de cálculo para a área de transferência"
                  >
                    {copiedFormula ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="text-emerald-200">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Memória</span>
                      </>
                    )}
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedCalcDiscipline(null)}
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer ml-1"
                    title="Fechar painel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                
                {/* Discipline Information Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{item.name}</span>
                      <span className="font-mono font-bold text-xs bg-blue-100 text-[#0A3977] px-2 py-0.5 rounded">
                        {item.code}
                      </span>
                      <span className="text-slate-500 font-medium">Turma: {item.classCode}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-600 text-[11px]">
                      <span><strong>Docente:</strong> {item.professor}</span>
                      <span>·</span>
                      <span><strong>Curso:</strong> {item.course}</span>
                      <span>·</span>
                      <span><strong>Semestre:</strong> {item.semester}º ({item.shift})</span>
                      <span>·</span>
                      <span><strong>Alunos:</strong> {item.totalStudents}</span>
                      <span>·</span>
                      <span><strong>Tempo Estudo:</strong> {item.studyTimeFormatted || `${item.studyHoursPerWeek}h`}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] text-right">
                      <div className="text-slate-400 text-[10px]">Perfil de Calibração</div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-[#0A3977]" />
                        <span>{weights.presetName || 'Padrão Estácio'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem({ ...item });
                        setAuditNote(item.auditNote || '');
                        setSelectedCalcDiscipline(null);
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-[#0A3977] hover:bg-blue-100 border border-blue-200 rounded-md font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                      title="Editar métricas base desta disciplina"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Ajustar Dados</span>
                    </button>
                  </div>
                </div>

                {/* View Mode Switcher Pills */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">Visualização:</span>
                    <button
                      type="button"
                      onClick={() => setCalcViewMode('both')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        calcViewMode === 'both'
                          ? 'bg-[#0A3977] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Ambas (LHI & ARS Lado a Lado)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcViewMode('lhi')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        calcViewMode === 'lhi'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-800'
                      }`}
                    >
                      Apenas LHI (Saúde Acadêmica)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcViewMode('ars')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        calcViewMode === 'ars'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-900'
                      }`}
                    >
                      Apenas ARS (Risco Acadêmico)
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 hidden sm:block">
                    Matriz de Indicadores Pulso versão {weights.pulsoRuleVersion || '2.0'}
                  </div>
                </div>

                {/* Grid for LHI and ARS calculation breakdowns */}
                <div className={`grid gap-4 ${calcViewMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  
                  {/* ============================================================== */}
                  {/* CARD 1: LHI (Learning Health Index - Índice de Saúde)          */}
                  {/* ============================================================== */}
                  {(calcViewMode === 'both' || calcViewMode === 'lhi') && (
                    <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden flex flex-col">
                      {/* LHI Header */}
                      <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50/50 border-b border-teal-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                            LHI
                          </div>
                          <div>
                            <div className="font-extrabold text-sm text-teal-950">
                              Learning Health Index (Saúde Acadêmica)
                            </div>
                            <div className="text-[10px] text-teal-700">
                              Mede a higidez pedagógica da turma na escala de 0 a 100 pontos
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-xl font-black tabular-nums ${lhiHealthTheme.textColor}`}>
                            {item.lhi.toFixed(1)} <span className="text-xs font-medium text-slate-500">pts</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lhiHealthTheme.bgTint} ${lhiHealthTheme.textColor} border border-teal-200`}>
                            {lhiStatus}
                          </span>
                        </div>
                      </div>

                      {/* LHI Formula Banner */}
                      <div className="p-3 bg-slate-50/80 border-b border-slate-200 text-[11px] text-slate-700 space-y-1">
                        <div className="font-bold text-[#0A3977] flex items-center justify-between">
                          <span>Fórmula Oficial Aplicada:</span>
                          <span className="font-mono text-[10px] text-slate-500">LHI = Σ (Pesoᵢ × Indicadorᵢ)</span>
                        </div>
                        <div className="font-mono bg-white p-2 rounded border border-slate-200 text-slate-800 text-[10px] sm:text-[11px] overflow-x-auto">
                          LHI = ({weights.lhi.learningScore} × Aprendizagem) + ({weights.lhi.attendance} × Frequência) + ({weights.lhi.passRate} × TaxaAprovação) + ({weights.lhi.lmsAdherence} × AdesãoLMS)
                        </div>
                        <div className="text-[10px] text-slate-500 italic">
                          * Nota: Taxa de Aprovação = max(0, 100% - Taxa de Reprovação). No Pulso 2.0, considera alunos com ao menos 1 prova (AV/NC/AVS).
                        </div>
                      </div>

                      {/* LHI Step-by-Step Table */}
                      <div className="p-3.5 space-y-3 flex-1">
                        <div className="font-semibold text-slate-800 text-xs">
                          Demonstrativo Detalhado de Componentes e Contribuições:
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                <th className="p-2">Componente</th>
                                <th className="p-2 text-right">Valor Base</th>
                                <th className="p-2 text-right">Peso</th>
                                <th className="p-2 text-right">Operação</th>
                                <th className="p-2 text-right">Pontos</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {/* 1. Aprendizagem */}
                              <tr className="hover:bg-slate-50/60">
                                <td className="p-2">
                                  <div className="font-bold text-slate-800">1. Grau de Aprendizagem</div>
                                  <div className="text-[10px] text-slate-400">Provas com nota ≥ esperada</div>
                                </td>
                                <td className="p-2 text-right font-semibold tabular-nums text-slate-800">
                                  {item.learningScore.toFixed(1)}%
                                </td>
                                <td className="p-2 text-right tabular-nums text-slate-600">
                                  {(weights.lhi.learningScore * 100).toFixed(0)}%
                                </td>
                                <td className="p-2 text-right font-mono text-[10px] text-slate-500 tabular-nums">
                                  {item.learningScore} × {weights.lhi.learningScore}
                                </td>
                                <td className="p-2 text-right font-bold tabular-nums text-emerald-700">
                                  +{lhiLearnContrib.toFixed(2)}
                                </td>
                              </tr>

                              {/* 2. Frequência */}
                              <tr className="hover:bg-slate-50/60">
                                <td className="p-2">
                                  <div className="font-bold text-slate-800">2. Frequência Discente</div>
                                  <div className="text-[10px] text-slate-400">Presenças / Total presenças+faltas</div>
                                </td>
                                <td className="p-2 text-right font-semibold tabular-nums text-slate-800">
                                  {item.attendanceRate.toFixed(1)}%
                                </td>
                                <td className="p-2 text-right tabular-nums text-slate-600">
                                  {(weights.lhi.attendance * 100).toFixed(0)}%
                                </td>
                                <td className="p-2 text-right font-mono text-[10px] text-slate-500 tabular-nums">
                                  {item.attendanceRate} × {weights.lhi.attendance}
                                </td>
                                <td className="p-2 text-right font-bold tabular-nums text-emerald-700">
                                  +{lhiAttendContrib.toFixed(2)}
                                </td>
                              </tr>

                              {/* 3. Taxa de Aprovação */}
                              <tr className="hover:bg-slate-50/60">
                                <td className="p-2">
                                  <div className="font-bold text-slate-800">3. Taxa de Aprovação</div>
                                  <div className="text-[10px] text-slate-400">100% - Reprovação ({item.failureRate}%)</div>
                                </td>
                                <td className="p-2 text-right font-semibold tabular-nums text-slate-800">
                                  {passRate.toFixed(1)}%
                                </td>
                                <td className="p-2 text-right tabular-nums text-slate-600">
                                  {(weights.lhi.passRate * 100).toFixed(0)}%
                                </td>
                                <td className="p-2 text-right font-mono text-[10px] text-slate-500 tabular-nums">
                                  {passRate.toFixed(1)} × {weights.lhi.passRate}
                                </td>
                                <td className="p-2 text-right font-bold tabular-nums text-emerald-700">
                                  +{lhiPassContrib.toFixed(2)}
                                </td>
                              </tr>

                              {/* 4. Adesão LMS */}
                              <tr className="hover:bg-slate-50/60">
                                <td className="p-2">
                                  <div className="font-bold text-slate-800">4. Adesão ao LMS</div>
                                  <div className="text-[10px] text-slate-400">Acessos conteúdo + Simulados SM</div>
                                </td>
                                <td className="p-2 text-right font-semibold tabular-nums text-slate-800">
                                  {item.lmsAdherenceRate.toFixed(1)}%
                                </td>
                                <td className="p-2 text-right tabular-nums text-slate-600">
                                  {(weights.lhi.lmsAdherence * 100).toFixed(0)}%
                                </td>
                                <td className="p-2 text-right font-mono text-[10px] text-slate-500 tabular-nums">
                                  {item.lmsAdherenceRate} × {weights.lhi.lmsAdherence}
                                </td>
                                <td className="p-2 text-right font-bold tabular-nums text-emerald-700">
                                  +{lhiLmsContrib.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr className="bg-teal-50/80 font-bold border-t border-teal-200">
                                <td colSpan={4} className="p-2 text-slate-800">
                                  Somatório Final LHI (Total Calculado):
                                </td>
                                <td className="p-2 text-right tabular-nums text-sm text-teal-900">
                                  {lhiRawTotal.toFixed(2)} pts
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Numerical expression representation */}
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                          <span className="text-slate-500 block text-[10px] font-sans font-semibold mb-0.5">
                            Substituição Numérica Direta:
                          </span>
                          <span>LHI = {lhiLearnContrib.toFixed(2)} + {lhiAttendContrib.toFixed(2)} + {lhiPassContrib.toFixed(2)} + {lhiLmsContrib.toFixed(2)} = <strong>{lhiRawTotal.toFixed(2)}</strong></span>
                          <span className="text-slate-500"> → Arredondamento oficial: <strong>{item.lhi.toFixed(1)}</strong></span>
                        </div>

                        {/* Health Progress Indicator */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Crítico (&lt;55)</span>
                            <span>Alerta (55-69)</span>
                            <span>Saudável (70-84)</span>
                            <span>Excelente (≥85)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
                            <div
                              className={`h-full ${lhiHealthTheme.barColor}`}
                              style={{ width: `${Math.min(100, Math.max(0, item.lhi))}%` }}
                            />
                          </div>
                        </div>

                        {/* Audit Verification status */}
                        <div className="flex items-center gap-1.5 text-[11px] pt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-emerald-800">
                            Cálculo LHI Verificado:
                          </span>
                          <span className="text-slate-600">
                            {isLhiConsistent
                              ? '100% aderente ao valor exibido no grid e no relatório executivo.'
                              : `Apresenta ajuste arredondado (${item.lhi} vs ${lhiRawTotal}).`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* CARD 2: ARS (Academic Risk Score - Pontuação de Risco)         */}
                  {/* ============================================================== */}
                  {(calcViewMode === 'both' || calcViewMode === 'ars') && (
                    <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden flex flex-col">
                      {/* ARS Header */}
                      <div className={`p-3.5 bg-gradient-to-r from-rose-50 to-orange-50/50 border-b ${arsRiskTheme.borderTint} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                            ARS
                          </div>
                          <div>
                            <div className="font-extrabold text-sm text-rose-950">
                              Academic Risk Score (Pontuação de Risco)
                            </div>
                            <div className="text-[10px] text-rose-700">
                              Mede a severidade do risco de retenção e evasão discente
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-xl font-black tabular-nums ${arsRiskTheme.textColor}`}>
                            {item.ars.toFixed(1)} <span className="text-xs font-medium text-slate-500">pts</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${arsRiskTheme.bgTint} ${arsRiskTheme.textColor} border ${arsRiskTheme.borderTint}`}>
                            {arsRiskTheme.label}
                          </span>
                        </div>
                      </div>

                      {/* ARS Formula Banner */}
                      <div className="p-3 bg-slate-50/80 border-b border-slate-200 text-[11px] text-slate-700 space-y-1">
                        <div className="font-bold text-[#0A3977] flex items-center justify-between">
                          <span>Fórmula Oficial Aplicada:</span>
                          <span className="font-mono text-[10px] text-slate-500">ARS = Σ (Pesoᵢ × FatorRiscoᵢ)</span>
                        </div>
                        <div className="font-mono bg-white p-2 rounded border border-slate-200 text-slate-800 text-[10px] sm:text-[11px] overflow-x-auto">
                          ARS = ({weights.ars.failureRate} × Reprovação) + ({weights.ars.infrequency} × Infrequência) + ({weights.ars.learningDeficit} × DéficitAprendizagem) + ({weights.ars.dropoutRisk} × RiscoEvasão)
                        </div>
                        <div className="text-[10px] text-slate-500 italic">
                          * Fatores inversos: Infrequência = max(0, 100% - Frequência); Déficit de Aprendizagem = max(0, 100% - Grau de Aprendizagem).
                        </div>
                      </div>

                      {/* ARS Step-by-Step Table */}
                      <div className="p-3.5 space-y-3 flex-1">
                        <div className="font-semibold text-slate-800 text-xs">
                          Demonstrativo Detalhado dos Fatores de Risco:
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                <th className="p-2">Fator de Risco</th>
                                <th className="p-2 text-right">Valor Base</th>
                                <th className="p-2 text-right">Peso</th>
                                <th className="p-2 text-right">Operação</th>
                                <th className="p-2 text-right">Carga</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {/* 1. Reprovação */}
                              <tr className="hover:bg-slate-50/60">
                                <td className="p-2">
                                  <div className="font-bold text-slate-800">1. Taxa de Reprovação</div>
                                  <div className="text-[10px] text-slate-400">Pulso 2.0: avaliados com nota &lt; 6</div>
                                </td>
                                <td className="p-2 text-right font-semibold tabular-nums text-slate-800">
                                  {item.failureRate.toFixed(1)}%
                                </td>
                                <td className="p-2 text-right tabular-nums text-slate-600">
                                  {(weights.ars.failureRate * 100).toFixed(0)}%
                                </td>
                                <td className="p-2 text-right font-mono text-[10px] text-slate-500 tabular-nums">
                                  {item.failureRate} × {weights.ars.failureRate}
                                </td>
                                <td className="p-2 text-right font-bold tabular-nums text-rose-700">
                                  +{arsFailContrib.toFixed(2)}
                                </td>
                              </tr>

                              {/* 2. Infrequência */}
                              <tr className="hover:bg-slate-50/60">
                                <td className="p-2">
                                  <div className="font-bold text-slate-800">2. Infrequência (Faltas)</div>
                                  <div className="text-[10px] text-slate-400">100% - Frequência ({item.attendanceRate}%)</div>
                                </td>
                                <td className="p-2 text-right font-semibold tabular-nums text-slate-800">
                                  {infrequency.toFixed(1)}%
                                </td>
                                <td className="p-2 text-right tabular-nums text-slate-600">
                                  {(weights.ars.infrequency * 100).toFixed(0)}%
                                </td>
                                <td className="p-2 text-right font-mono text-[10px] text-slate-500 tabular-nums">
                                  {infrequency.toFixed(1)} × {weights.ars.infrequency}
                                </td>
                                <td className="p-2 text-right font-bold tabular-nums text-rose-700">
                                  +{arsInfreqContrib.toFixed(2)}
                                </td>
                              </tr>

                              {/* 3. Déficit de Aprendizagem */}
                              <tr className="hover:bg-slate-50/60">
                                <td className="p-2">
                                  <div className="font-bold text-slate-800">3. Déficit de Aprendizagem</div>
                                  <div className="text-[10px] text-slate-400">100% - Aprendizagem ({item.learningScore}%)</div>
                                </td>
                                <td className="p-2 text-right font-semibold tabular-nums text-slate-800">
                                  {learningDeficit.toFixed(1)}%
                                </td>
                                <td className="p-2 text-right tabular-nums text-slate-600">
                                  {(weights.ars.learningDeficit * 100).toFixed(0)}%
                                </td>
                                <td className="p-2 text-right font-mono text-[10px] text-slate-500 tabular-nums">
                                  {learningDeficit.toFixed(1)} × {weights.ars.learningDeficit}
                                </td>
                                <td className="p-2 text-right font-bold tabular-nums text-rose-700">
                                  +{arsDeficitContrib.toFixed(2)}
                                </td>
                              </tr>

                              {/* 4. Risco de Evasão */}
                              <tr className="hover:bg-slate-50/60">
                                <td className="p-2">
                                  <div className="font-bold text-slate-800">4. Risco de Evasão / Não Adesão</div>
                                  <div className="text-[10px] text-slate-400">Não realização de AV/NC/AVS/SM</div>
                                </td>
                                <td className="p-2 text-right font-semibold tabular-nums text-slate-800">
                                  {item.dropoutRiskRate.toFixed(1)}%
                                </td>
                                <td className="p-2 text-right tabular-nums text-slate-600">
                                  {(weights.ars.dropoutRisk * 100).toFixed(0)}%
                                </td>
                                <td className="p-2 text-right font-mono text-[10px] text-slate-500 tabular-nums">
                                  {item.dropoutRiskRate} × {weights.ars.dropoutRisk}
                                </td>
                                <td className="p-2 text-right font-bold tabular-nums text-rose-700">
                                  +{arsDropContrib.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr className="bg-rose-50/80 font-bold border-t border-rose-200">
                                <td colSpan={4} className="p-2 text-slate-800">
                                  Somatório Final ARS (Total de Risco Calculado):
                                </td>
                                <td className="p-2 text-right tabular-nums text-sm text-rose-950">
                                  {arsRawTotal.toFixed(2)} pts
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Numerical expression representation */}
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                          <span className="text-slate-500 block text-[10px] font-sans font-semibold mb-0.5">
                            Substituição Numérica Direta:
                          </span>
                          <span>ARS = {arsFailContrib.toFixed(2)} + {arsInfreqContrib.toFixed(2)} + {arsDeficitContrib.toFixed(2)} + {arsDropContrib.toFixed(2)} = <strong>{arsRawTotal.toFixed(2)}</strong></span>
                          <span className="text-slate-500"> → Arredondamento oficial: <strong>{item.ars.toFixed(1)}</strong></span>
                        </div>

                        {/* Risk Severity Progress Indicator */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span>Baixo (&lt;25)</span>
                            <span>Moderado (25-44)</span>
                            <span>Alto (45-64)</span>
                            <span>Crítico (≥65)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
                            <div
                              className={`h-full ${arsRiskTheme.barColor}`}
                              style={{ width: `${Math.min(100, Math.max(0, item.ars))}%` }}
                            />
                          </div>
                        </div>

                        {/* Audit Verification status */}
                        <div className="flex items-center gap-1.5 text-[11px] pt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-emerald-800">
                            Cálculo ARS Verificado:
                          </span>
                          <span className="text-slate-600">
                            {isArsConsistent
                              ? '100% aderente ao valor exibido no grid e no relatório executivo.'
                              : `Apresenta ajuste arredondado (${item.ars} vs ${arsRawTotal}).`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pedagogical Action & Governance Section - Complemented with multi-dimensional analysis */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
                  {/* 1. Header with Title, Priority, Timeline & Trigger */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="p-1 rounded bg-[#0A3977] text-white">
                          <BookOpen className="w-4 h-4" />
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                          Diagnóstico Pedagógico e Ação Recomendada
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diag.priority.badgeBg} ${diag.priority.badgeText} ${diag.priority.badgeBorder}`}>
                          {diag.priority.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Análise diagnóstica aprofundada para a disciplina <strong>{item.name}</strong> ({item.code} · Turma {item.classCode})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 font-medium shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-[#0A3977]" />
                        <span>{diag.priority.timeline}</span>
                      </span>
                      <span className="text-slate-400 hidden sm:inline">·</span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        Acionado pelo cruzamento de ARS ({item.ars.toFixed(1)} · {getARSLevel(item.ars)}) e LHI ({item.lhi.toFixed(1)} · {getLHIStatus(item.lhi)})
                      </span>
                    </div>
                  </div>

                  {/* 2. Diretriz Executiva Síntese (Destaque Principal) */}
                  <div className="p-3.5 rounded-lg bg-gradient-to-r from-amber-50/90 via-amber-50 to-orange-50/60 border border-amber-200 text-amber-950 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>Diretriz Executiva de Intervenção Pedagógica:</span>
                      </span>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200/80">
                        Docente Responsável: {item.professor}
                      </span>
                    </div>
                    <p className="font-semibold text-xs leading-relaxed text-amber-950">
                      {item.recommendedAction}
                    </p>
                    <p className="text-[11px] text-amber-900/90 pt-1.5 leading-relaxed border-t border-amber-200/60">
                      {diag.executiveSummary}
                    </p>
                  </div>

                  {/* 3. Diagnóstico Analítico Multidimensional dos 4 Indicadores */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#0A3977]" />
                      <span>Diagnóstico Específico por Indicador da Disciplina:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Aprendizagem */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-blue-600" />
                            <span>{diag.indicatorsDiagnosis.learning.label}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            diag.indicatorsDiagnosis.learning.status === 'Crítico' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                            diag.indicatorsDiagnosis.learning.status === 'Alerta' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {diag.indicatorsDiagnosis.learning.value} · {diag.indicatorsDiagnosis.learning.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {diag.indicatorsDiagnosis.learning.text}
                        </p>
                      </div>

                      {/* Reprovação */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{diag.indicatorsDiagnosis.failure.label}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            diag.indicatorsDiagnosis.failure.status === 'Crítico' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                            diag.indicatorsDiagnosis.failure.status === 'Alerta' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {diag.indicatorsDiagnosis.failure.value} · {diag.indicatorsDiagnosis.failure.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {diag.indicatorsDiagnosis.failure.text}
                        </p>
                      </div>

                      {/* Frequência */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-teal-600" />
                            <span>{diag.indicatorsDiagnosis.attendance.label}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            diag.indicatorsDiagnosis.attendance.status === 'Crítico' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                            diag.indicatorsDiagnosis.attendance.status === 'Alerta' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {diag.indicatorsDiagnosis.attendance.value} · {diag.indicatorsDiagnosis.attendance.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {diag.indicatorsDiagnosis.attendance.text}
                        </p>
                      </div>

                      {/* Adesão LMS & Estudo */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{diag.indicatorsDiagnosis.engagement.label}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            diag.indicatorsDiagnosis.engagement.status === 'Crítico' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                            diag.indicatorsDiagnosis.engagement.status === 'Alerta' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {diag.indicatorsDiagnosis.engagement.value} · {diag.indicatorsDiagnosis.engagement.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {diag.indicatorsDiagnosis.engagement.text}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Plano Tático Operacional em 3 Eixos */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-[#0A3977]" />
                      <span>Plano de Ação Tático Operacional (3 Eixos Integrados):</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {/* Eixo Docente */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                        <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                          <GraduationCap className="w-4 h-4 text-[#0A3977]" />
                          <span className="font-bold text-xs text-slate-900">Eixo Docente</span>
                          <span className="text-[10px] text-slate-400">({item.professor})</span>
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-700">
                          {diag.actionPlan.faculty.map((act, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-[#0A3977] font-bold shrink-0 mt-0.5">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Eixo Coordenação */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                        <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                          <School className="w-4 h-4 text-[#0A3977]" />
                          <span className="font-bold text-xs text-slate-900">Coordenação de Curso</span>
                          <span className="text-[10px] text-slate-400">({item.course})</span>
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-700">
                          {diag.actionPlan.coordination.map((act, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-[#0A3977] font-bold shrink-0 mt-0.5">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Eixo Discente & Monitoria */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                        <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                          <Users className="w-4 h-4 text-emerald-700" />
                          <span className="font-bold text-xs text-slate-900">Discentes & Monitoria</span>
                          <span className="text-[10px] text-slate-400">({item.totalStudents} alunos)</span>
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-700">
                          {diag.actionPlan.students.map((act, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-emerald-700 font-bold shrink-0 mt-0.5">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 5. Metas Quantitativas de Recuperação (KPI Targets) */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[#0A3977]" />
                        <span>Metas e Indicadores de Sucesso para a Turma (Alvos do Pulso 2.0):</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Monitoramento via Colegiado de Curso
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="text-[10px] text-slate-500">Meta Aprendizagem</div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{diag.targets.targetLearning}</div>
                        <div className="text-[10px] text-slate-400">Atual: {item.learningScore}%</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="text-[10px] text-slate-500">Teto Reprovação</div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{diag.targets.targetFailure}</div>
                        <div className="text-[10px] text-slate-400">Atual: {item.failureRate}%</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="text-[10px] text-slate-500">Piso Frequência</div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{diag.targets.targetAttendance}</div>
                        <div className="text-[10px] text-slate-400">Atual: {item.attendanceRate}%</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="text-[10px] text-slate-500">Meta Adesão LMS</div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{diag.targets.targetLms}</div>
                        <div className="text-[10px] text-slate-400">Atual: {item.lmsAdherenceRate}%</div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Histórico de Auditoria se houver */}
                  {item.auditNote && (
                    <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                      <strong>Registro de Auditoria / Observação da Coordenação:</strong> &ldquo;{item.auditNote}&rdquo; (Atualizado em {item.lastUpdated})
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Auditoria transparente em conformidade com o modelo matemático do Pulso Acadêmico 2.0.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMemory}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-md transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    {copiedFormula ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedFormula ? 'Copiado!' : 'Copiar Memória de Cálculo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCalcDiscipline(null)}
                    className="px-4 py-1.5 bg-[#0A3977] text-white font-semibold rounded-md hover:bg-blue-800 transition-colors cursor-pointer text-xs"
                  >
                    Fechar Verificação
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
