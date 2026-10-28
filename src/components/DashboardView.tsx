import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  MapPin, 
  Layers, 
  ShieldAlert, 
  Award, 
  ArrowUpRight, 
  Sliders, 
  CheckCircle2, 
  FileSpreadsheet,
  Download,
  Info
} from 'lucide-react';
import { DisciplineMetric, SystemConfig, AcademicCourse } from '../types';
import { 
  EXECUTIVE_STUDY_TIME_RANKING, 
  EXECUTIVE_SLIDE_METRICS, 
  PULSO_IMPAR_EXECUTIVE_SUMMARY 
} from '../data/mockAcademicData';

interface DashboardViewProps {
  disciplines: DisciplineMetric[];
  config: SystemConfig;
  onNavigateToAudit: (filter?: { course?: AcademicCourse; riskOnly?: boolean }) => void;
  onNavigateToSources: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  disciplines,
  config,
  onNavigateToAudit,
  onNavigateToSources,
}) => {
  // Toggle between Executive Presentation Layout (matching Final_pulso_academico_f30add0b.jpeg) and Governance/Audit mode
  const [selectedCampus, setSelectedCampus] = useState<'taquara' | 'tomjobim'>('taquara');
  const [showGovernanceCards, setShowGovernanceCards] = useState<boolean>(true);

  // Check if we are showing data from Pulso Acadêmico IMPAR.pdf
  const isPulsoImpar = disciplines.some(
    (d) => d.sourceFileOrUrl.toLowerCase().includes('impar') || d.campus === 'TOM JOBIM' || d.code === 'TMS0024'
  );

  // Summary indicators
  const totalDisciplines = disciplines.length;
  const totalStudents = disciplines.reduce((acc, curr) => acc + curr.totalStudents, 0);

  const avgLearning = isPulsoImpar 
    ? PULSO_IMPAR_EXECUTIVE_SUMMARY.learningScore.toFixed(2)
    : (disciplines.reduce((acc, curr) => acc + curr.learningScore, 0) / (totalDisciplines || 1)).toFixed(1);

  const avgFailure = isPulsoImpar 
    ? PULSO_IMPAR_EXECUTIVE_SUMMARY.failureRate.toFixed(2)
    : (disciplines.reduce((acc, curr) => acc + curr.failureRate, 0) / (totalDisciplines || 1)).toFixed(1);

  const avgAttendance = isPulsoImpar 
    ? PULSO_IMPAR_EXECUTIVE_SUMMARY.attendanceRate.toFixed(2)
    : (disciplines.reduce((acc, curr) => acc + curr.attendanceRate, 0) / (totalDisciplines || 1)).toFixed(1);

  const avgStudyFormatted = isPulsoImpar 
    ? PULSO_IMPAR_EXECUTIVE_SUMMARY.studyTimeFormatted
    : `${(disciplines.reduce((acc, curr) => acc + curr.studyHoursPerWeek, 0) / (totalDisciplines || 1)).toFixed(1)}h`;

  const avgLHI = (disciplines.reduce((acc, curr) => acc + curr.lhi, 0) / (totalDisciplines || 1)).toFixed(1);
  const avgARS = (disciplines.reduce((acc, curr) => acc + curr.ars, 0) / (totalDisciplines || 1)).toFixed(1);

  const criticalDisciplines = disciplines.filter((d) => d.ars >= 50 || d.failureRate >= 30);

  // Ranking data: use the authentic 15 rows from the executive mockup
  const rankingRows = EXECUTIVE_STUDY_TIME_RANKING;

  // Active campus details
  const campusLabel = selectedCampus === 'taquara' ? 'Campus R9 – Taquara' : 'Campus TOM JOBIM';
  const lastUpdatedText = selectedCampus === 'taquara' ? '20/10/2026 às 16h38' : '28/10/2026 às 10h48';

  return (
    <div className="space-y-6">
      {/* Top Utility & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-slate-700">Campus em Exibição:</span>
          <div className="inline-flex rounded-md shadow-xs bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setSelectedCampus('taquara')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                selectedCampus === 'taquara'
                  ? 'bg-white text-[#0A3977] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Campus R9 – Taquara (Slide Oficial)
            </button>
            <button
              onClick={() => setSelectedCampus('tomjobim')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                selectedCampus === 'tomjobim'
                  ? 'bg-white text-[#0A3977] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Campus TOM JOBIM (PDF Importado)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGovernanceCards(!showGovernanceCards)}
            className="flex items-center gap-1.5 px-3 py-1 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>{showGovernanceCards ? 'Ocultar Indicadores LHI/ARS' : 'Exibir Indicadores LHI/ARS'}</span>
          </button>

          <button
            onClick={() => onNavigateToAudit()}
            className="flex items-center gap-1 px-3 py-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            <span>Ver Grid de Auditoria</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          EXECUTIVE DASHBOARD CANVAS
          Faithfully reconstructed from "Final_pulso academico.jpeg"
         ========================================================================= */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans">
        
        {/* 1. Executive Top Header Banner (Deep Blue with Gold Accent) */}
        <div className="relative bg-[#0A3977] text-white px-6 py-5 overflow-hidden border-b-4 border-[#FFB800]">
          {/* Subtle geometric diamond watermark on top right */}
          <div className="absolute right-3 top-3 opacity-15 pointer-events-none hidden sm:block">
            <svg width="90" height="90" viewBox="0 0 100 100" fill="none">
              <polygon points="50,5 95,50 50,95 5,50" stroke="#38BDF8" strokeWidth="6" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="#38BDF8" strokeWidth="4" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="#38BDF8" strokeWidth="4" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title Hierarchy */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FFB800] uppercase font-sans">
                PULSO ACADÊMICO
              </h1>
              <h2 className="text-base sm:text-lg font-bold tracking-wide text-white uppercase mt-0.5">
                CURSO: CIÊNCIA DA COMPUTAÇÃO
              </h2>
            </div>

            {/* Slide Metadata */}
            <div className="text-xs space-y-1 text-slate-100/90 font-medium md:text-right">
              <div className="flex items-center md:justify-end gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="font-semibold text-white">{campusLabel}</span>
              </div>
              <div className="flex items-center md:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Ano 10/2026</span>
              </div>
              <div className="flex items-center md:justify-end gap-1.5 text-white/80 text-[11px]">
                <Clock className="w-3 h-3 text-[#38BDF8]" />
                <span>Dados atualizados em: {lastUpdatedText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Hero KPI Cards Grid (Direct replica of the 2 Executive Cards in Final_pulso_academico_f30add0b.jpeg) */}
        <div className="p-6 bg-[#F4F7FA]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* HERO CARD 1: TEMPO DE ESTUDO */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                {/* Blue circular icon */}
                <div className="w-14 h-14 rounded-full bg-[#EBF3FB] border-2 border-[#BCD7F2] flex items-center justify-center text-[#0A3977] shrink-0">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-black tracking-wider text-slate-700 uppercase">
                    TEMPO DE ESTUDO
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-extrabold text-[#0A3977] tracking-tight tabular-nums font-sans">
                      {selectedCampus === 'taquara' ? '14:39' : avgStudyFormatted}
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                      hh:mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Red drop indicator & comparison */}
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-rose-600 font-extrabold text-lg sm:text-xl">
                  <span className="text-xs">▼</span>
                  <span>{selectedCampus === 'taquara' ? '-8:32' : '-3:45'}</span>
                </div>
                <div className="text-xs font-bold text-rose-600">
                  {selectedCampus === 'taquara' ? '-36.68% A.A.' : '-23.10% A.A.'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  Ano Anterior ({selectedCampus === 'taquara' ? '23:11 A.A.' : '16:14 A.A.'})
                </div>
              </div>
            </div>

            {/* HERO CARD 2: FREQUÊNCIA */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                {/* Blue circular icon */}
                <div className="w-14 h-14 rounded-full bg-[#EBF3FB] border-2 border-[#BCD7F2] flex items-center justify-center text-[#0A3977] shrink-0">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-black tracking-wider text-slate-700 uppercase">
                    FREQUÊNCIA
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-extrabold text-[#0A3977] tracking-tight tabular-nums font-sans">
                      {selectedCampus === 'taquara' ? '68,36 %' : `${avgAttendance}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Red drop indicator & comparison */}
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-rose-600 font-extrabold text-lg sm:text-xl">
                  <span className="text-xs">▼</span>
                  <span>{selectedCampus === 'taquara' ? '-2,23 %' : '+8.61 %'}</span>
                </div>
                <div className="text-xs font-bold text-rose-600">
                  {selectedCampus === 'taquara' ? 'em relação ao 70,59% A.A.' : 'em relação ao 72,64% A.A.'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  Ano Anterior ({selectedCampus === 'taquara' ? '70,59% A.A.' : '72,64% A.A.'})
                </div>
              </div>
            </div>

          </div>

          {/* Optional Governance Strip: Learning, Failure, LHI & ARS */}
          {showGovernanceCards && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 font-medium">Grau de Aprendizagem</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">{avgLearning}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Meta: 50.00% · A.A: 45.28%</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 font-medium">Reprovação Geral</div>
                <div className="text-lg font-bold text-rose-600 mt-0.5">{avgFailure}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Meta: 2.58% · A.A: 0.00%</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 font-medium">Learning Health (LHI)</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">{avgLHI} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Saúde Pedagógica</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500 font-medium">Academic Risk (ARS)</div>
                <div className="text-lg font-bold text-amber-600 mt-0.5">{avgARS} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
                <div className="text-[10px] text-rose-600 font-medium mt-0.5">{criticalDisciplines.length} turmas em atenção</div>
              </div>
            </div>
          )}

          {/* 3. Ranking Table Container matching exact layout of Final_pulso_academico_f30add0b.jpeg */}
          <div className="mt-6 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            
            {/* Navy Rounded Ranking Header Bar */}
            <div className="bg-[#084172] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold tracking-wide">
                  Ranking de Tempo de Estudo por Disciplina · do maior para o menor
                </span>
              </div>
              <span className="text-[11px] font-semibold text-white/70 hidden sm:inline-block">
                Top 15 Disciplinas Curriculares
              </span>
            </div>

            {/* The Authentic Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0A3977] text-white font-bold text-[11px] border-b border-[#082E60]">
                    <th className="py-2.5 px-3 text-center w-12">#</th>
                    <th className="py-2.5 px-3">Disciplina</th>
                    <th className="py-2.5 px-3 font-mono text-center">Código</th>
                    <th className="py-2.5 px-3 text-center">Alunos (A.A.)</th>
                    <th className="py-2.5 px-3 text-center">Alunos (Atual)</th>
                    <th className="py-2.5 px-3 text-center">Tempo de (A.A.)</th>
                    <th className="py-2.5 px-3 text-center bg-[#07305C]">Tempo de Estudo</th>
                    <th className="py-2.5 px-3 w-48 text-left">Barra de Desempenho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {rankingRows.map((item) => {
                    const isTopThree = item.rank <= 3;
                    const hasPrevStudents = item.previousYearStudents !== undefined;
                    const hasPrevTime = item.previousYearStudyTime !== undefined;

                    // Progress bar color mapping matching the reference mockup:
                    // Green for top >= 7:00h
                    // Amber for 6:00h - 6:59h
                    // Orange for 5:30h - 5:59h
                    // Red for < 5:30h
                    let barColorClass = 'bg-[#16A34A]'; // Green
                    if (item.statusColor === 'yellow') {
                      barColorClass = 'bg-[#EAB308]'; // Yellow/Amber
                    } else if (item.statusColor === 'orange') {
                      barColorClass = 'bg-[#F97316]'; // Orange
                    } else if (item.statusColor === 'red') {
                      barColorClass = 'bg-[#EF4444]'; // Red
                    }

                    return (
                      <tr 
                        key={`${item.code}-${item.rank}`}
                        className={`hover:bg-slate-50 transition-colors ${
                          item.rank % 2 === 0 ? 'bg-[#F9FAFB]/70' : 'bg-white'
                        }`}
                      >
                        {/* 1. Rank pill: #1-#3 in solid green, #4-#15 neutral */}
                        <td className="py-2 px-3 text-center">
                          {isTopThree ? (
                            <span className="inline-flex items-center justify-center w-6 h-5 rounded-full bg-[#16A34A] text-white font-black text-[11px] shadow-2xs">
                              {item.rank}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold text-xs">
                              {item.rank}
                            </span>
                          )}
                        </td>

                        {/* 2. Disciplina name (uppercase, crisp font) */}
                        <td className="py-2 px-3 font-bold text-slate-900 tracking-tight text-[11px] sm:text-xs">
                          {item.name}
                        </td>

                        {/* 3. Código */}
                        <td className="py-2 px-3 font-mono text-[11px] text-center text-slate-700 font-semibold">
                          {item.code}
                        </td>

                        {/* 4. Alunos (A.A.) with subtle warm tint when has value */}
                        <td className={`py-2 px-3 text-center tabular-nums text-xs font-semibold ${
                          hasPrevStudents ? 'bg-amber-50/70 text-slate-800' : 'text-slate-400'
                        }`}>
                          {item.previousYearStudents ?? '—'}
                        </td>

                        {/* 5. Alunos (Atual) */}
                        <td className="py-2 px-3 text-center tabular-nums text-xs font-bold text-slate-900 bg-amber-50/50">
                          {item.currentStudents}
                        </td>

                        {/* 6. Tempo de (A.A.) with subtle highlight when has value */}
                        <td className={`py-2 px-3 text-center tabular-nums text-xs ${
                          hasPrevTime ? 'bg-amber-100/60 text-slate-900 font-semibold' : 'text-slate-400'
                        }`}>
                          {item.previousYearStudyTime ?? '—'}
                        </td>

                        {/* 7. Tempo de Estudo (Current) */}
                        <td className="py-2 px-3 text-center tabular-nums font-extrabold text-slate-900 bg-slate-50/90 text-xs">
                          {item.studyTimeFormatted}
                        </td>

                        {/* 8. Barra de Desempenho (Dynamic horizontal bar) */}
                        <td className="py-2 px-3">
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                              style={{ width: `${item.percentageWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Executive Slide Footer with Official Estácio Logo */}
            <div className="bg-[#EBF3FB] px-6 py-3.5 border-t border-[#BCD7F2] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-600 font-medium">
                Fonte: YDUQS – Pulso Acadêmico (Curso) · A.A. = Ano Anterior · Dados atualizados em: {lastUpdatedText}
              </div>

              {/* Official Estácio Logo */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider hidden md:inline">
                  Instituição
                </span>
                <div className="bg-white px-3 py-1 rounded shadow-2xs border border-slate-200 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Logo_estacio_sem_fundo_83f2716c.png"
                    alt="Logo Estácio Oficial"
                    className="h-6 w-auto object-contain"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Summary Pedagogical Notes and Call to Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Diagnóstico de Tempo de Estudo</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              O tempo médio consolidado no curso atingiu <strong>14:39 hh:mm</strong>, indicando retração de <strong>-36.68%</strong> em relação ao mesmo período do ano anterior (23:11 A.A.). As 3 disciplinas com maior engajamento superam 7h30 semanais.
            </p>
          </div>
          <button
            onClick={() => onNavigateToAudit()}
            className="mt-3 text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver correlações na auditoria</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Engajamento & Frequência</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              A frequência média de <strong>68,36%</strong> representa uma variação de <strong>-2,23%</strong> frente a 70,59% A.A. É recomendada a busca ativa dos alunos infrequentes nas primeiras 4 semanas de aula.
            </p>
          </div>
          <button
            onClick={() => onNavigateToAudit({ riskOnly: true })}
            className="mt-3 text-rose-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Filtrar turmas em risco</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportação & Conformidade</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Gere apresentações no formato widescreen 16:9 formatadas com o padrão Estácio/YDUQS ou planilhas analíticas .xlsx com fórmulas dinâmicas para a reunião de colegiado.
            </p>
          </div>
          <button
            onClick={onNavigateToSources}
            className="mt-3 text-slate-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Sincronizar Power BI & PDFs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
