import React from 'react';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ChevronRight, 
  MapPin, 
  ShieldAlert, 
  Award, 
  ArrowUpRight, 
  CheckCircle2, 
  FileSpreadsheet,
  Download,
  Database
} from 'lucide-react';
import { DisciplineMetric, SystemConfig, AcademicCourse, ImportSession } from '../types';
import { ExecutiveDashboardCanvas } from './ExecutiveDashboardCanvas';
import { AcademicRiskNotifications } from './AcademicRiskNotifications';
import { resolveSourceCreatedAtFallback, resolveDisplayCourseName } from '../utils/pdfParser';

interface DashboardViewProps {
  disciplines: DisciplineMetric[];
  activeSession?: ImportSession | null;
  config: SystemConfig;
  onNavigateToAudit: (filter?: { course?: AcademicCourse; riskOnly?: boolean }) => void;
  onNavigateToSources: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  disciplines,
  activeSession,
  config,
  onNavigateToAudit,
  onNavigateToSources,
}) => {

  // Check if base has data
  const hasData = disciplines.length > 0;
  const primaryDiscipline = disciplines[0];
  const executive = primaryDiscipline?.executiveSummary;

  // Summary Metrics (When base is zerada, ALL values are 0 / default as requested by user)
  const totalDisciplines = disciplines.length;
  const totalStudents = hasData ? disciplines.reduce((acc, curr) => acc + curr.totalStudents, 0) : 0;

  // Helper for parsing hh:mm to minutes
  const parseTimeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };

  // Campus em Exibição (strictly driven by the active import or executive summary)
  const campusLabel = !hasData 
    ? '-- (Base Zerada)' 
    : activeSession?.campus
    ? (activeSession.campus.startsWith('Campus') || activeSession.campus.startsWith('Não informado') ? activeSession.campus : `Campus ${activeSession.campus}`)
    : executive?.campus 
    ? (executive.campus.startsWith('Campus') ? executive.campus : `Campus ${executive.campus}`)
    : primaryDiscipline?.campus
    ? (primaryDiscipline.campus.startsWith('Campus') || primaryDiscipline.campus.startsWith('Não informado') ? primaryDiscipline.campus : `Campus ${primaryDiscipline.campus}`)
    : 'Não informado na fonte';

  const courseLabel = !hasData
    ? 'CURSO: --'
    : `CURSO: ${resolveDisplayCourseName(activeSession, disciplines).toUpperCase()}`;

  const fileCreatedAtDisplay = hasData
    ? resolveSourceCreatedAtFallback(activeSession, primaryDiscipline)
    : null;

  const lastUpdatedText = !hasData 
    ? 'Base de dados limpa' 
    : `Fonte: ${activeSession?.fileName || primaryDiscipline?.sourceFileOrUrl || 'Não informado na fonte'}`;

  // 1. Tempo de Estudo
  const studyTimeDisplay = !hasData 
    ? '00:00' 
    : executive?.studyTimeFormatted 
    ? executive.studyTimeFormatted
    : (() => {
        const avgHours = disciplines.reduce((acc, curr) => acc + (curr.studyHoursPerWeek || 0), 0) / totalDisciplines;
        const totalMins = Math.round(avgHours * 60);
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        return `${h}:${m.toString().padStart(2, '0')}`;
      })();

  const studyTimeCalculations = (() => {
    if (!hasData) return { isPos: null, diffStr: '0:00', pctStr: '0,00% A.A.', prevStr: 'Ano Anterior (00:00 A.A.)', targetStr: 'Meta: 00:00' };
    
    if (executive) {
      const currMins = parseTimeToMinutes(executive.studyTimeFormatted);
      const prevMins = parseTimeToMinutes(executive.studyTimePreviousYear);
      const diffMins = currMins - prevMins;
      const isPos = diffMins >= 0;
      const absDiff = Math.abs(diffMins);
      const diffH = Math.floor(absDiff / 60);
      const diffM = absDiff % 60;
      const diffStr = `${isPos ? '+' : '-'}${diffH}:${diffM.toString().padStart(2, '0')}`;
      const diffPct = prevMins > 0 ? ((currMins - prevMins) / prevMins) * 100 : 0;
      const pctStr = `${isPos ? '+' : ''}${diffPct.toFixed(2).replace('.', ',')}% A.A.`;
      const prevStr = `Ano Anterior (${executive.studyTimePreviousYear})`;
      const targetStr = `Meta: ${executive.studyTimeTarget}`;
      return { isPos, diffStr, pctStr, prevStr, targetStr };
    }

    return {
      isPos: null,
      diffStr: '—',
      pctStr: 'A.A. não informado na fonte',
      prevStr: 'Ano Anterior: Não informado na fonte',
      targetStr: 'Meta: Não informada na fonte',
    };
  })();

  const studyTimeIsPositive = studyTimeCalculations.isPos;
  const studyTimeDiff = studyTimeCalculations.diffStr;
  const studyTimeDiffPercent = studyTimeCalculations.pctStr;
  const studyTimePreviousYear = studyTimeCalculations.prevStr;
  const studyTimeTarget = studyTimeCalculations.targetStr;

  // 2. Frequência
  const attendanceCalculations = (() => {
    if (!hasData) return { isPos: null, dispStr: '0,00 %', diffStr: '0,00 %', diffText: 'em relação a 0,00% A.A.', prevStr: 'Ano Anterior (0,00% A.A.)' };

    if (executive) {
      const diff = executive.attendanceRate - executive.attendanceRatePreviousYear;
      const isPos = diff >= 0;
      return {
        isPos,
        dispStr: `${executive.attendanceRate.toFixed(2).replace('.', ',')} %`,
        diffStr: `${isPos ? '+' : ''}${diff.toFixed(2).replace('.', ',')} %`,
        diffText: `em relação ao ${executive.attendanceRatePreviousYear.toFixed(2).replace('.', ',')}% A.A.`,
        prevStr: `Ano Anterior (${executive.attendanceRatePreviousYear.toFixed(2).replace('.', ',')}% A.A.)`
      };
    }

    const avg = disciplines.reduce((acc, curr) => acc + curr.attendanceRate, 0) / totalDisciplines;
    return {
      isPos: null,
      dispStr: `${avg.toFixed(2).replace('.', ',')} %`,
      diffStr: '—',
      diffText: 'A.A. não informado na fonte',
      prevStr: 'Ano Anterior: Não informado na fonte'
    };
  })();

  const attendanceIsPositive = attendanceCalculations.isPos;
  const attendanceDisplay = attendanceCalculations.dispStr;
  const attendanceDiff = attendanceCalculations.diffStr;
  const attendanceDiffText = attendanceCalculations.diffText;
  const attendancePreviousYear = attendanceCalculations.prevStr;

  // 3. Grau de Aprendizagem
  const learningScoreDisplay = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.learningScore.toFixed(2).replace('.', ',')}%` 
    : `${(disciplines.reduce((acc, curr) => acc + curr.learningScore, 0) / totalDisciplines).toFixed(2).replace('.', ',')}%`;

  const learningPrevious = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.learningScorePreviousYear.toFixed(2).replace('.', ',')}%`
    : 'Não informado';

  const learningTarget = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.learningScoreTarget.toFixed(2).replace('.', ',')}%`
    : 'Não informado';

  // 4. Reprovação Geral
  const failureRateDisplay = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.failureRate.toFixed(2).replace('.', ',')}%` 
    : `${(disciplines.reduce((acc, curr) => acc + curr.failureRate, 0) / totalDisciplines).toFixed(2).replace('.', ',')}%`;

  const failurePrevious = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.failureRatePreviousYear.toFixed(2).replace('.', ',')}%`
    : 'Não informado';

  const failureTarget = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.failureRateTarget.toFixed(2).replace('.', ',')}%`
    : 'Não informado';

  // 5. Adesão AV & SM
  const itemsWithAdhesionAV = disciplines.filter((d) => d.adhesionAV !== undefined);
  const adhesionAVDisplay = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.adhesionAV.toFixed(2).replace('.', ',')}%`
    : itemsWithAdhesionAV.length > 0
    ? `${(itemsWithAdhesionAV.reduce((acc, curr) => acc + (curr.adhesionAV || 0), 0) / itemsWithAdhesionAV.length).toFixed(2).replace('.', ',')}%`
    : 'Não informado';

  const adhesionAVTarget = !hasData ? '0,00%' : executive ? `${executive.adhesionAVTarget.toFixed(2).replace('.', ',')}%` : 'Não informado';
  const adhesionAVPrevious = !hasData ? '0,00%' : executive ? `${executive.adhesionAVPreviousYear.toFixed(2).replace('.', ',')}%` : 'Não informado';

  const itemsWithAdhesionSM = disciplines.filter((d) => d.adhesionSM !== undefined);
  const adhesionSMDisplay = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.adhesionSM.toFixed(2).replace('.', ',')}%`
    : itemsWithAdhesionSM.length > 0
    ? `${(itemsWithAdhesionSM.reduce((acc, curr) => acc + (curr.adhesionSM || 0), 0) / itemsWithAdhesionSM.length).toFixed(2).replace('.', ',')}%`
    : 'Não informado';

  const adhesionSMTarget = !hasData ? '0,00%' : executive ? `${executive.adhesionSMTarget.toFixed(2).replace('.', ',')}%` : 'Não informado';
  const adhesionSMPrevious = !hasData ? '0,00%' : executive ? `${executive.adhesionSMPreviousYear.toFixed(2).replace('.', ',')}%` : 'Não informado';

  // 6. LHI & ARS
  const avgLHI = !hasData ? '0.0' : (disciplines.reduce((acc, curr) => acc + curr.lhi, 0) / totalDisciplines).toFixed(1);
  const avgARS = !hasData ? '0.0' : (disciplines.reduce((acc, curr) => acc + curr.ars, 0) / totalDisciplines).toFixed(1);

  // Ranking: sorted dynamically by study time descending
  const sortedDisciplines = [...disciplines].sort((a, b) => {
    return (b.studyHoursPerWeek || 0) - (a.studyHoursPerWeek || 0);
  });

  // Risk & Priority Diagnostics (strictly derived from active disciplines)
  const sortedByRisk = [...disciplines].sort((a, b) => b.ars - a.ars);
  const highestRiskDiscipline = sortedByRisk[0];
  const highRiskDisciplines = disciplines.filter((d) => d.ars >= 45);
  const alertRiskDisciplines = disciplines.filter((d) => d.ars >= 25 && d.ars < 45);
  const controlledRiskDisciplines = disciplines.filter((d) => d.ars < 25);
  const priorityDisciplinesCount = highRiskDisciplines.length + alertRiskDisciplines.length;
  const priorityStudentsCount = [...highRiskDisciplines, ...alertRiskDisciplines].reduce(
    (acc, curr) => acc + curr.totalStudents,
    0
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Utility & Control Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 text-xs bg-white py-2 px-3 sm:px-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700">Campus em Exibição:</span>
          <span className={`px-2 py-0.5 rounded font-semibold border text-xs ${
            hasData 
              ? 'bg-blue-50 text-[#0A3977] border-blue-200' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {campusLabel}
          </span>
          {hasData ? (
            <span className="text-slate-500 hidden sm:inline text-[11px]">
              · {totalDisciplines} turmas · {totalStudents} alunos matriculados
            </span>
          ) : (
            <span className="text-slate-400 hidden sm:inline text-[11px]">
              · Nenhuma turma carregada
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold">Fonte Ativa:</span>
            <span className="text-[11px] font-bold text-slate-800">
              {hasData ? (activeSession?.fileName || primaryDiscipline?.sourceFileOrUrl || 'Arquivo Importado') : 'Nenhuma Fonte (Base Limpa)'}
            </span>
            {hasData && fileCreatedAtDisplay && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                  Criado em: <strong className="text-slate-700">{fileCreatedAtDisplay}</strong>
                </span>
              </>
            )}
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            hasData ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {hasData ? 'Base Ativa' : 'Base Zerada'}
          </span>
        </div>
      </div>

      {/* EXECUTIVE DASHBOARD CANVAS */}
      <div id="print-executive-report">
        <ExecutiveDashboardCanvas
          key={`exec-${activeSession?.importId || 'empty'}`}
          disciplines={disciplines}
          activeSession={activeSession}
          config={config}
          onNavigateToSources={onNavigateToSources}
        />
      </div>

      {/* Sistema de Notificações de Risco Acadêmico (Top 3 LHI mais crítico) */}
      <AcademicRiskNotifications
        key={`risk-${activeSession?.importId || 'empty'}`}
        disciplines={disciplines}
        activeSession={activeSession}
        config={config}
        onNavigateToAudit={onNavigateToAudit}
        onNavigateToSources={onNavigateToSources}
      />

      {/* Context Pedagogical Notes */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Tempo de Estudo ({studyTimeDisplay} hh:mm)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {hasData ? (
                <>
                  O relatório do <strong>{campusLabel}</strong> registra tempo consolidado de <strong>{studyTimeDisplay}</strong> ({studyTimeDiffPercent} vs. {studyTimePreviousYear}), apurado pelo <em>tempo de navegação no conteúdo da disciplina + 52&apos; para cada download realizado</em>. Líder: <strong>{sortedDisciplines[0]?.name}</strong> ({sortedDisciplines[0]?.code}) com {sortedDisciplines[0]?.studyTimeFormatted || '00:00'}.
                </>
              ) : (
                "Base de dados limpa. O indicador apura o tempo de navegação no conteúdo da disciplina + 52' para cada download realizado (Pulso 1.0 / 2.0)."
              )}
            </p>
          </div>
          <button
            onClick={() => onNavigateToAudit()}
            className="mt-3 text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Auditar {totalDisciplines} turmas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Frequência ({attendanceDisplay}) & Adesão</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {hasData ? (
                <>
                  Frequência média de <strong>{attendanceDisplay}</strong> (<em>Quantidade de presenças / Quantidade de presença + faltas</em>), variação de <strong>{attendanceDiff}</strong> {attendanceDiffText}. Adesão consolidada na fonte: <strong>{adhesionAVDisplay} (AV)</strong> e <strong>{adhesionSMDisplay} (SM)</strong>.
                </>
              ) : (
                'Base de dados limpa. Frequência calculada por: Quantidade de presenças / Quantidade de presença + faltas (Pulso 1.0 / 2.0).'
              )}
            </p>
          </div>
          <button
            onClick={() => onNavigateToAudit()}
            className="mt-3 text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver correlações pedagógicas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className={`p-3 sm:p-3.5 rounded-lg border shadow-xs flex flex-col justify-between transition-colors ${
          !hasData
            ? 'bg-white border-slate-200'
            : highRiskDisciplines.length > 0
            ? 'bg-rose-50/40 border-rose-200'
            : alertRiskDisciplines.length > 0
            ? 'bg-amber-50/40 border-amber-200'
            : 'bg-emerald-50/40 border-emerald-200'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldAlert className={`w-4 h-4 shrink-0 ${
                  !hasData
                    ? 'text-slate-400'
                    : highRiskDisciplines.length > 0
                    ? 'text-rose-600'
                    : alertRiskDisciplines.length > 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`} />
                <span>Diagnóstico de Risco (ARS {avgARS}) & Prioridade</span>
              </div>
              {hasData && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${
                  highRiskDisciplines.length > 0
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : alertRiskDisciplines.length > 0
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {highRiskDisciplines.length > 0
                    ? `${highRiskDisciplines.length} Crítica(s)`
                    : alertRiskDisciplines.length > 0
                    ? `${alertRiskDisciplines.length} em Alerta`
                    : '100% Controlado'}
                </span>
              )}
            </div>

            {hasData && highestRiskDiscipline ? (
              <div className="space-y-2">
                <p className="text-slate-600 leading-relaxed">
                  {priorityDisciplinesCount > 0 ? (
                    <>
                      <strong>{priorityDisciplinesCount} de {totalDisciplines} turmas</strong> ({priorityStudentsCount} alunos) requerem acompanhamento (<strong>{highRiskDisciplines.length}</strong> em Alto Risco, <strong>{alertRiskDisciplines.length}</strong> em Alerta e <strong>{controlledRiskDisciplines.length}</strong> Controladas). Prioridade #1: <strong>{highestRiskDiscipline.name}</strong> ({highestRiskDiscipline.code}) com <strong>ARS {highestRiskDiscipline.ars.toFixed(1)}</strong> e estudo de <strong>{highestRiskDiscipline.studyTimeFormatted || '00:00'}</strong>.
                    </>
                  ) : (
                    <>
                      Todas as <strong>{totalDisciplines} turmas</strong> ({totalStudents} alunos) operam em <strong>Nível Controlado</strong> (ARS &lt; 25). Maior pontuação de atenção atual: <strong>{highestRiskDiscipline.name}</strong> ({highestRiskDiscipline.code}) com <strong>ARS {highestRiskDiscipline.ars.toFixed(1)}</strong> e saúde LHI de <strong>{highestRiskDiscipline.lhi.toFixed(1)}</strong>.
                    </>
                  )}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white/90 px-2.5 py-1.5 rounded border border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Aprendizagem</span>
                    <span className="text-[11px] font-extrabold text-slate-800 tabular-nums">
                      {learningScoreDisplay} <span className="text-[10px] font-normal text-slate-400">(Meta {learningTarget})</span>
                    </span>
                  </div>
                  <div className="bg-white/90 px-2.5 py-1.5 rounded border border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Reprovação</span>
                    <span className="text-[11px] font-extrabold text-slate-800 tabular-nums">
                      {failureRateDisplay} <span className="text-[10px] font-normal text-slate-400">(Meta {failureTarget})</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 leading-relaxed">
                Base de dados limpa. Importe um relatório oficial para visualizar o mapeamento automático de turmas críticas (ARS), prioridades de intervenção pedagógica e metas de aprovação.
              </p>
            )}
          </div>

          <button
            onClick={() => onNavigateToAudit({ riskOnly: priorityDisciplinesCount > 0 })}
            className={`mt-3 font-semibold hover:underline flex items-center gap-1 cursor-pointer ${
              !hasData
                ? 'text-blue-600'
                : highRiskDisciplines.length > 0
                ? 'text-rose-700'
                : alertRiskDisciplines.length > 0
                ? 'text-amber-800'
                : 'text-emerald-700'
            }`}
          >
            <span>
              {priorityDisciplinesCount > 0
                ? `Inspecionar ${priorityDisciplinesCount} turma(s) prioritária(s) por Risco`
                : 'Inspecionar ranking de Risco (ARS) e Saúde (LHI)'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
