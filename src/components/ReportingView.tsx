import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Presentation, 
  Download, 
  Settings, 
  CheckCircle2, 
  Save,
  Upload,
  FileDown,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { DisciplineMetric, SystemConfig, ImportSession } from '../types';
import { exportAnalyticalWorkbook, exportPowerPointDeck, exportConfigFile } from '../utils/calculations';
import { exportExecutiveDashboardToPdf } from '../utils/pdfExport';
import { PrintableExecutiveReport } from './PrintableExecutiveReport';

interface ReportingViewProps {
  disciplines: DisciplineMetric[];
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  activeSession?: ImportSession | null;
  onNavigateToSources?: () => void;
}

export const ReportingView: React.FC<ReportingViewProps> = ({
  disciplines,
  config,
  onUpdateConfig,
  activeSession,
  onNavigateToSources,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Settings form state
  const [institutionName, setInstitutionName] = useState(config.institutionName);
  const [academicPeriod, setAcademicPeriod] = useState(config.academicPeriod);
  const [coordinatorName, setCoordinatorName] = useState(config.coordinatorName);
  const [coordinatorEmail, setCoordinatorEmail] = useState(config.coordinatorEmail);

  const handleSavePdf = async () => {
    setIsExportingPdf(true);
    setExportError(null);
    try {
      const campusName = activeSession?.campus || disciplines[0]?.campus || 'Geral';
      const cleanCampus = campusName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `Relatorio_Executivo_Dashboard_${cleanCampus}_${dateStr}.pdf`;
      await exportExecutiveDashboardToPdf('print-executive-report', fileName, {
        disciplines,
        activeSession,
        config,
      });
      setExportNotice(`Arquivo PDF (${fileName}) gerado em alta resolução e baixado com sucesso!`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      setExportError('Não foi possível gerar o arquivo PDF: ' + (err?.message || 'Erro na captura'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    setExportError(null);
    try {
      exportAnalyticalWorkbook(disciplines, config);
      setExportNotice('Planilha analítica Excel (.xlsx) gerada com 3 abas formatadas!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      setExportError('Erro ao gerar planilha Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPPTX = async () => {
    setIsExportingPptx(true);
    setExportError(null);
    try {
      await exportPowerPointDeck(disciplines, config);
      setExportNotice('Apresentação executiva PowerPoint (.pptx) gerada em padrão widescreen 16:9!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      setExportError('Erro ao gerar apresentação PowerPoint.');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleSaveInstitutionProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...config,
      institutionName,
      academicPeriod,
      coordinatorName,
      coordinatorEmail,
      lastBackupDate: new Date().toISOString().slice(0, 10),
    });
    setExportNotice('Perfil institucional e governança atualizados.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleImportConfigFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.institutionName && parsed.weights) {
          onUpdateConfig(parsed);
          setInstitutionName(parsed.institutionName);
          setAcademicPeriod(parsed.academicPeriod);
          setCoordinatorName(parsed.coordinatorName);
          setCoordinatorEmail(parsed.coordinatorEmail);
          setExportNotice('Arquivo de configuração importado e aplicado com sucesso!');
          setTimeout(() => setExportNotice(null), 3000);
        }
      } catch (err) {
        setExportError('Arquivo de configuração JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header bar (no-print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Reporting Layer & Governança Corporativa</span>
            <span aria-hidden="true">·</span>
            <span>Widescreen 16:9, Impressão & Exportação PDF</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Central de Emissão de Relatórios & Apresentações
          </h1>
        </div>
      </div>

      {exportNotice && (
        <div className="no-print p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {exportError && (
        <div className="no-print p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* =========================================================================
          COMPONENTE: RELATÓRIO EXECUTIVO PARA IMPRESSÃO
          Renderiza o layout completo do 'Dashboard Executivo' exatamente como ele
          aparece na tela, utilizando o container #print-executive-report e os estilos
          definidos em index.css, com botões 'Salvar como PDF' e 'Imprimir Relatório'.
          ========================================================================= */}
      <section aria-label="Relatório Executivo para Impressão">
        <PrintableExecutiveReport
          disciplines={disciplines}
          activeSession={activeSession}
          config={config}
          onNavigateToSources={onNavigateToSources}
        />
      </section>

      {/* =========================================================================
          DEMAIS FORMATOS DE EXPORTAÇÃO (PDF Direto, Excel, PowerPoint, Configurações, Batch)
          Ocultados automaticamente durante a impressão via .no-print
          ========================================================================= */}
      <div className="no-print space-y-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Formatos de Exportação & Auditoria Complementares
            </h2>
            <p className="text-xs text-slate-500">
              Arquivos analíticos, apresentações em slides e cadernos para prestação de contas colegiada
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PDF CARD */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Relatório em PDF (.pdf)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Captura gráfica vetorial/raster de alta resolução (html2canvas + jsPDF)
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 my-4 border-y border-slate-100 py-3">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span><strong>Widescreen 16:9:</strong> Enquadramento automático no padrão paisagem</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span><strong>Design Oficial:</strong> Todas as cores, banners, logos e métricas preservados</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span><strong>Download Imediato:</strong> Não requer configuração manual de impressora</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleSavePdf}
              disabled={isExportingPdf}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-600 disabled:opacity-60 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Baixar Arquivo PDF (.pdf)</span>
                </>
              )}
            </button>
          </div>

          {/* EXCEL CARD */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Planilha Analítica (.xlsx)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Caderno com fórmulas abertas, matriz de risco e sumário
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 my-4 border-y border-slate-100 py-3">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Aba 1 - Sumário:</strong> KPIs consolidados</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Aba 2 - Auditoria:</strong> {disciplines.length} turmas mapeadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Aba 3 - Matriz de Risco:</strong> ARS &ge; 50</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingExcel ? 'Gerando Planilha...' : 'Baixar Caderno (.xlsx)'}</span>
            </button>
          </div>

          {/* POWERPOINT CARD */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
                  <Presentation className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Apresentação (.pptx)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Layout 16:9 corporativo com cartões de indicadores e tabelas
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 my-4 border-y border-slate-100 py-3">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span><strong>Slide 1:</strong> Capa Institucional</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span><strong>Slide 2:</strong> Executive Dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span><strong>Slide 3 & 4:</strong> Diretrizes & Ações</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleExportPPTX}
              disabled={isExportingPptx}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPptx ? 'Gerando Slides...' : 'Baixar Apresentação (.pptx)'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Persistence Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-700" />
                <span>Persistência Avançada de Configurações & Metadados</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Armazene preferências de exportação, histórico de conexões e perfil do coordenador em arquivo local JSON/TOML
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfigFile}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => exportConfigFile(config)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Config (JSON)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveInstitutionProfile} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Instituição de Ensino Superior
              </label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Período Letivo
              </label>
              <input
                type="text"
                required
                value={academicPeriod}
                onChange={(e) => setAcademicPeriod(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nome do Coordenador de TI
              </label>
              <input
                type="text"
                required
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                E-mail Institucional
              </label>
              <input
                type="email"
                required
                value={coordinatorEmail}
                onChange={(e) => setCoordinatorEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:outline-blue-600"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Preferências Institucionais</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
