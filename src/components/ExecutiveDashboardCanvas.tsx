import React, { useState } from 'react';
import { Clock, Calendar, MapPin, Database, Info, X, AlertTriangle, CheckCircle2, ShieldAlert, Lightbulb } from 'lucide-react';
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
  const [selectedRiskItem, setSelectedRiskItem] = useState<DisciplineMetric | null>(null);
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
    ? (activeSession.campus.startsWith('Campus') || activeSession.campus.startsWith('Não informado') ? activeSession.campus : `Campus ${activeSession.campus}`)
    : executive?.campus 
    ? (executive.campus.startsWith('Campus') ? executive.campus : `Campus ${executive.campus}`)
    : primaryDiscipline?.campus
    ? (primaryDiscipline.campus.startsWith('Campus') || primaryDiscipline.campus.startsWith('Não informado') ? primaryDiscipline.campus : `Campus ${primaryDiscipline.campus}`)
    : 'Não informado na fonte';

  const courseLabel = !hasData
    ? 'CURSO: --'
    : `CURSO: ${(activeSession?.course || executive?.course || primaryDiscipline?.course || 'Não informado na fonte').toUpperCase()}`;

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
  const avgLHINumber = !hasData ? 0 : disciplines.reduce((acc, curr) => acc + curr.lhi, 0) / totalDisciplines;
  const avgARSNumber = !hasData ? 0 : disciplines.reduce((acc, curr) => acc + curr.ars, 0) / totalDisciplines;
  const avgLHI = !hasData ? '0.0' : avgLHINumber.toFixed(1);
  const avgARS = !hasData ? '0.0' : avgARSNumber.toFixed(1);

  const avgFailureNumber = !hasData
    ? 0
    : executive
    ? executive.failureRate
    : disciplines.reduce((acc, curr) => acc + curr.failureRate, 0) / totalDisciplines;

  // Esquema de cores diferenciado para o nível de Risco (ARS):
  // - Alto Risco (ARS >= 45): tons de vermelho suave (rose)
  // - Em Alerta (25 <= ARS < 45): tons de amarelo/âmbar suave (amber)
  // - Controlado (ARS < 25): tons de verde suave (emerald)
  const getRiskScheme = (arsValue: number, active: boolean) => {
    if (!active) {
      return {
        levelLabel: 'Sem Dados',
        cardBg: 'bg-white border-slate-200',
        titleText: 'text-slate-500',
        valueText: 'text-slate-400',
        subText: 'text-slate-400',
        badgeStyle: 'bg-slate-100 text-slate-500 border-slate-200',
        rowTint: '',
      };
    }
    if (arsValue >= 45) {
      return {
        levelLabel: arsValue >= 65 ? 'Risco Crítico' : 'Alto Risco',
        cardBg: 'bg-rose-50/90 border-rose-200/90',
        titleText: 'text-rose-900',
        valueText: 'text-rose-700',
        subText: 'text-rose-700',
        badgeStyle: 'bg-rose-100/90 text-rose-800 border-rose-300',
        rowTint: 'bg-rose-50/35',
      };
    }
    if (arsValue >= 25) {
      return {
        levelLabel: 'Em Alerta',
        cardBg: 'bg-amber-50/90 border-amber-200/90',
        titleText: 'text-amber-900',
        valueText: 'text-amber-700',
        subText: 'text-amber-800',
        badgeStyle: 'bg-amber-100/90 text-amber-800 border-amber-300',
        rowTint: 'bg-amber-50/25',
      };
    }
    return {
      levelLabel: 'Controlado',
      cardBg: 'bg-emerald-50/90 border-emerald-200/90',
      titleText: 'text-emerald-900',
      valueText: 'text-emerald-700',
      subText: 'text-emerald-800',
      badgeStyle: 'bg-emerald-100/90 text-emerald-800 border-emerald-300',
      rowTint: '',
    };
  };

  // Esquema semântico para Saúde da Aprendizagem (LHI - maior é melhor)
  const getHealthScheme = (lhiValue: number, active: boolean) => {
    if (!active) {
      return {
        levelLabel: 'Saúde Pedagógica',
        cardBg: 'bg-white border-slate-200',
        titleText: 'text-slate-500',
        valueText: 'text-slate-400',
        subText: 'text-slate-400',
        badgeStyle: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }
    if (lhiValue < 55) {
      return {
        levelLabel: 'Atenção Crítica',
        cardBg: 'bg-rose-50/80 border-rose-200/90',
        titleText: 'text-rose-900',
        valueText: 'text-rose-700',
        subText: 'text-rose-700',
        badgeStyle: 'bg-rose-100/90 text-rose-800 border-rose-300',
      };
    }
    if (lhiValue < 70) {
      return {
        levelLabel: 'Em Alerta',
        cardBg: 'bg-amber-50/80 border-amber-200/90',
        titleText: 'text-amber-900',
        valueText: 'text-amber-700',
        subText: 'text-amber-800',
        badgeStyle: 'bg-amber-100/90 text-amber-800 border-amber-300',
      };
    }
    return {
      levelLabel: lhiValue >= 85 ? 'Excelente' : 'Controlado / Saudável',
      cardBg: 'bg-emerald-50/80 border-emerald-200/90',
      titleText: 'text-emerald-900',
      valueText: 'text-emerald-700',
      subText: 'text-emerald-800',
      badgeStyle: 'bg-emerald-100/90 text-emerald-800 border-emerald-300',
    };
  };

  // Esquema semântico para Taxa de Reprovação
  const getFailureScheme = (failValue: number, active: boolean) => {
    if (!active) {
      return {
        levelLabel: 'Sem Dados',
        cardBg: 'bg-white border-slate-200',
        valueText: 'text-slate-400',
        badgeStyle: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }
    if (failValue >= 25) {
      return {
        levelLabel: 'Alto Risco',
        cardBg: 'bg-rose-50/60 border-rose-200/80',
        valueText: 'text-rose-700',
        badgeStyle: 'bg-rose-100/90 text-rose-800 border-rose-200',
      };
    }
    if (failValue >= 15) {
      return {
        levelLabel: 'Alerta',
        cardBg: 'bg-amber-50/60 border-amber-200/80',
        valueText: 'text-amber-700',
        badgeStyle: 'bg-amber-100/90 text-amber-800 border-amber-200',
      };
    }
    return {
      levelLabel: 'Controlado',
      cardBg: 'bg-emerald-50/60 border-emerald-200/80',
      valueText: 'text-emerald-700',
      badgeStyle: 'bg-emerald-100/90 text-emerald-800 border-emerald-200',
    };
  };

  const overallRiskScheme = getRiskScheme(avgARSNumber, hasData);
  const overallHealthScheme = getHealthScheme(avgLHINumber, hasData);
  const overallFailureScheme = getFailureScheme(avgFailureNumber, hasData);

  // Contagem de disciplinas por faixa de Risco (ARS)
  const controlledRiskCount = hasData ? disciplines.filter((d) => d.ars < 25).length : 0;
  const alertRiskCount = hasData ? disciplines.filter((d) => d.ars >= 25 && d.ars < 45).length : 0;
  const highRiskCount = hasData ? disciplines.filter((d) => d.ars >= 45).length : 0;

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

        <div className="relative z-10 flex flex-col md:flex-row print:flex-row md:items-center print:items-center justify-between gap-4">
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
          <div className="text-xs space-y-1 text-slate-100/90 font-medium md:text-right print:text-right">
            <div className="flex items-center md:justify-end print:justify-end gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="font-semibold text-white">{campusLabel}</span>
            </div>
            <div className="flex items-center md:justify-end print:justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>{hasData ? (executive?.entryYear ? `Ano Entrada: ${executive.entryYear} · Período ${config.academicPeriod}` : `Período ${config.academicPeriod}`) : 'Período --'}</span>
            </div>
            <div className="flex items-center md:justify-end print:justify-end gap-1.5 text-white/80 text-[11px]">
              <Clock className="w-3 h-3 text-[#38BDF8]" />
              <span>{lastUpdatedText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Responsive KPI Grid System */}
      <div className="p-6 bg-[#F4F7FA] space-y-5 print:p-4 print:space-y-4">
        {/* Primary Hero Indicators Row (2 equal-height responsive columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:grid-cols-2 print:gap-4 items-stretch">
          
          {/* HERO CARD 1: TEMPO DE ESTUDO */}
          <div 
            className="h-full bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md print:shadow-none"
            title="Tempo de Estudo (Pulso 1.0 / 2.0): Tempo de navegação no conteúdo da disciplina + 52' para cada download realizado."
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#EBF3FB] border-2 border-[#BCD7F2] flex items-center justify-center text-[#0A3977] shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider text-slate-700 uppercase block">
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
            <div className="sm:text-right flex flex-col sm:items-end justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <div className={`flex items-center gap-1.5 font-extrabold text-lg sm:text-xl tabular-nums ${
                !hasData 
                  ? 'text-slate-400' 
                  : studyTimeIsPositive === false 
                  ? 'text-rose-600' 
                  : 'text-emerald-600'
              }`}>
                <span className="text-[22px]">{!hasData ? '—' : studyTimeIsPositive === false ? '▼' : '▲'}</span>
                <span className="text-[22px]">{studyTimeDiff}</span>
              </div>
              <div className={`text-xs font-bold tabular-nums ${
                !hasData 
                  ? 'text-slate-400' 
                  : studyTimeIsPositive === false 
                  ? 'text-rose-600' 
                  : 'text-emerald-600'
              }`}>
                {studyTimeDiffPercent}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1 tabular-nums">
                {studyTimePreviousYear}
              </div>
              {hasData && (
                <div className="text-[11px] text-slate-500 font-medium tabular-nums">
                  {studyTimeTarget}
                </div>
              )}
            </div>
          </div>

          {/* HERO CARD 2: FREQUÊNCIA */}
          <div 
            className="h-full bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md print:shadow-none"
            title="Frequência (Pulso 1.0 / 2.0): Quantidade de presenças / Quantidade de presença + faltas"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#EBF3FB] border-2 border-[#BCD7F2] flex items-center justify-center text-[#0A3977] shrink-0">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wider text-slate-700 uppercase block">
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
            <div className="sm:text-right flex flex-col sm:items-end justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <div className={`flex items-center gap-1.5 font-extrabold text-lg sm:text-xl tabular-nums ${
                !hasData 
                  ? 'text-slate-400' 
                  : attendanceIsPositive === false 
                  ? 'text-rose-600' 
                  : 'text-emerald-600'
              }`}>
                <span className="text-[22px]">{!hasData ? '—' : attendanceIsPositive === false ? '▼' : '▲'}</span>
                <span className="text-[22px]">{attendanceDiff}</span>
              </div>
              <div className={`text-xs font-bold tabular-nums ${
                !hasData 
                  ? 'text-slate-400' 
                  : attendanceIsPositive === false 
                  ? 'text-rose-600' 
                  : 'text-emerald-600'
              }`}>
                {attendanceDiffText}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1 tabular-nums">
                {attendancePreviousYear}
              </div>
              {hasData && (
                <div className="text-[11px] text-slate-500 font-medium tabular-nums">
                  Meta: 80,00%
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Governance Indicators Responsive Grid: 1 col mobile -> 2 cols sm -> 3 cols lg -> 6 cols xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 print:grid-cols-6 print:gap-2 items-stretch">
          {/* Card 1: Grau de Aprendizagem */}
          <div 
            className="h-full flex flex-col justify-between bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs text-xs print:p-2.5"
            title="Grau de Aprendizagem (Pulso 1.0 / 2.0): Total de provas com notas >= as notas esperada / Total de provas realizadas. Nota esperada: média da taxa de acerto das questões que compõem cada prova."
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-slate-600 font-bold text-[11px] leading-snug">Grau de Aprendizagem</span>
            </div>
            <div className="text-[20px] font-extrabold text-slate-900 my-1.5 tabular-nums tracking-tight">
              {learningScoreDisplay}
            </div>
            <div className="text-[11px] text-slate-500 font-medium leading-tight border-t border-slate-100 pt-1.5 tabular-nums">
              {hasData ? (
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                  <span>Meta: {learningTarget}</span>
                  <span>A.A: {learningPrevious}</span>
                </div>
              ) : (
                'Meta: 0,00%'
              )}
            </div>
          </div>

          {/* Card 2: Reprovação Geral (com destaque semântico de risco) */}
          <div 
            className={`h-full flex flex-col justify-between p-3.5 rounded-xl border shadow-2xs text-xs transition-colors print:p-2.5 ${overallFailureScheme.cardBg}`}
            title="Reprovação (Pulso 2.0): Quantidade de alunos disciplinas com notas <6 na expressão: maior nota entre (AV, NC e AVS) + (SM1+ SM2) dividido pela quantidade alunos disciplinas que realizaram ao menos uma das três avaliações."
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-slate-700 font-bold text-[11px] leading-snug">Reprovação Geral</span>
              {hasData && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${overallFailureScheme.badgeStyle}`}>
                  {overallFailureScheme.levelLabel}
                </span>
              )}
            </div>
            <div className={`text-[20px] font-extrabold my-1.5 tabular-nums tracking-tight ${overallFailureScheme.valueText}`}>
              {failureRateDisplay}
            </div>
            <div className="text-[11px] text-slate-600 font-medium leading-tight border-t border-slate-200/60 pt-1.5 tabular-nums">
              {hasData ? (
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                  <span>Meta: {failureTarget}</span>
                  <span>A.A: {failurePrevious}</span>
                </div>
              ) : (
                'Meta: 0,00%'
              )}
            </div>
          </div>

          {/* Card 3: Adesão AV */}
          <div 
            className="h-full flex flex-col justify-between bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs text-xs print:p-2.5"
            title="Adesão AV (Pulso 1.0 / 2.0): Quantidade alunos disciplinas que realizaram ao menos uma das avaliações: (AV, NC, AVS, NF) / Quantidade de alunos disciplinas"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-slate-600 font-bold text-[11px] leading-snug">Adesão AV</span>
            </div>
            <div className="text-[20px] font-extrabold text-slate-900 my-1.5 tabular-nums tracking-tight">
              {adhesionAVDisplay}
            </div>
            <div className="text-[11px] text-slate-500 font-medium leading-tight border-t border-slate-100 pt-1.5 tabular-nums">
              {hasData ? (
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                  <span>Meta: {adhesionAVTarget}</span>
                  <span>A.A: {adhesionAVPrevious}</span>
                </div>
              ) : (
                'Meta: 0,00%'
              )}
            </div>
          </div>

          {/* Card 4: Adesão SM */}
          <div 
            className="h-full flex flex-col justify-between bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs text-xs print:p-2.5"
            title="Adesão SM (Pulso 1.0 / 2.0): A partir de 2024.1 todas as modalidades seguem com SM1 e SM2 (Quantidade alunos disciplinas que realizaram SM1 e SM2 / Quantidade de alunos disciplinas)."
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-slate-600 font-bold text-[11px] leading-snug">Adesão SM</span>
            </div>
            <div className="text-[20px] font-extrabold text-slate-900 my-1.5 tabular-nums tracking-tight">
              {adhesionSMDisplay}
            </div>
            <div className="text-[11px] text-slate-500 font-medium leading-tight border-t border-slate-100 pt-1.5 tabular-nums">
              {hasData ? (
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                  <span>Meta: {adhesionSMTarget}</span>
                  <span>A.A: {adhesionSMPrevious}</span>
                </div>
              ) : (
                'Meta: 0,00%'
              )}
            </div>
          </div>

          {/* Card 5: Learning Health (LHI) */}
          <div 
            className={`h-full flex flex-col justify-between p-3.5 rounded-xl border shadow-2xs text-xs transition-colors print:p-2.5 ${overallHealthScheme.cardBg}`}
            title="Learning Health Index (LHI): Índice composto de vitalidade pedagógica (0 a 100)."
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className={`font-bold text-[11px] leading-snug ${overallHealthScheme.titleText}`}>
                Learning Health (LHI)
              </span>
            </div>
            <div className={`text-[20px] font-extrabold my-1.5 tabular-nums tracking-tight ${overallHealthScheme.valueText}`}>
              {avgLHI} <span className="text-xs font-semibold opacity-70">/ 100</span>
            </div>
            <div className="flex items-center justify-between gap-1 border-t border-black/5 pt-1.5">
              <span className={`text-[11px] font-bold ${overallHealthScheme.subText}`}>
                {overallHealthScheme.levelLabel}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Saúde</span>
            </div>
          </div>

          {/* Card 6: Academic Risk (ARS) com esquema de cores diferenciado */}
          <div 
            className={`h-full flex flex-col justify-between p-3.5 rounded-xl border shadow-2xs text-xs transition-colors print:p-2.5 ${overallRiskScheme.cardBg}`}
            title="Academic Risk Score (ARS): Esquema de cores diferenciado por nível de risco (Verde < 25 Controlado, Amarelo 25-44.9 Alerta, Vermelho >= 45 Alto Risco)."
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className={`font-bold text-[11px] leading-snug ${overallRiskScheme.titleText}`}>
                Academic Risk (ARS)
              </span>
              <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded border ${overallRiskScheme.badgeStyle}`}>
                {overallRiskScheme.levelLabel}
              </span>
            </div>
            <div className={`text-[20px] font-extrabold my-1.5 tabular-nums tracking-tight ${overallRiskScheme.valueText}`}>
              {avgARS} <span className="text-xs font-semibold opacity-70">/ 100</span>
            </div>
            <div className="flex items-center justify-between gap-1 border-t border-black/5 pt-1.5 text-[10px] font-semibold tabular-nums">
              <span className="text-emerald-800" title="Disciplinas em nível Controlado">
                {controlledRiskCount} Contr.
              </span>
              <span className="text-amber-800" title="Disciplinas em nível de Alerta">
                {alertRiskCount} Alerta
              </span>
              <span className="text-rose-800" title="Disciplinas em Alto Risco / Crítico">
                {highRiskCount} Alto
              </span>
            </div>
          </div>
        </div>

        {/* Matriz Visual de Distribuição de Risco Acadêmico (Verde Controlado / Amarelo Alerta / Vermelho Alto Risco) */}
        {hasData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2 items-stretch">
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                  Nível Controlado (Baixo Risco)
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  ARS &lt; 25 · Desempenho equilibrado
                </div>
              </div>
              <div className="text-right tabular-nums shrink-0">
                <span className="text-xl font-black text-emerald-800">{controlledRiskCount}</span>
                <span className="text-[11px] font-bold text-emerald-700 block">
                  {Math.round((controlledRiskCount / totalDisciplines) * 100)}% das turmas
                </span>
              </div>
            </div>

            <div className="bg-amber-50/90 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                  Nível em Alerta (Risco Moderado)
                </div>
                <div className="text-[11px] text-amber-800 font-medium">
                  ARS 25 a 44,9 · Monitoramento preventivo
                </div>
              </div>
              <div className="text-right tabular-nums shrink-0">
                <span className="text-xl font-black text-amber-800">{alertRiskCount}</span>
                <span className="text-[11px] font-bold text-amber-800 block">
                  {Math.round((alertRiskCount / totalDisciplines) * 100)}% das turmas
                </span>
              </div>
            </div>

            <div className="bg-rose-50/90 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-900">
                  Nível Alto Risco / Crítico
                </div>
                <div className="text-[11px] text-rose-800 font-medium">
                  ARS &ge; 45 · Intervenção prioritária
                </div>
              </div>
              <div className="text-right tabular-nums shrink-0">
                <span className="text-xl font-black text-rose-800">{highRiskCount}</span>
                <span className="text-[11px] font-bold text-rose-800 block">
                  {Math.round((highRiskCount / totalDisciplines) * 100)}% das turmas
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Ranking Table Container: Reflects the active dataset or empty state */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden print:shadow-none">
          
          {/* Navy Rounded Ranking Header Bar */}
          <div className="bg-[#084172] text-white px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:py-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-wide">
                Ranking de Tempo de Estudo e Nível de Risco por Disciplina
              </span>
            </div>
            <span className="text-[11px] font-semibold text-white/80">
              {hasData ? `${sortedDisciplines.length} Disciplinas Importadas · ${totalStudents} Alunos · ${campusLabel}` : '0 Disciplinas'}
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
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0A3977] text-white font-bold text-[11px] border-b border-[#082E60]">
                    <th className="py-2.5 px-3 text-center w-11">#</th>
                    <th className="py-2.5 px-3">Disciplina</th>
                    <th className="py-2.5 px-3 font-mono text-center">Código</th>
                    <th className="py-2.5 px-3 text-center">Alunos (A.A.)</th>
                    <th className="py-2.5 px-3 text-center">Alunos (Atual)</th>
                    <th className="py-2.5 px-3 text-center">Tempo (A.A.)</th>
                    <th className="py-2.5 px-3 text-center bg-[#07305C]">Tempo de Estudo</th>
                    <th className="py-2.5 px-3 text-center">Nível de Risco (ARS)</th>
                    <th className="py-2.5 px-3 w-52 text-left">Barra de Desempenho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {sortedDisciplines.map((item, idx) => {
                    const rank = idx + 1;
                    const isTopThree = rank <= 3;
                    const hasPrevStudents = item.previousYearStudents !== undefined && item.previousYearStudents > 0;
                    const hasPrevTime = Boolean(item.previousYearStudyTime && item.previousYearStudyTime !== '—');
                    const itemRisk = getRiskScheme(item.ars, true);

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
                        className={`hover:bg-slate-50/90 transition-colors ${
                          itemRisk.rowTint
                            ? itemRisk.rowTint
                            : rank % 2 === 0
                            ? 'bg-[#F9FAFB]/70'
                            : 'bg-white'
                        }`}
                      >
                        {/* 1. Rank number */}
                        <td className="py-2.5 px-3 text-center tabular-nums">
                          {isTopThree ? (
                            <span className="inline-flex items-center justify-center w-6 h-5 rounded-md bg-[#16A34A] text-white font-black text-[11px] shadow-2xs">
                              {rank}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold text-xs">
                              {rank}
                            </span>
                          )}
                        </td>

                        {/* 2. Disciplina name (uppercase, crisp font) */}
                        <td className="py-2.5 px-3 font-bold text-slate-900 tracking-tight text-[11px] sm:text-xs">
                          {item.name}
                        </td>

                        {/* 3. Código */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-center text-slate-700 font-semibold">
                          {item.code}
                        </td>

                        {/* 4. Alunos (A.A.) */}
                        <td className={`py-2.5 px-3 text-center tabular-nums text-xs font-semibold ${
                          hasPrevStudents ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {hasPrevStudents ? item.previousYearStudents : '—'}
                        </td>

                        {/* 5. Alunos (Atual) */}
                        <td className="py-2.5 px-3 text-center tabular-nums text-xs font-bold text-slate-900">
                          {item.totalStudents}
                        </td>

                        {/* 6. Tempo de (A.A.) */}
                        <td className={`py-2.5 px-3 text-center tabular-nums text-xs ${
                          hasPrevTime ? 'text-slate-800 font-semibold' : 'text-slate-400'
                        }`}>
                          {hasPrevTime ? item.previousYearStudyTime : '—'}
                        </td>

                        {/* 7. Tempo de Estudo (Current) */}
                        <td className="py-2.5 px-3 text-center tabular-nums font-extrabold text-[#0A3977] bg-slate-50/90 text-xs">
                          {item.studyTimeFormatted || `${item.studyHoursPerWeek}h`}
                        </td>

                        {/* 8. Nível de Risco (ARS) com esquema de cores suave (Verde / Amarelo / Vermelho) */}
                        <td className="py-2.5 px-3 text-center tabular-nums">
                          <button
                            type="button"
                            onClick={() => setSelectedRiskItem(item)}
                            title="Clique para ver a justificativa do Nível de Risco (ARS) e a solução recomendada"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold transition-all hover:brightness-95 cursor-pointer ${itemRisk.badgeStyle}`}
                          >
                            <span>{item.ars.toFixed(1)}</span>
                            <span className="opacity-50">·</span>
                            <span>{itemRisk.levelLabel}</span>
                          </button>
                        </td>

                        {/* 9. Barra de Desempenho + Ícone de Informação (Justificativa ARS & Solução) */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                                style={{ width: `${percentageWidth}%` }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedRiskItem(item)}
                              className="p-1 text-slate-600 hover:text-[#0A3977] hover:bg-blue-50 rounded-md transition-colors cursor-pointer shrink-0 no-print"
                              title="Ver justificativa do Nível de Risco (ARS) e solução recomendada"
                              aria-label={`Ver justificativa do Nível de Risco (ARS) e solução para ${item.name}`}
                            >
                              <Info className="w-4 h-4 stroke-[2.2]" />
                            </button>
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
          <div className="bg-[#EBF3FB] px-6 py-3.5 border-t border-[#BCD7F2] flex flex-col sm:flex-row print:flex-row items-center justify-between gap-3 print:py-2">
            <div className="text-[11px] text-slate-600 font-medium">
              Fonte: YDUQS – Pulso Acadêmico (Curso) · {campusLabel} · A.A. = Ano Anterior · {lastUpdatedText}
            </div>

            {/* Official Estácio Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider hidden md:inline print:inline">
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

      {/* Modal de Justificativa do Nível de Risco (ARS) e Solução Pedagógica */}
      {selectedRiskItem && (() => {
        const modalRisk = getRiskScheme(selectedRiskItem.ars, true);
        const weights = config.weights?.ars || {
          failureRate: 0.40,
          infrequency: 0.30,
          learningDeficit: 0.20,
          dropoutRisk: 0.10,
        };

        const infrequencyRate = Number(Math.max(0, 100 - selectedRiskItem.attendanceRate).toFixed(2));
        const learningDeficitRate = Number(Math.max(0, 100 - selectedRiskItem.learningScore).toFixed(2));

        const contribFailure = Number((selectedRiskItem.failureRate * weights.failureRate).toFixed(1));
        const contribInfrequency = Number((infrequencyRate * weights.infrequency).toFixed(1));
        const contribLearning = Number((learningDeficitRate * weights.learningDeficit).toFixed(1));
        const contribDropout = Number((selectedRiskItem.dropoutRiskRate * weights.dropoutRisk).toFixed(1));

        // Identifica os motivos determinantes reais da disciplina para justificar o ARS
        const riskReasons: string[] = [];
        if (learningDeficitRate > 40) {
          riskReasons.push(
            `Déficit no Grau de Aprendizagem (${selectedRiskItem.learningScore.toFixed(1)}% de acerto esperado nas provas, gerando déficit de ${learningDeficitRate.toFixed(1)}% e adicionando +${contribLearning} pts ao ARS).`
          );
        }
        if (selectedRiskItem.failureRate >= 15) {
          riskReasons.push(
            `Taxa de Reprovação em ${selectedRiskItem.failureRate.toFixed(1)}% (peso ${(weights.failureRate * 100).toFixed(0)}% na matriz Pulso 2.0, adicionando +${contribFailure} pts ao ARS).`
          );
        }
        if (infrequencyRate >= 20) {
          riskReasons.push(
            `Infrequência acumulada de ${infrequencyRate.toFixed(1)}% (Frequência atual de ${selectedRiskItem.attendanceRate.toFixed(1)}%, adicionando +${contribInfrequency} pts ao ARS).`
          );
        }
        if (selectedRiskItem.studyHoursPerWeek < 5.5) {
          riskReasons.push(
            `Tempo de Estudo na disciplina (${selectedRiskItem.studyTimeFormatted || `${selectedRiskItem.studyHoursPerWeek}h`}) requer estímulo de navegação e consumo de materiais no ambiente virtual.`
          );
        }
        if (riskReasons.length === 0) {
          riskReasons.push(
            `Os indicadores da disciplina encontram-se equilibrados (Reprovação de ${selectedRiskItem.failureRate.toFixed(1)}%, Frequência de ${selectedRiskItem.attendanceRate.toFixed(1)}% e Tempo de Estudo de ${selectedRiskItem.studyTimeFormatted || `${selectedRiskItem.studyHoursPerWeek}h`}), mantendo o ARS em patamar controlado (${selectedRiskItem.ars.toFixed(1)} pts).`
          );
        }

        // Plano de solução direcionado aos fatores reais da disciplina
        const solutionSteps: { title: string; detail: string }[] = [];
        if (selectedRiskItem.learningScore < 60 || selectedRiskItem.failureRate >= 15) {
          solutionSteps.push({
            title: 'Nivelamento Avaliativo e Revisão de Questões (AV / NC / AVS + SM1/SM2)',
            detail:
              'Realizar revisão orientada dos tópicos com menor taxa de acerto antes das avaliações oficiais e incentivar a conclusão integral dos simulados SM1 e SM2 (que somam até 2,0 pontos na expressão da nota final do Pulso 2.0).',
          });
        }
        if (selectedRiskItem.studyHoursPerWeek < 6.0) {
          solutionSteps.push({
            title: 'Ampliação do Tempo de Estudo e Engajamento Digital',
            detail:
              "Promover roteiros semanais de estudo na trilha digital da disciplina e disponibilizar materiais estruturados para download (cada download contabiliza +52' na métrica oficial de Tempo de Estudo do Pulso Acadêmico).",
          });
        }
        if (selectedRiskItem.attendanceRate < 80) {
          solutionSteps.push({
            title: 'Busca Ativa e Monitoramento de Presença Discente',
            detail:
              `Acompanhar os ${selectedRiskItem.totalStudents} alunos matriculados na disciplina para elevar a frequência atual (${selectedRiskItem.attendanceRate.toFixed(1)}%) até a meta institucional de 80,00%, reduzindo o impacto da infrequência no ARS.`,
          });
        }
        solutionSteps.push({
          title: 'Diretriz Pedagógica Consolidada da Coordenação',
          detail:
            selectedRiskItem.recommendedAction ||
            'Manter acompanhamento contínuo dos indicadores de aprendizagem, frequência e engajamento nos simulados e avaliações.',
        });

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print"
            onClick={() => setSelectedRiskItem(null)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-150 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabeçalho do Modal com a cor semântica do Nível de Risco */}
              <div className="bg-[#0A3977] text-white px-6 py-4 border-b-4 border-[#FFB800] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
                    <Info className="w-3.5 h-3.5" />
                    <span>Justificativa de Risco Acadêmico (ARS) & Plano de Solução</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white mt-1 leading-snug">
                    {selectedRiskItem.name}
                  </h3>
                  <p className="text-xs text-slate-200 mt-0.5 font-mono">
                    Código: {selectedRiskItem.code} · Alunos Atuais: {selectedRiskItem.totalStudents} · Tempo de Estudo: {selectedRiskItem.studyTimeFormatted || `${selectedRiskItem.studyHoursPerWeek}h`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRiskItem(null)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Banner de Classificação do Nível de Risco (Verde / Amarelo / Vermelho) */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${modalRisk.cardBg}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border shrink-0 ${modalRisk.badgeStyle}`}>
                      {selectedRiskItem.ars >= 45 ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : selectedRiskItem.ars >= 25 ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-extrabold uppercase tracking-wider ${modalRisk.titleText}`}>
                        Classificação Atual: {modalRisk.levelLabel}
                      </div>
                      <p className={`text-xs mt-0.5 font-medium ${modalRisk.subText}`}>
                        {selectedRiskItem.ars >= 45
                          ? 'Requer intervenção pedagógica prioritária para mitigação de reprovação e retenção.'
                          : selectedRiskItem.ars >= 25
                          ? 'Faixa de alerta preventivo: demanda acompanhamento focado nos fatores de atenção abaixo.'
                          : 'Risco controlado: indicadores dentro da faixa de estabilidade acadêmica.'}
                      </p>
                    </div>
                  </div>
                  <div className="sm:text-right tabular-nums shrink-0">
                    <div className={`text-2xl font-black ${modalRisk.valueText}`}>
                      {selectedRiskItem.ars.toFixed(1)} <span className="text-xs font-bold opacity-75">/ 100</span>
                    </div>
                    <div className={`text-[11px] font-bold ${modalRisk.subText}`}>
                      LHI (Saúde): {selectedRiskItem.lhi.toFixed(1)} pts
                    </div>
                  </div>
                </div>

                {/* 1. Motivo / Justificativa do Nível de Risco (ARS) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#0A3977]" />
                    <span>1. Motivo e Justificativa do Nível de Risco (ARS)</span>
                  </h4>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      O <strong>Academic Risk Score (ARS = {selectedRiskItem.ars.toFixed(1)})</strong> desta disciplina é calculado a partir da ponderação dos 4 indicadores de risco abaixo (Perfil <strong>{config.weights?.presetName || 'Padrão Estácio — Pulso 2.0'}</strong>):
                    </p>

                    {/* Grid de decomposição matemática do ARS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 tabular-nums">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">Reprovação ({selectedRiskItem.failureRate.toFixed(1)}%)</div>
                          <div className="text-[11px] text-slate-500">Peso na fórmula: {(weights.failureRate * 100).toFixed(0)}%</div>
                        </div>
                        <span className="px-2 py-1 rounded bg-slate-100 font-extrabold text-slate-800">
                          +{contribFailure} pts
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">Infrequência ({infrequencyRate.toFixed(1)}%)</div>
                          <div className="text-[11px] text-slate-500">Frequência: {selectedRiskItem.attendanceRate.toFixed(1)}% · Peso: {(weights.infrequency * 100).toFixed(0)}%</div>
                        </div>
                        <span className="px-2 py-1 rounded bg-slate-100 font-extrabold text-slate-800">
                          +{contribInfrequency} pts
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">Déficit Aprendizagem ({learningDeficitRate.toFixed(1)}%)</div>
                          <div className="text-[11px] text-slate-500">Grau Aprendizagem: {selectedRiskItem.learningScore.toFixed(1)}% · Peso: {(weights.learningDeficit * 100).toFixed(0)}%</div>
                        </div>
                        <span className="px-2 py-1 rounded bg-slate-100 font-extrabold text-slate-800">
                          +{contribLearning} pts
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">Risco Evasão / Adesão ({selectedRiskItem.dropoutRiskRate.toFixed(1)}%)</div>
                          <div className="text-[11px] text-slate-500">Tempo Estudo: {selectedRiskItem.studyTimeFormatted || `${selectedRiskItem.studyHoursPerWeek}h`} · Peso: {(weights.dropoutRisk * 100).toFixed(0)}%</div>
                        </div>
                        <span className="px-2 py-1 rounded bg-slate-100 font-extrabold text-slate-800">
                          +{contribDropout} pts
                        </span>
                      </div>
                    </div>

                    {/* Lista de motivos específicos diagnosticados */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="font-bold text-slate-800 mb-1.5">Diagnóstico Causa-Raiz da Disciplina:</div>
                      <ul className="space-y-1.5 text-slate-700">
                        {riskReasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <span className="font-bold text-[#0A3977] mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 2. Solução Recomendada para o Problema */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>2. Solução Recomendada e Plano de Ação Pedagógica</span>
                  </h4>

                  <div className="space-y-2.5">
                    {solutionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-slate-800"
                      >
                        <div className="font-bold text-[#0A3977] flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0A3977] text-white text-[10px] font-extrabold shrink-0">
                            {idx + 1}
                          </span>
                          <span>{step.title}</span>
                        </div>
                        <p className="text-slate-700 mt-1 pl-7 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  Fonte dos dados: <strong>{activeSession?.fileName || selectedRiskItem.sourceFileOrUrl || 'Não informado na fonte'}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRiskItem(null)}
                  className="px-4 py-2 bg-[#0A3977] hover:bg-blue-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Fechar Diagnóstico
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
