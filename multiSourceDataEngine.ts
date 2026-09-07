import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataSourceItem, RiskIncident, DepartmentKey, RiskLevel, RiskStage, SeverityMatrixLevel, YearlyLabRiskData, Department5YearStats } from '../types';
import { filterOutTrashedItems } from './trashEngine';

/**
 * Normalizes text for header matching
 */
function normalizeHeader(str: string): string {
  return (str || '').toString().toLowerCase().replace(/[\s_\-\.\(\)\/\\]/g, '');
}

/**
 * Intelligent field extractor for lab & hospital risk rows
 */
export function mapRowToIncident(row: Record<string, any>, sourceId: string, defaultDept: string = 'central'): RiskIncident {
  const keys = Object.keys(row);
  const findValue = (possibleMatches: string[]): any => {
    for (const pm of possibleMatches) {
      const normPM = normalizeHeader(pm);
      const foundKey = keys.find((k) => normalizeHeader(k).includes(normPM));
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
        return row[foundKey];
      }
    }
    return undefined;
  };

  const idVal = findValue(['id', 'incidentid', 'รหัส', 'ลำดับ', 'no']) || `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const titleVal = findValue(['title', 'หัวข้อ', 'เรื่อง', 'incident', 'event', 'รายการอุบัติการณ์', 'description', 'รายละเอียด']) || 'อุบัติการณ์ความเสี่ยงทางห้องปฏิบัติการ';
  const deptRaw = findValue(['department', 'dept', 'แผนก', 'ห้องปฏิบัติการ', 'หน่วยงาน']) || defaultDept;
  const stageRaw = findValue(['stage', 'ขั้นตอน', 'phase', 'กระบวนการ']) || 'Pre-analytical';
  const riskLevelRaw = findValue(['risklevel', 'level', 'ระดับความเสี่ยง', 'ความรุนแรง', 'severity']) || 'Moderate';
  const dateVal = findValue(['date', 'วันที่', 'timestamp', 'เวลา', 'datetime']) || new Date().toISOString().split('T')[0];
  const specimenVal = findValue(['specimen', 'สิ่งส่งตรวจ', 'ชนิดสิ่งส่งตรวจ', 'sample']) || 'Blood / Serum';
  const typeVal = findValue(['type', 'ประเภท', 'หมวดหมู่', 'category', 'สาเหตุ']) || 'สิ่งส่งตรวจไม่ถูกต้อง / ปฏิเสธสิ่งส่งตรวจ';
  const reporterVal = findValue(['reporter', 'ผู้รายงาน', 'reportedby', 'name']) || 'เจ้าหน้าที่ห้องปฏิบัติการ';
  const statusVal = findValue(['status', 'สถานะ', 'การจัดการ']) || 'Under Investigation';
  const descVal = findValue(['description', 'รายละเอียด', 'detail', 'เหตุการณ์']) || titleVal;
  const hnVal = findValue(['hn', 'patienthn', 'เลขhn', 'hospitalnumber']);
  const labNoVal = findValue(['labno', 'labnumber', 'เลขแล็บ']);
  const rootCauseVal = findValue(['rootcause', 'สาเหตุรากเหง้า', 'สาเหตุหลัก']);
  const actionVal = findValue(['action', 'immediateaction', 'การแก้ไขเบื้องต้น', 'capa']);

  // Map Department Key
  let departmentKey: DepartmentKey = 'central';
  const normDept = (deptRaw || '').toString().toLowerCase();
  if (normDept.includes('blood') || normDept.includes('เลือด') || normDept.includes('ธนาคาร')) {
    departmentKey = 'blood';
  } else if (normDept.includes('micro') || normDept.includes('จุลชีว')) {
    departmentKey = 'microbiology';
  } else if (normDept.includes('outpatient') || normDept.includes('opd') || normDept.includes('ผู้ป่วยนอก')) {
    departmentKey = 'outpatient';
  } else if (normDept.includes('molecular_sci') || normDept.includes('วิทยาศาสตร์')) {
    departmentKey = 'molecular_science';
  } else if (normDept.includes('molecular') || normDept.includes('อณูชีว')) {
    departmentKey = 'molecular';
  } else if (normDept.includes('material') || normDept.includes('คลัง') || normDept.includes('พัสดุ')) {
    departmentKey = 'material_store';
  } else if (normDept.includes('central') || normDept.includes('กลาง') || normDept.includes('เคมี') || normDept.includes('โลหิต')) {
    departmentKey = 'central';
  } else if (defaultDept && defaultDept !== 'overview') {
    departmentKey = defaultDept;
  }

  // Map Risk Level
  let riskLevel: RiskLevel = 'Moderate';
  const normRisk = (riskLevelRaw || '').toString().toLowerCase();
  if (normRisk.includes('crit') || normRisk.includes('วิกฤต') || normRisk.includes('level g') || normRisk.includes('level h') || normRisk.includes('level i') || /^\s*[efghi]\s*$/i.test(String(riskLevelRaw))) {
    riskLevel = 'Critical';
  } else if (normRisk.includes('high') || normRisk.includes('สูง') || normRisk.includes('level c') || normRisk.includes('level d')) {
    riskLevel = 'High Risk';
  } else if (normRisk.includes('low') || normRisk.includes('ต่ำ') || normRisk.includes('level a') || normRisk.includes('level b')) {
    riskLevel = 'Low Risk';
  }

  // Map Stage
  let stage: RiskStage = 'Pre-analytical';
  const normStage = (stageRaw || '').toString().toLowerCase();
  if (normStage.includes('post') || normStage.includes('หลัง')) {
    stage = 'Post-analytical';
  } else if (normStage.includes('analytical') || normStage.includes('วิเคราะห์') || normStage.includes('ตรวจ')) {
    stage = 'Analytical';
  } else if (normStage.includes('store') || normStage.includes('คลัง') || normStage.includes('เก็บ')) {
    stage = 'General/Storage';
  } else if (normStage.includes('safe') || normStage.includes('ปลอดภัย') || normStage.includes('สิ่งแวดล้อม')) {
    stage = 'Safety/Environment';
  }

  // Parse Year
  let yearNum = 2569;
  const matchYear = String(dateVal).match(/(256[0-9]|202[0-9])/);
  if (matchYear) {
    const yr = parseInt(matchYear[1], 10);
    yearNum = yr > 2500 ? yr : yr + 543;
  }

  return {
    id: `src-${sourceId}-${idVal}`,
    incidentId: `INC-${idVal}`,
    title: String(titleVal).slice(0, 150),
    department: departmentKey,
    departmentKey,
    specimen: String(specimenVal),
    patientHn: hnVal ? String(hnVal) : undefined,
    labNumber: labNoVal ? String(labNoVal) : undefined,
    type: String(typeVal),
    stage,
    riskLevel,
    severityMatrix: (riskLevel === 'Critical' ? 'Level G' : riskLevel === 'High Risk' ? 'Level D' : 'Level B') as SeverityMatrixLevel,
    date: String(dateVal).slice(0, 20),
    year: yearNum,
    reportedBy: String(reporterVal),
    status: (String(statusVal).toLowerCase().includes('resolve') || String(statusVal).includes('เรียบร้อย') || String(statusVal).includes('แก้ไขแล้ว')) ? 'Resolved' : 'Under Investigation',
    description: String(descVal),
    rootCause: rootCauseVal ? String(rootCauseVal) : undefined,
    immediateAction: actionVal ? String(actionVal) : undefined,
    sourceSheetId: sourceId,
  };
}

/**
 * Parse CSV String / File
 */
export function parseCSVData(csvText: string, sourceId: string, departmentKey: string): { incidents: RiskIncident[]; totalSpecimens: number; rejectedCount: number } {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const rows = (parsed.data as Record<string, any>[]) || [];
  let totalSpecimens = 0;
  let rejectedCount = 0;

  const incidents: RiskIncident[] = rows.map((row, idx) => {
    // Check if row has specimen counts
    const specCount = Number(row['totalSpecimens'] || row['สิ่งส่งตรวจ'] || row['จำนวนสิ่งส่งตรวจ'] || 0);
    const rejCount = Number(row['rejectedSpecimens'] || row['ปฏิเสธ'] || row['จำนวนที่ปฏิเสธ'] || 0);
    if (specCount > 0) totalSpecimens += specCount;
    if (rejCount > 0) rejectedCount += rejCount;

    return mapRowToIncident(row, `${sourceId}-${idx}`, departmentKey);
  });

  // Never invent hospital metrics. Missing counts remain 0.

  return { incidents, totalSpecimens, rejectedCount };
}

/**
 * Parse Excel File (Buffer / ArrayBuffer)
 */
export function parseExcelData(arrayBuffer: ArrayBuffer, sourceId: string, departmentKey: string): { incidents: RiskIncident[]; totalSpecimens: number; rejectedCount: number } {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let totalSpecimens = 0;
  let rejectedCount = 0;
  const incidents: RiskIncident[] = [];

  // Read EVERY worksheet. Sheet name is preserved in the source id for traceability.
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    rows.forEach((row, idx) => {
      const specCount = Number(row['totalSpecimens'] || row['สิ่งส่งตรวจ'] || row['จำนวนสิ่งส่งตรวจ'] || 0);
      const rejCount = Number(row['rejectedSpecimens'] || row['ปฏิเสธ'] || row['จำนวนที่ปฏิเสธ'] || 0);
      if (Number.isFinite(specCount) && specCount > 0) totalSpecimens += specCount;
      if (Number.isFinite(rejCount) && rejCount > 0) rejectedCount += rejCount;
      incidents.push(mapRowToIncident(row, `${sourceId}-${sheetName}-${idx}`, departmentKey));
    });
  });

  // Never fabricate specimen/rejection counts when the source file does not contain them.
  return { incidents, totalSpecimens, rejectedCount };
}

/**
 * Parse JSON data
 */
export function parseJSONData(jsonText: string, sourceId: string, departmentKey: string): { incidents: RiskIncident[]; totalSpecimens: number; rejectedCount: number } {
  const parsed = JSON.parse(jsonText);
  const rows = Array.isArray(parsed) ? parsed : parsed.incidents || parsed.data || [parsed];

  let totalSpecimens = 0;
  let rejectedCount = 0;

  const incidents: RiskIncident[] = rows.map((row: any, idx: number) => {
    return mapRowToIncident(row, `${sourceId}-${idx}`, departmentKey);
  });

  rows.forEach((row: any) => {
    const specCount = Number(row?.totalSpecimens || row?.['จำนวนสิ่งส่งตรวจ'] || 0);
    const rejCount = Number(row?.rejectedSpecimens || row?.['จำนวนที่ปฏิเสธ'] || row?.['ปฏิเสธ'] || 0);
    if (Number.isFinite(specCount) && specCount > 0) totalSpecimens += specCount;
    if (Number.isFinite(rejCount) && rejCount > 0) rejectedCount += rejCount;
  });

  return { incidents, totalSpecimens, rejectedCount };
}

/**
 * Fetch and parse a Google Sheet via server endpoint with fallback to direct fetch
 */
export async function fetchAndParseGoogleSheet(url: string, sourceId: string, departmentKey: string): Promise<{ incidents: RiskIncident[]; totalSpecimens: number; rejectedCount: number; rawRowsCount: number }> {
  let csvText = '';

  try {
    const serverRes = await fetch('/api/sheets/fetch-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data.csvText) {
        csvText = data.csvText;
      }
    }
  } catch (err) {
    console.warn('Server-side sheet fetch failed, trying direct CSV url:', err);
  }

  // Fallback: Direct CSV URL if server route failed
  if (!csvText) {
    let directUrl = url;
    if (url.includes('docs.google.com/spreadsheets')) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const sheetId = match[1];
        directUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }
    }
    const directRes = await fetch(directUrl);
    if (!directRes.ok) {
      throw new Error(`ไม่สามารถเปิดลิงก์ Google Sheets ได้ (Status ${directRes.status}) โปรดตรวจสอบว่าได้ตั้งค่าสิทธิ์เป็น 'Anyone with the link can view' หรือไม่`);
    }
    csvText = await directRes.text();
  }

  const { incidents, totalSpecimens, rejectedCount } = parseCSVData(csvText, sourceId, departmentKey);
  return { incidents, totalSpecimens, rejectedCount, rawRowsCount: incidents.length };
}

/**
 * Multi-Source Fusion Calculator:
 * Aggregates all ACTIVE data sources into a unified recalculated dataset.
 */
export interface FusedDataMetrics {
  totalSources: number;
  activeSources: number;
  totalIncidents: number;
  totalSpecimens: number;
  rejectedSpecimens: number;
  totalRejected: number;
  rejectionRate: number;
  criticalIncidents: number;
  highRiskIncidents: number;
  moderateIncidents: number;
  lowRiskIncidents: number;
  resolvedIncidents: number;
  pendingIncidents: number;
  departmentCounts: Record<string, { count: number; specimens: number; rejected: number; rate: number }>;
  stageCounts: Record<string, number>;
  categoryBreakdown: { name: string; count: number; percentage: number }[];
  monthlyTrend: { month: string; incidents: number; rejected: number; specimens: number }[];
  yearly5YearStats: YearlyLabRiskData[];
  allIncidents: RiskIncident[];
}

export function calculateFusedMetrics(
  sources: DataSourceItem[],
  selectedYear: number = 2569,
  trashedIds?: Set<string> | string[]
): FusedDataMetrics {
  const trashedSet = trashedIds
    ? Array.isArray(trashedIds)
      ? new Set(trashedIds)
      : trashedIds
    : new Set<string>();

  const nonTrashedSources = filterOutTrashedItems(sources, trashedSet);
  const activeSources = nonTrashedSources.filter((s) => s.status === 'active');
  const allIncidents: RiskIncident[] = [];
  const seenIds = new Set<string>();
  let totalSpecimens = 0;
  let rejectedSpecimens = 0;

  activeSources.forEach((src, srcIdx) => {
    // Filter out any incidents that are directly trashed
    const nonTrashedIncidents = src.incidents.filter(
      (inc) => !trashedSet.has(inc.id) && !trashedSet.has(inc.incidentId || '')
    );

    nonTrashedIncidents.forEach((inc, incIdx) => {
      let uniqueId = inc.id || `inc-${src.id}-${incIdx}`;
      if (seenIds.has(uniqueId)) {
        uniqueId = `${src.id}-${uniqueId}-${incIdx}-${srcIdx}`;
      }
      seenIds.add(uniqueId);
      allIncidents.push({
        ...inc,
        id: uniqueId,
      });
    });
    totalSpecimens += src.specimenCount || 0;
    rejectedSpecimens += src.rejectedCount || 0;
  });

  const totalIncidents = allIncidents.length;
  const rejectionRate = totalSpecimens > 0 ? Number(((rejectedSpecimens / totalSpecimens) * 100).toFixed(2)) : 0;

  let criticalIncidents = 0;
  let highRiskIncidents = 0;
  let moderateIncidents = 0;
  let lowRiskIncidents = 0;
  let resolvedIncidents = 0;
  let pendingIncidents = 0;

  const departmentCounts: Record<string, { count: number; specimens: number; rejected: number; rate: number }> = {};
  const stageCounts: Record<string, number> = {
    'Pre-analytical': 0,
    'Analytical': 0,
    'Post-analytical': 0,
    'General/Storage': 0,
    'Safety/Environment': 0,
  };
  const categoryMap: Record<string, number> = {};

  // Months Thai
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const monthMap: Record<string, { incidents: number; rejected: number; specimens: number }> = {};
  thaiMonths.forEach((m) => {
    monthMap[m] = { incidents: 0, rejected: 0, specimens: 0 };
  });

  allIncidents.forEach((inc) => {
    // Risk level
    if (inc.riskLevel === 'Critical') criticalIncidents++;
    else if (inc.riskLevel === 'High Risk') highRiskIncidents++;
    else if (inc.riskLevel === 'Low Risk') lowRiskIncidents++;
    else moderateIncidents++;

    // Status
    if (inc.status === 'Resolved') resolvedIncidents++;
    else pendingIncidents++;

    // Department
    const deptKey = inc.departmentKey || 'central';
    if (!departmentCounts[deptKey]) {
      departmentCounts[deptKey] = { count: 0, specimens: 0, rejected: 0, rate: 0 };
    }
    departmentCounts[deptKey].count++;
    // Rejected/specimen totals are attached to source-level metrics, not guessed per incident.

    // Stage
    if (inc.stage && stageCounts[inc.stage] !== undefined) {
      stageCounts[inc.stage]++;
    } else {
      stageCounts['Pre-analytical']++;
    }

    // Category
    const cat = inc.type || 'ทั่วไป';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;

    // Monthly distribution estimation from date
    let mIndex = 0;
    if (inc.date) {
      const match = inc.date.match(/[-/](\d{1,2})[-/]/) || inc.date.match(/^\d{4}-(\d{2})-/);
      if (match && match[1]) {
        const m = parseInt(match[1], 10);
        if (m >= 1 && m <= 12) mIndex = m - 1;
      }
    }
    const mName = thaiMonths[mIndex % 12];
    if (monthMap[mName]) {
      monthMap[mName].incidents++;
      monthMap[mName].rejected++;
    }
  });

  // Allocate exact source-level specimen/rejection metrics to departments.
  activeSources.forEach((src) => {
    const deptKey = src.departmentKey || 'central';
    if (!departmentCounts[deptKey]) departmentCounts[deptKey] = { count: 0, specimens: 0, rejected: 0, rate: 0 };
    departmentCounts[deptKey].specimens += src.specimenCount || 0;
    departmentCounts[deptKey].rejected += src.rejectedCount || 0;
  });
  Object.values(departmentCounts).forEach((dept) => {
    dept.rate = dept.specimens > 0 ? Number(((dept.rejected / dept.specimens) * 100).toFixed(2)) : 0;
  });

  const categoryBreakdown = Object.keys(categoryMap)
    .map((name) => ({
      name,
      count: categoryMap[name],
      percentage: totalIncidents > 0 ? Number(((categoryMap[name] / totalIncidents) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const monthlyTrend = thaiMonths.map((m) => ({
    month: m,
    incidents: monthMap[m].incidents,
    rejected: monthMap[m].rejected,
    specimens: monthMap[m].specimens,
  }));

  // Historical chart uses only data actually present in incidents. No synthetic trend generation.
  const years = [2565, 2566, 2567, 2568, 2569];
  const yearly5YearStats: YearlyLabRiskData[] = years.map((y) => {
    const yearIncidents = allIncidents.filter((inc) => inc.year === y);
    const yearCategoryMap: Record<string, number> = {};
    yearIncidents.forEach((inc) => {
      const cat = inc.type || 'ทั่วไป';
      yearCategoryMap[cat] = (yearCategoryMap[cat] || 0) + 1;
    });
    const isSelectedYear = y === selectedYear;
    const ySpecimens = isSelectedYear ? totalSpecimens : 0;
    const yRejected = isSelectedYear ? rejectedSpecimens : 0;
    return {
      year: y,
      totalIncidents: yearIncidents.length,
      totalSpecimens: ySpecimens,
      rejectedSpecimens: yRejected,
      rejectionRate: ySpecimens > 0 ? Number(((yRejected / ySpecimens) * 100).toFixed(2)) : 0,
      categoryBreakdown: Object.entries(yearCategoryMap).map(([name, count]) => ({ category: name, categoryTh: name, count })),
    };
  });


  return {
    totalSources: sources.length,
    activeSources: activeSources.length,
    totalIncidents: totalIncidents || 0,
    totalSpecimens: totalSpecimens || 0,
    rejectedSpecimens: rejectedSpecimens || 0,
    totalRejected: rejectedSpecimens || 0,
    rejectionRate: rejectionRate || 0,
    criticalIncidents: criticalIncidents || 0,
    highRiskIncidents: highRiskIncidents || 0,
    moderateIncidents: moderateIncidents || 0,
    lowRiskIncidents: lowRiskIncidents || 0,
    resolvedIncidents: resolvedIncidents || 0,
    pendingIncidents: pendingIncidents || 0,
    departmentCounts: departmentCounts || {},
    stageCounts: stageCounts || {},
    categoryBreakdown: categoryBreakdown || [],
    monthlyTrend: monthlyTrend || [],
    yearly5YearStats: yearly5YearStats || [],
    allIncidents: allIncidents || [],
  };
}

/**
 * Dynamic Purge: Removes a data source and completely purges all associated records
 */
export function purgeSourceAndRecalculate(
  sources: DataSourceItem[],
  sourceIdToPurge: string
): { updatedSources: DataSourceItem[]; recalculatedMetrics: FusedDataMetrics } {
  const updatedSources = sources.filter((s) => s.id !== sourceIdToPurge);
  const recalculatedMetrics = calculateFusedMetrics(updatedSources);
  return { updatedSources, recalculatedMetrics };
}

export function buildDepartment5YearStats(
  sources: DataSourceItem[],
  deptKey: string,
  deptName: string,
  deptThName: string
): Department5YearStats {
  const years = [2565, 2566, 2567, 2568, 2569];
  const deptSources = sources.filter((s) => s.status === 'active' && s.departmentKey === deptKey);
  const incidents = deptSources.flatMap((s) => s.incidents || []);
  const currentSpecimens = deptSources.reduce((sum, s) => sum + (s.specimenCount || 0), 0);
  const currentRejected = deptSources.reduce((sum, s) => sum + (s.rejectedCount || 0), 0);

  const yearlyData = years.map((year) => {
    const yearIncidents = incidents.filter((i) => i.year === year);
    const cats: Record<string, number> = {};
    yearIncidents.forEach((i) => { cats[i.type || 'ทั่วไป'] = (cats[i.type || 'ทั่วไป'] || 0) + 1; });
    const isCurrent = year === 2569;
    const totalSpecimens = isCurrent ? currentSpecimens : 0;
    const rejectedSpecimens = isCurrent ? currentRejected : 0;
    return {
      year,
      totalIncidents: yearIncidents.length,
      totalSpecimens,
      rejectedSpecimens,
      rejectionRate: totalSpecimens > 0 ? Number(((rejectedSpecimens / totalSpecimens) * 100).toFixed(2)) : 0,
      categoryBreakdown: Object.entries(cats).map(([category, count]) => ({ category, categoryTh: category, count })),
    };
  });

  const nonZero = yearlyData.filter((y) => y.totalIncidents > 0);
  let overallTrendPercent = 0;
  let trendDirection: Department5YearStats['trendDirection'] = 'stable';
  if (nonZero.length >= 2) {
    const first = nonZero[0].totalIncidents;
    const last = nonZero[nonZero.length - 1].totalIncidents;
    overallTrendPercent = first > 0 ? Number((((last - first) / first) * 100).toFixed(1)) : 0;
    trendDirection = overallTrendPercent > 0 ? 'increased' : overallTrendPercent < 0 ? 'decreased' : 'stable';
  }

  return {
    deptKey,
    deptName,
    deptThName,
    yearlyData,
    overallTrendPercent,
    trendDirection,
    mtSummary: incidents.length > 0 ? `สรุปจากข้อมูลจริงที่นำเข้า ${incidents.length} อุบัติการณ์` : 'ยังไม่มีข้อมูลจริงสำหรับห้องนี้',
    keyCategories: Array.from(new Set(incidents.map((i) => i.type).filter(Boolean))).slice(0, 5),
  };
}
