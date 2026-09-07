import { GoogleSheetResource, RiskIncident, RiskLevel, RiskStage, SeverityMatrixLevel } from '../types';

/**
 * Extract Google Sheet ID from standard sharing URL or embed link
 */
export function extractGoogleSheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  // If user pasted just the ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

/**
 * Extract Google Form ID from form URL
 */
export function extractGoogleFormId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/forms\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Convert any Google Sheet URL to direct CSV export link via Google Visualization API
 */
export function getGoogleSheetCsvUrl(url: string, sheetTabName?: string): string {
  const sheetId = extractGoogleSheetId(url);
  if (!sheetId) {
    return url; // fallback if already direct CSV
  }
  const tabParam = sheetTabName ? `&sheet=${encodeURIComponent(sheetTabName)}` : '';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${tabParam}`;
}

/**
 * Simple CSV tokenizer that handles commas inside quotes
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of \r\n
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Map Thai/English headers to normalized keys
 */
function normalizeHeader(h: string): string {
  const clean = h.toLowerCase().replace(/[\s_()/-]/g, '');
  if (/timestamp|date|วันที่|วันเวลา|ประทับเวลา/.test(clean)) return 'date';
  if (/department|dept|หน่วยงาน|แผนก|ห้องแล็บ|lab/.test(clean)) return 'department';
  if (/title|incident|หัวข้อ|เรื่อง|ความเสี่ยง|อุบัติการณ์|ชื่อเหตุการณ์/.test(clean)) return 'title';
  if (/severity|risklevel|ระดับความเสี่ยง|ระดับความรุนแรง|risk|level|เกณฑ์/.test(clean)) return 'riskLevel';
  if (/matrix|severitymatrix|ระดับmatrix|ระดับa-i/.test(clean)) return 'severityMatrix';
  if (/specimen|tube|สิ่งส่งตรวจ|ตัวอย่าง|ชนิดสิ่งส่งตรวจ/.test(clean)) return 'specimen';
  if (/hn|patienthn|เลขhn|hospitalnumber|เลขประจำตัวผู้ป่วย/.test(clean)) return 'patientHn';
  if (/labnumber|labno|เลขแล็บ|accession/.test(clean)) return 'labNumber';
  if (/location|ward|สถานที่|วอร์ด|หน่วยส่งตรวจ/.test(clean)) return 'location';
  if (/stage|ขั้นตอน|preanalytical|analytical|postanalytical/.test(clean)) return 'stage';
  if (/reporter|reportedby|ผู้รายงาน|ชื่อผู้แจ้ง/.test(clean)) return 'reportedBy';
  if (/description|detail|รายละเอียด|พฤติการณ์/.test(clean)) return 'description';
  if (/rootcause|สาเหตุ|หมวดสาเหตุ/.test(clean)) return 'rootCause';
  if (/corrective|action|การแก้ไข|การจัดการเบื้องต้น/.test(clean)) return 'action';
  if (/rejectionreason|สาเหตุการปฏิเสธ|เหตุผลปฏิเสธ/.test(clean)) return 'rejectionReason';
  if (/totalspecimens|จำนวนสิ่งส่งตรวจ|ยอดส่งตรวจ/.test(clean)) return 'totalSpecimens';
  if (/rejectedcount|จำนวนที่ปฏิเสธ|ปฏิเสธ/.test(clean)) return 'rejectedCount';
  if (/count|จำนวน|เคส|incidents/.test(clean)) return 'count';
  return clean;
}

/**
 * Parse Risk Level from raw string
 */
function parseRiskLevel(val: string): RiskLevel {
  if (!val) return 'Moderate';
  const v = val.toLowerCase();
  if (v.includes('critical') || v.includes('วิกฤต') || v.includes('สูงมาก') || v.includes('level g') || v.includes('level h') || v.includes('level i')) {
    return 'Critical';
  }
  if (v.includes('high') || v.includes('สูง') || v.includes('level e') || v.includes('level f')) {
    return 'High Risk';
  }
  if (v.includes('low') || v.includes('ต่ำ') || v.includes('level a') || v.includes('level b')) {
    return 'Low Risk';
  }
  return 'Moderate';
}

/**
 * Parse Risk Stage
 */
function parseRiskStage(val: string): RiskStage {
  if (!val) return 'Pre-analytical';
  const v = val.toLowerCase();
  if (v.includes('pre') || v.includes('ก่อนตรวจ') || v.includes('เจาะเลือด') || v.includes('ติดสติกเกอร์') || v.includes('สิ่งส่งตรวจ')) {
    return 'Pre-analytical';
  }
  if (v.includes('post') || v.includes('หลังตรวจ') || v.includes('รายงานผล') || v.includes('turnaround')) {
    return 'Post-analytical';
  }
  if (v.includes('storage') || v.includes('คลัง') || v.includes('วัสดุ') || v.includes('ตู้เย็น')) {
    return 'General/Storage';
  }
  if (v.includes('safety') || v.includes('ความปลอดภัย') || v.includes('สิ่งแวดล้อม')) {
    return 'Safety/Environment';
  }
  return 'Analytical';
}

/**
 * Determine department key from department name
 */
export function mapDepartmentToKey(dept: string): string {
  if (!dept) return 'central';
  const d = dept.toLowerCase();
  if (d.includes('blood') || d.includes('ธนาคารเลือด') || d.includes('คลังเลือด')) return 'blood';
  if (d.includes('micro') || d.includes('จุลชีววิทยา') || d.includes('hemoculture')) return 'microbiology';
  if (d.includes('outpatient') || d.includes('opd') || d.includes('ผู้ป่วยนอก') || d.includes('เจาะเลือด')) return 'outpatient';
  if (d.includes('science') || d.includes('ชีวโมเลกุล')) return 'molecular_science';
  if (d.includes('molecular') || d.includes('อณูชีว') || d.includes('pcr') || d.includes('ngs')) return 'molecular';
  if (d.includes('store') || d.includes('คลัง') || d.includes('วัสดุ')) return 'material_store';
  if (d.includes('central') || d.includes('เคมี') || d.includes('โลหิต') || d.includes('กลาง')) return 'central';
  return 'central';
}

/**
 * Fetch and process Google Sheet CSV and compute all numeric KPIs
 */
export async function syncAndProcessGoogleSheet(
  resource: GoogleSheetResource
): Promise<{
  updatedResource: GoogleSheetResource;
  newIncidents: RiskIncident[];
}> {
  const csvUrl = getGoogleSheetCsvUrl(resource.url, resource.sheetTabName);
  
  let csvText = '';
  try {
    const resp = await fetch(csvUrl);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} - ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ (โปรดตรวจสอบการเปิดแชร์เป็น "ทุกคนที่มีลิงก์เข้าดูได้")`);
    }
    csvText = await resp.text();
  } catch (err: any) {
    // If standard fetch fails due to CORS or restricted permission, provide clear diagnostic
    throw new Error(
      err?.message || 'เชื่อมต่อ Google Sheet ล้มเหลว โปรดตรวจสอบ URL หรือตั้งค่าแชร์ชีตให้เป็น "Anyone with the link can view"'
    );
  }

  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    throw new Error('Google Sheet ไม่มีข้อมูลเพียงพอ (ต้องมีแถวหัวตารางและข้อมูลอย่างน้อย 1 แถว)');
  }

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);
  const dataRows = rows.slice(1);

  const incidents: RiskIncident[] = [];
  let totalSpecimensSum = 0;
  let rejectedCountSum = 0;
  let criticalCount = 0;
  let highRiskCount = 0;
  let moderateCount = 0;
  let lowCount = 0;
  const categoryMap: Record<string, number> = {};
  const monthMap: Record<string, number> = {
    'ม.ค.': 0, 'ก.พ.': 0, 'มี.ค.': 0, 'เม.ย.': 0, 'พ.ค.': 0, 'มิ.ย.': 0,
    'ก.ค.': 0, 'ส.ค.': 0, 'ก.ย.': 0, 'ต.ค.': 0, 'พ.ย.': 0, 'ธ.ค.': 0,
  };

  dataRows.forEach((row, idx) => {
    const rowObj: Record<string, string> = {};
    normalizedHeaders.forEach((key, colIdx) => {
      rowObj[key] = row[colIdx] || '';
    });

    const title = rowObj.title || rowObj.description || `อุบัติการณ์จาก Google Sheet #${idx + 1}`;
    const dateStr = rowObj.date || new Date().toLocaleDateString('th-TH');
    const dept = rowObj.department || resource.departmentKey || 'ห้องปฏิบัติการกลาง';
    const deptKey = mapDepartmentToKey(dept);
    const riskLvl = parseRiskLevel(rowObj.riskLevel || rowObj.severityMatrix || '');
    const stage = parseRiskStage(rowObj.stage || title);
    const specimen = rowObj.specimen || 'สิ่งส่งตรวจ (Specimen)';
    
    // Numeric stats parsing
    const numericCount = parseInt(rowObj.count || '1', 10) || 1;
    const rowSpecimens = parseInt(rowObj.totalSpecimens || '0', 10);
    const rowRejections = parseInt(rowObj.rejectedCount || '0', 10);

    if (rowSpecimens > 0) totalSpecimensSum += rowSpecimens;
    if (rowRejections > 0) rejectedCountSum += rowRejections;

    if (riskLvl === 'Critical') criticalCount += numericCount;
    else if (riskLvl === 'High Risk') highRiskCount += numericCount;
    else if (riskLvl === 'Low Risk') lowCount += numericCount;
    else moderateCount += numericCount;

    // Category tally
    const catName = rowObj.type || rowObj.rejectionReason || stage;
    categoryMap[catName] = (categoryMap[catName] || 0) + numericCount;

    // Monthly tally
    const foundMonth = Object.keys(monthMap).find((m) => dateStr.includes(m));
    if (foundMonth) {
      monthMap[foundMonth] += numericCount;
    } else {
      // distribute
      const currentMonthIndex = new Date().getMonth();
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      monthMap[thaiMonths[currentMonthIndex]] += numericCount;
    }

    const incident: RiskIncident = {
      id: `gsheet-${resource.id}-${idx + 1}`,
      incidentId: rowObj.labNumber || `GS-${2569}-${String(idx + 1).padStart(3, '0')}`,
      title,
      department: dept,
      departmentKey: deptKey,
      specimen,
      specimenType: specimen,
      patientHn: rowObj.patientHn || `HN-GS${idx + 100}`,
      labNumber: rowObj.labNumber || `LAB-GS-${idx + 1}`,
      location: rowObj.location || 'หน่วยงานตรวจรักษา',
      type: rowObj.type || rowObj.rejectionReason || 'Google Sheet Synced Incident',
      stage,
      riskLevel: riskLvl,
      severityMatrix: (rowObj.severityMatrix as SeverityMatrixLevel) || (riskLvl === 'Critical' ? 'Level G' : 'Level D'),
      harmLevel: rowObj.harmLevel || (riskLvl === 'Critical' ? 'Sentinel Event / Critical' : 'Near Miss'),
      date: dateStr,
      time: rowObj.time || '08:30',
      year: 2569,
      reportedBy: rowObj.reportedBy || 'Google Sheet Auto Sync',
      reporterPosition: 'Medical Technologist / Staff',
      reporterContact: '-',
      status: 'Resolved',
      description: rowObj.description || title,
      rootCause: rowObj.rootCause || 'บันทึกผ่าน Google Sheet',
      rootCauseCategory: 'Protocol/SOP',
      immediateAction: rowObj.action || 'ประสานงานและแก้ไขตาม SOP เรียบร้อย',
      correctiveActionPlan: 'ทบทวนสถิติความเสี่ยงประจำเดือน',
      preventiveAction: 'ติดตามคุณภาพต่อเนื่องผ่านแดชบอร์ด',
      syncedToGoogleSheet: true,
      sourceSheetId: resource.id,
    };

    incidents.push(incident);
  });

  const totalIncidents = dataRows.length;
  if (totalSpecimensSum === 0) {
    totalSpecimensSum = totalIncidents * 120; // estimation if not provided in sheet
  }
  if (rejectedCountSum === 0) {
    rejectedCountSum = incidents.filter((i) => i.stage === 'Pre-analytical' || i.title.includes('ปฏิเสธ')).length;
  }
  const rejectionRate = totalSpecimensSum > 0 ? Number(((rejectedCountSum / totalSpecimensSum) * 100).toFixed(2)) : 0;

  const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
  const monthlyTrend = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

  const updatedResource: GoogleSheetResource = {
    ...resource,
    rowCount: totalIncidents,
    lastSyncTime: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
    status: 'connected',
    parsedIncidents: incidents,
    summaryMetrics: {
      totalIncidents,
      totalSpecimens: totalSpecimensSum,
      rejectedCount: rejectedCountSum,
      rejectionRate,
      criticalCount,
      highRiskCount,
      categories,
      monthlyTrend,
    },
    errorMessage: undefined,
  };

  return { updatedResource, newIncidents: incidents };
}
