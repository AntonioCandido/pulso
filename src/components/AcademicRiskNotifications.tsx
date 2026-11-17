import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  BookOpen,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  EyeOff,
  GraduationCap,
  ListChecks,
  RotateCcw,
  School,
  ShieldAlert,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { AcademicCourse, DisciplineMetric, ImportSession, SystemConfig } from '../types';
import {
  DEFAULT_WEIGHTS,
  getARSLevel,
  getDetailedPedagogicalDiagnostic,
  getLHIStatus,
  getRecommendedPedagogicalAction,
} from '../utils/calculations';
import { resolveSourceCreatedAtFallback } from '../utils/pdfParser';

interface AcademicRiskNotificationsProps {
  disciplines: DisciplineMetric[];
  activeSession?: ImportSession | null;
  config: SystemConfig;
  onNavigateToAudit: (filter?: { course?: AcademicCourse; riskOnly?: boolean }) => void;
  onNavigateToSources: () => void;
}

export const AcademicRiskNotifications: React.FC<AcademicRiskNotificationsProps> = ({
  disciplines,
  activeSession,
  config,
  onNavigateToAudit,
  onNavigateToSources,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [selectedAlertDiscipline, setSelectedAlertDiscipline] = useState<DisciplineMetric | null>(null);
  const [copiedPlan, setCopiedPlan] = useState(false);

  useEffect(() => {
    setDismissedIds([]);
    setSelectedAlertDiscipline(null);
    setIsExpanded(false);
  }, [activeSession?.importId]);

  const weights = config.weights || DEFAULT_WEIGHTS;
  const hasData = disciplines.length > 0;

  // Analisa todas as disciplinas importadas e extrai as 3 com LHI mais crítico (menor LHI; desempate por maior ARS e Reprovação)
  const analysis = useMemo(() => {
    const sortedByLowestLhi = [...disciplines].sort(
      (a, b) => a.lhi - b.lhi || b.ars - a.ars || b.failureRate - a.failureRate
    );

    const criticalCount = disciplines.filter((d) => d.lhi < 55).length;
    const alertCount = disciplines.filter((d) => d.lhi >= 55 && d.lhi < 70).length;
    const healthyCount = disciplines.filter((d) => d.lhi >= 70).length;

    const top3CriticalLhi = sortedByLowestLhi.slice(0, 3);
    const visibleTop3 = top3CriticalLhi.filter((d) => !dismissedIds.includes(d.id));

    return {
      criticalCount,
      alertCount,
      healthyCount,
      top3CriticalLhi,
      visibleTop3,
    };
  }, [disciplines, dismissedIds]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleRestoreAll = () => {
    setDismissedIds([]);
  };

  const getLhiSeverityStyle = (lhi: number) => {
    if (lhi < 55) {
      return {
        label: 'LHI Crítico',
        cardClass: 'bg-rose-50/45 border-rose-200',
        headerText: 'text-rose-800',
        scoreText: 'text-rose-700',
        barColor: 'bg-rose-600',
        dividerClass: 'border-rose-200/70',
        buttonPrimary: 'bg-rose-700 hover:bg-rose-800 text-white',
        Icon: ShieldAlert,
      };
    }
    if (lhi < 70) {
      return {
        label: 'LHI em Alerta',
        cardClass: 'bg-amber-50/45 border-amber-200',
        headerText: 'text-amber-900',
        scoreText: 'text-amber-700',
        barColor: 'bg-amber-500',
        dividerClass: 'border-amber-200/70',
        buttonPrimary: 'bg-[#0A3977] hover:bg-blue-800 text-white',
        Icon: AlertTriangle,
      };
    }
    return {
      label: 'Menor LHI (Monitoramento)',
      cardClass: 'bg-slate-50/70 border-slate-200',
      headerText: 'text-slate-800',
      scoreText: 'text-[#0A3977]',
      barColor: 'bg-[#0A3977]',
      dividerClass: 'border-slate-200',
      buttonPrimary: 'bg-[#0A3977] hover:bg-blue-800 text-white',
      Icon: CheckCircle2,
    };
  };

  if (!hasData) {
    return (
      <section
        aria-label="Notificações de Risco Acadêmico"
        className="no-print bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Notificações de Risco Acadêmico · Monitoramento LHI
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Nenhuma disciplina importada no momento. Ao carregar um relatório (PDF, Excel ou BI), o sistema analisará automaticamente as turmas e destacará as 3 disciplinas com LHI mais crítico.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNavigateToSources}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0A3977] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Importar Disciplinas</span>
        </button>
      </section>
    );
  }

  return (
    <>
      <section
        aria-label="Notificações de Risco Acadêmico"
        className="no-print bg-white rounded-xl border border-slate-200 p-4 space-y-3.5"
      >
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                analysis.criticalCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : analysis.alertCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-50 text-[#0A3977]'
              }`}
            >
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h2 className="text-sm font-bold text-slate-900">
                  Notificações de Risco Acadêmico
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  · Top 3 disciplinas com LHI mais crítico ({disciplines.length} turmas analisadas)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-600 mt-0.5 tabular-nums">
                <span className={analysis.criticalCount > 0 ? 'font-semibold text-rose-700' : ''}>
                  {analysis.criticalCount} Crítica(s) (LHI &lt; 55)
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className={analysis.alertCount > 0 ? 'font-semibold text-amber-800' : ''}>
                  {analysis.alertCount} em Alerta (55–69,9)
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{analysis.healthyCount} Saudáveis/Excelentes (LHI ≥ 70)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {dismissedIds.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar ({dismissedIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateToAudit({ riskOnly: true })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A3977] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Auditar Riscos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              aria-expanded={isExpanded}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isExpanded ? 'Recolher' : 'Exibir Alertas'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3 Critical LHI Cards */}
        {isExpanded && (
          <>
            {analysis.visibleTop3.length === 0 ? (
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                <span>Todas as 3 notificações prioritárias de LHI foram marcadas como cientes nesta sessão.</span>
                <button
                  type="button"
                  onClick={handleRestoreAll}
                  className="inline-flex items-center gap-1.5 text-[#0A3977] font-semibold hover:underline cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Exibir novamente as 3 notificações</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                {analysis.visibleTop3.map((item) => {
                  const rankIndex = analysis.top3CriticalLhi.findIndex((d) => d.id === item.id) + 1;
                  const style = getLhiSeverityStyle(item.lhi);
                  const StatusIcon = style.Icon;
                  const lhiGapToHealthy = Number((70 - item.lhi).toFixed(1));
                  const diag = getDetailedPedagogicalDiagnostic(item, weights);
                  const quickAction = getRecommendedPedagogicalAction(item);

                  return (
                    <article
                      key={item.id}
                      className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-colors ${style.cardClass}`}
                    >
                      <div className="space-y-2.5">
                        {/* Rank + Explicit Severity + Dismiss */}
                        <div className="flex items-center justify-between gap-2">
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${style.headerText}`}>
                            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="tabular-nums">0{rankIndex}.</span>
                            <span>{style.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDismiss(item.id)}
                            title="Marcar notificação como ciente"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded hover:bg-white/80 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <EyeOff className="w-3 h-3" />
                            <span>Ciente</span>
                          </button>
                        </div>

                        {/* Discipline Name + Clean Unboxed Metadata */}
                        <div>
                          <h3
                            className="text-sm font-bold text-slate-900 leading-snug line-clamp-2"
                            title={item.name}
                          >
                            {item.name}
                          </h3>
                          <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            <span className="font-mono font-semibold text-slate-700">{item.code}</span>
                            <span aria-hidden="true">·</span>
                            <span>Turma {item.classCode}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.semester}º sem. {item.shift}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-full min-w-0" title={item.professor}>
                              {item.professor}
                            </span>
                          </div>
                        </div>

                        {/* LHI Highlight + Progress Bar */}
                        <div className={`pt-2 border-t ${style.dividerClass}`}>
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-2xl font-black tracking-tight tabular-nums ${style.scoreText}`}>
                                {item.lhi.toFixed(1)}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">pts LHI</span>
                            </div>
                            <span className="text-[11px] font-medium text-slate-600 tabular-nums">
                              {lhiGapToHealthy > 0
                                ? `-${lhiGapToHealthy.toFixed(1)} pts p/ Saudável (70)`
                                : `Meta Saudável atingida`}
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-white/90 rounded-full overflow-hidden mt-1.5 border border-slate-200/70">
                            <div
                              className={`h-full rounded-full ${style.barColor}`}
                              style={{ width: `${Math.max(4, Math.min(100, item.lhi))}%` }}
                            />
                          </div>
                        </div>

                        {/* Compact 4-Metric Hairline Strip */}
                        <div className="grid grid-cols-4 divide-x divide-slate-200/80 bg-white/85 rounded-lg border border-slate-200/80 py-1.5 text-center tabular-nums">
                          <div className="px-1">
                            <div className="text-[10px] text-slate-500">ARS</div>
                            <div className={`text-xs font-bold ${item.ars >= 45 ? 'text-rose-700' : item.ars >= 25 ? 'text-amber-700' : 'text-slate-800'}`}>
                              {item.ars.toFixed(1)}
                            </div>
                          </div>
                          <div className="px-1">
                            <div className="text-[10px] text-slate-500">Reprov.</div>
                            <div className={`text-xs font-bold ${item.failureRate >= 15 ? 'text-rose-700' : 'text-slate-800'}`}>
                              {item.failureRate.toFixed(1)}%
                            </div>
                          </div>
                          <div className="px-1">
                            <div className="text-[10px] text-slate-500">Aprend.</div>
                            <div className={`text-xs font-bold ${item.learningScore < 55 ? 'text-amber-800' : 'text-slate-800'}`}>
                              {item.learningScore.toFixed(0)}%
                            </div>
                          </div>
                          <div className="px-1">
                            <div className="text-[10px] text-slate-500">Freq.</div>
                            <div className={`text-xs font-bold ${item.attendanceRate < 75 ? 'text-rose-700' : 'text-slate-800'}`}>
                              {item.attendanceRate.toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        {/* Primary Bottleneck & Quick Action */}
                        <div className="text-[11px] text-slate-700 space-y-1 leading-relaxed">
                          <div>
                            <span className="font-bold text-slate-900">
                              Gargalo ({diag.disciplineAnalysis.primaryBottleneck.indicator}):
                            </span>{' '}
                            {diag.disciplineAnalysis.primaryBottleneck.detail}
                          </div>
                          <div className="text-slate-600 line-clamp-2" title={quickAction}>
                            <span className="font-semibold text-[#0A3977]">Ação:</span> {quickAction}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className={`pt-2.5 border-t ${style.dividerClass} flex items-center justify-between gap-2`}>
                        <button
                          type="button"
                          onClick={() => setSelectedAlertDiscipline(item)}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${style.buttonPrimary}`}
                        >
                          <ListChecks className="w-3.5 h-3.5" />
                          <span>Plano Tático & Análise</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToAudit({ riskOnly: true })}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span>Auditar</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal de Análise da Disciplina & Plano de Ação Tático Operacional (3 Eixos Integrados) */}
      {selectedAlertDiscipline && (() => {
        const item = selectedAlertDiscipline;
        const diag = getDetailedPedagogicalDiagnostic(item, weights);
        const headlineAction = getRecommendedPedagogicalAction(item);
        const lhiStatus = getLHIStatus(item.lhi);
        const arsLevel = getARSLevel(item.ars);

        const handleCopyTacticalPlan = () => {
          const text = [
            `NOTIFICAÇÃO DE RISCO ACADÊMICO — ${item.name} (${item.code})`,
            `Turma: ${item.classCode} · ${item.course} (${item.semester}º sem. · ${item.shift}) · Docente: ${item.professor}`,
            `LHI: ${item.lhi.toFixed(1)} pts (${lhiStatus}) | ARS: ${item.ars.toFixed(1)} pts (${arsLevel}) | Alunos: ${item.totalStudents}`,
            ``,
            `1. ANÁLISE PERSONALIZADA DA DISCIPLINA`,
            `• Diretriz Prioritária: ${headlineAction}`,
            `• Área Temática: ${diag.disciplineAnalysis.thematicArea}`,
            `• Conteúdos Críticos: ${diag.disciplineAnalysis.criticalTopics}`,
            `• Ferramental Prático: ${diag.disciplineAnalysis.practicalTooling}`,
            `• Gargalo Prioritário: ${diag.disciplineAnalysis.primaryBottleneck.indicator} (${diag.disciplineAnalysis.primaryBottleneck.severity}) — ${diag.disciplineAnalysis.primaryBottleneck.detail}`,
            `• Alavanca / Ponto Forte: ${diag.disciplineAnalysis.protectiveStrength.indicator} — ${diag.disciplineAnalysis.protectiveStrength.detail}`,
            `• Perfil & Histórico: ${diag.disciplineAnalysis.classProfile} | ${diag.disciplineAnalysis.historicalNote}`,
            ``,
            `2. PLANO DE AÇÃO TÁTICO OPERACIONAL (3 EIXOS INTEGRADOS)`,
            `[Eixo Docente — ${item.professor}]`,
            `  Foco: ${diag.actionPlan.axisFocus.faculty}`,
            ...diag.actionPlan.faculty.map((a) => `  - ${a}`),
            ``,
            `[Coordenação de Curso — ${item.course} · Turma ${item.classCode}]`,
            `  Foco: ${diag.actionPlan.axisFocus.coordination}`,
            ...diag.actionPlan.coordination.map((a) => `  - ${a}`),
            ``,
            `[Discentes & Monitoria — ${item.totalStudents} alunos]`,
            `  Foco: ${diag.actionPlan.axisFocus.students}`,
            ...diag.actionPlan.students.map((a) => `  - ${a}`),
            ``,
            `Resultado Integrado Esperado: ${diag.actionPlan.expectedOutcome}`,
          ].join('\n');
          navigator.clipboard.writeText(text);
          setCopiedPlan(true);
          setTimeout(() => setCopiedPlan(false), 2000);
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print"
            onClick={() => setSelectedAlertDiscipline(null)}
          >
            <div
              className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92dvh] flex flex-col overflow-hidden text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#0A3977] text-white px-4 sm:px-5 py-3.5 border-b-4 border-[#FFB800] flex items-start justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
                    <BellRing className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Notificação de Risco Acadêmico · Diagnóstico & Plano Tático</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5 leading-snug break-words">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-200 mt-0.5 break-words">
                    {item.code} · Turma {item.classCode} · {item.course} ({item.semester}º sem. · {item.shift}) · {item.professor}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAlertDiscipline(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  aria-label="Fechar janela"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* Summary KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50 rounded-xl border border-slate-200 py-2.5 text-center tabular-nums">
                  <div className="px-2 py-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">LHI (Saúde)</div>
                    <div className={`text-base font-black ${item.lhi < 55 ? 'text-rose-700' : item.lhi < 70 ? 'text-amber-700' : 'text-[#0A3977]'}`}>
                      {item.lhi.toFixed(1)} pts
                    </div>
                    <div className="text-[10px] text-slate-500">{lhiStatus}</div>
                  </div>
                  <div className="px-2 py-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">ARS (Risco)</div>
                    <div className={`text-base font-black ${item.ars >= 45 ? 'text-rose-700' : item.ars >= 25 ? 'text-amber-700' : 'text-slate-800'}`}>
                      {item.ars.toFixed(1)} pts
                    </div>
                    <div className="text-[10px] text-slate-500">{arsLevel}</div>
                  </div>
                  <div className="px-2 py-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Reprovação</div>
                    <div className="text-base font-bold text-slate-900">{item.failureRate.toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-500">{item.totalStudents} discentes</div>
                  </div>
                  <div className="px-2 py-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Aprendizagem</div>
                    <div className="text-base font-bold text-slate-900">{item.learningScore.toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-500">Meta {diag.targets.targetLearning}</div>
                  </div>
                  <div className="px-2 py-1 col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Frequência</div>
                    <div className="text-base font-bold text-slate-900">{item.attendanceRate.toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-500">Estudo {item.studyTimeFormatted || `${item.studyHoursPerWeek}h`}</div>
                  </div>
                </div>

                {/* 1. Análise Personalizada da Disciplina */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#0A3977]" />
                      <span>1. Análise Personalizada da Disciplina · {diag.disciplineAnalysis.thematicArea}</span>
                    </h4>
                    <span className="text-[11px] font-medium text-slate-500">
                      {diag.disciplineAnalysis.historicalNote}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-900">
                        Diretriz Prioritária · {diag.priority.label}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-800">
                        Prazo: {diag.priority.timeline}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-950 leading-relaxed">{headlineAction}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
                    <div
                      className={`p-3 rounded-lg border ${
                        diag.disciplineAnalysis.primaryBottleneck.severity === 'Crítico'
                          ? 'bg-rose-50/70 border-rose-200'
                          : diag.disciplineAnalysis.primaryBottleneck.severity === 'Alerta'
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                        <span>Gargalo Prioritário: {diag.disciplineAnalysis.primaryBottleneck.indicator}</span>
                        <span className="text-[11px] font-bold text-slate-700">
                          {diag.disciplineAnalysis.primaryBottleneck.severity}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-1 leading-relaxed">
                        {diag.disciplineAnalysis.primaryBottleneck.detail}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Alavanca / Ponto Forte: {diag.disciplineAnalysis.protectiveStrength.indicator}</span>
                      </div>
                      <p className="text-emerald-900/90 mt-1 leading-relaxed">
                        {diag.disciplineAnalysis.protectiveStrength.detail}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                    <div>
                      <strong className="text-slate-900">Conteúdos Críticos da Ementa:</strong>{' '}
                      {diag.disciplineAnalysis.criticalTopics}.
                    </div>
                    <div>
                      <strong className="text-slate-900">Perfil da Turma & Ferramental:</strong>{' '}
                      {diag.disciplineAnalysis.classProfile}. Ferramentas: <em>{diag.disciplineAnalysis.practicalTooling}</em>.
                    </div>
                  </div>
                </div>

                {/* 2. Plano de Ação Tático Operacional (3 Eixos Integrados) */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-[#0A3977]" />
                      <span>2. Plano de Ação Tático Operacional (3 Eixos Integrados) · {item.code}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleCopyTacticalPlan}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[#0A3977] font-semibold rounded-md transition-colors cursor-pointer text-[11px]"
                    >
                      {copiedPlan ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Plano Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Plano Tático</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col gap-2">
                      <div className="pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-[#0A3977] shrink-0" />
                          <span className="font-bold text-xs text-slate-900">Eixo Docente</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={item.professor}>
                          {item.professor}
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded bg-blue-50/80 border border-blue-100 text-[10px] font-semibold text-[#0A3977] leading-snug">
                        Foco: {diag.actionPlan.axisFocus.faculty}
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-700 flex-1">
                        {diag.actionPlan.faculty.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-[#0A3977] font-bold shrink-0 mt-0.5">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col gap-2">
                      <div className="pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <School className="w-4 h-4 text-[#0A3977] shrink-0" />
                          <span className="font-bold text-xs text-slate-900">Coordenação de Curso</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={`${item.course} · ${item.classCode}`}>
                          {item.course} · Turma {item.classCode}
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded bg-blue-50/80 border border-blue-100 text-[10px] font-semibold text-[#0A3977] leading-snug">
                        Foco: {diag.actionPlan.axisFocus.coordination}
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-700 flex-1">
                        {diag.actionPlan.coordination.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-[#0A3977] font-bold shrink-0 mt-0.5">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col gap-2">
                      <div className="pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="font-bold text-xs text-slate-900">Discentes & Monitoria</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.totalStudents} {item.totalStudents === 1 ? 'aluno' : 'alunos'} · {item.semester}º sem. ({item.shift})
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded bg-emerald-50/80 border border-emerald-100 text-[10px] font-semibold text-emerald-800 leading-snug">
                        Foco: {diag.actionPlan.axisFocus.students}
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-700 flex-1">
                        {diag.actionPlan.students.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-emerald-700 font-bold shrink-0 mt-0.5">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="px-3 py-2 rounded-lg bg-[#0A3977]/5 border border-[#0A3977]/15 text-[11px] text-slate-700 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#0A3977] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#0A3977]">Resultado Integrado Esperado:</strong>{' '}
                      {diag.actionPlan.expectedOutcome}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-4 sm:px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                <div className="text-[11px] text-slate-500 min-w-0 break-words">
                  Fonte: <strong>{activeSession?.fileName || item.sourceFileOrUrl || 'Base Importada'}</strong>
                  {resolveSourceCreatedAtFallback(activeSession, item) && (
                    <span className="tabular-nums"> · Criado em: <strong>{resolveSourceCreatedAtFallback(activeSession, item)}</strong></span>
                  )}
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlertDiscipline(null);
                      onNavigateToAudit({ riskOnly: true });
                    }}
                    className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Abrir na Auditoria
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAlertDiscipline(null)}
                    className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-[#0A3977] hover:bg-blue-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};
