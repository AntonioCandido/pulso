import React from 'react';
import { Clock, Calendar, MapPin, Database } from 'lucide-react';
import { DisciplineMetric, SystemConfig, ImportSession } from '../types';

export interface ExecutiveDashboardCanvasProps {
  disciplines: DisciplineMetric[];
  activeSession?: ImportSession | null;
  config: SystemConfig;
  onNavigateToSources?: () => void;
  isPrintMode?: boolean;
}

export const ExecutiveDashboardCanvas: React.FC<ExecutiveDashboardCanvasProps> = ({
  disciplines,
  activeSession,
  config,
  onNavigateToSources,
  isPrintMode = false,
}) => {
  const hasData = disciplines.length > 0;
  const primaryDiscipline = disciplines[0];
  const executive = primaryDiscipline?.executiveSummary;

  const totalDisciplines = disciplines.length;
  const totalStudents = hasData ? disciplines.reduce((acc, curr) => acc + curr.totalStudents, 0) : 0;

  // Helper for parsing hh:mm to minutes
  const parseTimeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };

  // Campus em Exibição
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
    <div className={`bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans print:shadow-none print:border-none print:rounded-none ${isPrintMode ? 'w-full' : ''}`}>
      {/* 1. Executive Top Header Banner (Deep Blue with Gold Accent) */}
      <div className="relative bg-[#0A3977] text-white px-6 py-5 overflow-hidden border-b-4 border-[#FFB800] print:py-4">
        {/* Subtle geometric diamond watermark on top right */}
        <div className="absolute right-3 top-3 opacity-15 pointer-events-none hidden sm:block">
          <svg width="90" height="90" viewBox="0 0 100 100" fill="none">
            <polygon points="50,5 95,50 50,95 5,50" stroke="#38BDF8" strokeWidth="6" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="#38BDF8" strokeWidth="4" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="#38BDF8" strokeWidth="4" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title Hierarchy with exact 31px font size requested */}
          <div>
            <h1 
              style={{ fontSize: '31px' }}
              className="text-[31px] font-black tracking-tight text-[#FFB800] uppercase font-sans leading-none"
            >
              PULSO ACADÊMICO
            </h1>
            <h2 className="text-base sm:text-lg font-bold tracking-wide text-white uppercase mt-1">
              {courseLabel}
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
              <span>{hasData ? (executive?.entryYear ? `Ano Entrada: ${executive.entryYear} · Período ${config.academicPeriod}` : `Período ${config.academicPeriod}`) : 'Período --'}</span>
            </div>
            <div className="flex items-center md:justify-end gap-1.5 text-white/80 text-[11px]">
              <Clock className="w-3 h-3 text-[#38BDF8]" />
              <span>{lastUpdatedText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero KPI Cards Grid (Reflects the loaded report dynamically, 00:00/0% when zerado) */}
      <div className="p-6 bg-[#F4F7FA] print:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-2 print:gap-4">
          
          {/* HERO CARD 1: TEMPO DE ESTUDO */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between transition-all hover:shadow-md print:shadow-none">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#EBF3FB] border-2 border-[#BCD7F2] flex items-center justify-center text-[#0A3977] shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider text-slate-700 uppercase">
                  TEMPO DE ESTUDO
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-[#0A3977] tracking-tight tabular-nums font-sans print:text-3xl">
                    {studyTimeDisplay}
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    hh:mm
                  </span>
                </div>
              </div>
            </div>

            {/* Indicator & comparison */}
            <div className="text-right flex flex-col items-end">
              <div className={`flex items-center gap-1.5 font-extrabold text-lg sm:text-xl ${
                !hasData 
                  ? 'text-slate-400' 
                  : studyTimeIsPositive === false 
                  ? 'text-rose-600' 
                  : 'text-emerald-600'
              }`}>
                <span className="text-xs">{!hasData ? '—' : studyTimeIsPositive === false ? '▼' : '▲'}</span>
                <span>{studyTimeDiff}</span>
              </div>
              <div className={`text-xs font-bold ${
                !hasData 
                  ? 'text-slate-400' 
                  : studyTimeIsPositive === false 
                  ? 'text-rose-600' 
                  : 'text-emerald-600'
              }`}>
                {studyTimeDiffPercent}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                {studyTimePreviousYear}
              </div>
              {hasData && (
                <div className="text-[10px] text-slate-400 font-medium">
                  {studyTimeTarget}
                </div>
              )}
            </div>
          </div>

          {/* HERO CARD 2: FREQUÊNCIA */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between transition-all hover:shadow-md print:shadow-none">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#EBF3FB] border-2 border-[#BCD7F2] flex items-center justify-center text-[#0A3977] shrink-0">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider text-slate-700 uppercase">
                  FREQUÊNCIA
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-[#0A3977] tracking-tight tabular-nums font-sans print:text-3xl">
                    {attendanceDisplay}
                  </span>
                </div>
              </div>
            </div>

            {/* Indicator & comparison */}
            <div className="text-right flex flex-col items-end">
              <div className={`flex items-center gap-1.5 font-extrabold text-lg sm:text-xl ${
                !hasData 
                  ? 'text-slate-400' 
                  : attendanceIsPositive === false 
                  ? 'text-rose-600' 
                  : 'text-emerald-600'
              }`}>
                <span className="text-xs">{!hasData ? '—' : attendanceIsPositive === false ? '▼' : '▲'}</span>
                <span>{attendanceDiff}</span>
              </div>
              <div className={`text-xs font-bold ${
                !hasData 
                  ? 'text-slate-400' 
                  : attendanceIsPositive === false 
                  ? 'text-rose-600' 
                  : 'text-emerald-600'
              }`}>
                {attendanceDiffText}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                {attendancePreviousYear}
              </div>
              {hasData && (
                <div className="text-[10px] text-slate-400 font-medium">
                  Meta: 80,00%
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Governance Strip: Grau de Aprendizagem, Reprovação, Adesão AV, Adesão SM, LHI & ARS */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-6 gap-3 print:grid-cols-6 print:gap-2">
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-500 font-medium text-[11px]">Grau de Aprendizagem</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">{learningScoreDisplay}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {hasData ? `Meta: ${learningTarget} · A.A: ${learningPrevious}` : 'Meta: 0,00%'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-500 font-medium text-[11px]">Reprovação Geral</div>
            <div className={`text-lg font-bold mt-0.5 ${!hasData ? 'text-slate-400' : 'text-slate-800'}`}>
              {failureRateDisplay}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {hasData ? `Meta: ${failureTarget} · A.A: ${failurePrevious}` : 'Meta: 0,00%'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-500 font-medium text-[11px]">Adesão AV</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">{adhesionAVDisplay}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {hasData ? `Meta: ${adhesionAVTarget} · A.A: ${adhesionAVPrevious}` : 'Meta: 0,00%'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-500 font-medium text-[11px]">Adesão SM</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">{adhesionSMDisplay}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {hasData ? `Meta: ${adhesionSMTarget} · A.A: ${adhesionSMPrevious}` : 'Meta: 0,00%'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-500 font-medium text-[11px]">Learning Health (LHI)</div>
            <div className={`text-lg font-bold mt-0.5 ${!hasData ? 'text-slate-400' : 'text-emerald-700'}`}>
              {avgLHI} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Saúde Pedagógica</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-500 font-medium text-[11px]">Academic Risk (ARS)</div>
            <div className={`text-lg font-bold mt-0.5 ${!hasData ? 'text-slate-400' : 'text-amber-600'}`}>
              {avgARS} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Risco Acadêmico</div>
          </div>
        </div>

        {/* 3. Ranking Table Container: Reflects the active dataset or empty state */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden print:mt-4 print:shadow-none">
          
          {/* Navy Rounded Ranking Header Bar */}
          <div className="bg-[#084172] text-white px-5 py-3 flex items-center justify-between print:py-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-wide">
                Ranking de Tempo de Estudo por Disciplina · do maior para o menor
              </span>
            </div>
            <span className="text-[11px] font-semibold text-white/70 hidden sm:inline-block">
              {hasData ? `${sortedDisciplines.length} Disciplinas Importadas · ${campusLabel}` : '0 Disciplinas'}
            </span>
          </div>

          {/* If Base is Zerada (empty), display clear zeroed message */}
          {!hasData ? (
            <div className="p-8 text-center bg-white space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Base de Dados Zerada
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Nenhum indicador curricular importado no momento. Acesse a tela "Conexão & Fontes" para importar relatórios PDF ou sincronizar o conector Power BI.
                </p>
              </div>
              {onNavigateToSources && (
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 no-print">
                  <button
                    onClick={onNavigateToSources}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>Acessar Conexão & Fontes</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* The Table showing exact data for the active report */
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
                  {sortedDisciplines.map((item, idx) => {
                    const rank = idx + 1;
                    const isTopThree = rank <= 3;
                    const hasPrevStudents = item.previousYearStudents !== undefined && item.previousYearStudents > 0;
                    const hasPrevTime = Boolean(item.previousYearStudyTime && item.previousYearStudyTime !== '—');

                    // Calculate percentage relative to max
                    const percentageWidth = Math.max(25, Math.min(100, Math.round(((item.studyHoursPerWeek || 4) / maxStudyHours) * 100)));

                    // Bar color mapping
                    let barColorClass = 'bg-[#16A34A]'; // Green >= 7h
                    if (item.studyHoursPerWeek < 4.5) {
                      barColorClass = 'bg-[#EF4444]'; // Red < 4.5h
                    } else if (item.studyHoursPerWeek < 6.0) {
                      barColorClass = 'bg-[#F97316]'; // Orange 4.5h - 5.9h
                    } else if (item.studyHoursPerWeek < 7.0) {
                      barColorClass = 'bg-[#EAB308]'; // Yellow 6.0h - 6.9h
                    }

                    return (
                      <tr 
                        key={`${item.code}-${rank}`}
                        className={`hover:bg-slate-50 transition-colors ${
                          rank % 2 === 0 ? 'bg-[#F9FAFB]/70' : 'bg-white'
                        }`}
                      >
                        {/* 1. Rank pill: #1-#3 in solid green, #4-#15 neutral */}
                        <td className="py-2 px-3 text-center">
                          {isTopThree ? (
                            <span className="inline-flex items-center justify-center w-6 h-5 rounded-full bg-[#16A34A] text-white font-black text-[11px] shadow-2xs">
                              {rank}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold text-xs">
                              {rank}
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
                          {hasPrevStudents ? item.previousYearStudents : '—'}
                        </td>

                        {/* 5. Alunos (Atual) */}
                        <td className="py-2 px-3 text-center tabular-nums text-xs font-bold text-slate-900 bg-amber-50/50">
                          {item.totalStudents}
                        </td>

                        {/* 6. Tempo de (A.A.) with subtle highlight when has value */}
                        <td className={`py-2 px-3 text-center tabular-nums text-xs ${
                          hasPrevTime ? 'bg-amber-100/60 text-slate-900 font-semibold' : 'text-slate-400'
                        }`}>
                          {hasPrevTime ? item.previousYearStudyTime : '—'}
                        </td>

                        {/* 7. Tempo de Estudo (Current) */}
                        <td className="py-2 px-3 text-center tabular-nums font-extrabold text-slate-900 bg-slate-50/90 text-xs">
                          {item.studyTimeFormatted || `${item.studyHoursPerWeek}h`}
                        </td>

                        {/* 8. Barra de Desempenho (Dynamic horizontal bar) */}
                        <td className="py-2 px-3">
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                              style={{ width: `${percentageWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Executive Slide Footer with Official Estácio Logo */}
          <div className="bg-[#EBF3FB] px-6 py-3.5 border-t border-[#BCD7F2] flex flex-col sm:flex-row items-center justify-between gap-3 print:py-2">
            <div className="text-[11px] text-slate-600 font-medium">
              Fonte: YDUQS – Pulso Acadêmico (Curso) · {campusLabel} · A.A. = Ano Anterior · {lastUpdatedText}
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
  );
};
