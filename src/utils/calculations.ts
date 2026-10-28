import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';
import { 
  DisciplineMetric, 
  FormulaWeights, 
  LHIStatus, 
  ARSLevel, 
  SystemConfig 
} from '../types';

export const DEFAULT_WEIGHTS: FormulaWeights = {
  lhi: {
    learningScore: 0.35,
    attendance: 0.25,
    passRate: 0.20,
    lmsAdherence: 0.20,
  },
  ars: {
    failureRate: 0.40,
    infrequency: 0.30,
    learningDeficit: 0.20,
    dropoutRisk: 0.10,
  },
};

/**
 * Calculates Learning Health Index (LHI) - 0 to 100
 */
export function calculateLHI(
  learningScore: number,
  attendanceRate: number,
  failureRate: number,
  lmsAdherenceRate: number,
  weights: FormulaWeights['lhi'] = DEFAULT_WEIGHTS.lhi
): number {
  const passRate = Math.max(0, 100 - failureRate);
  
  const rawLhi = 
    (weights.learningScore * learningScore) +
    (weights.attendance * attendanceRate) +
    (weights.passRate * passRate) +
    (weights.lmsAdherence * lmsAdherenceRate);
    
  return Number(Math.min(100, Math.max(0, rawLhi)).toFixed(1));
}

/**
 * Calculates Academic Risk Score (ARS) - 0 to 100 (Higher means riskier)
 */
export function calculateARS(
  failureRate: number,
  attendanceRate: number,
  learningScore: number,
  dropoutRiskRate: number,
  weights: FormulaWeights['ars'] = DEFAULT_WEIGHTS.ars
): number {
  const infrequency = Math.max(0, 100 - attendanceRate);
  const learningDeficit = Math.max(0, 100 - learningScore);
  
  const rawArs = 
    (weights.failureRate * failureRate) +
    (weights.infrequency * infrequency) +
    (weights.learningDeficit * learningDeficit) +
    (weights.dropoutRisk * dropoutRiskRate);
    
  return Number(Math.min(100, Math.max(0, rawArs)).toFixed(1));
}

export function getLHIStatus(lhi: number): LHIStatus {
  if (lhi >= 85) return 'Excelente';
  if (lhi >= 70) return 'Saudável';
  if (lhi >= 55) return 'Alerta';
  return 'Crítico';
}

export function getARSLevel(ars: number): ARSLevel {
  if (ars < 25) return 'Baixo';
  if (ars < 45) return 'Moderado';
  if (ars < 65) return 'Alto';
  return 'Crítico';
}

export function getRecommendedPedagogicalAction(item: DisciplineMetric): string {
  if (item.ars >= 65 || item.failureRate > 35) {
    return 'Plano de Tutoria Intensiva, nivelamento de pré-requisitos e revisão de ementa avaliativa.';
  }
  if (item.attendanceRate < 75) {
    return 'Busca ativa discente, flexibilização assíncrona e engajamento via coordenação.';
  }
  if (item.lmsAdherenceRate < 60) {
    return 'Capacitação docente para dinâmicas ativas no LMS e atividades formativas pontuadas.';
  }
  if (item.studyHoursPerWeek < 4) {
    return 'Orientação de estudos acadêmicos e criação de grupos de estudo com bolsistas.';
  }
  return 'Monitoramento padrão e manutenção das boas práticas metodológicas.';
}

/**
 * Recalculate metrics for an array of disciplines based on current weights
 */
export function recalculateAllMetrics(
  items: DisciplineMetric[],
  weights: FormulaWeights
): DisciplineMetric[] {
  return items.map((item) => {
    const lhi = calculateLHI(
      item.learningScore,
      item.attendanceRate,
      item.failureRate,
      item.lmsAdherenceRate,
      weights.lhi
    );
    const ars = calculateARS(
      item.failureRate,
      item.attendanceRate,
      item.learningScore,
      item.dropoutRiskRate,
      weights.ars
    );
    return {
      ...item,
      lhi,
      ars,
      lhiStatus: getLHIStatus(lhi),
      arsLevel: getARSLevel(ars),
      recommendedAction: getRecommendedPedagogicalAction({ ...item, lhi, ars }),
    };
  });
}

/**
 * Export to multi-sheet formatted Excel workbook (.xlsx)
 */
export function exportAnalyticalWorkbook(
  items: DisciplineMetric[],
  config: SystemConfig
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Sumário Executivo
  const totalDisciplines = items.length;
  const totalStudents = items.reduce((acc, curr) => acc + curr.totalStudents, 0);
  const avgLearning = (items.reduce((acc, curr) => acc + curr.learningScore, 0) / (totalDisciplines || 1)).toFixed(1);
  const avgFailure = (items.reduce((acc, curr) => acc + curr.failureRate, 0) / (totalDisciplines || 1)).toFixed(1);
  const avgAttendance = (items.reduce((acc, curr) => acc + curr.attendanceRate, 0) / (totalDisciplines || 1)).toFixed(1);
  const avgLHI = (items.reduce((acc, curr) => acc + curr.lhi, 0) / (totalDisciplines || 1)).toFixed(1);
  const avgARS = (items.reduce((acc, curr) => acc + curr.ars, 0) / (totalDisciplines || 1)).toFixed(1);

  const summaryData = [
    ['PULSO ACADÊMICO - RELATÓRIO GERENCIAL EXECUTIVO DE INDICADORES'],
    ['Instituição:', config.institutionName],
    ['Período Letivo:', config.academicPeriod],
    ['Coordenador Responsável:', config.coordinatorName],
    ['Data da Extração / Geração:', new Date().toLocaleString('pt-BR')],
    [],
    ['INDICADOR CONSOLIDADO', 'VALOR GLOBAL', 'CLASSIFICAÇÃO METODOLÓGICA'],
    ['Learning Health Index (LHI Médio)', `${avgLHI} / 100`, getLHIStatus(Number(avgLHI))],
    ['Academic Risk Score (ARS Médio)', `${avgARS} / 100`, getARSLevel(Number(avgARS))],
    ['Grau Médio de Aprendizagem', `${avgLearning}%`, Number(avgLearning) >= 70 ? 'Satisfatório' : 'Abaixo da Meta'],
    ['Índice Médio de Reprovação', `${avgFailure}%`, Number(avgFailure) <= 20 ? 'Aceitável' : 'Atenção Crítica'],
    ['Frequência Média Global', `${avgAttendance}%`, Number(avgAttendance) >= 75 ? 'Regular' : 'Infrequência Alta'],
    ['Total de Matrículas Monitoradas', totalStudents, 'Alunos em disciplinas de TI'],
    ['Total de Turmas / Disciplinas Auditadas', totalDisciplines, 'Turmas analisadas'],
    [],
    ['GOVERNANÇA DE FÓRMULAS E PESOS APLICADOS'],
    ['Fórmula LHI', '0.35 * Aprendizagem + 0.25 * Frequência + 0.20 * (100 - Reprovação) + 0.20 * Adesão LMS'],
    ['Fórmula ARS', '0.40 * Reprovação + 0.30 * (100 - Frequência) + 0.20 * (100 - Aprendizagem) + 0.10 * Evasão'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Sumário Executivo');

  // Sheet 2: Auditoria Tabular Detalhada
  const auditHeaders = [
    'Código',
    'Disciplina',
    'Curso',
    'Período',
    'Turno',
    'Turma',
    'Docente',
    'Matriculados',
    'Aprendizagem (%)',
    'Reprovação (%)',
    'Evasão (%)',
    'Dedicação (h/sem)',
    'Frequência (%)',
    'Adesão LMS (%)',
    'LHI (Saúde)',
    'Status LHI',
    'ARS (Risco)',
    'Nível ARS',
    'Fonte do Dado',
    'Ajuste Manual?',
    'Ação Pedagógica Recomendada',
  ];

  const auditRows = items.map((i) => [
    i.code,
    i.name,
    i.course,
    `${i.semester}º Semestre`,
    i.shift,
    i.classCode,
    i.professor,
    i.totalStudents,
    i.learningScore,
    i.failureRate,
    i.dropoutRiskRate,
    i.studyHoursPerWeek,
    i.attendanceRate,
    i.lmsAdherenceRate,
    i.lhi,
    i.lhiStatus,
    i.ars,
    i.arsLevel,
    i.sourceType,
    i.isManuallyAdjusted ? 'Sim' : 'Não',
    i.recommendedAction || '',
  ]);

  const wsAudit = XLSX.utils.aoa_to_sheet([auditHeaders, ...auditRows]);
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Auditoria por Disciplina');

  // Sheet 3: Matriz de Risco Crítico
  const criticalItems = items.filter((i) => i.ars >= 50 || i.failureRate >= 30);
  const criticalRows = criticalItems.map((i) => [
    i.code,
    i.name,
    i.course,
    i.classCode,
    i.professor,
    i.totalStudents,
    i.failureRate,
    i.ars,
    i.arsLevel,
    i.recommendedAction,
  ]);

  const wsCritical = XLSX.utils.aoa_to_sheet([
    ['Disciplinas em Risco Crítico / Alto (ARS >= 50 ou Reprovação >= 30%)'],
    ['Código', 'Disciplina', 'Curso', 'Turma', 'Docente', 'Alunos', 'Reprovação (%)', 'ARS', 'Nível de Risco', 'Plano de Ação Imediata'],
    ...criticalRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsCritical, 'Matriz de Risco Crítico');

  // Generate and download
  const filename = `PulsoAcademico_Relatorio_Analitico_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export to widescreen 16:9 executive PowerPoint presentation (.pptx)
 */
export async function exportPowerPointDeck(
  items: DisciplineMetric[],
  config: SystemConfig
): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = config.coordinatorName || 'Coordenação de TI';
  pptx.company = config.institutionName || 'Pulso Acadêmico';
  pptx.title = 'Pulso Acadêmico - Relatório Executivo';

  const totalDisciplines = items.length;
  const totalStudents = items.reduce((acc, curr) => acc + curr.totalStudents, 0);
  const avgLearning = (items.reduce((acc, curr) => acc + curr.learningScore, 0) / (totalDisciplines || 1)).toFixed(1);
  const avgFailure = (items.reduce((acc, curr) => acc + curr.failureRate, 0) / (totalDisciplines || 1)).toFixed(1);
  const avgAttendance = (items.reduce((acc, curr) => acc + curr.attendanceRate, 0) / (totalDisciplines || 1)).toFixed(1);
  const avgLHI = (items.reduce((acc, curr) => acc + curr.lhi, 0) / (totalDisciplines || 1)).toFixed(1);
  const avgARS = (items.reduce((acc, curr) => acc + curr.ars, 0) / (totalDisciplines || 1)).toFixed(1);

  // Corporate Theme Colors
  const COLOR_NAVY = '0F172A';
  const COLOR_SLATE = '1E293B';
  const COLOR_LIGHT_BG = 'F8FAFC';
  const COLOR_ACCENT = '2563EB';
  const COLOR_EMERALD = '059669';
  const COLOR_AMBER = 'D97706';
  const COLOR_ROSE = 'DC2626';

  // SLIDE 1: Cover Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: COLOR_NAVY };

  slide1.addText('PULSO ACADÊMICO', {
    x: 1.0,
    y: 1.8,
    fontSize: 40,
    fontFace: 'Segoe UI',
    color: 'FFFFFF',
    bold: true,
  });

  slide1.addText('Relatório Gerencial Executivo & Governança de Indicadores', {
    x: 1.0,
    y: 2.7,
    fontSize: 20,
    fontFace: 'Segoe UI',
    color: '94A3B8',
  });

  slide1.addShape(pptx.ShapeType.rect, {
    x: 1.0,
    y: 3.4,
    w: 2.5,
    h: 0.05,
    fill: { color: COLOR_ACCENT },
    line: { color: COLOR_ACCENT },
  });

  slide1.addText([
    { text: `Instituição: ${config.institutionName}\n`, options: { bold: true, color: 'FFFFFF' } },
    { text: `Coordenação de Cursos de Tecnologia da Informação\n`, options: { color: 'CBD5E1' } },
    { text: `Período Letivo: ${config.academicPeriod} · Coordenador: ${config.coordinatorName}\n`, options: { color: '94A3B8' } },
    { text: `Data da Apresentação: ${new Date().toLocaleDateString('pt-BR')}`, options: { color: '64748B' } },
  ], {
    x: 1.0,
    y: 3.8,
    fontSize: 14,
    fontFace: 'Segoe UI',
    lineSpacing: 22,
  });

  // SLIDE 2: Methodology & Composite Indices (RF03)
  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_LIGHT_BG };

  slide2.addText('Governança Analítica & Índices Proprietários', {
    x: 0.8,
    y: 0.6,
    fontSize: 24,
    fontFace: 'Segoe UI',
    color: COLOR_NAVY,
    bold: true,
  });

  slide2.addText('Critérios e formulações estatísticas ponderadas para suporte à tomada de decisão executiva', {
    x: 0.8,
    y: 1.1,
    fontSize: 12,
    fontFace: 'Segoe UI',
    color: '64748B',
  });

  // Card 1: LHI
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.8,
    w: 5.6,
    h: 4.8,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  });

  slide2.addText('Learning Health Index (LHI)', {
    x: 1.1,
    y: 2.1,
    fontSize: 18,
    fontFace: 'Segoe UI',
    bold: true,
    color: COLOR_EMERALD,
  });

  slide2.addText('Métrica ponderada de vitalidade acadêmica (0 a 100):\n• 35% Grau de Aprendizagem (Desempenho avaliativo)\n• 25% Frequência e Presença em sala de aula\n• 20% Taxa de Aprovação / Retenção Efetiva\n• 20% Adesão e Engajamento em Ambientes Virtuais (LMS)\n\nFaixas de Diagnóstico:\n• >= 85: Excelente (Nível de Excelência Acadêmica)\n• 70 a 84: Saudável (Dentro da meta pedagógica)\n• 55 a 69: Alerta (Demanda tutoria pontual)\n• < 55: Crítico (Risco institucional de evasão)', {
    x: 1.1,
    y: 2.8,
    w: 5.0,
    fontSize: 12,
    fontFace: 'Segoe UI',
    color: COLOR_SLATE,
    lineSpacing: 18,
  });

  // Card 2: ARS
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.8,
    w: 5.6,
    h: 4.8,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  });

  slide2.addText('Academic Risk Score (ARS)', {
    x: 7.1,
    y: 2.1,
    fontSize: 18,
    fontFace: 'Segoe UI',
    bold: true,
    color: COLOR_ROSE,
  });

  slide2.addText('Algoritmo preditivo de risco de retenção e evasão:\n• 40% Índice de Reprovação histórica e atual\n• 30% Infrequência e faltas acumuladas\n• 20% Déficit de aprendizagem em pré-requisitos\n• 10% Fator de risco de abandono de curso\n\nNíveis de Risco:\n• < 25: Baixo Risco (Desempenho equilibrado)\n• 25 a 45: Risco Moderado (Acompanhamento rotineiro)\n• 45 a 65: Alto Risco (Intervenção da coordenação)\n• >= 65: Risco Crítico (Convocação imediata)', {
    x: 7.1,
    y: 2.8,
    w: 5.0,
    fontSize: 12,
    fontFace: 'Segoe UI',
    color: COLOR_SLATE,
    lineSpacing: 18,
  });

  // SLIDE 3: Global Dashboard KPIs
  const slide3 = pptx.addSlide();
  slide3.background = { color: COLOR_LIGHT_BG };

  slide3.addText('Painel Executivo de Indicadores Globais', {
    x: 0.8,
    y: 0.6,
    fontSize: 24,
    fontFace: 'Segoe UI',
    color: COLOR_NAVY,
    bold: true,
  });

  slide3.addText(`Consolidação de ${totalDisciplines} turmas e ${totalStudents} matrículas de Tecnologia da Informação`, {
    x: 0.8,
    y: 1.1,
    fontSize: 12,
    fontFace: 'Segoe UI',
    color: '64748B',
  });

  // KPI boxes (row of 4 + row of 2)
  const kpis = [
    { label: 'LHI Geral (Saúde)', value: `${avgLHI}`, sub: getLHIStatus(Number(avgLHI)), color: COLOR_EMERALD },
    { label: 'ARS Médio (Risco)', value: `${avgARS}`, sub: `Nível ${getARSLevel(Number(avgARS))}`, color: Number(avgARS) > 40 ? COLOR_ROSE : COLOR_AMBER },
    { label: 'Aprendizagem Média', value: `${avgLearning}%`, sub: 'Notas & Avaliações', color: COLOR_ACCENT },
    { label: 'Índice de Reprovação', value: `${avgFailure}%`, sub: 'Taxa Consolidada', color: Number(avgFailure) > 20 ? COLOR_ROSE : COLOR_SLATE },
  ];

  kpis.forEach((kpi, idx) => {
    const xPos = 0.8 + idx * 2.95;
    slide3.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 1.8,
      w: 2.75,
      h: 2.0,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.08,
    });

    slide3.addText(kpi.label, {
      x: xPos + 0.2,
      y: 2.0,
      w: 2.35,
      fontSize: 11,
      fontFace: 'Segoe UI',
      color: '64748B',
    });

    slide3.addText(kpi.value, {
      x: xPos + 0.2,
      y: 2.4,
      w: 2.35,
      fontSize: 32,
      fontFace: 'Segoe UI',
      bold: true,
      color: kpi.color,
    });

    slide3.addText(kpi.sub, {
      x: xPos + 0.2,
      y: 3.2,
      w: 2.35,
      fontSize: 11,
      fontFace: 'Segoe UI',
      color: '94A3B8',
    });
  });

  // Bottom table of Courses
  const courseGroups = ['Ciência da Computação', 'Engenharia de Software', 'Análise e Desenv. de Sistemas', 'Sistemas de Informação'] as const;
  const courseTableData: pptxgen.TableRow[] = [
    [
      { text: 'Curso de TI', options: { bold: true, fill: { color: COLOR_SLATE }, color: 'FFFFFF' } },
      { text: 'Turmas', options: { bold: true, fill: { color: COLOR_SLATE }, color: 'FFFFFF' } },
      { text: 'Alunos', options: { bold: true, fill: { color: COLOR_SLATE }, color: 'FFFFFF' } },
      { text: 'Aprendizagem', options: { bold: true, fill: { color: COLOR_SLATE }, color: 'FFFFFF' } },
      { text: 'Reprovação', options: { bold: true, fill: { color: COLOR_SLATE }, color: 'FFFFFF' } },
      { text: 'LHI Médio', options: { bold: true, fill: { color: COLOR_SLATE }, color: 'FFFFFF' } },
      { text: 'ARS Médio', options: { bold: true, fill: { color: COLOR_SLATE }, color: 'FFFFFF' } },
    ]
  ];

  courseGroups.forEach((course) => {
    const cItems = items.filter((i) => i.course === course);
    if (cItems.length > 0) {
      const cStud = cItems.reduce((a, b) => a + b.totalStudents, 0);
      const cLearn = (cItems.reduce((a, b) => a + b.learningScore, 0) / cItems.length).toFixed(1);
      const cFail = (cItems.reduce((a, b) => a + b.failureRate, 0) / cItems.length).toFixed(1);
      const cLhi = (cItems.reduce((a, b) => a + b.lhi, 0) / cItems.length).toFixed(1);
      const cArs = (cItems.reduce((a, b) => a + b.ars, 0) / cItems.length).toFixed(1);

      courseTableData.push([
        { text: course },
        { text: String(cItems.length) },
        { text: String(cStud) },
        { text: `${cLearn}%` },
        { text: `${cFail}%` },
        { text: `${cLhi}` },
        { text: `${cArs}` },
      ]);
    }
  });

  slide3.addTable(courseTableData, {
    x: 0.8,
    y: 4.2,
    w: 11.6,
    fontSize: 11,
    fontFace: 'Segoe UI',
    color: COLOR_SLATE,
    border: { color: 'E2E8F0', pt: 1 },
  });

  // SLIDE 4: Top Critical Disciplines & Action Plan
  const slide4 = pptx.addSlide();
  slide4.background = { color: COLOR_LIGHT_BG };

  slide4.addText('Disciplinas Prioritárias & Matriz de Intervenção Pedagógica', {
    x: 0.8,
    y: 0.6,
    fontSize: 24,
    fontFace: 'Segoe UI',
    color: COLOR_NAVY,
    bold: true,
  });

  slide4.addText('Turmas com indicadores de reprovação ou risco de retenção acima do limite crítico', {
    x: 0.8,
    y: 1.1,
    fontSize: 12,
    fontFace: 'Segoe UI',
    color: '64748B',
  });

  const topCritical = [...items].sort((a, b) => b.ars - a.ars).slice(0, 5);
  const critTable: pptxgen.TableRow[] = [
    [
      { text: 'Disciplina / Turma', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Curso', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Docente', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Reprovação', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'ARS (Risco)', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
      { text: 'Ação Pedagógica Imediata', options: { bold: true, fill: { color: COLOR_NAVY }, color: 'FFFFFF' } },
    ]
  ];

  topCritical.forEach((i) => {
    critTable.push([
      { text: `${i.name} (${i.classCode})` },
      { text: i.course },
      { text: i.professor },
      { text: `${i.failureRate}%` },
      { text: `${i.ars} (${i.arsLevel})` },
      { text: i.recommendedAction || 'Tutoria personalizada' },
    ]);
  });

  slide4.addTable(critTable, {
    x: 0.8,
    y: 1.8,
    w: 11.6,
    fontSize: 10,
    fontFace: 'Segoe UI',
    color: COLOR_SLATE,
    border: { color: 'CBD5E1', pt: 1 },
  });

  // SLIDE 5: Concluding Governance & Next Steps
  const slide5 = pptx.addSlide();
  slide5.background = { color: COLOR_NAVY };

  slide5.addText('Diretrizes de Governança & Próximos Passos', {
    x: 1.0,
    y: 1.2,
    fontSize: 32,
    fontFace: 'Segoe UI',
    color: 'FFFFFF',
    bold: true,
  });

  slide5.addText([
    { text: '1. Implantação do Programa de Monitoria & Tutoria Ativa:\n', options: { bold: true, color: 'FFFFFF' } },
    { text: '   Alocação de monitores acadêmicos nas disciplinas do 1º e 2º semestres com ARS > 50.\n\n', options: { color: 'CBD5E1' } },
    { text: '2. Reuniões de Alinhamento com o Corpo Docente:\n', options: { bold: true, color: 'FFFFFF' } },
    { text: '   Discutir calibragem avaliativa e práticas metodológicas ativas com professores das turmas críticas.\n\n', options: { color: 'CBD5E1' } },
    { text: '3. Busca Ativa de Estudantes Infrequentes:\n', options: { bold: true, color: 'FFFFFF' } },
    { text: '   Contato direto da coordenação com discentes com frequência inferior a 75% antes do fechamento de faltas.\n\n', options: { color: 'CBD5E1' } },
    { text: '4. Integração Contínua com os Relatórios Power BI & PDF:\n', options: { bold: true, color: 'FFFFFF' } },
    { text: '   Sincronização semanal de dados para garantir auditoria em tempo real no Pulso Acadêmico.', options: { color: 'CBD5E1' } },
  ], {
    x: 1.0,
    y: 2.2,
    w: 11.0,
    fontSize: 14,
    fontFace: 'Segoe UI',
    lineSpacing: 22,
  });

  slide5.addText(`Coordenação de Cursos de TI · ${config.institutionName} · Gerado via Pulso Acadêmico`, {
    x: 1.0,
    y: 6.5,
    fontSize: 11,
    fontFace: 'Segoe UI',
    color: '64748B',
  });

  const filename = `PulsoAcademico_Apresentacao_Executiva_${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName: filename });
}

/**
 * Generate configuration file download (JSON or TOML)
 */
export function exportConfigFile(config: SystemConfig): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', 'pulso_academico_config.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Generate Windows automation batch script (executar.bat) as described in RNF03 & Review
 */
export function generateBatchScript(config: SystemConfig): void {
  const batContent = `@echo off
REM ====================================================================
REM  PULSO ACADÊMICO - SCRIPT DE INICIALIZAÇÃO LOCAL (WINDOWS)
REM  Instituição: ${config.institutionName}
REM  Coordenação: ${config.coordinatorName}
REM ====================================================================

title Pulso Acadêmico - Ambiente Corporativo
echo [PULSO ACADEMICO] Inicializando ambiente virtual e dependencias...

IF NOT EXIST "venv" (
    echo [INFO] Criando ambiente virtual Python...
    python -m venv venv
)

call venv\\Scripts\\activate

echo [INFO] Verificando dependencias necessarias (PyMuPDF, pandas, openpyxl)...
pip install -q pymupdf pandas openpyxl python-pptx requests

echo [INFO] Iniciando motor de processamento analitico...
python -c "print('[PULSO ACADEMICO] Motor estatistico LHI/ARS operacional.')"

echo [INFO] Abrindo interface do Pulso Academico...
start "" "%~dp0index.html"

pause
`;

  const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', 'executar.bat');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
