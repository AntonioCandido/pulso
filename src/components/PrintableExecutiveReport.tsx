import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import { DisciplineMetric, SystemConfig, ImportSession } from '../types';
import { ExecutiveDashboardCanvas } from './ExecutiveDashboardCanvas';
import { 
  exportExecutiveDashboardToPdf, 
  printExecutiveDashboardReport, 
  promptSystemSavePdfFileHandle,
  PrintOptionsConfig
} from '../utils/pdfExport';

export interface PrintableExecutiveReportProps {
  disciplines: DisciplineMetric[];
  activeSession?: ImportSession | null;
  config: SystemConfig;
  onNavigateToSources?: () => void;
}

/**
 * Componente: Relatório Executivo para Impressão & Exportação PDF
 * 
 * - Mantém o container #print-executive-report oculto na tela da seção "Relatórios & Exportação"
 *   (removendo a duplicação visual do Dashboard Executivo em tela), mas ativo em 1280px offscreen
 *   para captura fiel em PDF e visível automaticamente durante @media print.
 * - Botão "Salvar como PDF": abre a rotina de escolha do local e nome para salvar o arquivo
 *   (integrado à File System Access API showSaveFilePicker / showDirectoryPicker + seletor de diretório).
 * - Botão "Imprimir Relatório": abre a rotina de escolha da impressora e parâmetros de página
 *   acionando o seletor nativo de impressão do sistema.
 */
export const PrintableExecutiveReport: React.FC<PrintableExecutiveReportProps> = ({
  disciplines,
  activeSession,
  config,
  onNavigateToSources,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State: Salvar como PDF (Escolha do Local)
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState<string>('C:\\Users\\Coordenacao\\Downloads');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [directoryHandle, setDirectoryHandle] = useState<any | null>(null);

  // Modal State: Imprimir Relatório (Escolha da Impressora)
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('system_dialog');
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [printColorMode, setPrintColorMode] = useState<'color' | 'grayscale'>('color');
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [printScaleFit, setPrintScaleFit] = useState<boolean>(true);

  const hasData = disciplines.length > 0;
  const primaryDiscipline = disciplines[0];
  const executive = primaryDiscipline?.executiveSummary;

  const campusLabel = !hasData 
    ? '-- (Base Zerada)' 
    : activeSession?.campus 
    ? (activeSession.campus.startsWith('Campus') ? activeSession.campus : `Campus ${activeSession.campus}`)
    : executive?.campus
    ? (executive.campus.startsWith('Campus') ? executive.campus : `Campus ${executive.campus}`)
    : `Campus ${primaryDiscipline?.campus || 'Principal'}`;

  const getDefaultPdfFileName = () => {
    const cleanCampus = campusLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    return `Relatorio_Executivo_Dashboard_${cleanCampus}_${dateStr}.pdf`;
  };

  useEffect(() => {
    setCustomFileName(getDefaultPdfFileName());
  }, [campusLabel, activeSession?.importId]);

  // 1. Abertura da rotina de escolha do local para salvar o arquivo PDF
  const handleOpenSavePdfModal = () => {
    setStatusBanner(null);
    const defaultName = customFileName || getDefaultPdfFileName();
    setCustomFileName(defaultName);
    setShowSaveLocationModal(true);
  };

  // Procurar pasta via File System Access API (showDirectoryPicker) se disponível
  const handleBrowseSystemFolder = async () => {
    const win = window as any;
    if (typeof win.showDirectoryPicker === 'function') {
      try {
        const dirHandle = await win.showDirectoryPicker({ mode: 'readwrite' });
        if (dirHandle) {
          setDirectoryHandle(dirHandle);
          setSelectedDirectory(`Pasta do Sistema: ${dirHandle.name}`);
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Tenta showSaveFilePicker diretamente
    const pickerResult = await promptSystemSavePdfFileHandle(customFileName || getDefaultPdfFileName());
    if (pickerResult.handle) {
      setShowSaveLocationModal(false);
      setIsGeneratingPdf(true);
      try {
        const res = await exportExecutiveDashboardToPdf(
          'print-executive-report',
          customFileName || getDefaultPdfFileName(),
          { disciplines, activeSession, config },
          pickerResult.handle
        );
        setStatusBanner({
          type: 'success',
          message: `Arquivo PDF "${res.fileName}" salvo com sucesso no local selecionado!`,
        });
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  };

  // Confirma a gravação do PDF no local e nome escolhidos no modal
  const handleConfirmSavePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = (customFileName.trim() || getDefaultPdfFileName()).endsWith('.pdf')
      ? customFileName.trim() || getDefaultPdfFileName()
      : `${customFileName.trim()}.pdf`;

    setShowSaveLocationModal(false);
    setIsGeneratingPdf(true);
    setStatusBanner(null);

    try {
      let targetFileHandle: any = undefined;

      // Se o usuário selecionou uma pasta via showDirectoryPicker, cria o arquivo dentro dela
      if (directoryHandle && typeof directoryHandle.getFileHandle === 'function') {
        try {
          targetFileHandle = await directoryHandle.getFileHandle(finalName, { create: true });
        } catch {
          targetFileHandle = undefined;
        }
      } else {
        // Tenta abrir o seletor nativo do sistema antes da geração
        const pickerResult = await promptSystemSavePdfFileHandle(finalName);
        if (pickerResult.cancelled) {
          setIsGeneratingPdf(false);
          return;
        }
        if (pickerResult.handle) {
          targetFileHandle = pickerResult.handle;
        }
      }

      const res = await exportExecutiveDashboardToPdf(
        'print-executive-report',
        finalName,
        { disciplines, activeSession, config },
        targetFileHandle
      );

      setStatusBanner({
        type: 'success',
        message: `Arquivo PDF "${res.fileName}" salvo com sucesso em ${selectedDirectory}!`,
      });
      setTimeout(() => setStatusBanner(null), 5000);
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      setStatusBanner({
        type: 'error',
        message: 'Não foi possível gerar o arquivo PDF: ' + (err?.message || 'Erro inesperado na captura.'),
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Abertura da rotina de escolha da impressora
  const handleOpenPrinterModal = () => {
    setStatusBanner(null);
    setShowPrinterModal(true);
  };

  // Confirma a impressão enviando para a impressora selecionada e abrindo o diálogo do sistema
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

    try {
      await printExecutiveDashboardReport(
        'print-executive-report',
        `Relatório Executivo — ${campusLabel} (${config.academicPeriod})`,
        printOptions
      );
      setStatusBanner({
        type: 'success',
        message: `Documento enviado para "${chosenPrinterLabel}" (${printPaperSize} ${
          printOrientation === 'landscape' ? 'Paisagem' : 'Retrato'
        }, ${printCopies} ${printCopies > 1 ? 'cópias' : 'cópia'}).`,
      });
      setTimeout(() => setStatusBanner(null), 5000);
    } catch (err: any) {
      console.error('Erro ao imprimir relatório:', err);
      setStatusBanner({
        type: 'error',
        message: 'Não foi possível iniciar a impressão: ' + (err?.message || 'Tente usar o botão Salvar como PDF.'),
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const presetDirectories = [
    { label: 'Pasta Downloads (Padrão)', path: 'C:\\Users\\Coordenacao\\Downloads' },
    { label: 'Meus Documentos — Relatórios', path: 'C:\\Users\\Coordenacao\\Documents\\Relatorios_Pulso' },
    { label: 'Área de Trabalho (Desktop)', path: 'C:\\Users\\Coordenacao\\Desktop' },
    { label: 'Rede Corporativa (OneDrive / YDUQS)', path: 'Z:\\Governanca_Academica\\2026_2\\Relatorios' },
  ];

  const availablePrinters = [
    {
      id: 'system_dialog',
      name: 'Escolher Impressora do Sistema (Diálogo Nativo Windows / macOS)',
      detail: 'Abre a lista completa de impressoras instaladas localmente e na rede',
      status: 'Pronta',
    },
    {
      id: 'corporate_default',
      name: 'Impressora Padrão da Rede Corporativa (Campus)',
      detail: 'Fila de impressão departamental frente e verso · A4 Paisagem',
      status: 'Online',
    },
    {
      id: 'laserjet_coord',
      name: 'HP LaserJet Enterprise Color — Coordenação de Cursos',
      detail: 'Alta definição em cores oficiais (#0A3977 / #FFB800)',
      status: 'Online',
    },
    {
      id: 'pdf_printer',
      name: 'Microsoft Print to PDF / Salvar como PDF via Impressão',
      detail: 'Gera spool de impressão virtual paginado em formato A4',
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
              <span>Layout Fiel ao Dashboard Executivo (16:9)</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Orientação Paisagem · A4
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Emissão do Relatório Executivo (Padrão Oficial Dashboard)
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Exporte ou imprima o <strong>Dashboard Executivo</strong> com seu design e layout completos (banner institucional em azul marinho <span className="text-[#0A3977] font-semibold">#0A3977</span> e dourado <span className="text-[#0A3977] font-semibold">#FFB800</span>, cartões hero de Tempo de Estudo e Frequência, indicadores de governança, tabela de ranking e chancela Estácio).
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
              <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded truncate max-w-xs" title={activeSession.fileName}>
                <span>Origem: <strong className="text-slate-800">{activeSession.fileName}</strong></span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Salvar como PDF & Imprimir Relatório */}
        <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 justify-center">
          <button
            onClick={handleOpenSavePdfModal}
            disabled={isGeneratingPdf}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:opacity-60 rounded-lg transition-all shadow-xs cursor-pointer hover:shadow-md"
            title="Escolher local no computador para salvar o arquivo PDF do Dashboard Executivo"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span>Salvando PDF...</span>
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
            title="Escolher impressora e imprimir o Relatório Executivo"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 text-[#FFB800] animate-spin" />
                <span>Enviando para Impressora...</span>
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

      {/* Inline Status Banner (Success or Error) */}
      {statusBanner && (
        <div
          className={`no-print p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 border ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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

      {/* =========================================================================
          OFFSCREEN / PRINT-ONLY CONTAINER: #print-executive-report
          Oculto na tela da aba "Relatórios & Exportação" (conforme solicitado para
          remover os elementos visuais duplicados em tela), mas mantido em 1280px no DOM
          para captura pelo html2canvas/jsPDF e exibido automaticamente durante @media print.
          ========================================================================= */}
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

      {/* =========================================================================
          MODAL 1: SALVAR COMO PDF — ESCOLHER LOCAL PARA SALVAR O ARQUIVO
          ========================================================================= */}
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
                    Salvar como PDF — Escolher Local para Salvar
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina a pasta de destino e o nome do arquivo PDF do Dashboard Executivo
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
              {/* Seleção de Pasta / Diretório */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Local / Pasta de Destino:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleBrowseSystemFolder}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Procurar Pasta no Computador...</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {presetDirectories.map((dir) => {
                    const isSelected = selectedDirectory === dir.path;
                    return (
                      <button
                        key={dir.path}
                        type="button"
                        onClick={() => {
                          setDirectoryHandle(null);
                          setSelectedDirectory(dir.path);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-600 text-slate-900 font-semibold'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block text-xs">{dir.label}</span>
                          <span className="block text-[10px] font-mono text-slate-500 truncate">{dir.path}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Caminho Selecionado:
                  </label>
                  <input
                    type="text"
                    value={selectedDirectory}
                    onChange={(e) => setSelectedDirectory(e.target.value)}
                    className="w-full px-3 py-1.5 font-mono text-[11px] border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-emerald-600"
                  />
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
              </div>

              {/* Resumo de Formato */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span>Formato: <strong>PDF A4 Paisagem (Widescreen 16:9)</strong></span>
                <span className="text-emerald-700 font-semibold">Alta Resolução (300 DPI)</span>
              </div>

              {/* Rodapé do Modal */}
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
                  <span>Salvar Arquivo PDF</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: IMPRIMIR RELATÓRIO — OPÇÃO DE ESCOLHA DA IMPRESSORA
          ========================================================================= */}
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
                    Imprimir Relatório — Escolher Impressora
                  </h3>
                  <p className="text-xs text-blue-100">
                    Selecione a impressora de destino e os parâmetros de página para o Dashboard Executivo
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
                  <span>Selecione a Impressora de Destino:</span>
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
                  <span>Preferências da Folha de Impressão:</span>
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
                  <span>Ajustar automaticamente todo o Dashboard Executivo em uma única página</span>
                </label>
              </div>

              {/* Rodapé do Modal */}
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
