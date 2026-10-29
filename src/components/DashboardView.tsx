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
    ? (activeSession.campus.startsWith('Campus') ? activeSession.campus : `Campus ${activeSession.campus}`)
    : executive?.campus 
    ? (executive.campus.startsWith('Campus') ? executive.campus : `Campus ${executive.campus}`)
    : `Campus ${primaryDiscipline?.campus || 'Principal'} (${primaryDiscipline?.regional || 'UNESA'})`;

  const courseLabel = !hasData
    ? 'CURSO: --'
    : `CURSO: ${(activeSession?.course || executive?.course || primaryDiscipline?.course || 'CIÊNCIA DA COMPUTAÇÃO').toUpperCase()}`;

  const lastUpdatedText = !hasData 
    ? 'Base de dados limpa' 
    : `Relatório: ${activeSession?.fileName || primaryDiscipline?.sourceFileOrUrl || 'Arquivo Selecionado'}`;

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

    return { isPos: true, diffStr: '+1:00', pctStr: '+5,00% A.A.', prevStr: 'Ano Anterior (18:00 A.A.)', targetStr: 'Meta: 20:00' };
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
      isPos: true,
      dispStr: `${avg.toFixed(2).replace('.', ',')} %`,
      diffStr: '+1,50 %',
      diffText: 'em relação à meta',
      prevStr: 'Ano Anterior (75,00% A.A.)'
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
    : '40,00%';

  const learningTarget = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.learningScoreTarget.toFixed(2).replace('.', ',')}%`
    : '50,00%';

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
    : '5,00%';

  const failureTarget = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.failureRateTarget.toFixed(2).replace('.', ',')}%`
    : '0,00%';

  // 5. Adesão AV & SM
  const adhesionAVDisplay = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.adhesionAV.toFixed(2).replace('.', ',')}%`
    : `${(disciplines.reduce((acc, curr) => acc + (curr.adhesionAV || 80), 0) / totalDisciplines).toFixed(2).replace('.', ',')}%`;

  const adhesionAVTarget = !hasData ? '0,00%' : executive ? `${executive.adhesionAVTarget.toFixed(2).replace('.', ',')}%` : '80,00%';
  const adhesionAVPrevious = !hasData ? '0,00%' : executive ? `${executive.adhesionAVPreviousYear.toFixed(2).replace('.', ',')}%` : '78,00%';

  const adhesionSMDisplay = !hasData 
    ? '0,00%' 
    : executive 
    ? `${executive.adhesionSM.toFixed(2).replace('.', ',')}%`
    : `${(disciplines.reduce((acc, curr) => acc + (curr.adhesionSM || 65), 0) / totalDisciplines).toFixed(2).replace('.', ',')}%`;

  const adhesionSMTarget = !hasData ? '0,00%' : executive ? `${executive.adhesionSMTarget.toFixed(2).replace('.', ',')}%` : '50,00%';
  const adhesionSMPrevious = !hasData ? '0,00%' : executive ? `${executive.adhesionSMPreviousYear.toFixed(2).replace('.', ',')}%` : '60,00%';

  // 6. LHI & ARS
  const avgLHI = !hasData ? '0.0' : (disciplines.reduce((acc, curr) => acc + curr.lhi, 0) / totalDisciplines).toFixed(1);
  const avgARS = !hasData ? '0.0' : (disciplines.reduce((acc, curr) => acc + curr.ars, 0) / totalDisciplines).toFixed(1);

  // Ranking: sorted dynamically by study time descending
  const sortedDisciplines = [...disciplines].sort((a, b) => {
    return (b.studyHoursPerWeek || 0) - (a.studyHoursPerWeek || 0);
  });

  const maxStudyHours = sortedDisciplines.length > 0 ? (sortedDisciplines[0].studyHoursPerWeek || 9.42) : 10;

  return (
    <div className="space-y-6">
      {/* Top Utility & Control Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-slate-700">Campus em Exibição:</span>
          <span className={`px-2.5 py-1 rounded font-semibold border ${
            hasData 
              ? 'bg-blue-50 text-[#0A3977] border-blue-200' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {campusLabel}
          </span>
          {hasData ? (
            <span className="text-slate-500 hidden sm:inline">
              · {totalDisciplines} turmas · {totalStudents} alunos matriculados
            </span>
          ) : (
            <span className="text-slate-400 hidden sm:inline">
              · Nenhuma turma carregada
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold">Fonte Ativa:</span>
            <span className="text-[11px] font-bold text-slate-800">
              {hasData ? (activeSession?.fileName || primaryDiscipline?.sourceFileOrUrl || 'Arquivo Importado') : 'Nenhuma Fonte (Base Limpa)'}
            </span>
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
          disciplines={disciplines}
          activeSession={activeSession}
          config={config}
          onNavigateToSources={onNavigateToSources}
        />
      </div>

      {/* Context Pedagogical Notes */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
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

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Frequência ({attendanceDisplay}) & Adesão</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {hasData ? (
                <>
                  Frequência média de <strong>{attendanceDisplay}</strong> (<em>Quantidade de presenças / Quantidade de presença + faltas</em>), variação de <strong>{attendanceDiff}</strong> {attendanceDiffText}. A partir de 2024.1, todas as modalidades seguem com <strong>SM1 e SM2</strong> na Adesão SM.
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

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Governança Pulso 2.0 & Reprovação</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              No <strong>Pulso 2.0</strong>, a Reprovação considera os alunos com nota &lt; 6 na expressão <em>maior nota entre (AV, NC e AVS) + (SM1 + SM2)</em> dividido pelos alunos que realizaram ao menos uma das três avaliações, refletindo também a nova modelagem estrutural de dados.
            </p>
          </div>
          <button
            onClick={onNavigateToSources}
            className="mt-3 text-slate-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Gerenciar Fontes & Power BI</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
