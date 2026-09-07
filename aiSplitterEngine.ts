import { AISplitResult, DataSourceItem, RiskIncident } from '../types';

/**
 * Intelligent AI File Parsing & Multi-Room Routing Engine
 * Automatically analyzes ingested files, identifies multi-department contents,
 * splits them into distinct sub-datasets, and routes them to their respective rooms & categories.
 */
export function simulateAISplitAndRoute(
  filename: string,
  rawRowCount: number = 180
): {
  splitResult: AISplitResult;
  routedSources: DataSourceItem[];
} {
  const timestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const dateStr = new Date().toLocaleDateString('th-TH');

  // Compute proportioned record counts
  const bloodCount = Math.round(rawRowCount * 0.4);
  const centralCount = Math.round(rawRowCount * 0.45);
  const microCount = rawRowCount - bloodCount - centralCount;

  // Split partition 1: Blood Bank / บัตรแบงก์ / แบ็ก
  const bloodIncidents: RiskIncident[] = [
    {
      id: `inc-split-bb-${Date.now()}-1`,
      incidentId: `INC-BB-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'แจ้งเตือนระบบตรวจจับความไม่เข้ากันของหมู่เลือด ABO (Blood Bank Crossmatch Mismatch)',
      department: 'Blood Bank (ธนาคารเลือด)',
      departmentKey: 'blood',
      date: dateStr,
      time: timestamp,
      stage: 'Analytical',
      riskLevel: 'Critical',
      specimen: 'Crossmatch Packed Red Cells (PRC)',
      type: 'ความปลอดภัยธนาคารเลือด & บัตรแบงก์',
      description: 'ระบบ AI ตรวจพบการจับคู่สิ่งส่งตรวจข้ามชนิดในแฟ้มประวัติผู้ป่วย ผ่าตัดฉุกเฉิน ยับยั้งก่อนการจ่ายเลือด',
      reportedBy: 'AI Smart Parser (Auto-Routed)',
      status: 'Under Investigation',
      source: `AI Split จาก ${filename}`,
    },
    {
      id: `inc-split-bb-${Date.now()}-2`,
      incidentId: `INC-BB-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'อุณหภูมิตู้เก็บเกล็ดเลือด Platelet Agitator สูงกว่าเกณฑ์ 24.8°C',
      department: 'Blood Bank (ธนาคารเลือด)',
      departmentKey: 'blood',
      date: dateStr,
      time: timestamp,
      stage: 'General/Storage',
      riskLevel: 'Moderate',
      specimen: 'Single Donor Platelets (SDP)',
      type: 'การควบคุมอุณหภูมิคลังโลหิต',
      description: 'ตู้เก็บเกล็ดเลือดมีอุณหภูมิเกินเกณฑ์ ได้ทำการย้ายถุงเลือดสำรองเข้าตู้ฉุกเฉินเรียบร้อย',
      reportedBy: 'AI Smart Parser (Auto-Routed)',
      status: 'Resolved',
      source: `AI Split จาก ${filename}`,
    },
  ];

  // Split partition 2: Central Lab
  const centralIncidents: RiskIncident[] = [
    {
      id: `inc-split-cen-${Date.now()}-1`,
      incidentId: `INC-CEN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'สิ่งส่งตรวจเลือดผู้ป่วย ICU เกิดภาวะเม็ดเลือดแดงแตกตัวรุนแรง (Gross Hemolysis)',
      department: 'Central Lab',
      departmentKey: 'central',
      date: dateStr,
      time: timestamp,
      stage: 'Pre-analytical',
      riskLevel: 'Moderate',
      specimen: 'Clotted Blood / Serum',
      type: 'Specimen Rejection',
      description: 'พบภาวะ Hemolysis ระดับ 3+ ส่งผลต่อค่า Electrolytes K+ และ AST จึงปฏิเสธและขอเก็บใหม่',
      reportedBy: 'AI Smart Parser (Auto-Routed)',
      status: 'Action Required',
      source: `AI Split จาก ${filename}`,
    },
    {
      id: `inc-split-cen-${Date.now()}-2`,
      incidentId: `INC-CEN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'ฉลากบาร์โค้ดสิ่งส่งตรวจยับและเปียกชื้น เครื่อง Auto-Sorter อ่านค่าไม่ผ่าน',
      department: 'Central Lab',
      departmentKey: 'central',
      date: dateStr,
      time: timestamp,
      stage: 'Pre-analytical',
      riskLevel: 'Minor',
      specimen: 'EDTA Blood',
      type: 'Barcode & Identification',
      description: 'เจ้าหน้าที่จุดรับสิ่งส่งตรวจทำการพิมพ์ฉลากทดแทนและยืนยันข้อมูลผู้ป่วยเรียบร้อย',
      reportedBy: 'AI Smart Parser (Auto-Routed)',
      status: 'Resolved',
      source: `AI Split จาก ${filename}`,
    },
  ];

  // Split partition 3: Clinical Microbiology
  const microIncidents: RiskIncident[] = [
    {
      id: `inc-split-mic-${Date.now()}-1`,
      incidentId: `INC-MIC-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'พบการปนเปื้อนเชื้อประจำถิ่น Coagulase-negative Staphylococci ในขวด Blood Culture ขวดแรก',
      department: 'Clinical Microbiology',
      departmentKey: 'microbiology',
      date: dateStr,
      time: timestamp,
      stage: 'Analytical',
      riskLevel: 'Moderate',
      specimen: 'Blood Culture (Aerobic)',
      type: 'Contamination',
      description: 'ผลการเพาะเชื้อขวดแรกพบเชื้อปนเปื้อนผิวหนัง ขวดที่สองไม่พบเชื้อ แนะนำทบทวน Aseptic Technique หอผู้ป่วย',
      reportedBy: 'AI Smart Parser (Auto-Routed)',
      status: 'Under Investigation',
      source: `AI Split จาก ${filename}`,
    },
  ];

  const splitResult: AISplitResult = {
    originalFileName: filename,
    totalRecords: rawRowCount,
    splitDate: `${dateStr} ${timestamp}`,
    splits: [
      {
        roomKey: 'blood',
        roomNameTh: 'ห้องธนาคารเลือด (Blood Bank)',
        category: 'blood_bank',
        recordCount: bloodCount,
        specimenType: 'PRC / FFP / Platelets / ข้อมูลบัตรแบงก์',
        incidentsCount: bloodIncidents.length,
        destinationTarget: 'ห้องธนาคารเลือด & สถิติบัตรแบงก์/แบ็ก',
      },
      {
        roomKey: 'central',
        roomNameTh: 'ห้องปฏิบัติการกลาง (Central Lab)',
        category: 'central',
        recordCount: centralCount,
        specimenType: 'Clotted Blood / EDTA / Urine Chemistry',
        incidentsCount: centralIncidents.length,
        destinationTarget: 'ห้องปฏิบัติการกลาง & สถิติรวมห้องแล็บ',
      },
      {
        roomKey: 'microbiology',
        roomNameTh: 'ห้องจุลชีววิทยาคลินิก (Clinical Microbiology)',
        category: 'microbiology',
        recordCount: microCount,
        specimenType: 'Blood Culture / Sputum / Swab',
        incidentsCount: microIncidents.length,
        destinationTarget: 'ห้องจุลชีววิทยาคลินิก & สถิติส่วนตัว',
      },
    ],
  };

  const routedSources: DataSourceItem[] = [
    {
      id: `split-src-blood-${Date.now()}`,
      name: `[AI Split] ธนาคารเลือด - ${filename.replace(/\.[^/.]+$/, '')}`,
      type: 'file_csv',
      departmentKey: 'blood',
      uploadedAt: `วันนี้ ${timestamp}`,
      lastSyncedAt: `วันนี้ ${timestamp}`,
      status: 'active',
      rowCount: bloodCount,
      specimenCount: bloodCount * 80,
      rejectedCount: Math.round(bloodCount * 0.05),
      rejectionRate: 0.25,
      incidents: bloodIncidents,
      filename: `[AI_Part_1_BloodBank]_${filename}`,
      fileSize: `${Math.round(bloodCount * 0.8)} KB`,
    },
    {
      id: `split-src-central-${Date.now()}`,
      name: `[AI Split] Central Lab - ${filename.replace(/\.[^/.]+$/, '')}`,
      type: 'file_csv',
      departmentKey: 'central',
      uploadedAt: `วันนี้ ${timestamp}`,
      lastSyncedAt: `วันนี้ ${timestamp}`,
      status: 'active',
      rowCount: centralCount,
      specimenCount: centralCount * 140,
      rejectedCount: Math.round(centralCount * 0.08),
      rejectionRate: 0.32,
      incidents: centralIncidents,
      filename: `[AI_Part_2_CentralLab]_${filename}`,
      fileSize: `${Math.round(centralCount * 0.9)} KB`,
    },
    {
      id: `split-src-micro-${Date.now()}`,
      name: `[AI Split] Microbiology - ${filename.replace(/\.[^/.]+$/, '')}`,
      type: 'file_csv',
      departmentKey: 'microbiology',
      uploadedAt: `วันนี้ ${timestamp}`,
      lastSyncedAt: `วันนี้ ${timestamp}`,
      status: 'active',
      rowCount: microCount,
      specimenCount: microCount * 60,
      rejectedCount: Math.round(microCount * 0.12),
      rejectionRate: 0.85,
      incidents: microIncidents,
      filename: `[AI_Part_3_Microbiology]_${filename}`,
      fileSize: `${Math.round(microCount * 0.7)} KB`,
    },
  ];

  return { splitResult, routedSources };
}
