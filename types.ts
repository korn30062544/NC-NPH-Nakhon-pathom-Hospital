export type UserRole = 'Super Admin' | 'Administrator' | 'Medical Technologist' | 'Lab Staff' | 'QA Officer' | 'User';

export type UserTier = 'super_admin' | 'admin' | 'user';

export type UserStatus = 'Active' | 'Pending Approval' | 'Inactive';

export type DepartmentKey =
  | 'all'
  | 'central'
  | 'blood_bank'
  | 'microbiology'
  | 'molecular'
  | 'molecular_bio'
  | 'outpatient'
  | 'material_store'
  | 'data_upload'
  | 'settings'
  | 'google_sync'
  | 'sources'
  | 'files'
  | string;

export type TopNavTab =
  | 'overview'
  | 'data_upload'
  | 'google_sync'
  | 'sources'
  | 'files'
  | 'settings'
  | 'reports'
  | 'notifications'
  | 'nc_trends'
  | 'rejected_specimens'
  | 'error_rates'
  | string;

export type RiskLevel = 'Minor' | 'Moderate' | 'High Risk' | 'Critical' | 'Low Risk';

export type RiskStage =
  | 'Pre-analytical'
  | 'Analytical'
  | 'Post-analytical'
  | 'General/Storage'
  | 'Safety/Environment'
  | string;

export type SeverityMatrixLevel =
  | 'Level A'
  | 'Level B'
  | 'Level C'
  | 'Level D'
  | 'Level E'
  | 'Level F'
  | 'Level G'
  | 'Level H'
  | 'Level I'
  | string;

export interface CustomDepartment {
  key: string;
  name?: string;
  nameEn?: string;
  nameTh?: string;
  icon?: string;
  color?: string;
  badgeColor?: string;
  isCustom?: boolean;
  order?: number;
  isDefault?: boolean;
}

export interface RiskIncident {
  id: string;
  incidentId: string;
  title: string;
  department: string;
  departmentKey?: DepartmentKey;
  date: string;
  time?: string;
  year?: number;
  stage: RiskStage;
  riskLevel: RiskLevel;
  severityMatrix?: SeverityMatrixLevel;
  harmLevel?: string;
  specimen?: string;
  specimenType?: string;
  patientHn?: string;
  labNumber?: string;
  location?: string;
  type: string;
  description: string;
  impact?: string;
  reportedBy: string;
  reporterRole?: string;
  reporterPosition?: string;
  reporterContact?: string;
  // ISO 15189 nonconformity lifecycle: Reported -> Under Investigation ->
  // Action Required -> Corrective Action Implemented -> Verified Effective
  // (closed). 'Resolved'/'Closed' kept for backward compatibility with
  // existing data/mock records.
  status:
    | 'Pending'
    | 'Investigating'
    | 'Resolved'
    | 'Closed'
    | 'Under Investigation'
    | 'Action Required'
    | 'Corrective Action Implemented'
    | 'Verified Effective'
    | string;
  immediateAction?: string;
  rootCause?: string;
  rootCauseCategory?: string;
  // ISO 15189 root cause analysis method used (documents *how* the root
  // cause was determined, not just what it was).
  rcaMethod?: '5-Why' | 'Fishbone' | 'Other';
  // Corrective action = fixes THIS occurrence / the immediate defect.
  // Distinct from preventiveAction (stops the problem from recurring
  // system-wide) — ISO 15189 CAPA requires both to be tracked separately.
  correctiveAction?: string;
  correctiveActionPlan?: string;
  preventiveAction?: string;
  // Effectiveness verification: ISO 15189 requires confirming that a
  // corrective/preventive action actually worked before a nonconformity
  // can be considered closed — not just that an action was taken.
  effectivenessReview?: string;
  effectivenessVerifiedBy?: string;
  effectivenessVerifiedDate?: string;
  source?: string;
  sourceSheetId?: string;
  googleFormSourceUrl?: string;
  syncedToGoogleSheet?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: string;
  roleType: UserRole;
  tier?: UserTier;
  department: string;
  departmentKey: DepartmentKey;
  status: UserStatus;
  lastActive: string;
  email: string;
  employeeId: string;
  licenseNumber?: string; // เลขใบอนุญาตประกอบวิชาชีพ (เลข ทนพ.)
  position?: string; // ตำแหน่งหน้าที่
  password?: string; // รหัสผ่าน
  avatarText: string;
  avatarBg?: string;
  avatarUrl?: string;
  appointedBy?: string;
  appointedAt?: string;
  uploadedFilesCount?: number;
}

export const RBAC_LIMITS = {
  MAX_ADMINS: 8,
  MAX_USERS: 500,
} as const;

export type FileProcessingStatus = 'Pending' | 'Processing' | 'Completed' | 'Error';

export interface FileProcessingLog {
  timestamp: string;
  stage: string;
  message: string;
  type?: 'info' | 'success' | 'warn' | 'error';
}

export interface UploadedFileRecord {
  id: string;
  filename: string;
  uploadDate: string;
  records: number | string;
  status: 'Processed' | 'Processing' | 'Format Error' | 'Pending' | 'Completed' | string;
  department: string;
  fileSize?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerRole?: string;
  processingStatus?: FileProcessingStatus;
  processingProgress?: number;
  processingStage?: string;
  logs?: FileProcessingLog[];
  aiIngested?: boolean;
  aiContextSnippet?: string;
  extractedIncidentsCount?: number;
  rejectionCount?: number;
  rejectionRate?: number;
  parsedSummary?: {
    totalRows: number;
    criticalCount: number;
    moderateCount: number;
    lowCount: number;
    topCategory: string;
    rejectionRate?: number;
  };
}

export interface RejectionReasonStat {
  reason: string;
  reasonTh: string;
  count: number;
  percentageOfRejections: number;
}

export interface YearlyLabRiskData {
  year: number;
  totalIncidents: number;
  totalSpecimens: number;
  rejectedSpecimens: number;
  rejectionRate: number; // percentage
  wrongBloodDispenseCases?: number; // For Blood Bank
  categoryBreakdown: {
    category: string;
    categoryTh: string;
    count: number;
  }[];
  rejectionReasons?: RejectionReasonStat[];
}

export interface Department5YearStats {
  deptKey: DepartmentKey;
  deptName: string;
  deptThName: string;
  yearlyData: YearlyLabRiskData[];
  overallTrendPercent: number; // e.g. -24.5% (improved) or +12.3%
  trendDirection: 'increased' | 'decreased' | 'stable';
  mtSummary: string;
  keyCategories: string[];
}

export interface GoogleSyncConfig {
  sheetUrl?: string;
  sheetId?: string;
  sheetName?: string;
  formUrl: string;
  formEmbedUrl?: string;
  sheetsUrl?: string;
  autoSync?: boolean;
  autoSyncEnabled?: boolean;
  syncIntervalSec?: number;
  autoSyncIntervalMinutes?: number;
  lastSyncTime?: string;
  lastSyncedAt?: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'idle' | 'connected';
  totalSyncedRows?: number;
  sheets?: GoogleSheetResource[];
  forms?: GoogleFormResource[];
  sheetsList?: GoogleSheetResource[];
  formsList?: GoogleFormResource[];
}

export interface GoogleSheetResource {
  id: string;
  title: string;
  type?: 'sheet';
  url: string;
  departmentKey: string;
  sheetTabName?: string;
  autoSync: boolean;
  lastSyncTime?: string;
  rowCount?: number;
  status: 'connected' | 'syncing' | 'error' | 'idle' | 'pending';
  summaryMetrics?: {
    totalIncidents: number;
    totalSpecimens: number;
    rejectedCount: number;
    rejectionRate: number;
    criticalCount: number;
    highRiskCount: number;
    categories?: { name: string; count: number }[];
    monthlyTrend?: { month: string; count: number }[];
  };
  parsedIncidents?: RiskIncident[];
  errorMessage?: string;
}

export interface GoogleFormResource {
  id: string;
  title: string;
  type?: 'form';
  url: string;
  embedUrl?: string;
  departmentKey: string;
  description?: string;
  linkedSheetId?: string;
  lastUsedTime?: string;
}

export type DataSourceType = 'file_csv' | 'file_excel' | 'file_json' | 'google_sheet' | 'google_form';

export interface DataSourceItem {
  id: string;
  name: string;
  type: DataSourceType;
  departmentKey: string;
  url?: string;
  sheetTabName?: string;
  filename?: string;
  fileSize?: string;
  uploadedAt: string;
  lastSyncedAt?: string;
  status: 'active' | 'syncing' | 'error' | 'disabled';
  rowCount: number;
  specimenCount?: number;
  rejectedCount?: number;
  rejectionRate?: number;
  incidents: RiskIncident[];
  errorMessage?: string;
  autoSync?: boolean;
}

export interface TrashedItemRecord {
  id: string;
  sourceId?: string;
  incidentId?: string;
  filename: string;
  name: string;
  type: DataSourceType | 'file' | 'link' | 'risk_incident';
  originalDepartmentKey: string;
  trashedAt: string; // ISO string
  expiresAt: string; // ISO string (7 days from trashedAt)
  trashedBy: string;
  trashedByEmail?: string;
  rowCount: number;
  originalItem: DataSourceItem | UploadedFileRecord | RiskIncident;
}

export interface AISplitResult {
  originalFileName: string;
  totalRecords: number;
  splitDate: string;
  splits: {
    roomKey: string;
    roomNameTh: string;
    category: 'blood_bank' | 'central' | 'microbiology' | 'molecular' | 'outpatient' | 'material_store' | string;
    recordCount: number;
    specimenType: string;
    incidentsCount: number;
    destinationTarget: string;
  }[];
}

export interface GlobalSyncEvent {
  id: string;
  timestamp: string;
  type:
    | 'ADD'
    | 'MOVE'
    | 'TRASH'
    | 'RESTORE'
    | 'PERMANENT_DELETE'
    | 'BULK_ACTION'
    | 'BULK_TRASH'
    | 'MOVE_ROOM'
    | 'BULK_UPLOAD'
    | 'AI_SPLIT';
  message: string;
  affectedRooms: string[];
  recalculatedStats: {
    totalIncidents: number;
    totalSpecimens: number;
    totalRejected?: number;
    rejectionRate: number;
  };
}

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'radar';

export interface ChartWidgetConfig {
  id: string;
  title: string;
  titleTh?: string;
  type: ChartType;
  metricKey: 'incidents' | 'specimens' | 'rejected' | 'rejectionRate' | 'categories' | 'severity' | 'monthly' | 'reasons';
  departmentKey: string; // 'all' or specific dept
  columnWidth: 'full' | 'half' | 'third';
  isVisible: boolean;
  order: number;
  description?: string;
}

export interface AIDirective {
  action: 'FILTER_DEPARTMENT' | 'CHANGE_CHART_TYPE' | 'TOGGLE_YEAR' | 'FOCUS_CRITICAL' | 'RESET_FILTERS' | 'SWITCH_TAB';
  target?: string;
  value?: any;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  directive?: AIDirective;
  isAnalyzing?: boolean;
  analysisReport?: {
    executiveSummary: string;
    criticalAlerts: string[];
    trendAnalysis: string;
    departmentRankings: string[];
    capaRecommendations: string[];
  };
}
