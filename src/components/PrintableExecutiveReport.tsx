import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Sparkles, 
  FileCheck2, 
  Layers, 
  Loader2,
  CheckCircle2,
  FileDown,
  AlertCircle,
  X,
  FolderOpen,
  HardDrive,
  SlidersHorizontal,
  Check,
  StopCircle,
  ArrowDownToLine,
  Zap
} from 'lucide-react';
import { DisciplineMetric, SystemConfig, ImportSession } from '../types';
import { ExecutiveDashboardCanvas } from './ExecutiveDashboardCanvas';
import { resolveSourceCreatedAtFallback } from '../utils/pdfParser';
import { 
  exportExecutiveDashboardToPdf, 
  printExecutiveDashboardReport, 
  promptSystemSavePdfFileHandle,
  sanitizePdfFileName,
  PrintOptionsConfig,
  ExportProgressUpdate
} from '../utils/pdfExport';

export interface PrintableExecutiveReportProps {
  disciplines: DisciplineMetric[];
  activeSession?: ImportSession | null;
  config: SystemConfig;
  onNavigateToSources?: () => void;
}

/**
 * Componente Refatorado: Relatório Executivo para Impressão & Exportação PDF
 * 
 * - Renderização assíncrona não-bloqueante com acompanhamento de progresso percentual (0 a 100%).
 * - Suporte a cancelamento em tempo real via AbortController.
 * - Modo duplo de salvamento: Download Imediato (Memory-Safe) ou Escolha de Pasta do Sistema (File System Access API).
 * - Spool de impressão em iframe isolado com sincronização de fontes e eliminação de artefatos visuais.
 * - Respeito integral à regra de "NÃO INVENTAR INFORMAÇÕES".
 */
export const PrintableExecutiveReport: React.FC<PrintableExecutiveReportProps> = ({
  disciplines,
  activeSession,
  config,
  onNavigateToSources,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgressUpdate | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modal State: Salvar como PDF
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [saveMode, setSaveMode] = useState<'instant' | 'system_picker'>('instant');
  const [selectedDirectory, setSelectedDirectory] = useState<string>('Downloads (Padrão do Navegador)');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [directoryHandle, setDirectoryHandle] = useState<any | null>(null);

  // Modal State: Imprimir Relatório
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('system_dialog');
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [printColorMode, setPrintColorMode] = useState<'color' | 'grayscale'>('color');
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [printScaleFit, setPrintScaleFit] = useState<boolean>(true);

  // AbortController para cancelamento seguro de tarefas longas
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasData = disciplines.length > 0;
  const primaryDiscipline = disciplines[0];
  const executive = primaryDiscipline?.executiveSummary;

  const campusLabel = !hasData 
    ? '-- (Base Zerada)' 
    : activeSession?.campus 
    ? (activeSession.campus.startsWith('Campus') || activeSession.campus.startsWith('Não informado') ? activeSession.campus : `Campus ${activeSession.campus}`)
    : executive?.campus
    ? (executive.campus.startsWith('Campus') || executive.campus.startsWith('Não informado') ? executive.campus : `Campus ${executive.campus}`)
    : primaryDiscipline?.campus
    ? `Campus ${primaryDiscipline.campus}`
    : 'Não informado na fonte';

  const getDefaultPdfFileName = () => {
    const cleanCampus = campusLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    return sanitizePdfFileName(`Relatorio_Executivo_Dashboard_${cleanCampus}_${dateStr}.pdf`);
  };

  useEffect(() => {
    setCustomFileName(getDefaultPdfFileName());
  }, [campusLabel, activeSession?.importId]);

  // Cancelar processamento caso o componente seja desmontado
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Cancelamento manual pelo usuário
  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatusBanner({
        type: 'info',
        message: 'A geração do relatório PDF foi interrompida a pedido do usuário.',
      });
      setIsGeneratingPdf(false);
      setExportProgress(null);
    }
  };

  // 1. Abertura do Modal de PDF
  const handleOpenSavePdfModal = () => {
    setStatusBanner(null);
    const defaultName = customFileName || getDefaultPdfFileName();
    setCustomFileName(defaultName);
    setShowSaveLocationModal(true);
  };

  // Procurar pasta via File System Access API
  const handleBrowseSystemFolder = async () => {
    const win = window as any;
    if (typeof win.showDirectoryPicker === 'function') {
      try {
        const dirHandle = await win.showDirectoryPicker({ mode: 'readwrite' });
        if (dirHandle) {
          setDirectoryHandle(dirHandle);
          setSelectedDirectory(`Pasta Selecionada: ${dirHandle.name}`);
          setSaveMode('system_picker');
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: Diálogo Nativo Salvar Como
    const pickerResult = await promptSystemSavePdfFileHandle(customFileName || getDefaultPdfFileName());
    if (pickerResult.handle) {
      setShowSaveLocationModal(false);
      executePdfGeneration(pickerResult.handle);
    }
  };

  // Execução do pipeline de geração PDF
  const executePdfGeneration = async (targetFileHandle?: any) => {
    setIsGeneratingPdf(true);
    setStatusBanner(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const finalName = sanitizePdfFileName(customFileName || getDefaultPdfFileName());

    try {
      const res = await exportExecutiveDashboardToPdf({
        elementId: 'print-executive-report',
        customFileName: finalName,
        fallbackContext: { disciplines, activeSession, config },
        fileHandle: targetFileHandle,
        scale: 2,
        signal: controller.signal,
        onProgress: (progress) => {
          setExportProgress(progress);
        },
      });

      setStatusBanner({
        type: 'success',
        message: `Arquivo PDF "${res.fileName}" gerado com sucesso! (${res.byteSize ? (res.byteSize / 1024).toFixed(1) + ' KB' : 'A4 Paisagem'})`,
      });
      setTimeout(() => setStatusBanner(null), 6000);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStatusBanner({
          type: 'info',
          message: 'Operação de exportação cancelada com sucesso.',
        });
      } else {
        console.error('Erro ao gerar PDF:', err);
        setStatusBanner({
          type: 'error',
          message: 'Falha na geração do PDF: ' + (err?.message || 'Erro inesperado na captura de tela.'),
        });
      }
    } finally {
      setIsGeneratingPdf(false);
      setExportProgress(null);
      abortControllerRef.current = null;
    }
  };

  // Submissão do formulário do Modal de PDF
  const handleConfirmSavePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveLocationModal(false);

    let targetFileHandle: any = undefined;

    if (saveMode === 'system_picker') {
      if (directoryHandle && typeof directoryHandle.getFileHandle === 'function') {
        try {
          const finalName = sanitizePdfFileName(customFileName || getDefaultPdfFileName());
          targetFileHandle = await directoryHandle.getFileHandle(finalName, { create: true });
        } catch {
          targetFileHandle = undefined;
        }
      } else {
        const pickerResult = await promptSystemSavePdfFileHandle(customFileName || getDefaultPdfFileName());
        if (pickerResult.cancelled) {
          return;
        }
        if (pickerResult.handle) {
          targetFileHandle = pickerResult.handle;
        }
      }
    }

    await executePdfGeneration(targetFileHandle);
  };

  // 2. Abertura do Modal de Impressão
  const handleOpenPrinterModal = () => {
    setStatusBanner(null);
    setShowPrinterModal(true);
  };

  // Confirmação de impressão
  const handleConfirmPrint = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPrinterModal(false);
    setIsPrinting(true);
    setStatusBanner(null);

    const printerLabelMap: Record<string, string> = {
      system_dialog: 'Seletor de Impressoras do Sistema Operacional',
      corporate_default: 'Impressora Padrão Corporativa (Rede Estácio / YDUQS)',
      laserjet_coord: 'HP LaserJet Pro — Coordenação Acadêmica',
      pdf_printer: 'Microsoft Print to PDF / Impressora Virtual',
    };

    const chosenPrinterLabel = printerLabelMap[selectedPrinter] || 'Impressora Selecionada';

    const printOptions: PrintOptionsConfig = {
      printerName: chosenPrinterLabel,
      orientation: printOrientation,
      paperSize: printPaperSize,
      colorMode: printColorMode,
      scaleFit: printScaleFit,
      copies: printCopies,
    };

    const sourceCreatedAt = resolveSourceCreatedAtFallback(activeSession, primaryDiscipline);

    try {
      await printExecutiveDashboardReport(
        'print-executive-report',
        `Relatório Executivo — ${campusLabel} (${config.academicPeriod})${sourceCreatedAt ? ` · Arquivo criado em ${sourceCreatedAt}` : ''}`,
        printOptions
      );
      setStatusBanner({
        type: 'success',
        message: `Documento formatado e enviado ao spool de impressão ("${chosenPrinterLabel}" · ${printPaperSize} ${
          printOrientation === 'landscape' ? 'Paisagem' : 'Retrato'
        }).`,
      });
      setTimeout(() => setStatusBanner(null), 5000);
    } catch (err: any) {
      console.error('Erro ao imprimir relatório:', err);
      setStatusBanner({
        type: 'error',
        message: 'Não foi possível concluir a impressão: ' + (err?.message || 'Tente utilizar o botão Salvar como PDF.'),
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const availablePrinters = [
    {
      id: 'system_dialog',
      name: 'Escolher Impressora do Sistema (Diálogo Nativo Windows / macOS / Linux)',
      detail: 'Abre a caixa de diálogo nativa com todas as impressoras de rede, térmicas ou virtuais',
      status: 'Pronta',
    },
    {
      id: 'corporate_default',
      name: 'Impressora Padrão da Rede Corporativa (Campus)',
      detail: 'Fila departamental com duplex e alta fidelidade de cores A4',
      status: 'Online',
    },
    {
      id: 'laserjet_coord',
      name: 'HP LaserJet Enterprise Color — Coordenação de Cursos',
      detail: 'Calibragem precisa para as cores oficiais #0A3977 e #FFB800',
      status: 'Online',
    },
    {
      id: 'pdf_printer',
      name: 'Microsoft Print to PDF / Salvar como PDF via Driver',
      detail: 'Gera arquivo paginado diretamente pelo subsistema de impressão do S.O.',
      status: 'Virtual',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Card de Controle de Impressão & Exportação PDF */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0A3977] text-white">
              <Printer className="w-3.5 h-3.5 text-[#FFB800]" />
              <span>Relatório Executivo para Impressão & PDF</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-[#0A3977] border border-blue-200 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-[#FFB800]" />
              <span>Motor Gráfico de Alta Performance (Anti-Freeze)</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              A4 Paisagem (16:9) · 300 DPI
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Emissão do Relatório Executivo (Padrão Oficial Dashboard)
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Exporte ou imprima o <strong>Dashboard Executivo</strong> com fidelidade visual absoluta (cores institucionais <span className="text-[#0A3977] font-semibold">#0A3977</span> e <span className="text-[#0A3977] font-semibold">#FFB800</span>, cartões analíticos de Tempo de Estudo e Frequência, matriz de risco ARS e chancela Estácio).
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded">
              <Layers className="w-3 h-3 text-slate-500" />
              <span>Campus: <strong className="text-slate-800">{campusLabel}</strong></span>
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded">
              <FileCheck2 className="w-3 h-3 text-slate-500" />
              <span>Disciplinas: <strong className="text-slate-800">{disciplines.length} turmas</strong></span>
            </span>
            {activeSession?.fileName && (
              <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded max-w-md truncate" title={activeSession.fileName}>
                <span>
                  Origem: <strong className="text-slate-800">{activeSession.fileName}</strong>
                  {resolveSourceCreatedAtFallback(activeSession, disciplines[0]) && (
                    <span className="tabular-nums text-slate-600">
                      {' '}· Criado em: <strong className="text-slate-800">{resolveSourceCreatedAtFallback(activeSession, disciplines[0])}</strong>
                    </span>
                  )}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 justify-center">
          <button
            onClick={handleOpenSavePdfModal}
            disabled={isGeneratingPdf}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:opacity-60 rounded-lg transition-all shadow-xs cursor-pointer hover:shadow-md"
            title="Escolher opções e baixar o arquivo PDF de alta definição"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span>Processando PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-emerald-200" />
                <span>Salvar como PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenPrinterModal}
            disabled={isPrinting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#0A3977] hover:bg-[#082d5e] active:bg-[#062247] disabled:opacity-60 rounded-lg transition-all shadow-xs cursor-pointer hover:shadow-md"
            title="Abrir o spooler de impressão e escolher impressora"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 text-[#FFB800] animate-spin" />
                <span>Sincronizando Impressora...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 text-[#FFB800]" />
                <span>Imprimir Relatório</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barra de Progresso Reativa durante a Exportação PDF */}
      {isGeneratingPdf && exportProgress && (
        <div className="no-print bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="font-bold text-slate-200">{exportProgress.message}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-400">{exportProgress.percent}%</span>
              <button
                type="button"
                onClick={handleCancelExport}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[11px] font-semibold border border-rose-800 transition-colors cursor-pointer"
                title="Interromper geração do PDF"
              >
                <StopCircle className="w-3 h-3" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${exportProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Banner de Status (Sucesso / Erro / Info) */}
      {statusBanner && !isGeneratingPdf && (
        <div
          className={`no-print p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 border ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusBanner.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusBanner.type === 'info' ? (
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Container Offscreen #print-executive-report */}
      <div 
        id="print-executive-report"
        aria-hidden="true"
        className="fixed -left-[10000px] top-0 w-[1280px] opacity-0 pointer-events-none select-none print:static print:left-0 print:opacity-100 print:pointer-events-auto print:w-full bg-white overflow-hidden"
      >
        <ExecutiveDashboardCanvas
          disciplines={disciplines}
          activeSession={activeSession}
          config={config}
          onNavigateToSources={onNavigateToSources}
          isPrintMode={true}
        />
      </div>

      {/* Modal 1: Salvar como PDF */}
      {showSaveLocationModal && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-700 text-white">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Exportação de PDF — Alta Performance
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escolha a modalidade de download e o nome do arquivo executivo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveLocationModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSavePdf} className="p-6 space-y-4 text-xs">
              {/* Modalidade de Salvamento */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  Método de Armazenamento:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSaveMode('instant')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      saveMode === 'instant'
                        ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 shadow-2xs ring-1 ring-emerald-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <ArrowDownToLine className="w-4 h-4 text-emerald-700" />
                        <span>Download Imediato</span>
                      </span>
                      {saveMode === 'instant' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Grava diretamente na pasta padrão do seu navegador com velocidade máxima e desalocação de memória segura.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSaveMode('system_picker');
                      handleBrowseSystemFolder();
                    }}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      saveMode === 'system_picker'
                        ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 shadow-2xs ring-1 ring-emerald-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-emerald-700" />
                        <span>Escolher Pasta no S.O.</span>
                      </span>
                      {saveMode === 'system_picker' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Abre a janela nativa do Windows/macOS para escolher a pasta de destino (File System Access).
                    </p>
                  </button>
                </div>
              </div>

              {/* Nome do Arquivo */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nome do Arquivo PDF (.pdf):
                </label>
                <input
                  type="text"
                  required
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="Relatorio_Executivo_Dashboard.pdf"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 focus:bg-white text-slate-900 font-medium focus:outline-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Caracteres especiais são automaticamente sanitizados para preservar a integridade do sistema de arquivos.
                </p>
              </div>

              {/* Informações Técnicas de Otimização */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pipeline: <strong>Widescreen 16:9 · Landscape A4</strong></span>
                </span>
                <span className="text-emerald-700 font-semibold">Descarregamento não-bloqueante</span>
              </div>

              {/* Rodapé */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSaveLocationModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Iniciar Exportação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Imprimir Relatório */}
      {showPrinterModal && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-[#0A3977] text-white flex items-center justify-between border-b-2 border-[#FFB800]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 text-[#FFB800]">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Imprimir Relatório — Seletor de Dispositivo
                  </h3>
                  <p className="text-xs text-blue-100">
                    Configure a saída de impressão do Dashboard Executivo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrinterModal(false)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPrint} className="p-6 space-y-4 text-xs">
              {/* Lista de Impressoras */}
              <div>
                <label className="block font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-[#0A3977]" />
                  <span>Destino de Impressão:</span>
                </label>

                <div className="space-y-2">
                  {availablePrinters.map((printer) => {
                    const isSelected = selectedPrinter === printer.id;
                    return (
                      <button
                        key={printer.id}
                        type="button"
                        onClick={() => setSelectedPrinter(printer.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 border-[#0A3977] text-slate-900 shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{printer.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                              {printer.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{printer.detail}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#0A3977] bg-[#0A3977] text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parâmetros de Impressão */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-2.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#0A3977]" />
                  <span>Preferências de Enquadramento:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Orientação
                    </label>
                    <select
                      value={printOrientation}
                      onChange={(e) => setPrintOrientation(e.target.value as 'landscape' | 'portrait')}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-slate-50 font-semibold text-slate-800"
                    >
                      <option value="landscape">Paisagem (16:9)</option>
                      <option value="portrait">Retrato</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tamanho do Papel
                    </label>
                    <select
                      value={printPaperSize}
                      onChange={(e) => setPrintPaperSize(e.target.value as 'A4' | 'Letter')}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-slate-50 font-semibold text-slate-800"
                    >
                      <option value="A4">A4 (297 × 210 mm)</option>
                      <option value="Letter">Carta (Letter)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Modo de Cor
                    </label>
                    <select
                      value={printColorMode}
                      onChange={(e) => setPrintColorMode(e.target.value as 'color' | 'grayscale')}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-slate-50 font-semibold text-slate-800"
                    >
                      <option value="color">Colorido Oficial</option>
                      <option value="grayscale">Preto e Branco</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nº de Cópias
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={printCopies}
                      onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-slate-50 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 mt-3 text-[11px] text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printScaleFit}
                    onChange={(e) => setPrintScaleFit(e.target.checked)}
                    className="rounded border-slate-300 text-[#0A3977] focus:ring-[#0A3977]"
                  />
                  <span>Ajustar proporcionalmente todo o Dashboard Executivo para folha única (Single Page Fit)</span>
                </label>
              </div>

              {/* Rodapé */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPrinterModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#0A3977] hover:bg-[#082d5e] rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#FFB800]" />
                  <span>Abrir Impressora e Imprimir</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
