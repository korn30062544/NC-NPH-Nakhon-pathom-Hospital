import { DataSourceItem, DepartmentKey, UploadedFileRecord, User } from '../types';
import { parseCSVData, parseExcelData, parseJSONData } from './multiSourceDataEngine';

const deptMap: Record<string, DepartmentKey> = {
  'Central Lab': 'central',
  'Blood Bank': 'blood',
  'Molecular Biology': 'molecular',
  'Outpatient Lab': 'outpatient',
  'Clinical Microbiology': 'microbiology',
  'Molecular Science': 'molecular_science',
  'Science Material Store': 'material_store',
  'All Departments': 'all',
};

export async function ingestUploadedFile(file: File, department: string, user: User): Promise<{ fileRecord: UploadedFileRecord; source: DataSourceItem }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const sourceId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const deptKey = deptMap[department] || 'central';
  let parsed: { incidents: any[]; totalSpecimens: number; rejectedCount: number };
  let type: DataSourceItem['type'];

  if (ext === 'csv' || ext === 'txt') {
    parsed = parseCSVData(await file.text(), sourceId, deptKey);
    type = 'file_csv';
  } else if (ext === 'xlsx' || ext === 'xls') {
    parsed = parseExcelData(await file.arrayBuffer(), sourceId, deptKey);
    type = 'file_excel';
  } else if (ext === 'json') {
    parsed = parseJSONData(await file.text(), sourceId, deptKey);
    type = 'file_json';
  } else if (ext === 'pdf') {
    throw new Error('PDF ยังไม่รองรับการสกัดข้อมูลแบบเชื่อถือได้ในเวอร์ชันนี้ กรุณาใช้ CSV/XLSX/XLS/JSON เพื่อป้องกันการสร้างข้อมูลผิด');
  } else {
    throw new Error(`ไม่รองรับไฟล์ .${ext || 'unknown'}`);
  }

  const now = new Date();
  const uploadedAt = now.toLocaleString('th-TH');
  const rejectionRate = parsed.totalSpecimens > 0 ? Number(((parsed.rejectedCount / parsed.totalSpecimens) * 100).toFixed(2)) : 0;
  const source: DataSourceItem = {
    id: sourceId,
    name: file.name,
    type,
    departmentKey: deptKey,
    uploadedAt,
    lastSyncedAt: uploadedAt,
    status: 'active',
    rowCount: parsed.incidents.length,
    specimenCount: parsed.totalSpecimens,
    rejectedCount: parsed.rejectedCount,
    rejectionRate,
    incidents: parsed.incidents,
    filename: file.name,
    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
  };

  const criticalCount = parsed.incidents.filter((i) => i.riskLevel === 'Critical').length;
  const moderateCount = parsed.incidents.filter((i) => i.riskLevel === 'Moderate' || i.riskLevel === 'High Risk').length;
  const lowCount = parsed.incidents.filter((i) => i.riskLevel === 'Low Risk').length;
  const categoryCounts = parsed.incidents.reduce<Record<string, number>>((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {});
  const topCategory = Object.entries(categoryCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'ไม่พบข้อมูล';

  const fileRecord: UploadedFileRecord = {
    id: sourceId,
    filename: file.name,
    uploadDate: uploadedAt,
    records: parsed.incidents.length,
    status: 'Completed',
    department,
    fileSize: source.fileSize,
    ownerId: user.id,
    ownerName: user.name,
    ownerEmail: user.email,
    ownerRole: user.role,
    processingStatus: 'Completed',
    processingProgress: 100,
    processingStage: 'อ่านข้อมูลจริงจากไฟล์เสร็จสมบูรณ์',
    aiIngested: false,
    extractedIncidentsCount: parsed.incidents.length,
    rejectionCount: parsed.rejectedCount,
    rejectionRate,
    parsedSummary: { totalRows: parsed.incidents.length, criticalCount, moderateCount, lowCount, topCategory, rejectionRate },
    logs: [{ timestamp: now.toLocaleTimeString('th-TH'), stage: 'Parse', message: `อ่านข้อมูลจริง ${parsed.incidents.length} แถวจาก ${file.name} สำเร็จ (ไม่สร้างตัวเลขจำลอง)`, type: 'success' }],
  };
  return { fileRecord, source };
}
