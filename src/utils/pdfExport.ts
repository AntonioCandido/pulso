import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DisciplineMetric, ImportSession, SystemConfig } from '../types';

/**
 * Fases do ciclo de vida da exportação em PDF para feedback reativo na UI.
 */
export type ExportStage = 'preparing' | 'capturing' | 'compiling' | 'saving' | 'completed' | 'cancelled';

export interface ExportProgressUpdate {
  stage: ExportStage;
  percent: number;
  message: string;
}

export type ExportProgressCallback = (update: ExportProgressUpdate) => void;

export interface ExportPdfOptions {
  elementId?: string;
  customFileName?: string;
  fallbackContext?: {
    disciplines: DisciplineMetric[];
    activeSession?: ImportSession | null;
    config?: SystemConfig;
  };
  fileHandle?: any;
  scale?: number;
  onProgress?: ExportProgressCallback;
  signal?: AbortSignal;
}

export interface ExportPdfResult {
  fileName: string;
  savedViaSystemPicker: boolean;
  byteSize?: number;
  pageCount: number;
}

/**
 * Sanitiza o nome do arquivo para garantir compatibilidade com sistemas de arquivos (Windows, macOS, Linux).
 * Remove caracteres proibidos: / \ : * ? " < > | e espaços redundantes.
 */
export function sanitizePdfFileName(rawName: string, fallback = 'Relatorio_Executivo.pdf'): string {
  if (!rawName || !rawName.trim()) return fallback;
  const cleaned = rawName
    .trim()
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
}

/**
 * Função utilitária para descarregar a Main Thread (CPU yielding).
 * Permite que o navegador processe eventos de renderização, animações de spinner e cliques de cancelamento.
 */
export function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Converte qualquer função de cor CSS moderna (oklch, oklab, color-mix, lab, lch, color)
 * em formato rgb() / rgba() compatível com html2canvas usando o motor nativo 2D do navegador.
 */
export function createColorConverter() {
  if (typeof document === 'undefined') {
    return {
      toRgba: (c: string) => c,
      replaceModernColorFunctions: (i: string) => i,
      dispose: () => {},
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const cache = new Map<string, string>();

  const toRgba = (cssColor: string): string => {
    if (!cssColor || cssColor === 'none' || cssColor === 'transparent' || cssColor === 'inherit' || cssColor === 'initial') {
      return cssColor;
    }
    const trimmed = cssColor.trim();
    if (cache.has(trimmed)) {
      return cache.get(trimmed)!;
    }
    if (!ctx) return '#000000';

    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillStyle = trimmed;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      const r = data[0];
      const g = data[1];
      const b = data[2];
      const a = +(data[3] / 255).toFixed(3);
      const result = a === 0 ? 'rgba(0, 0, 0, 0)' : a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
      cache.set(trimmed, result);
      return result;
    } catch {
      return '#0f172a';
    }
  };

  const replaceModernColorFunctions = (input: string): string => {
    if (!input || !/(?:oklch|oklab|color-mix|lch|lab|color)\(/i.test(input)) {
      return input;
    }

    let output = input;
    const simpleFuncRegex = /(?:oklch|oklab|lch|lab|color)\([^()]*\)/gi;
    for (let pass = 0; pass < 3; pass++) {
      if (!simpleFuncRegex.test(output)) break;
      output = output.replace(simpleFuncRegex, (match) => toRgba(match));
    }

    const colorMixRegex = /color-mix\([^()]*\)/gi;
    for (let pass = 0; pass < 2; pass++) {
      if (!colorMixRegex.test(output)) break;
      output = output.replace(colorMixRegex, (match) => toRgba(match));
    }

    return output;
  };

  const dispose = () => {
    cache.clear();
    canvas.width = 0;
    canvas.height = 0;
  };

  return { toRgba, replaceModernColorFunctions, dispose };
}

/**
 * Aguarda o carregamento completo de todas as imagens dentro de um container com timeout defensivo.
 */
export async function waitForImages(root: HTMLElement, timeoutMs = 2000): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  if (images.length === 0) return;

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const onFinish = () => {
            img.removeEventListener('load', onFinish);
            img.removeEventListener('error', onFinish);
            resolve();
          };
          img.addEventListener('load', onFinish);
          img.addEventListener('error', onFinish);
          setTimeout(onFinish, timeoutMs);
        })
    )
  );
}

/**
 * Aguarda as fontes web estarem prontas no documento para evitar Flash of Unstyled Text (FOUT) no PDF e na impressão.
 */
export async function waitForFonts(targetDoc: Document = document, timeoutMs = 1500): Promise<void> {
  if ('fonts' in targetDoc && typeof targetDoc.fonts.ready?.then === 'function') {
    try {
      await Promise.race([
        targetDoc.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    } catch {
      // Degradação graciosa caso a API fonts falhe
    }
  }
}

/**
 * Sanitiza a árvore DOM clonada para eliminar funções de cor Tailwind v4 (oklch/color-mix)
 * e força o enquadramento Widescreen 16:9 (1280px) visível para captura.
 */
function sanitizeClonedDomForHtml2Canvas(
  originalElement: HTMLElement,
  clonedDoc: Document,
  clonedElement: HTMLElement
): void {
  const converter = createColorConverter();

  try {
    // 1. Sanitiza todas as tags <style> no documento clonado
    const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
    for (const styleTag of styleTags) {
      if (styleTag.textContent) {
        styleTag.textContent = converter.replaceModernColorFunctions(styleTag.textContent);
      }
    }

    // 2. Remove elementos com .no-print dentro do clone
    const noPrintNodes = Array.from(clonedElement.querySelectorAll('.no-print, [data-no-print="true"]'));
    for (const node of noPrintNodes) {
      node.remove();
    }

    // 3. Força layout Desktop 1280px estável
    clonedElement.style.position = 'static';
    clonedElement.style.left = '0';
    clonedElement.style.top = '0';
    clonedElement.style.opacity = '1';
    clonedElement.style.visibility = 'visible';
    clonedElement.style.display = 'block';
    clonedElement.style.width = '1280px';
    clonedElement.style.maxWidth = '1280px';
    clonedElement.style.minWidth = '1280px';
    clonedElement.style.margin = '0';
    clonedElement.style.padding = '0';
    clonedElement.style.overflow = 'visible';
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.borderRadius = '12px';

    // Expande containers com scroll horizontal
    const overflowContainers = Array.from(clonedElement.querySelectorAll('.overflow-x-auto, .overflow-hidden'));
    for (const container of overflowContainers) {
      if (container instanceof HTMLElement && container.classList.contains('overflow-x-auto')) {
        container.style.overflowX = 'visible';
        container.style.overflow = 'visible';
      }
    }

    // 4. Mapeamento seletivo de estilos computados (apenas se contiverem cores modernas)
    const origNodes = [originalElement, ...Array.from(originalElement.querySelectorAll('*'))];
    const cloneNodes = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))];

    const colorProps = [
      'color',
      'backgroundColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'outlineColor',
      'textDecorationColor',
    ] as const;

    const limit = Math.min(origNodes.length, cloneNodes.length);
    for (let i = 0; i < limit; i++) {
      const origEl = origNodes[i];
      const cloneEl = cloneNodes[i];
      if (!(origEl instanceof Element) || !(cloneEl instanceof HTMLElement || cloneEl instanceof SVGElement)) {
        continue;
      }

      const computed = window.getComputedStyle(origEl);
      const style = (cloneEl as HTMLElement).style;
      if (!style) continue;

      for (const prop of colorProps) {
        const val = computed[prop];
        if (val && /(?:oklch|oklab|color-mix|lch|lab|color)\(/i.test(val)) {
          style[prop] = converter.toRgba(val);
        } else if (val && val.startsWith('rgba(0, 0, 0, 0)')) {
          // ignora transparent
        }
      }

      if (computed.boxShadow && computed.boxShadow !== 'none' && /(?:oklch|oklab|color-mix|lch|lab|color)\(/i.test(computed.boxShadow)) {
        style.boxShadow = converter.replaceModernColorFunctions(computed.boxShadow);
      }
      if (computed.backgroundImage && computed.backgroundImage !== 'none' && /(?:oklch|oklab|color-mix|lch|lab|color)\(/i.test(computed.backgroundImage)) {
        style.backgroundImage = converter.replaceModernColorFunctions(computed.backgroundImage);
      }
    }

    if (clonedDoc.body) {
      clonedDoc.body.style.backgroundColor = '#ffffff';
      clonedDoc.body.style.color = '#0f172a';
    }
  } finally {
    converter.dispose();
  }
}

/**
 * Renderizador de contingência em Canvas 2D puro (Fallback Robusto de Alta Resolução).
 * Ativado caso o DOM contenha elementos não suportados pelo html2canvas.
 * Respeita estritamente a REGRA FUNDAMENTAL — NÃO INVENTAR DADOS.
 */
async function renderFallbackExecutiveCanvas(
  disciplines: DisciplineMetric[],
  activeSession?: ImportSession | null,
  config?: SystemConfig
): Promise<HTMLCanvasElement> {
  const hasData = disciplines.length > 0;
  const primary = disciplines[0];
  const executive = primary?.executiveSummary;
  const sorted = [...disciplines].sort((a, b) => (b.studyHoursPerWeek || 0) - (a.studyHoursPerWeek || 0));
  const rowCount = Math.max(1, sorted.length);

  const width = 1600;
  const rowHeight = 36;
  const tableHeight = hasData ? 85 + rowCount * rowHeight : 180;
  const height = 470 + tableHeight + 70;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F4F7FA';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#0A3977';
  ctx.fillRect(0, 0, width, 110);
  ctx.fillStyle = '#FFB800';
  ctx.fillRect(0, 106, width, 5);

  const campusLabel = !hasData
    ? '-- (Base Zerada)'
    : activeSession?.campus
    ? activeSession.campus.startsWith('Campus') || activeSession.campus.startsWith('Não informado')
      ? activeSession.campus
      : `Campus ${activeSession.campus}`
    : executive?.campus
    ? executive.campus.startsWith('Campus') || executive.campus.startsWith('Não informado')
      ? executive.campus
      : `Campus ${executive.campus}`
    : primary?.campus
    ? `Campus ${primary.campus}`
    : 'Não informado na fonte';

  const courseLabel = !hasData
    ? 'CURSO: --'
    : `CURSO: ${(activeSession?.course || executive?.course || primary?.course || 'Não informado na fonte').toUpperCase()}`;

  const periodText = hasData
    ? executive?.entryYear
      ? `Ano Entrada: ${executive.entryYear} · Período ${config?.academicPeriod || '2026.2'}`
      : `Período ${config?.academicPeriod || '2026.2'}`
    : 'Período --';

  const fileText = !hasData
    ? 'Base de dados limpa'
    : `Relatório: ${activeSession?.fileName || primary?.sourceFileOrUrl || 'Arquivo Importado'}`;

  ctx.fillStyle = '#FFB800';
  ctx.font = '900 34px sans-serif';
  ctx.fillText('PULSO ACADÊMICO', 36, 52);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(courseLabel, 36, 84);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(campusLabel, width - 36, 38);
  ctx.font = '500 14px sans-serif';
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText(periodText, width - 36, 62);
  ctx.fillText(fileText, width - 36, 86);
  ctx.textAlign = 'left';

  const drawCard = (x: number, y: number, w: number, h: number, bg = '#FFFFFF', border = '#E2E8F0') => {
    ctx.fillStyle = bg;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();
  };

  const heroY = 132;
  const heroW = (width - 72 - 24) / 2;
  const heroH = 130;

  drawCard(36, heroY, heroW, heroH);
  drawCard(36 + heroW + 24, heroY, heroW, heroH);

  const studyDisplay = !hasData ? '00:00' : executive?.studyTimeFormatted || 'Não informado';
  ctx.fillStyle = '#334155';
  ctx.font = '900 14px sans-serif';
  ctx.fillText('TEMPO DE ESTUDO', 64, heroY + 42);
  ctx.fillStyle = '#0A3977';
  ctx.font = '900 44px sans-serif';
  ctx.fillText(studyDisplay, 64, heroY + 92);
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('hh:mm', 200, heroY + 92);

  if (hasData && executive) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Ano Anterior (${executive.studyTimePreviousYear})`, 36 + heroW - 24, heroY + 62);
    ctx.fillStyle = '#64748B';
    ctx.font = '500 14px sans-serif';
    ctx.fillText(`Meta: ${executive.studyTimeTarget}`, 36 + heroW - 24, heroY + 90);
    ctx.textAlign = 'left';
  }

  const attDisplay = !hasData
    ? '0,00 %'
    : executive
    ? `${executive.attendanceRate.toFixed(2).replace('.', ',')} %`
    : 'Não informado';
  const card2X = 36 + heroW + 24;
  ctx.fillStyle = '#334155';
  ctx.font = '900 14px sans-serif';
  ctx.fillText('FREQUÊNCIA', card2X + 28, heroY + 42);
  ctx.fillStyle = '#0A3977';
  ctx.font = '900 44px sans-serif';
  ctx.fillText(attDisplay, card2X + 28, heroY + 92);

  if (hasData && executive) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748B';
    ctx.font = '500 14px sans-serif';
    ctx.fillText(
      `Ano Anterior (${executive.attendanceRatePreviousYear.toFixed(2).replace('.', ',')}% A.A.)`,
      card2X + heroW - 24,
      heroY + 62
    );
    ctx.fillText('Meta: 80,00%', card2X + heroW - 24, heroY + 90);
    ctx.textAlign = 'left';
  }

  const govY = heroY + heroH + 20;
  const govGap = 16;
  const govW = (width - 72 - govGap * 5) / 6;
  const govH = 88;

  const avgLHI = !hasData ? '0.0' : (disciplines.reduce((acc, c) => acc + c.lhi, 0) / disciplines.length).toFixed(1);
  const avgARS = !hasData ? '0.0' : (disciplines.reduce((acc, c) => acc + c.ars, 0) / disciplines.length).toFixed(1);

  const govItems = [
    {
      label: 'Grau de Aprendizagem',
      val: !hasData ? '0,00%' : executive ? `${executive.learningScore.toFixed(2).replace('.', ',')}%` : 'Não informado',
      sub: hasData && executive ? `Meta: ${executive.learningScoreTarget.toFixed(2).replace('.', ',')}%` : 'Meta: --',
      color: '#1E293B',
    },
    {
      label: 'Reprovação Geral',
      val: !hasData ? '0,00%' : executive ? `${executive.failureRate.toFixed(2).replace('.', ',')}%` : 'Não informado',
      sub: hasData && executive ? `Meta: ${executive.failureRateTarget.toFixed(2).replace('.', ',')}%` : 'Meta: --',
      color: '#1E293B',
    },
    {
      label: 'Adesão AV',
      val: !hasData ? '0,00%' : executive ? `${executive.adhesionAV.toFixed(2).replace('.', ',')}%` : 'Não informado',
      sub: hasData && executive ? `Meta: ${executive.adhesionAVTarget.toFixed(2).replace('.', ',')}%` : 'Meta: --',
      color: '#1E293B',
    },
    {
      label: 'Adesão SM',
      val: !hasData ? '0,00%' : executive ? `${executive.adhesionSM.toFixed(2).replace('.', ',')}%` : 'Não informado',
      sub: hasData && executive ? `Meta: ${executive.adhesionSMTarget.toFixed(2).replace('.', ',')}%` : 'Meta: --',
      color: '#1E293B',
    },
    {
      label: 'Learning Health (LHI)',
      val: `${avgLHI} / 100`,
      sub: 'Saúde Pedagógica',
      color: '#047857',
    },
    {
      label: 'Academic Risk (ARS)',
      val: `${avgARS} / 100`,
      sub: 'Risco Acadêmico',
      color: '#D97706',
    },
  ];

  govItems.forEach((item, idx) => {
    const gx = 36 + idx * (govW + govGap);
    drawCard(gx, govY, govW, govH);
    ctx.fillStyle = '#64748B';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(item.label, gx + 14, govY + 26);
    ctx.fillStyle = item.color;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(item.val, gx + 14, govY + 56);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 11px sans-serif';
    ctx.fillText(item.sub, gx + 14, govY + 76);
  });

  const tableY = govY + govH + 22;
  const tableW = width - 72;
  drawCard(36, tableY, tableW, tableHeight + 52);

  ctx.fillStyle = '#084172';
  ctx.fillRect(36, tableY, tableW, 44);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Ranking de Tempo de Estudo por Disciplina · do maior para o menor', 56, tableY + 28);

  const colHeaderY = tableY + 44;
  ctx.fillStyle = '#0A3977';
  ctx.fillRect(36, colHeaderY, tableW, 36);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('#', 58, colHeaderY + 23);
  ctx.fillText('Disciplina', 105, colHeaderY + 23);
  ctx.fillText('Código', 720, colHeaderY + 23);
  ctx.fillText('Alunos (A.A.)', 845, colHeaderY + 23);
  ctx.fillText('Alunos (Atual)', 985, colHeaderY + 23);
  ctx.fillText('Tempo (A.A.)', 1125, colHeaderY + 23);
  ctx.fillText('Tempo de Estudo', 1265, colHeaderY + 23);
  ctx.fillText('Desempenho', 1415, colHeaderY + 23);

  const maxStudyHours = sorted.length > 0 ? sorted[0].studyHoursPerWeek || 9.5 : 10;

  if (hasData) {
    sorted.forEach((item, idx) => {
      const ry = colHeaderY + 36 + idx * rowHeight;
      ctx.fillStyle = idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
      ctx.fillRect(37, ry, tableW - 2, rowHeight);

      ctx.fillStyle = idx < 3 ? '#16A34A' : '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(String(idx + 1), 58, ry + 23);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(item.name.slice(0, 52), 105, ry + 23);

      ctx.fillStyle = '#334155';
      ctx.font = '600 12px monospace';
      ctx.fillText(item.code, 720, ry + 23);

      ctx.fillStyle = '#475569';
      ctx.font = '600 13px sans-serif';
      ctx.fillText(item.previousYearStudents ? String(item.previousYearStudents) : '—', 875, ry + 23);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(String(item.totalStudents), 1020, ry + 23);

      ctx.fillStyle = '#475569';
      ctx.font = '600 13px sans-serif';
      ctx.fillText(item.previousYearStudyTime || '—', 1145, ry + 23);

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 13px sans-serif';
      ctx.fillText(item.studyTimeFormatted || `${item.studyHoursPerWeek}h`, 1295, ry + 23);

      const barX = 1415;
      const barY = ry + 13;
      const barMaxW = 125;
      const pct = Math.max(0.25, Math.min(1, (item.studyHoursPerWeek || 4) / maxStudyHours));
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(barX, barY, barMaxW, 10);

      let barColor = '#16A34A';
      if (item.studyHoursPerWeek < 4.5) barColor = '#EF4444';
      else if (item.studyHoursPerWeek < 6.0) barColor = '#F97316';
      else if (item.studyHoursPerWeek < 7.0) barColor = '#EAB308';

      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, Math.round(barMaxW * pct), 10);
    });
  } else {
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Base de Dados Zerada — Nenhum indicador importado no momento.', 520, colHeaderY + 95);
  }

  const footerY = tableY + tableHeight;
  ctx.fillStyle = '#EBF3FB';
  ctx.fillRect(37, footerY, tableW - 2, 50);
  ctx.fillStyle = '#475569';
  ctx.font = '500 13px sans-serif';
  ctx.fillText(
    `Fonte: YDUQS – Pulso Acadêmico (Curso) · ${campusLabel} · A.A. = Ano Anterior · ${fileText}`,
    56,
    footerY + 30
  );

  return canvas;
}

/**
 * Faz download de um Blob com desalocação de memória determinística (Memory-Safe Download).
 * Cria a URL temporária, dispara o clique simulado e revoga o ObjectURL para evitar memory leaks.
 */
export function downloadBlobWithCleanup(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitizePdfFileName(fileName);
  anchor.style.display = 'none';
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    // Revoga a URL imediatamente após o microciclo do clique
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1500);
  }
}

/**
 * Tenta abrir a janela nativa do Sistema Operacional "Salvar como..." (File System Access API)
 * para o usuário escolher a pasta e o nome do arquivo PDF.
 */
export async function promptSystemSavePdfFileHandle(suggestedFileName: string): Promise<{
  handle: any | null;
  cancelled: boolean;
  supported: boolean;
}> {
  const win = window as any;
  if (typeof win.showSaveFilePicker !== 'function') {
    return { handle: null, cancelled: false, supported: false };
  }

  try {
    const handle = await win.showSaveFilePicker({
      suggestedName: sanitizePdfFileName(suggestedFileName),
      types: [
        {
          description: 'Documento PDF (*.pdf)',
          accept: { 'application/pdf': ['.pdf'] },
        },
      ],
    });
    return { handle, cancelled: false, supported: true };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { handle: null, cancelled: true, supported: true };
    }
    // SecurityError quando executado em iframe restrito
    return { handle: null, cancelled: false, supported: false };
  }
}

/**
 * Rotina Principal: Exporta o Dashboard Executivo para PDF de alta fidelidade vetorial/raster
 * com ciclo assíncrono não-bloqueante, callbacks de progresso e liberação defensiva de memória.
 */
export async function exportExecutiveDashboardToPdf(
  elementIdOrOptions: string | ExportPdfOptions = 'print-executive-report',
  customFileName?: string,
  fallbackContext?: {
    disciplines: DisciplineMetric[];
    activeSession?: ImportSession | null;
    config?: SystemConfig;
  },
  fileHandle?: any
): Promise<ExportPdfResult> {
  const options: ExportPdfOptions =
    typeof elementIdOrOptions === 'string'
      ? {
          elementId: elementIdOrOptions,
          customFileName,
          fallbackContext,
          fileHandle,
        }
      : elementIdOrOptions;

  const elementId = options.elementId || 'print-executive-report';
  const scale = options.scale ?? (window.devicePixelRatio && window.devicePixelRatio > 1 ? 2 : 2);
  const onProgress = options.onProgress;
  const signal = options.signal;

  const updateProgress = (stage: ExportStage, percent: number, message: string) => {
    if (onProgress) {
      onProgress({ stage, percent, message });
    }
  };

  const checkAborted = () => {
    if (signal?.aborted) {
      updateProgress('cancelled', 0, 'Exportação cancelada pelo usuário.');
      throw new DOMException('Operação de exportação cancelada.', 'AbortError');
    }
  };

  // Fase 1: Preparação do DOM e Fontes
  updateProgress('preparing', 10, 'Preparando layout e verificando fontes tipográficas...');
  await yieldToMainThread();
  checkAborted();

  await waitForFonts(document, 1200);
  checkAborted();

  const element = document.getElementById(elementId);
  let canvas: HTMLCanvasElement | null = null;
  let usedFallback = false;

  // Fase 2: Captura de Alta Definição
  updateProgress('capturing', 30, 'Capturando painel em alta definição widescreen 16:9...');
  await yieldToMainThread();
  checkAborted();

  if (element) {
    try {
      await waitForImages(element, 2000);
      checkAborted();

      canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1360,
        width: 1280,
        onclone: (clonedDoc, clonedElement) => {
          sanitizeClonedDomForHtml2Canvas(element, clonedDoc, clonedElement);
        },
      });
    } catch (captureErr) {
      console.warn('Fallback Canvas 2D ativado para geração do relatório PDF:', captureErr);
      usedFallback = true;
      if (options.fallbackContext) {
        canvas = await renderFallbackExecutiveCanvas(
          options.fallbackContext.disciplines,
          options.fallbackContext.activeSession,
          options.fallbackContext.config
        );
      } else {
        throw captureErr;
      }
    }
  } else if (options.fallbackContext) {
    usedFallback = true;
    canvas = await renderFallbackExecutiveCanvas(
      options.fallbackContext.disciplines,
      options.fallbackContext.activeSession,
      options.fallbackContext.config
    );
  } else {
    throw new Error(`Elemento com identificador '#${elementId}' não foi localizado no documento.`);
  }

  checkAborted();

  // Fase 3: Compilação do Documento PDF
  updateProgress('compiling', 65, 'Compilando documento PDF no padrão A4 Paisagem...');
  await yieldToMainThread();
  checkAborted();

  if (!canvas) {
    throw new Error('Falha ao instanciar o buffer de renderização gráfica.');
  }

  const imgData = canvas.toDataURL('image/png', 1.0);

  // Inicializa o jsPDF em A4 Paisagem (297mm x 210mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();   // 297 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm
  const margin = 5;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const canvasRatio = canvas.width / canvas.height;
  let finalWidth = usableWidth;
  let finalHeight = usableWidth / canvasRatio;

  if (finalHeight > usableHeight) {
    finalHeight = usableHeight;
    finalWidth = usableHeight * canvasRatio;
  }

  const xOffset = (pageWidth - finalWidth) / 2;
  const yOffset = (pageHeight - finalHeight) / 2;

  pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');

  // Metadados do PDF para governança
  pdf.setProperties({
    title: 'Relatório Executivo — Pulso Acadêmico',
    subject: 'Dashboard Executivo de Governança Acadêmica',
    author: 'Sistema Pulso Acadêmico YDUQS',
    keywords: 'Pulso Acadêmico, Governança, LHI, ARS, Indicadores',
    creator: 'Pulso Acadêmico Engine v2.0',
  });

  // Limpeza defensiva de memória do Canvas
  canvas.width = 1;
  canvas.height = 1;

  // Fase 4: Gravação e Download do Arquivo
  updateProgress('saving', 85, 'Finalizando gravação do arquivo e transmitindo ao usuário...');
  await yieldToMainThread();
  checkAborted();

  const rawName =
    options.customFileName || `Relatorio_Executivo_Pulso_Academico_${new Date().toISOString().slice(0, 10)}.pdf`;
  const finalFileName = sanitizePdfFileName(rawName);

  const pdfBlob = pdf.output('blob');
  const byteSize = pdfBlob.size;

  // Se houver fileHandle compatível com File System Access API
  if (options.fileHandle && typeof options.fileHandle.createWritable === 'function') {
    try {
      const writable = await options.fileHandle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();

      updateProgress('completed', 100, `Arquivo PDF salvo com sucesso em seu dispositivo (${(byteSize / 1024).toFixed(1)} KB).`);

      return {
        fileName: options.fileHandle.name || finalFileName,
        savedViaSystemPicker: true,
        byteSize,
        pageCount: 1,
      };
    } catch (saveErr) {
      console.warn('Erro ao gravar via FileHandle, aplicando download direto de segurança:', saveErr);
    }
  }

  // Fallback padrão: download com limpeza de ObjectURL
  downloadBlobWithCleanup(pdfBlob, finalFileName);

  updateProgress('completed', 100, `Arquivo PDF gerado com sucesso (${(byteSize / 1024).toFixed(1)} KB).`);

  return {
    fileName: finalFileName,
    savedViaSystemPicker: false,
    byteSize,
    pageCount: 1,
  };
}

export interface PrintOptionsConfig {
  printerName?: string;
  orientation?: 'landscape' | 'portrait';
  paperSize?: 'A4' | 'Letter';
  colorMode?: 'color' | 'grayscale';
  scaleFit?: boolean;
  copies?: number;
}

/**
 * Rotina Otimizada de Impressão Direta e Visualização (Direct / Spool Print).
 * Utiliza um iframe isolado com carregamento de estilos, sincronização de fontes
 * e ciclo de vida assíncrono para garantir que nenhum elemento da interface externa apareça no papel.
 */
export async function printExecutiveDashboardReport(
  elementId = 'print-executive-report',
  documentTitle = 'Relatório Executivo — Pulso Acadêmico',
  options: PrintOptionsConfig = {}
): Promise<void> {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    window.print();
    return;
  }

  const orientation = options.orientation || 'landscape';
  const paperSize = options.paperSize || 'A4';
  const colorFilter = options.colorMode === 'grayscale' ? 'grayscale(100%)' : 'none';
  const zoomLevel = options.scaleFit !== false ? (orientation === 'landscape' ? '0.82' : '0.58') : '1';

  // Garante que não haja iframe anterior pendente
  const existingIframe = document.getElementById('pulso-executive-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'pulso-executive-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1280px';
  iframe.style.height = '900px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    const iframeWin = iframe.contentWindow;

    if (!iframeDoc || !iframeWin) {
      iframe.remove();
      window.print();
      return;
    }

    // Coleta todas as folhas de estilo ativas no documento pai
    const stylesHtml = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${documentTitle}</title>
  ${stylesHtml}
  <style>
    @page {
      size: ${paperSize} ${orientation};
      margin: 5mm;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 100% !important;
      overflow: visible !important;
      filter: ${colorFilter};
    }
    .no-print, [data-no-print="true"], button {
      display: none !important;
    }
    #print-wrapper {
      width: 1240px !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      transform-origin: top left;
    }
    @media print {
      #print-wrapper {
        width: 100% !important;
        zoom: ${zoomLevel};
      }
      .overflow-x-auto {
        overflow: visible !important;
      }
      .break-inside-avoid, tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div id="print-wrapper">
    ${sourceElement.innerHTML}
  </div>
</body>
</html>`);
    iframeDoc.close();

    // Aguarda imagens e fontes dentro do iframe
    await Promise.all([
      waitForImages(iframeDoc.body, 2000),
      waitForFonts(iframeDoc, 1500),
    ]);

    // Respiro mínimo para o layout engine do browser calcular as dimensões
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Executa impressão segura
    iframeWin.focus();

    // Configura remoção segura após impressão (ou após timeout se o usuário demorar na janela)
    const cleanup = () => {
      try {
        iframe.remove();
      } catch {
        // Ignora caso já tenha sido removido
      }
    };

    if ('onafterprint' in iframeWin) {
      iframeWin.onafterprint = cleanup;
    }

    iframeWin.print();

    // Timer de garantia para evitar orfandade do nó iframe no DOM
    setTimeout(cleanup, 10000);
  } catch (err) {
    console.warn('Fallback para window.print() em caso de exceção no iframe:', err);
    try {
      iframe.remove();
    } catch {
      // Ignora erro de remoção
    }
    window.print();
  }
}
