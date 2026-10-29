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
  CheckSquare
} from 'lucide-react';
import { DisciplineMetric, AcademicCourse, LHIStatus, ARSLevel, FormulaWeights } from '../types';
import { calculateLHI, calculateARS, getLHIStatus, getARSLevel, getRecommendedPedagogicalAction } from '../utils/calculations';

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

                      {/* LHI (Saúde) with semantic status color */}
                      <td className={`py-3.5 px-3 text-right tabular-nums ${healthTheme.bgTint}`}>
                        <div className={`font-extrabold text-sm ${healthTheme.textColor}`}>
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

                      {/* ARS (Risco) with dedicated semantic color highlight */}
                      <td className={`py-3.5 px-4 text-right tabular-nums ${riskTheme.bgTint}`}>
                        <div className="flex items-center justify-end gap-1.5">
                          <RiskIcon className={`w-3.5 h-3.5 shrink-0 ${riskTheme.iconColor}`} />
                          <span className={`font-extrabold text-sm ${riskTheme.textColor}`}>
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
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150 text-xs">
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
                return (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`p-3 rounded-lg border ${detailHealth.bgTint} border-slate-200`}>
                      <div className="text-[11px] text-slate-600 font-medium">LHI (Saúde Acadêmica)</div>
                      <div className={`text-base font-extrabold tabular-nums mt-0.5 ${detailHealth.textColor}`}>
                        {viewingDetailItem.lhi.toFixed(1)} · {getLHIStatus(viewingDetailItem.lhi)}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${detailRisk.bgTint} ${detailRisk.borderTint}`}>
                      <div className="text-[11px] text-slate-600 font-medium">ARS (Risco de Retenção)</div>
                      <div className={`text-base font-extrabold tabular-nums mt-0.5 ${detailRisk.textColor}`}>
                        {viewingDetailItem.ars.toFixed(1)} · {detailRisk.label}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <div className="font-semibold text-slate-800 mb-1">
                  Recomendação de Intervenção Pedagógica:
                </div>
                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-950 font-medium leading-relaxed">
                  {viewingDetailItem.recommendedAction}
                </div>
              </div>

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
    </div>
  );
};
