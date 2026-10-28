export type AcademicCourse = 
  | 'Ciência da Computação'
  | 'Engenharia de Software'
  | 'Análise e Desenv. de Sistemas'
  | 'Sistemas de Informação'
  | 'Segurança da Informação';

export type LHIStatus = 'Excelente' | 'Saudável' | 'Alerta' | 'Crítico';
export type ARSLevel = 'Baixo' | 'Moderado' | 'Alto' | 'Crítico';

export interface DisciplineMetric {
  id: string;
  code: string;
  name: string;
  course: AcademicCourse;
  semester: number; // 1 to 8/10
  shift: 'Matutino' | 'Noturno' | 'Integral';
  classCode: string; // e.g. "CC-3A-N"
  professor: string;
  totalStudents: number;
  
  // Critical Educational Indicators (RF02)
  learningScore: number;     // Grau de Aprendizagem (0 - 100%)
  failureRate: number;       // Taxa de Reprovação (0 - 100%)
  dropoutRiskRate: number;   // Taxa de Evasão / Risco de Desistência (0 - 100%)
  studyHoursPerWeek: number; // Tempo Médio de Estudo / Dedicação (horas/sem)
  attendanceRate: number;    // Frequência Média (0 - 100%)
  lmsAdherenceRate: number;  // Taxa de Adesão às Plataformas LMS (0 - 100%)
  
  // YDUQS Pulso Acadêmico specific metrics
  studyTimeFormatted?: string;       // e.g. "9:39"
  previousYearStudents?: number;     // Total de Alunos (A.A)
  previousYearStudyTime?: string;    // Tempo de Estudo (A.A) e.g. "0:50 A.A"
  adhesionAV?: number;               // Adesão AV %
  adhesionSM?: number;               // Adesão SM %
  campus?: string;                   // Campus Polo e.g. "TOM JOBIM"
  regional?: string;                 // Regional e.g. "UNESA"
  
  // Composite Calculated Indices (RF03)
  lhi: number; // Learning Health Index (0 - 100)
  ars: number; // Academic Risk Score (0 - 100)
  lhiStatus: LHIStatus;
  arsLevel: ARSLevel;
  
  // Audit Trail & Governance (RF04)
  sourceType: 'Power BI HTTPS' | 'Relatório PDF Local' | 'Ajuste Manual';
  sourceFileOrUrl: string;
  lastUpdated: string;
  isManuallyAdjusted?: boolean;
  auditNote?: string;
  recommendedAction?: string;
}

export interface PulsoExecutiveSummary {
  learningScore: number;
  learningScorePreviousYear: number;
  learningScoreTarget: number;
  failureRate: number;
  failureRatePreviousYear: number;
  failureRateTarget: number;
  studyTimeFormatted: string;
  studyTimePreviousYear: string;
  studyTimeTarget: string;
  adhesionAV: number;
  adhesionAVPreviousYear: number;
  adhesionAVTarget: number;
  adhesionSM: number;
  adhesionSMPreviousYear: number;
  adhesionSMTarget: number;
  attendanceRate: number;
  attendanceRatePreviousYear: number;
  attendanceRateTarget: number;
  brand: string;
  groupBrand: string;
  regional: string;
  campus: string;
  course: string;
  operationType: string;
  poloType: string;
  entryYear: string;
}

export interface FormulaWeights {
  lhi: {
    learningScore: number;  // Default 0.35
    attendance: number;     // Default 0.25
    passRate: number;       // Default 0.20 (100 - failureRate)
    lmsAdherence: number;   // Default 0.20
  };
  ars: {
    failureRate: number;    // Default 0.40
    infrequency: number;    // Default 0.30 (100 - attendance)
    learningDeficit: number;// Default 0.20 (100 - learningScore)
    dropoutRisk: number;    // Default 0.10
  };
}

export interface IngestionLog {
  id: string;
  timestamp: string;
  type: 'PDF' | 'POWER_BI' | 'CALC' | 'AUDIT';
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface PowerBIConnectionConfig {
  reportUrl: string;
  workspaceName: string;
  datasetId: string;
  authProtocol: 'OAuth 2.0 / HTTPS' | 'Service Principal' | 'Web Feed Direct';
  autoSyncMinutes: number;
  lastSyncTimestamp: string | null;
  status: 'Conectado' | 'Desconectado' | 'Sincronizando' | 'Erro de Conexão';
  tenantId?: string;
  appId?: string;
  reportObjectId?: string;
  reportPage?: string;
  sessionId?: string;
}

export interface SystemConfig {
  institutionName: string;
  academicPeriod: string;
  coordinatorName: string;
  coordinatorEmail: string;
  exportFormatPreference: 'xlsx' | 'pptx' | 'both';
  biConnections: PowerBIConnectionConfig[];
  weights: FormulaWeights;
  lastBackupDate: string;
}

export interface TestSuiteResult {
  id: string;
  testName: string;
  module: string;
  status: 'passed' | 'failed';
  executionTimeMs: number;
  assertionDescription: string;
}
