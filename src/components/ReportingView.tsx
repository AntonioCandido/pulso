import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Presentation, 
  FileText, 
  Download, 
  Printer, 
  Settings, 
  Terminal, 
  CheckCircle2, 
  ExternalLink,
  Save,
  Upload
} from 'lucide-react';
import { DisciplineMetric, SystemConfig } from '../types';
import { exportAnalyticalWorkbook, exportPowerPointDeck, exportConfigFile, generateBatchScript } from '../utils/calculations';

interface ReportingViewProps {
  disciplines: DisciplineMetric[];
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
}

export const ReportingView: React.FC<ReportingViewProps> = ({
  disciplines,
  config,
  onUpdateConfig,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Settings form state
  const [institutionName, setInstitutionName] = useState(config.institutionName);
  const [academicPeriod, setAcademicPeriod] = useState(config.academicPeriod);
  const [coordinatorName, setCoordinatorName] = useState(config.coordinatorName);
  const [coordinatorEmail, setCoordinatorEmail] = useState(config.coordinatorEmail);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Reporting Layer & Governança Corporativa</span>
            <span aria-hidden="true">·</span>
            <span>Widescreen 16:9 & Planilhas Analíticas</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Central de Emissão de Relatórios & Apresentações
          </h1>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Main Export Cards */}
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
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md transition-colors shadow-xs"
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

            <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                <span className="font-bold text-slate-700">Preview Visual do Padrão Widescreen (Estácio / YDUQS)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">16:9 HD</span>
              </div>
              <div className="bg-[#0A3977] text-white p-2.5 rounded-md flex items-center justify-between border-b-2 border-[#FFB800]">
                <div>
                  <span className="text-xs font-black text-[#FFB800] uppercase block">PULSO ACADÊMICO</span>
                  <span className="text-[10px] font-bold text-white uppercase">CURSO: CIÊNCIA DA COMPUTAÇÃO</span>
                </div>
                <div className="bg-white px-2 py-0.5 rounded shadow-xs">
                  <img
                    src="/assets/aistudio/Logo_estacio_sem_fundo_83f2716c.png"
                    alt="Logo Estácio"
                    className="h-4 w-auto object-contain"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500 font-bold block">TEMPO DE ESTUDO</span>
                  <span className="text-sm font-extrabold text-[#0A3977]">14:39</span> <span className="text-slate-400">hh:mm</span>
                  <span className="text-rose-600 font-bold block text-[9px]">▼ -8:32 (-36.68%)</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500 font-bold block">FREQUÊNCIA</span>
                  <span className="text-sm font-extrabold text-[#0A3977]">68,36 %</span>
                  <span className="text-rose-600 font-bold block text-[9px]">▼ -2,23 % (A.A.)</span>
                </div>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 my-3 border-y border-slate-100 py-2.5">
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
                <span><strong>Slide 3 - Governança Analítica:</strong> Conceitos de LHI e ARS com fórmulas</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span><strong>Slide 4 & 5 - Matriz de Ação & Diretrizes:</strong> Próximos passos e tutoria</span>
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

      {/* Evolution Opportunity 1: Advanced Configuration Persistence */}
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Preferências Institucionais</span>
            </button>
          </div>
        </form>
      </div>

      {/* RNF03 & Review: Windows Local Automation Script (executar.bat) */}
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
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shrink-0 font-mono shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar executar.bat</span>
        </button>
      </div>
    </div>
  );
};
