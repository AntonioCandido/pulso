import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Presentation, 
  Download, 
  Printer, 
  Settings, 
  Terminal, 
  CheckCircle2, 
  Save,
  Upload,
  Eye,
  X,
  Maximize2,
  FileCheck2,
  Layers,
  Sparkles
} from 'lucide-react';
import { DisciplineMetric, SystemConfig, ImportSession } from '../types';
import { exportAnalyticalWorkbook, exportPowerPointDeck, exportConfigFile, generateBatchScript } from '../utils/calculations';
import { ExecutiveDashboardCanvas } from './ExecutiveDashboardCanvas';

interface ReportingViewProps {
  disciplines: DisciplineMetric[];
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  activeSession?: ImportSession | null;
}

export const ReportingView: React.FC<ReportingViewProps> = ({
  disciplines,
  config,
  onUpdateConfig,
  activeSession,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Settings form state
  const [institutionName, setInstitutionName] = useState(config.institutionName);
  const [academicPeriod, setAcademicPeriod] = useState(config.academicPeriod);
  const [coordinatorName, setCoordinatorName] = useState(config.coordinatorName);
  const [coordinatorEmail, setCoordinatorEmail] = useState(config.coordinatorEmail);

  const hasData = disciplines.length > 0;
  const campusLabel = !hasData 
    ? '-- (Base Zerada)' 
    : activeSession?.campus 
    ? (activeSession.campus.startsWith('Campus') ? activeSession.campus : `Campus ${activeSession.campus}`)
    : `Campus ${disciplines[0]?.campus || 'Principal'}`;

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportAnalyticalWorkbook(disciplines, config);
      setExportNotice('Planilha analítica Excel (.xlsx) gerada com 3 abas formatadas!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPPTX = async () => {
    setIsExportingPptx(true);
    try {
      await exportPowerPointDeck(disciplines, config);
      setExportNotice('Apresentação executiva PowerPoint (.pptx) gerada em padrão widescreen 16:9!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
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
        alert('Arquivo de configuração inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* =========================================================================
          PRINT ONLY CANVAS (Consumed strictly by window.print())
          Renders the 100% faithful executive dashboard layout matching image_376e7fab.png
          ========================================================================= */}
      <div id="print-executive-report" className="hidden print:block w-full">
        <ExecutiveDashboardCanvas
          disciplines={disciplines}
          activeSession={activeSession}
          config={config}
          isPrintMode={true}
        />
      </div>

      {/* Screen Interactive UI */}
      <div className="space-y-6 no-print">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Reporting Layer & Governança Corporativa</span>
              <span aria-hidden="true">·</span>
              <span>Widescreen 16:9 & Impressão Executiva</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Central de Emissão de Relatórios & Apresentações
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0A3977] hover:bg-[#072752] rounded-md transition-colors shadow-xs cursor-pointer"
              title="Imprimir com o layout e design do Dashboard Executivo"
            >
              <Printer className="w-4 h-4 text-[#FFB800]" />
              <span>Imprimir Relatório Executivo</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* =========================================================================
            FEATURED: IMPRESSÃO DO RELATÓRIO EXECUTIVO (LAYOUT DASHBOARD)
            Direct fulfillment of user request: Designer e layout da Tela "Dashboard Executivo"
            ========================================================================= */}
        <div className="bg-white border-2 border-[#0A3977]/30 hover:border-[#0A3977] rounded-xl p-6 shadow-sm transition-all relative overflow-hidden">
          {/* Subtle top decorative ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0A3977] via-[#0D47A1] to-[#FFB800]" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0A3977] text-white">
                  <Printer className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span>Opção de Impressão Oficial</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-[#0A3977] border border-blue-200 px-2.5 py-1 rounded-full">
                  <Sparkles className="w-3 h-3 text-[#FFB800]" />
                  <span>Layout Idêntico à Tela "Dashboard Executivo"</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Formato Paisagem / Widescreen 16:9
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Imprimir Relatório Executivo (Layout Oficial Dashboard)</span>
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Gera a impressão ou PDF com a reprodução fidedigna do <strong>Dashboard Executivo</strong>: banner superior institucional em azul marinho (<code className="text-[#0A3977] font-bold font-mono">#0A3977</code>) com tipografia dourada (<code className="text-[#0A3977] font-bold font-mono">#FFB800</code>), marca d'água em losango, cartões hero de <strong>Tempo de Estudo</strong> e <strong>Frequência</strong>, indicadores de governança pedagógica (Grau de Aprendizagem, Reprovação Geral, Adesão AV/SM, LHI, ARS), tabela de <strong>Ranking de Tempo de Estudo</strong> com barras de desempenho e rodapé com chancela oficial Estácio.
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Campus ativo: <strong className="text-slate-800">{campusLabel}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md">
                  <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Turmas no relatório: <strong className="text-slate-800">{disciplines.length} disciplinas</strong></span>
                </div>
                {activeSession?.fileName && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md truncate max-w-xs" title={activeSession.fileName}>
                    <span>Arquivo: <strong className="text-slate-800">{activeSession.fileName}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons and visual preview trigger */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
              <button
                onClick={handlePrintReport}
                className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-[#0A3977] hover:bg-[#082d5e] active:bg-[#062247] rounded-lg transition-all shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#FFB800]" />
                <span>Imprimir Relatório Agora</span>
              </button>

              <button
                onClick={() => setShowPrintPreview(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0A3977] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4 text-[#0A3977]" />
                <span>Pré-visualizar em Tela Cheia</span>
              </button>
            </div>
          </div>

          {/* Miniature banner snapshot representation */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="bg-[#0A3977] text-white p-3 rounded-lg border-b-2 border-[#FFB800] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-[#FFB800] text-[#0A3977] font-black flex items-center justify-center text-xs">
                  P
                </div>
                <div>
                  <span className="text-xs font-black text-[#FFB800] tracking-wide block uppercase">
                    PULSO ACADÊMICO
                  </span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                    CURSO: CIÊNCIA DA COMPUTAÇÃO · {campusLabel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[10px] text-blue-200">
                  Layout Widescreen 16:9 Oficial
                </span>
                <div className="bg-white px-2 py-0.5 rounded shadow-xs">
                  <img
                    src="/assets/aistudio/Logo_estacio_sem_fundo_83f2716c.png"
                    alt="Logo Estácio"
                    className="h-4 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Secondary Export Cards (Excel & PowerPoint) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EXCEL CARD */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Planilha Analítica Executiva (.xlsx)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Caderno de auditoria com fórmulas abertas, matriz de risco e sumário
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 my-4 border-y border-slate-100 py-3">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Aba 1 - Sumário Executivo:</strong> KPIs institucionais consolidados e metodologias</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Aba 2 - Auditoria por Disciplina:</strong> Todas as {disciplines.length} turmas com métricas RF02 e índices LHI/ARS</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span><strong>Aba 3 - Matriz de Risco Crítico:</strong> Coortes com ARS &ge; 50 para convocação pedagógica</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingExcel ? 'Gerando Planilha...' : 'Baixar Caderno Analítico (.xlsx)'}</span>
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
                  <h2 className="text-base font-bold text-slate-900">
                    Apresentação PowerPoint Widescreen (.pptx)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Layout 16:9 corporativo com cartões de indicadores, tabelas e recomendações
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 my-4 border-y border-slate-100 py-3">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span><strong>Slide 1 - Capa Institucional:</strong> Período {config.academicPeriod}, dados da coordenação</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span><strong>Slide 2 - Executive Dashboard:</strong> Layout oficial com cartões hero e ranking de tempo</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span><strong>Slide 3 & 4 - Diretrizes & Ações:</strong> Matriz de intervenção e coortes prioritárias</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleExportPPTX}
              disabled={isExportingPptx}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPptx ? 'Gerando Apresentação...' : 'Baixar Apresentação Executiva (.pptx)'}</span>
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

        {/* Windows Automation Batch */}
        <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                RNF03: Script de Inicialização Automatizada (executar.bat)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Gera o script batch corporativo para provisionamento do ambiente virtual Python, checagem de dependências e execução local em estações de trabalho Windows.
            </p>
          </div>

          <button
            onClick={() => generateBatchScript(config)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shrink-0 font-mono shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar executar.bat</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PRINT PREVIEW MODAL (Full Screen WYSIWYG)
          ========================================================================= */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6 overflow-y-auto no-print">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-7xl w-full mx-auto flex flex-col my-auto border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0A3977] text-[#FFB800]">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Pré-visualização de Impressão — Dashboard Executivo</span>
                    <span className="text-[10px] font-semibold bg-[#FFB800] text-[#0A3977] px-2 py-0.5 rounded">
                      Layout Oficial 16:9
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Visualização idêntica ao resultado na folha ou PDF exportado.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0A3977] hover:bg-[#082d5e] rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-[#FFB800]" />
                  <span>Imprimir Agora (Ctrl + P)</span>
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                  title="Fechar pré-visualização"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Settings Helper Banner */}
            <div className="bg-blue-50 px-6 py-2.5 border-b border-blue-100 flex items-center justify-between text-xs text-[#0A3977]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#0A3977]" />
                <span>
                  <strong>Configuração recomendada na impressora:</strong> Orientação <strong>Paisagem (Landscape)</strong>, Margens <strong>Mínimas</strong> e habilitar <strong>"Gráficos de plano de fundo"</strong>.
                </span>
              </div>
              <span className="font-semibold">{campusLabel}</span>
            </div>

            {/* Canvas Preview Container */}
            <div className="p-6 bg-slate-100 overflow-x-auto">
              <div className="shadow-lg rounded-lg overflow-hidden bg-white max-w-6xl mx-auto">
                <ExecutiveDashboardCanvas
                  disciplines={disciplines}
                  activeSession={activeSession}
                  config={config}
                  isPrintMode={true}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>{disciplines.length} turmas mapeadas no relatório executivo</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50"
                >
                  Fechar
                </button>
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0A3977] hover:bg-[#082d5e] rounded-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span>Imprimir Relatório</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
