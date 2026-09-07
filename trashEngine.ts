import { TrashedItemRecord, DataSourceItem, UploadedFileRecord } from '../types';

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface TrashRetentionInfo {
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  isExpired: boolean;
  formattedRemaining: string;
}

/**
 * Calculates countdown and 7-day retention metrics
 */
export function calculateRetentionCountdown(trashedAtIso: string, expiresAtIso?: string): TrashRetentionInfo {
  const trashedDate = new Date(trashedAtIso).getTime();
  const expireDate = expiresAtIso ? new Date(expiresAtIso).getTime() : trashedDate + SEVEN_DAYS_MS;
  const now = Date.now();
  const diffMs = expireDate - now;

  if (diffMs <= 0) {
    return {
      daysLeft: 0,
      hoursLeft: 0,
      minutesLeft: 0,
      isExpired: true,
      formattedRemaining: 'หมดอายุแล้ว (พร้อมลบถาวร)',
    };
  }

  const daysLeft = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutesLeft = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

  let formatted = '';
  if (daysLeft > 0) {
    formatted = `เหลืออีก ${daysLeft} วัน ${hoursLeft} ชม.`;
  } else if (hoursLeft > 0) {
    formatted = `เหลืออีก ${hoursLeft} ชม. ${minutesLeft} นาที`;
  } else {
    formatted = `เหลืออีก ${minutesLeft} นาที`;
  }

  return {
    daysLeft,
    hoursLeft,
    minutesLeft,
    isExpired: false,
    formattedRemaining: formatted,
  };
}

/**
 * Create a new trashed item record with 7-day retention expiry
 */
export function createTrashedRecord(
  item: DataSourceItem | UploadedFileRecord,
  trashedByName: string,
  trashedByEmail?: string
): TrashedItemRecord {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SEVEN_DAYS_MS);

  const isDataSource = 'incidents' in item;
  const filename = isDataSource ? (item as DataSourceItem).name : (item as UploadedFileRecord).filename;
  const departmentKey = isDataSource
    ? (item as DataSourceItem).departmentKey
    : (item as UploadedFileRecord).department;

  const rowCount = isDataSource
    ? (item as DataSourceItem).rowCount
    : typeof (item as UploadedFileRecord).records === 'number'
    ? ((item as UploadedFileRecord).records as number)
    : 45;

  return {
    id: `trash-${item.id}-${Date.now()}`,
    sourceId: item.id,
    name: filename,
    filename,
    type: isDataSource ? (item as DataSourceItem).type : 'file',
    originalDepartmentKey: departmentKey,
    trashedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    trashedBy: trashedByName,
    trashedByEmail,
    rowCount,
    originalItem: item,
  };
}

/**
 * Create a new trashed incident record with 7-day retention expiry
 */
export function createTrashedIncidentRecord(
  incident: any,
  trashedByName: string,
  trashedByEmail?: string
): TrashedItemRecord {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SEVEN_DAYS_MS);

  return {
    id: `trash-inc-${incident.id}-${Date.now()}`,
    sourceId: incident.source || incident.id,
    incidentId: incident.id,
    name: incident.title,
    filename: `${incident.incidentId || incident.id}: ${incident.title}`,
    type: 'risk_incident',
    originalDepartmentKey: incident.departmentKey || 'central',
    trashedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    trashedBy: trashedByName,
    trashedByEmail,
    rowCount: 1,
    originalItem: incident,
  };
}

/**
 * Filter out any trashed items from active datasets
 * [CRITICAL EXCLUSION LOGIC]: Trashed items MUST NOT be included in AI processing or statistics calculation!
 */
export function filterOutTrashedItems<T extends { id: string }>(
  items: T[],
  trashedIds: Set<string> | string[]
): T[] {
  const trashedSet = Array.isArray(trashedIds) ? new Set(trashedIds) : trashedIds;
  return items.filter((item) => !trashedSet.has(item.id));
}

/**
 * Seed initial sample trashed items to allow testing 7-day retention immediately
 */
export const INITIAL_TRASHED_ITEMS: TrashedItemRecord[] = [
  {
    id: 'trash-sample-1',
    sourceId: 'src-old-draft-logs',
    filename: 'Draft_Specimen_Rejection_Log_Nov.xlsx',
    name: 'Draft_Specimen_Rejection_Log_Nov.xlsx',
    type: 'file_excel',
    originalDepartmentKey: 'outpatient',
    trashedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days left
    trashedBy: 'ธนพร สิทธิกรพันธุ์ฤทธิ์ (Super Admin)',
    trashedByEmail: 'sithikorn247@gmail.com',
    rowCount: 32,
    originalItem: {
      id: 'src-old-draft-logs',
      filename: 'Draft_Specimen_Rejection_Log_Nov.xlsx',
      uploadDate: '2 วันที่แล้ว',
      records: 32,
      status: 'Processed',
      department: 'Outpatient Lab',
      fileSize: '412 KB',
      ownerId: 'usr-super-owner',
      ownerName: 'ธนพร สิทธิกรพันธุ์ฤทธิ์',
      ownerEmail: 'sithikorn247@gmail.com',
      ownerRole: 'Super Admin',
    },
  },
  {
    id: 'trash-sample-2',
    sourceId: 'src-temp-link',
    filename: 'Google Sheet - สถิติทดสอบชั่วคราว OPD Rejection Tab',
    name: 'Google Sheet - สถิติทดสอบชั่วคราว OPD Rejection Tab',
    type: 'google_sheet',
    originalDepartmentKey: 'central',
    trashedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days left
    trashedBy: 'ธนพร สิทธิกรพันธุ์ฤทธิ์ (Super Admin)',
    trashedByEmail: 'sithikorn247@gmail.com',
    rowCount: 18,
    originalItem: {
      id: 'src-temp-link',
      name: 'Google Sheet - สถิติทดสอบชั่วคราว OPD Rejection Tab',
      type: 'google_sheet',
      departmentKey: 'central',
      uploadedAt: '4 วันที่แล้ว',
      status: 'active',
      rowCount: 18,
      specimenCount: 1200,
      rejectedCount: 12,
      rejectionRate: 1.0,
      incidents: [],
    },
  },
];
