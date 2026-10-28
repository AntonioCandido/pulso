import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit3, 
  Check, 
  X, 
  FileSpreadsheet, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  ChevronDown,
  RotateCcw,
  Sparkles,
  UserCheck,
  Trash2
} from 'lucide-react';
import { DisciplineMetric, AcademicCourse, LHIStatus, ARSLevel, FormulaWeights } from '../types';
import { calculateLHI, calculateARS, getLHIStatus, getARSLevel, getRecommendedPedagogicalAction } from '../utils/calculations';

interface AuditGridViewProps {
  disciplines: DisciplineMetric[];
  onUpdateDiscipline: (updated: DisciplineMetric) => void;
  onBatchUpdateDisciplines: (updatedItems: DisciplineMetric[]) => void;
  onClearAllData?: (clearSourcesAlso?: boolean) => void;
  weights: FormulaWeights;
  initialCourseFilter?: AcademicCourse | null;
  initialRiskOnly?: boolean;
}

export const AuditGridView: React.FC<AuditGridViewProps> = ({
  disciplines,
  onUpdateDiscipline,
  onBatchUpdateDisciplines,
  onClearAllData,
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
        if (arsFilter === 'RISK_HIGH') {
          if (item.ars < 45 && item.failureRate < 25) return false;
        } else if (arsFilter !== 'ALL' && item.arsLevel !== arsFilter) {
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

  const handleSort = (field: keyof DisciplineMetric) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
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

  // Inline audit submission
  const handleSaveAuditEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const recalculatedLHI = calculateLHI(
      editingItem.learningScore,
      editingItem.attendanceRate,
      editingItem.failureRate,
      editingItem.lmsAdherenceRate,
      weights.lhi
    );

    const recalculatedARS = calculateARS(
      editingItem.failureRate,
      editingItem.attendanceRate,
      editingItem.learningScore,
      editingItem.dropoutRiskRate,
      weights.ars
    );

    const updated: DisciplineMetric = {
      ...editingItem,
      lhi: recalculatedLHI,
      ars: recalculatedARS,
      lhiStatus: getLHIStatus(recalculatedLHI),
      arsLevel: getARSLevel(recalculatedARS),
      recommendedAction: getRecommendedPedagogicalAction({ ...editingItem, lhi: recalculatedLHI, ars: recalculatedARS }),
      isManuallyAdjusted: true,
      auditNote: auditNote || 'Ajuste auditado pela Coordenação de Curso.',
      sourceType: 'Ajuste Manual',
      lastUpdated: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
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

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>RF04</span>
            <span aria-hidden="true">·</span>
            <span>Auditoria e Governança Tabular</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700">{filteredData.length} turmas listadas</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Grid Interativo de Auditoria e Revisão de Dados
          </h1>
        </div>

        {/* Actions on right */}
        <div className="flex items-center gap-2">
          {/* Batch actions bar if rows selected */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <span className="font-semibold text-blue-900 px-2">
                {selectedIds.size} selecionadas
              </span>
              <button
                onClick={handleMarkTutoringBatch}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
              >
                Marcar Tutoria em Lote
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
              >
                Limpar Seleção
              </button>
            </div>
          )}

          {disciplines.length > 0 && onClearAllData && (
            <button
              onClick={() => {
                if (window.confirm(`Tem certeza que deseja zerar todas as ${disciplines.length} turmas da base de dados?`)) {
                  onClearAllData();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors shadow-xs"
              title="Zerar todas as informações e registros da base de dados"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Limpar Base de Dados</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por disciplina, código (TI-101), turma ou docente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-blue-600"
            />
          </div>

          {/* Course filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-blue-600 font-medium text-slate-700"
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
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-blue-600 font-medium text-slate-700"
            >
              <option value="ALL">Qualquer Nível de Risco (ARS)</option>
              <option value="RISK_HIGH">Apenas Risco Alto / Crítico</option>
              <option value="Baixo">Baixo Risco (&lt; 25)</option>
              <option value="Moderado">Risco Moderado (25 - 45)</option>
              <option value="Alto">Alto Risco (45 - 65)</option>
              <option value="Crítico">Risco Crítico (&ge; 65)</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-blue-600 font-medium text-slate-700"
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
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <span>Ordenação atual:</span>
            <span className="font-semibold text-slate-700 capitalize">{String(sortField)}</span>
            <span>({sortAsc ? 'Crescente' : 'Decrescente'})</span>
          </div>

          {(searchTerm || courseFilter !== 'ALL' || arsFilter !== 'ALL' || semesterFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCourseFilter('ALL');
                setArsFilter('ALL');
                setSemesterFilter('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabular Grid Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50/80 select-none">
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th 
                  onClick={() => handleSort('name')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Disciplina & Turma</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('course')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Curso</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('totalStudents')} 
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Alunos</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('learningScore')} 
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Aprendizagem</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('failureRate')} 
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Reprovação</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('attendanceRate')} 
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Frequência</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('studyHoursPerWeek')} 
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Dedicação</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('lhi')} 
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>LHI (Saúde)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ars')} 
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>ARS (Risco)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-slate-500">
                    {disciplines.length === 0 ? (
                      <div>
                        <div className="font-semibold text-slate-700 text-sm mb-1">Base de dados limpa (0 registros)</div>
                        <div className="text-slate-400">Todas as informações foram zeradas. Utilize o conector de BI ou relatórios PDF na aba Fontes para carregar novos dados.</div>
                      </div>
                    ) : (
                      'Nenhuma disciplina encontrada com os filtros selecionados.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono text-slate-600">{item.code}</span>
                          <span aria-hidden="true">·</span>
                          <span>Turma {item.classCode}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.professor}</span>
                          {item.isManuallyAdjusted && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700 font-medium">Auditado</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {item.course}
                        <div className="text-[10px] text-slate-400">
                          {item.semester}º Semestre · {item.shift}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                        {item.totalStudents}
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums font-medium text-slate-800">
                        {item.learningScore}%
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums">
                        <span
                          className={`font-semibold ${
                            item.failureRate > 30 ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {item.failureRate}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                        {item.attendanceRate}%
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                        {item.studyTimeFormatted ? `${item.studyTimeFormatted} (hh:mm)` : `${item.studyHoursPerWeek}h/sem`}
                      </td>

                      {/* LHI (Saúde) with unboxed text status */}
                      <td className="py-3 px-3 text-right tabular-nums">
                        <div className="font-bold text-emerald-700">{item.lhi}</div>
                        <div className="text-[10px] text-slate-400">{item.lhiStatus}</div>
                      </td>

                      {/* ARS (Risco) with unboxed text status */}
                      <td className="py-3 px-3 text-right tabular-nums">
                        <div
                          className={`font-bold ${
                            item.ars >= 50
                              ? 'text-rose-600'
                              : item.ars >= 35
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {item.ars}
                        </div>
                        <div className="text-[10px] text-slate-400">Risco {item.arsLevel}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingItem({ ...item });
                              setAuditNote(item.auditNote || '');
                            }}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                            title="Auditar / Ajustar Indicadores"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingDetailItem(item)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                            title="Visualizar Detalhes Pedagógicos"
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
      </div>

      {/* MODAL 1: Audit & Inline Review Editor */}
      {editingItem && (
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
                className="text-slate-400 hover:text-slate-600 p-1"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-blue-600 tabular-nums"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-blue-600 tabular-nums"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-blue-600 tabular-nums"
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
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-blue-600 tabular-nums"
                  />
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-blue-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-800">Recálculo em Tempo Real: </span>
                Os índices <strong>LHI</strong> e <strong>ARS</strong> serão atualizados automaticamente com base nos pesos vigentes da governança.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-xs transition-colors"
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
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500">Curso:</span>
                  <div className="font-medium text-slate-900">{viewingDetailItem.course}</div>
                </div>
                <div>
                  <span className="text-slate-500">Docente Responsável:</span>
                  <div className="font-medium text-slate-900">{viewingDetailItem.professor}</div>
                </div>
                <div>
                  <span className="text-slate-500">Matrículas Ativas:</span>
                  <div className="font-medium text-slate-900 tabular-nums">{viewingDetailItem.totalStudents} discentes</div>
                </div>
                <div>
                  <span className="text-slate-500">Origem dos Dados:</span>
                  <div className="font-medium text-slate-900">{viewingDetailItem.sourceType}</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded border border-blue-200">
                <div className="font-bold text-blue-900 mb-1">
                  Índices de Governança
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-600">LHI (Saúde Acadêmica): </span>
                    <strong className="text-emerald-700">{viewingDetailItem.lhi} ({viewingDetailItem.lhiStatus})</strong>
                  </div>
                  <div>
                    <span className="text-slate-600">ARS (Risco de Retenção): </span>
                    <strong className={viewingDetailItem.ars >= 50 ? 'text-rose-600' : 'text-amber-600'}>
                      {viewingDetailItem.ars} ({viewingDetailItem.arsLevel})
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-800 mb-1">
                  Recomendação de Intervenção Pedagógica:
                </div>
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                  {viewingDetailItem.recommendedAction}
                </div>
              </div>

              {viewingDetailItem.auditNote && (
                <div>
                  <div className="font-semibold text-slate-800 mb-1">
                    Histórico de Auditoria:
                  </div>
                  <div className="p-2.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                    "{viewingDetailItem.auditNote}" (Atualizado em {viewingDetailItem.lastUpdated})
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewingDetailItem(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-md hover:bg-slate-800"
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
