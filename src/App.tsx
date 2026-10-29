import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { IngestionView } from './components/IngestionView';
import { AuditGridView } from './components/AuditGridView';
import { FormulaEngineView } from './components/FormulaEngineView';
import { ReportingView } from './components/ReportingView';
import { TestSuiteView } from './components/TestSuiteView';
import { DisciplineMetric, SystemConfig, AcademicCourse, FormulaWeights, ImportSession } from './types';
import { INITIAL_SYSTEM_CONFIG } from './data/mockAcademicData';
import { exportAnalyticalWorkbook, exportPowerPointDeck } from './utils/calculations';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Active Import Session (Unique identifier and metadata of the currently imported dataset)
  const [activeSession, setActiveSession] = useState<ImportSession | null>(() => {
    try {
      const saved = localStorage.getItem('pulso_active_session_v6');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Disciplines state (default is [] zerado, as requested: "Zerar os valores como default")
  const [disciplines, setDisciplines] = useState<DisciplineMetric[]>(() => {
    try {
      const saved = localStorage.getItem('pulso_disciplines_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  // Config state (Persistência Avançada de Configurações & Metadados)
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

  // Sync state to local storage (single source of truth under v6)
  useEffect(() => {
    try {
      if (disciplines.length > 0) {
        localStorage.setItem('pulso_disciplines_v6', JSON.stringify(disciplines));
      } else {
        localStorage.removeItem('pulso_disciplines_v6');
      }
    } catch (e) {}
  }, [disciplines]);

  useEffect(() => {
    try {
      if (activeSession) {
        localStorage.setItem('pulso_active_session_v6', JSON.stringify(activeSession));
      } else {
        localStorage.removeItem('pulso_active_session_v6');
      }
    } catch (e) {}
  }, [activeSession]);

  useEffect(() => {
    try {
      localStorage.setItem('pulso_config_v3', JSON.stringify(config));
    } catch (e) {}
  }, [config]);

  // =========================================================================
  // CENTRAL ROUTINE: Replace Import Data Atomically
  // Replaces the entire imported dataset with zero leftovers from previous files.
  // =========================================================================
  const handleReplaceImportData = (newItems: DisciplineMetric[], sessionMeta: ImportSession) => {
    // 1. Tag all new items with the new unique importId and timestamp
    const taggedItems = newItems.map((item) => ({
      ...item,
      importId: sessionMeta.importId,
      lastUpdated: sessionMeta.importedAt,
    }));

    // 2. Atomically replace disciplines state (NEVER merge, concat or append)
    setDisciplines(taggedItems);
    setActiveSession(sessionMeta);

    // 3. Reset any temporary derived filters
    setAuditCourseFilter(null);
    setAuditRiskOnly(false);

    // 4. Update the single source of truth in local storage
    try {
      localStorage.setItem('pulso_disciplines_v6', JSON.stringify(taggedItems));
      localStorage.setItem('pulso_active_session_v6', JSON.stringify(sessionMeta));
      localStorage.setItem('pulso_user_pdf_docs_v6', JSON.stringify([
        {
          fileName: sessionMeta.fileName,
          description: `Relatório Ativo · ${sessionMeta.campus} (${sessionMeta.studyTimeFormatted} estudo, ${sessionMeta.attendanceRate.toFixed(2).replace('.', ',')}% freq)`,
          recordCount: sessionMeta.totalRecords,
          fileSize: sessionMeta.fileSize || '245 KB',
          uploadedDate: new Date().toISOString().slice(0, 10),
        }
      ]));
      // Clean legacy caches to prevent cross-file contamination
      localStorage.removeItem('pulso_disciplines_v5');
      localStorage.removeItem('pulso_disciplines_v4');
      localStorage.removeItem('pulso_disciplines_v3');
      localStorage.removeItem('pulso_disciplines_v2');
      localStorage.removeItem('pulso_user_pdf_docs_v5');
      localStorage.removeItem('pulso_user_pdf_docs_v4');
    } catch (e) {}
  };

  // =========================================================================
  // CENTRAL ROUTINE: Clear All Imported Data Atomically
  // Wipes all imported data and derived metrics, while preserving config & metadata.
  // =========================================================================
  const handleClearAllImportedData = () => {
    setDisciplines([]);
    setActiveSession(null);
    setAuditCourseFilter(null);
    setAuditRiskOnly(false);

    try {
      localStorage.removeItem('pulso_disciplines_v6');
      localStorage.removeItem('pulso_active_session_v6');
      localStorage.setItem('pulso_user_pdf_docs_v6', JSON.stringify([]));
      // Remove all legacy keys
      localStorage.removeItem('pulso_disciplines_v5');
      localStorage.removeItem('pulso_disciplines_v4');
      localStorage.removeItem('pulso_disciplines_v3');
      localStorage.removeItem('pulso_disciplines_v2');
      localStorage.removeItem('pulso_user_pdf_docs_v5');
      localStorage.removeItem('pulso_user_pdf_docs_v4');
    } catch (e) {}
    // CONFIGURATION (pulso_config_v3) IS PRESERVED INTACT!
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
            activeSession={activeSession}
            config={config}
            onNavigateToAudit={handleNavigateToAudit}
            onNavigateToSources={() => setActiveTab('sources')}
          />
        )}

        {activeTab === 'sources' && (
          <IngestionView
            disciplines={disciplines}
            activeSession={activeSession}
            onReplaceImportData={handleReplaceImportData}
            onClearAllImportedData={handleClearAllImportedData}
            config={config}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'audit' && (
          <AuditGridView
            disciplines={disciplines}
            onUpdateDiscipline={handleUpdateDiscipline}
            onBatchUpdateDisciplines={handleBatchUpdateDisciplines}
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
            activeSession={activeSession}
            onNavigateToSources={() => setActiveTab('ingestion')}
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
