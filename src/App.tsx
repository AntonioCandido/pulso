import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { IngestionView } from './components/IngestionView';
import { AuditGridView } from './components/AuditGridView';
import { FormulaEngineView } from './components/FormulaEngineView';
import { ReportingView } from './components/ReportingView';
import { TestSuiteView } from './components/TestSuiteView';
import { DisciplineMetric, SystemConfig, AcademicCourse, FormulaWeights } from './types';
import { INITIAL_DISCIPLINES, INITIAL_SYSTEM_CONFIG } from './data/mockAcademicData';
import { exportAnalyticalWorkbook, exportPowerPointDeck } from './utils/calculations';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Disciplines state (populated with authentic Pulso Acadêmico IMPAR data)
  const [disciplines, setDisciplines] = useState<DisciplineMetric[]>(() => {
    try {
      const saved = localStorage.getItem('pulso_disciplines_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(d => d.code === 'TMS0024')) {
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    return INITIAL_DISCIPLINES;
  });

  // Config state
  const [config, setConfig] = useState<SystemConfig>(() => {
    try {
      const saved = localStorage.getItem('pulso_config_v3');
      if (saved) {
        const parsed: SystemConfig = JSON.parse(saved);
        if (!parsed.biConnections.some(c => c.reportUrl.includes('f97e7c8e'))) {
          parsed.biConnections = INITIAL_SYSTEM_CONFIG.biConnections;
        }
        return parsed;
      }
    } catch (e) {
      // fallback
    }
    return INITIAL_SYSTEM_CONFIG;
  });

  // Filters passed from Dashboard into Audit grid
  const [auditCourseFilter, setAuditCourseFilter] = useState<AcademicCourse | null>(null);
  const [auditRiskOnly, setAuditRiskOnly] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('pulso_disciplines_v4', JSON.stringify(disciplines));
    } catch (e) {}
  }, [disciplines]);

  useEffect(() => {
    try {
      localStorage.setItem('pulso_config_v3', JSON.stringify(config));
    } catch (e) {}
  }, [config]);

  // Handlers
  const handleAddDisciplines = (newItems: DisciplineMetric[]) => {
    setDisciplines((prev) => {
      const prevFiltered = prev.filter((p) => !newItems.some((n) => n.id === p.id));
      return [...newItems, ...prevFiltered];
    });
  };

  const handleRemoveDisciplinesBySource = (sourceIdentifier: string) => {
    setDisciplines((prev) =>
      prev.filter((d) => !d.sourceFileOrUrl.toLowerCase().includes(sourceIdentifier.toLowerCase()))
    );
  };

  const handleClearAllData = (clearSourcesAlso: boolean = false) => {
    setDisciplines([]);
    try {
      localStorage.removeItem('pulso_disciplines_v3');
      localStorage.removeItem('pulso_disciplines_v2');
      if (clearSourcesAlso) {
        setConfig((prev) => ({
          ...prev,
          biConnections: [],
        }));
        localStorage.removeItem('pulso_user_pdf_docs_v3');
      }
    } catch (e) {}
  };

  const handleUpdateDiscipline = (updated: DisciplineMetric) => {
    setDisciplines((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleBatchUpdateDisciplines = (updatedItems: DisciplineMetric[]) => {
    setDisciplines(updatedItems);
  };

  const handleUpdateWeights = (newWeights: FormulaWeights) => {
    setConfig((prev) => ({
      ...prev,
      weights: newWeights,
    }));
  };

  const handleNavigateToAudit = (filter?: { course?: AcademicCourse; riskOnly?: boolean }) => {
    if (filter?.course) {
      setAuditCourseFilter(filter.course);
    } else {
      setAuditCourseFilter(null);
    }
    setAuditRiskOnly(Boolean(filter?.riskOnly));
    setActiveTab('audit');
  };

  const handleQuickExportExcel = () => {
    exportAnalyticalWorkbook(disciplines, config);
  };

  const handleQuickExportPPTX = async () => {
    await exportPowerPointDeck(disciplines, config);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Bar with Brand, Nav Links and Coordinator Action Profile */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickExportExcel={handleQuickExportExcel}
        onQuickExportPPTX={handleQuickExportPPTX}
        coordinatorName={config.coordinatorName}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            disciplines={disciplines}
            config={config}
            onNavigateToAudit={handleNavigateToAudit}
            onNavigateToSources={() => setActiveTab('sources')}
          />
        )}

        {activeTab === 'sources' && (
          <IngestionView
            disciplines={disciplines}
            onAddDisciplines={handleAddDisciplines}
            onRemoveDisciplinesBySource={handleRemoveDisciplinesBySource}
            onClearAllData={handleClearAllData}
            config={config}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'audit' && (
          <AuditGridView
            disciplines={disciplines}
            onUpdateDiscipline={handleUpdateDiscipline}
            onBatchUpdateDisciplines={handleBatchUpdateDisciplines}
            onClearAllData={handleClearAllData}
            weights={config.weights}
            initialCourseFilter={auditCourseFilter}
            initialRiskOnly={auditRiskOnly}
          />
        )}

        {activeTab === 'formulas' && (
          <FormulaEngineView
            weights={config.weights}
            onUpdateWeights={handleUpdateWeights}
            disciplines={disciplines}
            onBatchUpdateDisciplines={handleBatchUpdateDisciplines}
          />
        )}

        {activeTab === 'reporting' && (
          <ReportingView
            disciplines={disciplines}
            config={config}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'tests' && (
          <TestSuiteView weights={config.weights} />
        )}
      </main>

      {/* Executive Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Pulso Acadêmico</span>
            <span aria-hidden="true">·</span>
            <span>Inteligência & Governança Educacional em TI</span>
            <span aria-hidden="true">·</span>
            <span>{config.institutionName}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Período {config.academicPeriod}</span>
            <span aria-hidden="true">·</span>
            <span>Coordenação: {config.coordinatorName}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
