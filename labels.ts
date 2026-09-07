import { RiskLevel, RiskStage, UserRole, UserStatus } from '../types';

/**
 * Central place for Thai display labels. The underlying data values (in
 * Firestore, in filters/comparisons throughout the app) stay in English —
 * changing those would be a much riskier refactor touching every filter,
 * sort, and stat calculation in the codebase. These functions only affect
 * what text is shown on screen; always call the matching translate*()
 * function wherever one of these values would otherwise be rendered raw
 * (e.g. `{incident.riskLevel}` -> `{translateRiskLevel(incident.riskLevel)}`).
 */

export function translateRiskLevel(level?: RiskLevel | string): string {
  const map: Record<string, string> = {
    Critical: 'วิกฤต',
    'High Risk': 'ความเสี่ยงสูง',
    Moderate: 'ปานกลาง',
    'Low Risk': 'ความเสี่ยงต่ำ',
    Minor: 'เล็กน้อย',
  };
  return (level && map[level]) || level || 'ไม่ระบุ';
}

export function translateStage(stage?: RiskStage | string): string {
  const map: Record<string, string> = {
    'Pre-analytical': 'ก่อนการตรวจวิเคราะห์',
    Analytical: 'ระหว่างการตรวจวิเคราะห์',
    'Post-analytical': 'หลังการตรวจวิเคราะห์',
    'General/Storage': 'ทั่วไป/คลังพัสดุ',
    'Safety/Environment': 'ความปลอดภัย/สิ่งแวดล้อม',
  };
  return (stage && map[stage]) || stage || 'ไม่ระบุ';
}

export function translateStatus(status?: string): string {
  const map: Record<string, string> = {
    Pending: 'รอดำเนินการ',
    Investigating: 'กำลังตรวจสอบ',
    'Under Investigation': 'อยู่ระหว่างตรวจสอบ',
    'Action Required': 'ต้องดำเนินการแก้ไข',
    'Corrective Action Implemented': 'ดำเนินการแก้ไขแล้ว',
    'Verified Effective': 'ยืนยันได้ผลแล้ว (ปิดเคส)',
    Resolved: 'แก้ไขเรียบร้อย',
    Closed: 'ปิดเรื่อง',
  };
  return (status && map[status]) || status || 'ไม่ระบุ';
}

export function translateRole(role?: UserRole | string): string {
  const map: Record<string, string> = {
    'Super Admin': 'ผู้ดูแลระบบสูงสุด',
    Administrator: 'ผู้ดูแลระบบ',
    'Medical Technologist': 'นักเทคนิคการแพทย์',
    'Lab Staff': 'เจ้าหน้าที่ห้องปฏิบัติการ',
    'QA Officer': 'เจ้าหน้าที่ควบคุมคุณภาพ',
    User: 'ผู้ใช้งานทั่วไป',
    'General User': 'ผู้ใช้งานทั่วไป',
  };
  return (role && map[role]) || role || 'ไม่ระบุ';
}

export function translateUserStatus(status?: UserStatus | string): string {
  const map: Record<string, string> = {
    Active: 'ใช้งานอยู่',
    'Pending Approval': 'รออนุมัติ',
    Inactive: 'ระงับการใช้งาน',
  };
  return (status && map[status]) || status || 'ไม่ระบุ';
}

export function translateRcaMethod(method?: string): string {
  const map: Record<string, string> = {
    '5-Why': 'วิเคราะห์ 5 ทำไม (5-Why)',
    Fishbone: 'แผนผังก้างปลา (Fishbone/Ishikawa)',
    Other: 'อื่นๆ',
  };
  return (method && map[method]) || method || 'ไม่ระบุ';
}

export function translateFileStatus(status?: string): string {
  const map: Record<string, string> = {
    Pending: 'รอดำเนินการ',
    Processing: 'กำลังประมวลผล',
    Completed: 'เสร็จสมบูรณ์',
    Error: 'เกิดข้อผิดพลาด',
    Processed: 'ประมวลผลแล้ว',
    'Format Error': 'รูปแบบไฟล์ผิดพลาด',
  };
  return (status && map[status]) || status || 'ไม่ระบุ';
}

export function translateDataSourceStatus(status?: string): string {
  const map: Record<string, string> = {
    active: 'ใช้งานอยู่',
    syncing: 'กำลังซิงค์ข้อมูล',
    error: 'เกิดข้อผิดพลาด',
    disabled: 'ปิดใช้งาน',
  };
  return (status && map[status]) || status || 'ไม่ระบุ';
}
