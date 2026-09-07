import React, { useState } from 'react';
import { RiskIncident, Department5YearStats, RejectionReasonStat } from '../types';
import { YearSelectorBar } from './YearSelectorBar';
import { translateRiskLevel, translateStatus } from '../utils/labels';

interface CentralLabDashboardProps {
  incidents: RiskIncident[];
  stats: Department5YearStats;
  onOpenReportRisk: () => void;
  onOpenDataUpload: () => void;
  onOpenExportReport: () => void;
  onOpenGoogleSync: () => void;
  onSelectIncident: (incident: RiskIncident) => void;
}

type CentralLabSubTab =
  | 'overview'
  | 'reject_clot'
  | 'chemistry'
  | 'hematology'
  | 'tat_critical'
  | 'iqc_equipment'
  | 'google_sheet';

export const CentralLabDashboard: React.FC<CentralLabDashboardProps> = ({
  incidents,
  stats,
  onOpenReportRisk,
  onOpenDataUpload,
  onOpenExportReport,
  onOpenGoogleSync,
  onSelectIncident,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const [activeSubTab, setActiveSubTab] = useState<CentralLabSubTab>('overview');
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'reject_clot' | 'hemolysis' | 'critical' | 'tat' | 'qc'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const centralStats: Department5YearStats = stats;
  const yearlyData = centralStats.yearlyData;

  const currentYearData =
    yearlyData.find((y) => y.year === selectedYear) || yearlyData[yearlyData.length - 1];

  const centralIncidents = incidents.filter(
    (i) => i.departmentKey === 'central' || i.department.toLowerCase().includes('central')
  );

  const filteredIncidents = centralIncidents.filter((inc) => {
    // Text search
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const match =
        inc.incidentId.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        (inc.patientHn && inc.patientHn.toLowerCase().includes(q)) ||
        (inc.location && inc.location.toLowerCase().includes(q)) ||
        inc.specimen.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (incidentFilter === 'reject_clot') {
      return (
        inc.type.toLowerCase().includes('reject clot') ||
        inc.type.toLowerCase().includes('clot') ||
        inc.title.toLowerCase().includes('clot') ||
        inc.description.toLowerCase().includes('clot') ||
        inc.specimen.toLowerCase().includes('edta') ||
        inc.specimen.toLowerCase().includes('citrate')
      );
    }
    if (incidentFilter === 'hemolysis') {
      return (
        inc.type.toLowerCase().includes('hemolysis') ||
        inc.title.toLowerCase().includes('hemolysis') ||
        inc.description.toLowerCase().includes('hemolysis')
      );
    }
    if (incidentFilter === 'critical') {
      return (
        inc.riskLevel === 'Critical' ||
        (inc.severityMatrix && ['Level G', 'Level H', 'Level I'].includes(inc.severityMatrix))
      );
    }
    if (incidentFilter === 'tat') {
      return (
        inc.type.toLowerCase().includes('tat') ||
        inc.type.toLowerCase().includes('critical value') ||
        inc.title.toLowerCase().includes('delay') ||
        inc.title.toLowerCase().includes('notification')
      );
    }
    if (incidentFilter === 'qc') {
      return (
        inc.type.toLowerCase().includes('instrument') ||
        inc.type.toLowerCase().includes('calibration') ||
        inc.title.toLowerCase().includes('qc') ||
        inc.title.toLowerCase().includes('lamp') ||
        inc.title.toLowerCase().includes('analyzer')
      );
    }
    return true;
  });

  const maxIncidents = Math.max(...yearlyData.map((d) => d.totalIncidents), 180);

  // Extract rejection reasons
  const rejectionReasons: RejectionReasonStat[] = currentYearData.rejectionReasons || [
    { reason: 'Hemolyzed Blood', reasonTh: 'เลือดแตกตัว (Hemolysis)', count: 1180, percentageOfRejections: 40.0 },
    { reason: 'Reject Clot (Micro-clot / Clotted)', reasonTh: 'เลือดเกิดลิ่มเลือด (Reject Clot)', count: 855, percentageOfRejections: 29.0 },
    { reason: 'Underfilled Tube (QNS)', reasonTh: 'ปริมาณเลือดไม่เพียงพอ (QNS)', count: 472, percentageOfRejections: 16.0 },
    { reason: 'Mislabeled / Barcode Error', reasonTh: 'ติดบาร์โค้ดผิด/ฉลากไม่ตรง', count: 265, percentageOfRejections: 9.0 },
    { reason: 'Wrong Anticoagulant Tube', reasonTh: 'ใช้หลอดตรวจผิดประเภท', count: 118, percentageOfRejections: 4.0 },
    { reason: 'Delayed Transport / Expired', reasonTh: 'ส่งตรวจล่าช้าเกินเวลา', count: 60, percentageOfRejections: 2.0 },
  ];

  // Specific Reject Clot stat
  const rejectClotStat = rejectionReasons.find((r) =>
    r.reason.toLowerCase().includes('clot') || r.reasonTh.includes('ลิ่มเลือด')
  ) || {
    reason: 'Reject Clot (Micro-clot / Clotted)',
    reasonTh: 'เลือดเกิดลิ่มเลือด (Reject Clot)',
    count: 855,
    percentageOfRejections: 29.0,
  };

  const hemolysisStat = rejectionReasons.find((r) =>
    r.reason.toLowerCase().includes('hemoly') || r.reasonTh.includes('แตกตัว')
  ) || {
    reason: 'Hemolyzed Blood',
    reasonTh: 'เลือดแตกตัว (Hemolysis)',
    count: 1180,
    percentageOfRejections: 40.0,
  };

  // Ward Specific Rejection Data for Central Lab
  const wardRejectionStats = [
    { ward: 'ห้องฉุกเฉิน (Emergency Room / ER)', clot: 284, hemolysis: 462, totalReject: 746, trend: '+4.2%' },
    { ward: 'หอผู้ป่วยวิกฤตอายุรกรรม (MICU)', clot: 156, hemolysis: 238, totalReject: 394, trend: '-8.5%' },
    { ward: 'หอผู้ป่วยวิกฤตศัลยกรรม (SICU / Trauma)', clot: 142, hemolysis: 195, totalReject: 337, trend: '-5.1%' },
    { ward: 'หอผู้ป่วยอายุรกรรมหญิง 1 (Med Female 1)', clot: 98, hemolysis: 112, totalReject: 210, trend: '-12.0%' },
    { ward: 'หอผู้ป่วยอายุรกรรมชาย 2 (Med Male 2)', clot: 85, hemolysis: 94, totalReject: 179, trend: '-3.8%' },
    { ward: 'หอผู้ป่วยศัลยกรรมกระดูก (Ortho Ward)', clot: 52, hemolysis: 48, totalReject: 100, trend: '-15.4%' },
    { ward: 'แผนกผู้ป่วยนอก (OPD / Phlebotomy)', clot: 38, hemolysis: 31, totalReject: 69, trend: '-22.1%' },
  ];

  // Tube Type Breakdown for Central Lab
  const tubeTypeStats = [
    { type: 'EDTA Tube (จุกสีม่วง - CBC / HbA1c)', icon: 'colorize', color: '#7b1fa2', total: 420000, reject: 982, clotPercent: 78.4, mainIssue: 'Micro-clot & PLT Clumping' },
    { type: 'Sodium Citrate 3.2% (จุกฟ้า - Coagulogram)', icon: 'science', color: '#0288d1', total: 115000, reject: 412, clotPercent: 82.1, mainIssue: 'Fibrin Clot & Underfilled 9:1 ratio' },
    { type: 'Lithium Heparin Gel (จุกเขียวมิ้นต์ - STAT Chem)', icon: 'opacity', color: '#00897b', total: 245000, reject: 580, clotPercent: 6.2, mainIssue: 'Hemolysis Index 3+' },
    { type: 'Clot Activator SST (จุกแดง/เหลือง - Chemistry/Serology)', icon: 'bloodtype', color: '#c2185b', total: 180000, reject: 820, clotPercent: 2.1, mainIssue: 'Hemolysis & Lipemia Interference' },
    { type: 'Sodium Fluoride (จุกเทา - Glucose/Lactate)', icon: 'medication_liquid', color: '#757575', total: 25000, reject: 156, clotPercent: 4.5, mainIssue: 'QNS Underfilled Volume' },
  ];

  // Color mapping for rejection reasons
  const getReasonColor = (reasonKey: string) => {
    const key = reasonKey.toLowerCase();
    if (key.includes('clot') || key.includes('ลิ่มเลือด')) return { bg: 'bg-[#a90426]', text: 'text-[#a90426]', border: 'border-[#a90426]', lightBg: 'bg-[#ffdad6]' };
    if (key.includes('hemoly') || key.includes('แตกตัว')) return { bg: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]', border: 'border-[#ba1a1a]', lightBg: 'bg-[#ffdad9]' };
    if (key.includes('underfilled') || key.includes('ไม่เพียงพอ')) return { bg: 'bg-[#e26d00]', text: 'text-[#e26d00]', border: 'border-[#e26d00]', lightBg: 'bg-[#ffe8d6]' };
    if (key.includes('mislabeled') || key.includes('บาร์โค้ด')) return { bg: 'bg-[#003e6f]', text: 'text-[#003e6f]', border: 'border-[#003e6f]', lightBg: 'bg-[#d3e4ff]' };
    if (key.includes('wrong') || key.includes('ผิดประเภท')) return { bg: 'bg-[#5e35b1]', text: 'text-[#5e35b1]', border: 'border-[#5e35b1]', lightBg: 'bg-[#ede7f6]' };
    return { bg: 'bg-[#535f70]', text: 'text-[#535f70]', border: 'border-[#535f70]', lightBg: 'bg-[#e0e9f2]' };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-[#ecf5fe] min-w-0 space-y-6">
      {/* Top Banner with Hospital Central Lab Info & Live Google Sheet Integration */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c1c7d2] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-[#003e6f]/10 border border-[#003e6f]/20 flex items-center justify-center text-[#003e6f] shadow-inner shrink-0">
            <span className="material-symbols-outlined text-[32px] fill">biotech</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#003e6f] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                Central Laboratory Unit
              </span>
              <span className="text-xs text-[#006e25] bg-[#80f98b]/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border border-[#006e25]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006e25] animate-pulse"></span>
                ISO 15189 / LA Certified
              </span>
              <span className="text-xs text-[#a90426] bg-[#ffdad6] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-[#a90426]/30">
                <span className="material-symbols-outlined text-[13px]">bloodtype</span>
                Reject Clot Protocol Active
              </span>
              <a
                href="https://docs.google.com/spreadsheets/d/1ZoOv9s1ILsCj3GgmNDqWqL_CgNuyIb3sjMJyadD2cP4/edit?gid=866685160#gid=866685160"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#005596] bg-[#d3e4ff]/60 hover:bg-[#d3e4ff] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[13px] text-[#007327]">table_view</span>
                Google Sheet Live (gid: 866685160)
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#003e6f] mt-1">
              ห้องปฏิบัติการกลาง (Central Laboratory)
            </h2>
            <p className="text-xs sm:text-sm text-[#414750] mt-0.5">
              ศูนย์รวมการตรวจวิเคราะห์เคมีคลินิก (Clinical Chemistry), โลหิตวิทยา (Hematology / CBC), การแข็งตัวของเลือด (Coagulation), ปัสสาวะและสารคัดหลั่ง พร้อมระบบควบคุมคุณภาพ IQC / EQAS และการบริหารความเสี่ยงสิ่งส่งตรวจ
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={onOpenGoogleSync}
            className="px-3.5 py-2 bg-[#f6faff] border border-[#005596]/40 text-[#003e6f] rounded-xl text-xs font-bold hover:bg-[#d3e4ff]/60 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#007327]">sync_saved_locally</span>
            Sync Google Sheet
          </button>

          <button
            type="button"
            onClick={onOpenDataUpload}
            className="px-3.5 py-2 bg-white border border-[#c1c7d2] text-[#414750] rounded-xl text-xs font-bold hover:bg-[#e0e9f2] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#003e6f]">upload_file</span>
            อัปโหลด LIS / QC
          </button>

          <button
            type="button"
            onClick={onOpenExportReport}
            className="px-3.5 py-2 bg-white border border-[#c1c7d2] text-[#003e6f] rounded-xl text-xs font-bold hover:bg-[#e0e9f2] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export QA Report
          </button>

          <button
            type="button"
            onClick={onOpenReportRisk}
            className="px-4 py-2 bg-[#003e6f] hover:bg-[#004881] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:shadow-lg"
          >
            <span className="material-symbols-outlined text-[18px]">add_alert</span>
            รายงานความเสี่ยงแลปกลาง
          </button>
        </div>
      </div>

      {/* Year Selector with 5-Year default and 10-Year historical data */}
      <YearSelectorBar
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        yearlyData={yearlyData}
        latestYear={2569}
        deptThName="ห้องปฏิบัติการกลาง"
      />

      {/* Global quick search bar */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#727781]">
          search
        </span>
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="ค้นหา HN, Lab No, อาการ, ตึก หรือรายละเอียดความเสี่ยง..."
          className="w-full h-10 pl-9 pr-9 bg-white border border-[#c1c7d2] rounded-xl text-xs focus:outline-none focus:border-[#003e6f] shadow-xs"
        />
        {searchFilter && (
          <button
            type="button"
            onClick={() => setSearchFilter('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#727781] hover:text-[#141d23]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Interactive Sub-tabs for Central Lab Parts with Dedicated Icons */}
      <div className="bg-white rounded-2xl border border-[#c1c7d2] p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-[#003e6f] text-white shadow-xs'
              : 'text-[#414750] hover:bg-[#ecf5fe]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">query_stats</span>
          1. ภาพรวม &amp; สถิติ 5 ปี (Overview)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('reject_clot')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'reject_clot'
              ? 'bg-[#a90426] text-white shadow-xs'
              : 'text-[#a90426] hover:bg-[#ffdad6]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">grain</span>
          2. Reject Clot &amp; สิ่งส่งตรวจปฏิเสธ (Rejection)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('chemistry')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'chemistry'
              ? 'bg-[#003e6f] text-white shadow-xs'
              : 'text-[#414750] hover:bg-[#ecf5fe]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">experiment</span>
          3. เคมีคลินิก &amp; สารรบกวน HIL
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('hematology')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'hematology'
              ? 'bg-[#003e6f] text-white shadow-xs'
              : 'text-[#414750] hover:bg-[#ecf5fe]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">bloodtype</span>
          4. โลหิตวิทยา (CBC) &amp; การแข็งตัว
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tat_critical')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'tat_critical'
              ? 'bg-[#003e6f] text-white shadow-xs'
              : 'text-[#414750] hover:bg-[#ecf5fe]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">timer</span>
          5. Turnaround Time &amp; ผลวิกฤต (CVR)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('iqc_equipment')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'iqc_equipment'
              ? 'bg-[#003e6f] text-white shadow-xs'
              : 'text-[#414750] hover:bg-[#ecf5fe]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
          6. IQC &amp; บำรุงรักษาเครื่องมือ
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('google_sheet')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'google_sheet'
              ? 'bg-[#007327] text-white shadow-xs'
              : 'text-[#007327] hover:bg-[#80f98b]/30'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">table_chart</span>
          7. ตาราง Google Sheet Live Ingest
        </button>
      </div>

      {/* 6 High-Impact Summary KPI Cards with Healthcare Visuals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: Total Specimens */}
        <div className="bg-white border border-[#c1c7d2] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between hover:border-[#003e6f] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#414750] uppercase">ยอดตรวจรวม (ปี {selectedYear})</span>
            <span className="material-symbols-outlined text-[#003e6f] bg-[#d3e4ff] p-1 rounded-md text-[16px]">
              analytics
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl sm:text-2xl font-bold text-[#141d23] font-mono">
              {(currentYearData?.totalSpecimens || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#006e25] font-semibold mt-0.5">
              ~2,700 หลอด/วัน
            </p>
          </div>
          <div className="text-[10px] text-[#727781] bg-[#f6faff] p-1 rounded">
            ครอบคลุม 4 แผนกย่อย
          </div>
        </div>

        {/* KPI 2: Total Rejection */}
        <div className="bg-white border border-[#c1c7d2] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between hover:border-[#ba1a1a] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#ba1a1a] uppercase">ปฏิเสธสิ่งส่งตรวจ</span>
            <span className="material-symbols-outlined text-[#ba1a1a] bg-[#ffdad9] p-1 rounded-md text-[16px]">
              block
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl sm:text-2xl font-bold text-[#ba1a1a] font-mono">
              {(currentYearData?.rejectedSpecimens || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#ba1a1a] font-semibold mt-0.5">
              อัตรา: {currentYearData?.rejectionRate || 0}% (เป้า &lt; 0.5%)
            </p>
          </div>
          <div className="text-[10px] text-[#727781] bg-[#ffdad9]/30 p-1 rounded">
            ยอดปฏิเสธรวมทั้งปี
          </div>
        </div>

        {/* KPI 3: REJECT CLOT */}
        <div className="bg-white border-2 border-[#a90426]/50 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-[#fffbfa] hover:border-[#a90426] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#a90426] uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">grain</span>
              Reject Clot
            </span>
            <span className="material-symbols-outlined text-[#a90426] bg-[#ffdad6] p-1 rounded-md text-[16px]">
              error
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl sm:text-2xl font-bold text-[#a90426] font-mono">
              {(rejectClotStat?.count || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#a90426] font-bold mt-0.5">
              {(rejectClotStat?.percentageOfRejections || 0).toFixed(1)}% ของยอด Reject
            </p>
          </div>
          <div className="text-[10px] text-[#a90426] bg-[#ffdad6]/50 p-1 rounded font-bold">
            EDTA &amp; Citrate Tubes
          </div>
        </div>

        {/* KPI 4: Hemolysis */}
        <div className="bg-white border border-[#c1c7d2] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between hover:border-[#ba1a1a] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#414750] uppercase">Hemolysis (เลือดแตก)</span>
            <span className="material-symbols-outlined text-[#ba1a1a] bg-[#ffdad9] p-1 rounded-md text-[16px]">
              water_drop
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl sm:text-2xl font-bold text-[#ba1a1a] font-mono">
              {(hemolysisStat?.count || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#006e25] font-semibold mt-0.5">
              {(hemolysisStat?.percentageOfRejections || 0).toFixed(1)}% (ลดลงต่อเนื่อง)
            </p>
          </div>
          <div className="text-[10px] text-[#727781] bg-[#f6faff] p-1 rounded">
            เซรั่ม/พลาสมาเคมี
          </div>
        </div>

        {/* KPI 5: Critical Call Compliance */}
        <div className="bg-white border border-[#c1c7d2] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between hover:border-[#006e25] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#006e25] uppercase">แจ้งค่าวิกฤตทางโทรศัพท์</span>
            <span className="material-symbols-outlined text-[#006e25] bg-[#80f98b]/30 p-1 rounded-md text-[16px]">
              ring_volume
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl sm:text-2xl font-bold text-[#006e25] font-mono">
              8.4 <span className="text-xs font-normal text-[#414750]">นาที</span>
            </div>
            <p className="text-[11px] text-[#006e25] font-semibold mt-0.5">
              ผ่านเกณฑ์ 98.6% (เป้า &lt; 15น.)
            </p>
          </div>
          <div className="text-[10px] text-[#727781] bg-[#f6faff] p-1 rounded">
            Red Line Direct Call
          </div>
        </div>

        {/* KPI 6: 5-Year Improvement */}
        <div className="bg-white border border-[#c1c7d2] rounded-2xl p-3.5 shadow-xs flex flex-col justify-between hover:border-[#003e6f] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#003e6f] uppercase">5-Yr Trend</span>
            <span className="material-symbols-outlined text-[#006e25] bg-[#80f98b]/30 p-1 rounded-md text-[16px]">
              trending_down
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-xl sm:text-2xl font-bold text-[#006e25] font-mono">
              {centralStats.overallTrendPercent}%
            </div>
            <p className="text-[11px] text-[#006e25] font-semibold mt-0.5">
              ลดลงอย่างมีนัยสำคัญ
            </p>
          </div>
          <div className="text-[10px] text-[#727781] bg-[#f6faff] p-1 rounded">
            CAPA Effectiveness
          </div>
        </div>
      </div>

      {/* SUBTAB 1: OVERVIEW & 5-YEAR MULTI-SERIES TRENDS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 5-Year Dual-Axis Historical Chart */}
          <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#003e6f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#003e6f]">bar_chart</span>
                  สถิติอุบัติการณ์ความเสี่ยงและยอดตรวจย้อนหลัง (พ.ศ. 2560 - 2569)
                </h3>
                <p className="text-xs text-[#727781] mt-0.5">
                  Historical Multi-Series Comparison: Total Workload, Risk Incidents, and Specimen Rejection Rates
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#003e6f]"></span>
                  ยอดอุบัติการณ์ (Incidents)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#a90426]"></span>
                  ยอด Reject (หลอด)
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-64 flex items-end gap-3 sm:gap-8 pt-8 border-b border-l border-[#c1c7d2] px-4 sm:px-8 relative">
              {/* Y Axis Guides */}
              <div className="absolute -left-10 top-0 h-full flex flex-col justify-between text-[11px] font-mono text-[#727781] py-1">
                <span>180</span>
                <span>135</span>
                <span>90</span>
                <span>45</span>
                <span>0</span>
              </div>

              <div className="absolute inset-0 flex flex-col justify-between pt-8 pb-0 px-4 pointer-events-none">
                <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
                <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
                <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
                <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
                <div className="w-full border-t-0"></div>
              </div>

              {yearlyData.map((d) => {
                const heightPct = Math.min(100, Math.round((d.totalIncidents / maxIncidents) * 100));
                const isSelected = selectedYear === d.year;

                return (
                  <div
                    key={d.year}
                    onClick={() => setSelectedYear(d.year)}
                    className="flex-1 flex flex-col items-center group relative z-10 h-full justify-end cursor-pointer"
                  >
                    <div className="text-center mb-1">
                      <span className="text-[11px] font-mono font-bold text-[#003e6f] block">
                        {d.totalIncidents}
                      </span>
                      <span className="text-[10px] font-mono text-[#a90426] block">
                        {(d.rejectedSpecimens || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="w-full max-w-[56px] flex items-end justify-center gap-1">
                      {/* Bar 1: Incidents */}
                      <div
                        className={`w-1/2 rounded-t-lg transition-all duration-300 shadow-sm ${
                          isSelected
                            ? 'bg-[#003e6f] ring-2 ring-[#005596]'
                            : 'bg-[#003e6f]/70 group-hover:bg-[#003e6f]'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      ></div>
                      {/* Bar 2: Rejections normalized */}
                      <div
                        className={`w-1/2 rounded-t-lg transition-all duration-300 shadow-sm ${
                          isSelected
                            ? 'bg-[#a90426] ring-2 ring-[#ba1a1a]'
                            : 'bg-[#a90426]/70 group-hover:bg-[#a90426]'
                        }`}
                        style={{ height: `${Math.min(100, Math.round((d.rejectedSpecimens / 5000) * 100))}%` }}
                      ></div>
                    </div>

                    <span
                      className={`mt-2 text-xs font-bold ${
                        isSelected ? 'text-[#003e6f] underline' : 'text-[#414750]'
                      }`}
                    >
                      {d.year}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom summary text */}
            <div className="mt-5 p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2] flex items-start gap-3">
              <span className="material-symbols-outlined text-[#003e6f] text-[24px]">clinical_notes</span>
              <div>
                <h4 className="text-xs font-bold text-[#003e6f]">
                  ข้อสรุปและข้อเสนอแนะนักเทคนิคการแพทย์ (MT Review)
                </h4>
                <p className="text-xs text-[#414750] mt-0.5 leading-relaxed">
                  {centralStats.mtSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Root Cause Category Matrix & Harm Level Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 shadow-xs">
              <h4 className="text-sm font-bold text-[#141d23] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#003e6f]">account_tree</span>
                การแจกแจงตามประเภทความเสี่ยง (Category Breakdown - ปี {selectedYear})
              </h4>
              <div className="space-y-3">
                {currentYearData.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="p-3 bg-[#f6faff] rounded-xl border border-[#c1c7d2]/60">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-[#141d23]">{cat.categoryTh} ({cat.category})</span>
                      <span className="text-[#003e6f] font-mono">{cat.count} เคส</span>
                    </div>
                    <div className="w-full bg-[#c1c7d2]/40 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#003e6f] rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, (cat.count / currentYearData.totalIncidents) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Matrix (Level A-I) */}
            <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#141d23] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#a90426]">network_check</span>
                  ระดับความรุนแรงทางการแพทย์ (Severity Matrix Level A - I)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-3 bg-[#e8f5e9] border border-[#a5d6a7] rounded-xl text-center">
                    <div className="text-lg font-bold text-[#2e7d32]">เกือบพลาด</div>
                    <div className="text-[11px] text-[#1b5e20] font-semibold">Level A - B</div>
                    <div className="text-xs font-mono font-bold text-[#2e7d32] mt-1">68.5%</div>
                  </div>
                  <div className="p-3 bg-[#fff8e1] border border-[#ffe082] rounded-xl text-center">
                    <div className="text-lg font-bold text-[#f57f17]">ไม่เกิดอันตราย</div>
                    <div className="text-[11px] text-[#e65100] font-semibold">Level C - D</div>
                    <div className="text-xs font-mono font-bold text-[#f57f17] mt-1">26.2%</div>
                  </div>
                  <div className="p-3 bg-[#ffebee] border border-[#ffcdd2] rounded-xl text-center">
                    <div className="text-lg font-bold text-[#c62828]">เกิดอันตราย / วิกฤต</div>
                    <div className="text-[11px] text-[#b71c1c] font-semibold">Level E - I</div>
                    <div className="text-xs font-mono font-bold text-[#c62828] mt-1">5.3%</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#f6faff] rounded-xl border border-[#c1c7d2]/60 text-xs text-[#414750]">
                <strong>เกณฑ์ความปลอดภัยห้องแลป:</strong> เคสระดับ Level E ขึ้นไปจะถูกส่งเข้ากระบวนการ RCA (Root Cause Analysis) และต้องจัดทำ CAPA ส่งคณะกรรมการบริหารความเสี่ยง รพ. ภายใน 24 ชม.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: REJECT CLOT & SPECIMEN REJECTION DEEP DIVE */}
      {activeSubTab === 'reject_clot' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Focus on Reject Clot */}
          <div className="bg-[#fffbfa] rounded-2xl border-2 border-[#a90426]/40 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#a90426] text-white flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[28px]">grain</span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#a90426]">
                    ศูนย์ติดตามและควบคุมคุณภาพ Reject Clot (เลือดเกิดลิ่มเลือด / Micro-clot)
                  </h3>
                  <p className="text-xs text-[#727781]">
                    การวิเคราะห์สาเหตุเชิงลึกและอัตราการปฏิเสธสิ่งส่งตรวจในหลอด EDTA (CBC) และ 3.2% Sodium Citrate (Coagulogram)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenReportRisk}
                className="px-3.5 py-1.5 bg-[#a90426] hover:bg-[#8f001e] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                บันทึกเคส Reject Clot
              </button>
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-3.5 rounded-xl border border-[#a90426]/30">
                <div className="text-xs font-bold text-[#727781]">จำนวนหลอด Reject Clot ทั้งปี</div>
                <div className="text-2xl font-bold text-[#a90426] font-mono mt-1">
                  {(rejectClotStat?.count || 0).toLocaleString()} <span className="text-xs font-normal text-[#414750]">หลอด</span>
                </div>
                <div className="text-[11px] text-[#a90426] font-semibold mt-1">
                  เฉลี่ย 2.34 หลอดต่อวัน
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#a90426]/30">
                <div className="text-xs font-bold text-[#727781]">สัดส่วนต่อยอด Reject รวม</div>
                <div className="text-2xl font-bold text-[#a90426] font-mono mt-1">
                  {rejectClotStat.percentageOfRejections.toFixed(1)}%
                </div>
                <div className="text-[11px] text-[#727781] mt-1">
                  เป็นสาเหตุอันดับ 2 รองจาก Hemolysis (40%)
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#a90426]/30">
                <div className="text-xs font-bold text-[#727781]">ผลกระทบทางห้องปฏิบัติการ</div>
                <div className="text-xs font-bold text-[#141d23] mt-1">
                  Pseudothrombocytopenia &amp; PT Delay
                </div>
                <div className="text-[11px] text-[#a90426] font-semibold mt-1">
                  อาจเสี่ยงให้เกล็ดเลือดผิดคนหากไม่ตรวจซ้ำ
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Causes Breakdown & Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
              <h4 className="text-sm font-bold text-[#141d23] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#003e6f]">pie_chart</span>
                การกระจายตัวของสาเหตุการปฏิเสธสิ่งส่งตรวจ (Rejection Breakdown)
              </h4>
              <div className="space-y-3">
                {rejectionReasons.map((reason, idx) => {
                  const colorConfig = getReasonColor(reason.reason);
                  const isRejectClot = reason.reason.toLowerCase().includes('clot') || reason.reasonTh.includes('ลิ่มเลือด');

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isRejectClot
                          ? 'bg-[#fffbfa] border-[#a90426]/50 ring-1 ring-[#a90426]/30'
                          : 'bg-[#f6faff] border-[#c1c7d2]/60'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="font-semibold text-[#141d23] flex items-center gap-2 flex-wrap">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorConfig.bg}`}></span>
                          <span className={`font-bold ${isRejectClot ? 'text-[#a90426]' : 'text-[#141d23]'}`}>
                            {reason.reasonTh}
                          </span>
                          {isRejectClot && (
                            <span className="bg-[#ffdad6] text-[#93000a] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              High Risk
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#141d23] font-mono">
                            {(reason.count || 0).toLocaleString()} หลอด
                          </span>
                          <span className={`font-bold ml-2 font-mono ${isRejectClot ? 'text-[#a90426]' : 'text-[#003e6f]'}`}>
                            ({(reason.percentageOfRejections || 0).toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#c1c7d2]/40 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colorConfig.bg} rounded-full`}
                          style={{ width: `${Math.min(100, Math.max(3, reason.percentageOfRejections))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Donut Chart Visual & SOP */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-[#141d23] uppercase">
                    สัดส่วน Rejection Ratio (%)
                  </h4>
                  <span className="text-[11px] text-[#727781] font-mono">รวม {currentYearData.rejectedSpecimens} หลอด</span>
                </div>

                <div className="flex items-center justify-center my-4">
                  <div
                    className="relative w-36 h-36 rounded-full shadow-xs flex items-center justify-center"
                    style={{
                      background:
                        'conic-gradient(#ba1a1a 0% 40.0%, #a90426 40.0% 69.0%, #e26d00 69.0% 85.0%, #003e6f 85.0% 94.0%, #5e35b1 94.0% 98.0%, #535f70 98.0% 100%)',
                    }}
                  >
                    <div className="w-22 h-22 bg-white rounded-full flex flex-col items-center justify-center shadow-inner text-center p-1">
                      <span className="text-lg font-bold text-[#a90426]">29.0%</span>
                      <span className="text-[10px] text-[#727781] font-semibold">ปฏิเสธ (ลิ่มเลือด)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-[#c1c7d2]/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                    <span>Hemolysis: 40%</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-[#a90426]">
                    <span className="w-2 h-2 rounded-full bg-[#a90426]"></span>
                    <span>Reject Clot: 29%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#e26d00]"></span>
                    <span>Underfilled: 16%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#003e6f]"></span>
                    <span>Mislabeled: 9%</span>
                  </div>
                </div>
              </div>

              {/* SOP Inversion Protocol */}
              <div className="bg-[#fffbfa] rounded-2xl border border-[#a90426]/30 p-4 text-xs text-[#414750] space-y-2">
                <div className="font-bold text-[#a90426] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  มาตรฐานป้องกัน Reject Clot (Inversion SOP):
                </div>
                <p className="leading-relaxed">
                  1. พลิกหลอด EDTA/Citrate กลับไปมา <strong>8 - 10 ครั้งทันทีหลังเจาะเลือด</strong><br />
                  2. ห้ามเจาะเลือดส่งตรวจ Coagulation ผ่านสาย Three-way หรือ IV Line ที่มี Heparin ค้าง<br />
                  3. เจ้าหน้าที่แลปใช้ไม้ Applicator Stick ตรวจสอบก้นหลอดก่อนโหลดเครื่องอัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          {/* Rejection By Ward / Hospital Units */}
          <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
            <h4 className="text-sm font-bold text-[#141d23] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#003e6f]">domain</span>
              สถิติสิ่งส่งตรวจถูกปฏิเสธแยกตามตึก / หอผู้ป่วย (Rejection Rate by Ward)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#ecf5fe] text-[#414750] font-bold border-b border-[#c1c7d2]">
                    <th className="py-2.5 px-3">หอผู้ป่วย / แผนก (Ward)</th>
                    <th className="py-2.5 px-3 text-center text-[#a90426]">Reject Clot (หลอด)</th>
                    <th className="py-2.5 px-3 text-center text-[#ba1a1a]">Hemolysis (หลอด)</th>
                    <th className="py-2.5 px-3 text-center text-[#141d23]">ยอด Reject รวม</th>
                    <th className="py-2.5 px-3 text-right">แนวโน้มพัฒนา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c1c7d2]/60">
                  {wardRejectionStats.map((w, idx) => (
                    <tr key={idx} className="hover:bg-[#f6faff]">
                      <td className="py-2.5 px-3 font-semibold text-[#141d23] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#727781]">local_hospital</span>
                        {w.ward}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#a90426] bg-[#fffbfa]">
                        {w.clot}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#ba1a1a]">
                        {w.hemolysis}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#141d23]">
                        {w.totalReject}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={w.trend.startsWith('-') ? 'text-[#006e25]' : 'text-[#ba1a1a]'}>
                          {w.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anticoagulant Tube Breakdown */}
          <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
            <h4 className="text-sm font-bold text-[#141d23] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#003e6f]">colorize</span>
              การวิเคราะห์ตามประเภทหลอดตรวจและสารต้านการแข็งตัว (Tube Types)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tubeTypeStats.map((tube, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#c1c7d2]/70 bg-[#f8fbff] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: tube.color }}>
                        {tube.icon}
                      </span>
                      <span className="font-bold text-xs text-[#141d23]">{tube.type}</span>
                    </div>
                    <div className="text-xs text-[#414750] space-y-1">
                      <div className="flex justify-between">
                        <span>ยอดตรวจประจำปี:</span>
                        <span className="font-mono font-bold">{(tube.total || 0).toLocaleString()} หลอด</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ยอดถูกปฏิเสธ:</span>
                        <span className="font-mono font-bold text-[#ba1a1a]">{tube.reject} หลอด</span>
                      </div>
                      <div className="flex justify-between">
                        <span>อัตราเกิด Clot:</span>
                        <span className="font-mono font-bold text-[#a90426]">{tube.clotPercent}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#c1c7d2]/50 text-[11px] text-[#727781]">
                    <strong>ปัญหาหลัก:</strong> {tube.mainIssue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CLINICAL CHEMISTRY & INTERFERENCE (HIL INDEX) */}
      {activeSubTab === 'chemistry' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#003e6f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#003e6f]">experiment</span>
                  งานเคมีคลินิกและดัชนีสารรบกวน (Clinical Chemistry &amp; HIL Index)
                </h3>
                <p className="text-xs text-[#727781] mt-0.5">
                  การตรวจวัดระดับความเข้มข้นสารเคมีในเลือด (Electrolytes, Renal, LFT, Cardiac Markers) และการตรวจจับสารรบกวนอัตโนมัติ
                </p>
              </div>
              <span className="text-xs bg-[#e8f5e9] text-[#2e7d32] font-bold px-3 py-1 rounded-full border border-[#a5d6a7]">
                Automated HIL Scan 100%
              </span>
            </div>

            {/* 3 Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              <div className="p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2]/60">
                <div className="flex items-center justify-between text-xs font-bold text-[#ba1a1a] mb-2">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">water_drop</span>
                    Hemolysis Index (H-Index)
                  </span>
                  <span className="font-mono">1,180 หลอด</span>
                </div>
                <p className="text-xs text-[#414750]">
                  สารรบกวนหลักต่อค่า Potassium (Pseudo-hyperkalemia), LDH, AST และ Troponin-T
                </p>
              </div>

              <div className="p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2]/60">
                <div className="flex items-center justify-between text-xs font-bold text-[#f57f17] mb-2">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">wb_sunny</span>
                    Icterus Index (I-Index)
                  </span>
                  <span className="font-mono">245 หลอด</span>
                </div>
                <p className="text-xs text-[#414750]">
                  ระดับบิลิรูบินสูงในผู้ป่วยดีซ่าน รบกวนการตรวจวัดค่า Creatinine Enzymatic Method
                </p>
              </div>

              <div className="p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2]/60">
                <div className="flex items-center justify-between text-xs font-bold text-[#7cb342] mb-2">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">opacity</span>
                    Lipemia Index (L-Index)
                  </span>
                  <span className="font-mono">180 หลอด</span>
                </div>
                <p className="text-xs text-[#414750]">
                  ความขุ่นจาก Triglyceride &gt; 1,000 mg/dL ส่งผลต่อการวัดความเข้มแสง Photometer
                </p>
              </div>
            </div>

            {/* Test Volume Distribution Bar */}
            <div className="mt-6 pt-4 border-t border-[#c1c7d2]/60">
              <h4 className="text-xs font-bold text-[#141d23] uppercase mb-3">
                สัดส่วนการตรวจวิเคราะห์แยกตามชุดการตรวจ (Chemistry Panels Volume)
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">Electrolytes (Na, K, Cl, CO2)</span>
                    <span className="font-mono font-bold">385,000 การทดสอบ (39.1%)</span>
                  </div>
                  <div className="w-full bg-[#c1c7d2]/40 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#003e6f] rounded-full" style={{ width: '39.1%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">Renal Function (BUN, Creatinine, eGFR)</span>
                    <span className="font-mono font-bold">245,000 การทดสอบ (24.8%)</span>
                  </div>
                  <div className="w-full bg-[#c1c7d2]/40 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0288d1] rounded-full" style={{ width: '24.8%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">Liver Function Test (AST, ALT, ALP, Total Protein, Albumin, TB/DB)</span>
                    <span className="font-mono font-bold">198,000 การทดสอบ (20.1%)</span>
                  </div>
                  <div className="w-full bg-[#c1c7d2]/40 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00897b] rounded-full" style={{ width: '20.1%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">Cardiac Markers (hs-Troponin-I, CK-MB, NT-proBNP)</span>
                    <span className="font-mono font-bold">62,000 การทดสอบ (6.3%)</span>
                  </div>
                  <div className="w-full bg-[#c1c7d2]/40 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#a90426] rounded-full" style={{ width: '6.3%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: HEMATOLOGY & COAGULATION */}
      {activeSubTab === 'hematology' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#003e6f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#003e6f]">bloodtype</span>
                  งานโลหิตวิทยา (Hematology / CBC) &amp; การแข็งตัวของเลือด (Coagulation)
                </h3>
                <p className="text-xs text-[#727781] mt-0.5">
                  Complete Blood Count, Peripheral Blood Smear Review, PT/INR, aPTT, Fibrinogen, D-Dimer
                </p>
              </div>
            </div>

            {/* Grid 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CBC Analyzer Flags */}
              <div className="p-4 bg-[#f8fbff] rounded-xl border border-[#c1c7d2]/70">
                <h4 className="text-xs font-bold text-[#003e6f] uppercase mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">flag</span>
                  การแจ้งเตือนความผิดปกติในเครื่อง CBC (Analyzer Flags)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-[#c1c7d2]/60 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#a90426]">เกล็ดเลือดจับตัว / สัญญาณลิ่มเลือดเล็ก</div>
                      <div className="text-[11px] text-[#727781]">เสี่ยงรายงานผลเกล็ดเลือดต่ำเทียม</div>
                    </div>
                    <span className="font-mono font-bold text-[#a90426] bg-[#ffdad6] px-2 py-0.5 rounded">
                      428 เคส
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-[#c1c7d2]/60 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#e65100]">Cold Agglutinin Flag (RBC Clumping)</div>
                      <div className="text-[11px] text-[#727781]">MCHC &gt; 37.0 g/dL ต้องนำไปอบ 37°C</div>
                    </div>
                    <span className="font-mono font-bold text-[#e65100] bg-[#ffe082]/40 px-2 py-0.5 rounded">
                      56 เคส
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-[#c1c7d2]/60 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#003e6f]">แจ้งเตือน Blast / เม็ดเลือดขาวไม่สมบูรณ์</div>
                      <div className="text-[11px] text-[#727781]">ส่งย้อมสไลด์ส่องกล้องยืนยัน 100%</div>
                    </div>
                    <span className="font-mono font-bold text-[#003e6f] bg-[#d3e4ff] px-2 py-0.5 rounded">
                      112 เคส
                    </span>
                  </div>
                </div>
              </div>

              {/* Coagulation Quality Indicators */}
              <div className="p-4 bg-[#f8fbff] rounded-xl border border-[#c1c7d2]/70">
                <h4 className="text-xs font-bold text-[#003e6f] uppercase mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">science</span>
                  ดัชนีคุณภาพงาน Coagulogram (PT/PTT/INR)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-[#c1c7d2]/60 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#a90426]">Fibrin Clot ในหลอด Citrate</div>
                      <div className="text-[11px] text-[#727781]">สูญเสีย Coagulation Factors</div>
                    </div>
                    <span className="font-mono font-bold text-[#a90426] bg-[#ffdad6] px-2 py-0.5 rounded">
                      338 หลอด
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-[#c1c7d2]/60 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#ba1a1a]">Underfilled Tube (&lt; 90% Fill Line)</div>
                      <div className="text-[11px] text-[#727781]">อัตราส่วน Citrate:Blood ผิดเพี้ยน</div>
                    </div>
                    <span className="font-mono font-bold text-[#ba1a1a] bg-[#ffdad9] px-2 py-0.5 rounded">
                      74 หลอด
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-[#c1c7d2]/60 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#006e25]">Stroke Fast Track PT/INR &lt; 20 นาที</div>
                      <div className="text-[11px] text-[#727781]">สำหรับผู้ป่วยพิจารณาให้ rt-PA</div>
                    </div>
                    <span className="font-mono font-bold text-[#006e25] bg-[#80f98b]/30 px-2 py-0.5 rounded">
                      99.2% ผ่าน
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: TURNAROUND TIME & CRITICAL VALUE ALERTS */}
      {activeSubTab === 'tat_critical' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#003e6f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#003e6f]">timer</span>
              Turnaround Time (TAT) &amp; Critical Value Reporting (CVR)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2]/60">
                <div className="text-xs font-bold text-[#727781]">เวลารายงานผลด่วน (STAT)</div>
                <div className="text-2xl font-bold text-[#003e6f] font-mono mt-1">
                  24.2 <span className="text-xs font-normal">นาที</span>
                </div>
                <div className="text-[11px] text-[#006e25] font-semibold mt-1">
                  ผ่านเกณฑ์มาตรฐาน &lt; 30 นาที (97.4%)
                </div>
              </div>

              <div className="p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2]/60">
                <div className="text-xs font-bold text-[#727781]">เวลารายงานผลผู้ป่วยใน (ปกติ)</div>
                <div className="text-2xl font-bold text-[#003e6f] font-mono mt-1">
                  48.6 <span className="text-xs font-normal">นาที</span>
                </div>
                <div className="text-[11px] text-[#006e25] font-semibold mt-1">
                  ผ่านเกณฑ์มาตรฐาน &lt; 60 นาที (98.9%)
                </div>
              </div>

              <div className="p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2]/60">
                <div className="text-xs font-bold text-[#727781]">เวลาโทรแจ้งค่าวิกฤต</div>
                <div className="text-2xl font-bold text-[#006e25] font-mono mt-1">
                  8.4 <span className="text-xs font-normal">นาที</span>
                </div>
                <div className="text-[11px] text-[#006e25] font-semibold mt-1">
                  เป้าหมาย HA/ISO &lt; 15 นาที (98.6%)
                </div>
              </div>
            </div>

            {/* Critical Value Parameters Standard */}
            <div className="p-4 bg-[#fff8e1] rounded-xl border border-[#ffe082]">
              <h4 className="text-xs font-bold text-[#5d4037] uppercase mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#f57f17]">warning</span>
                เกณฑ์ค่าวิกฤตที่ต้องโทรแจ้งทันที (Critical Value Criteria Log):
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#5d4037]">
                <div>• Potassium: &lt; 2.8 หรือ &gt; 6.0 mmol/L</div>
                <div>• Glucose: &lt; 45 หรือ &gt; 450 mg/dL</div>
                <div>• Platelet: &lt; 20,000 หรือ &gt; 1,000,000 /uL</div>
                <div>• Hemoglobin: &lt; 7.0 g/dL</div>
                <div>• Troponin-T: &gt; 50 ng/L (Fast Track)</div>
                <div>• INR: &gt; 5.0 (เสี่ยงตกเลือด)</div>
                <div>• Sodium: &lt; 120 หรือ &gt; 160 mmol/L</div>
                <div>• Blood pH: &lt; 7.20 หรือ &gt; 7.60</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: IQC & EQUIPMENT MAINTENANCE */}
      {activeSubTab === 'iqc_equipment' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
            <h3 className="text-lg font-bold text-[#003e6f] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#003e6f]">precision_manufacturing</span>
              การควบคุมคุณภาพภายใน (IQC) และการบำรุงรักษาเครื่องวิเคราะห์อัตโนมัติ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#f8fbff] rounded-xl border border-[#c1c7d2]/70">
                <h4 className="text-xs font-bold text-[#003e6f] uppercase mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">checklist</span>
                  สถานะการทำงานเครื่องวิเคราะห์ (Analyzer Health Status)
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-[#c1c7d2]/60">
                    <div>
                      <div className="font-bold text-[#141d23]">Cobas c501 (Chemistry Analyzer 1)</div>
                      <div className="text-[11px] text-[#727781]">Daily QC: Passed | Lamp Life: 92%</div>
                    </div>
                    <span className="bg-[#80f98b]/40 text-[#006e25] px-2 py-0.5 rounded font-bold">ใช้งานปกติ</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-[#c1c7d2]/60">
                    <div>
                      <div className="font-bold text-[#141d23]">Sysmex XN-1000 (Hematology Analyzer)</div>
                      <div className="text-[11px] text-[#727781]">Daily QC: Passed | Background: Normal</div>
                    </div>
                    <span className="bg-[#80f98b]/40 text-[#006e25] px-2 py-0.5 rounded font-bold">ใช้งานปกติ</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-[#c1c7d2]/60">
                    <div>
                      <div className="font-bold text-[#141d23]">ACL TOP 550 (Coagulation Analyzer)</div>
                      <div className="text-[11px] text-[#727781]">Daily QC: Passed | Reagent Temp: 4.1°C</div>
                    </div>
                    <span className="bg-[#80f98b]/40 text-[#006e25] px-2 py-0.5 rounded font-bold">ใช้งานปกติ</span>
                  </div>
                </div>
              </div>

              {/* Westgard Rules */}
              <div className="p-4 bg-[#f8fbff] rounded-xl border border-[#c1c7d2]/70">
                <h4 className="text-xs font-bold text-[#003e6f] uppercase mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
                  การละเมิดกฎ Westgard Rules ในรอบปี
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-[#c1c7d2]/60">
                    <span>1-2s (Warning Rule):</span>
                    <span className="font-mono font-bold text-[#f57f17]">18 ครั้ง (เฝ้าระวัง)</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-[#c1c7d2]/60">
                    <span>1-3s (Random Error Reject):</span>
                    <span className="font-mono font-bold text-[#ba1a1a]">4 ครั้ง (Re-calibrated)</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-[#c1c7d2]/60">
                    <span>2-2s (Systematic Error Reject):</span>
                    <span className="font-mono font-bold text-[#ba1a1a]">2 ครั้ง (Reagent change)</span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded-lg border border-[#c1c7d2]/60">
                    <span>R-4s (Range Error Reject):</span>
                    <span className="font-mono font-bold text-[#ba1a1a]">1 ครั้ง (Probe rinse)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 7: LIVE GOOGLE SHEET DATA INGESTION VIEW */}
      {activeSubTab === 'google_sheet' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#80f98b]/40 text-[#006e25] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#006e25] animate-ping"></span>
                    Direct Connected
                  </span>
                  <span className="text-xs text-[#727781] font-mono">GID: 866685160</span>
                </div>
                <h3 className="text-xl font-bold text-[#003e6f]">
                  Google Sheet Ingestion Database (Central Lab)
                </h3>
                <p className="text-xs text-[#727781]">
                  ฐานข้อมูล Google Spreadsheet สำหรับนำเข้าข้อมูลอุบัติการณ์และรายงานความเสี่ยงแบบเรียลไทม์
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://docs.google.com/spreadsheets/d/1ZoOv9s1ILsCj3GgmNDqWqL_CgNuyIb3sjMJyadD2cP4/edit?gid=866685160#gid=866685160"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#007327] hover:bg-[#005e20] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  เปิด Google Sheet ต้นฉบับ
                </a>
                <button
                  type="button"
                  onClick={onOpenGoogleSync}
                  className="px-3.5 py-2 bg-[#003e6f] hover:bg-[#004881] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  ตั้งค่า Sync Config
                </button>
              </div>
            </div>

            {/* Embedded Live Sheet Frame */}
            <div className="border border-[#c1c7d2] rounded-xl overflow-hidden shadow-xs bg-[#faf8fd] p-3">
              <iframe
                src="https://docs.google.com/spreadsheets/d/1ZoOv9s1ILsCj3GgmNDqWqL_CgNuyIb3sjMJyadD2cP4/htmlembed?gid=866685160&widget=true&headers=false"
                title="Google Sheet Live Ingestion"
                className="w-full h-[550px] border-0 rounded-lg bg-white"
              >
                กำลังโหลด Google Sheet...
              </iframe>
            </div>
          </div>
        </div>
      )}

      {/* Incidents Table with Filter & Search */}
      <div className="bg-white rounded-2xl border border-[#c1c7d2] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#c1c7d2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#f6faff]">
          <div>
            <h4 className="text-base font-bold text-[#141d23] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#003e6f]">list_alt</span>
              รายการอุบัติการณ์ความเสี่ยง ห้องปฏิบัติการกลาง (Central Lab Log Table)
            </h4>
            <p className="text-xs text-[#727781]">บันทึกความเสี่ยง, เคส Reject Clot, Hemolysis, TAT Delay, และการแก้ไข CAPA</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Filters */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#c1c7d2] text-xs">
              <button
                type="button"
                onClick={() => setIncidentFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  incidentFilter === 'all' ? 'bg-[#003e6f] text-white' : 'text-[#414750] hover:bg-[#ecf5fe]'
                }`}
              >
                ทั้งหมด ({centralIncidents.length})
              </button>
              <button
                type="button"
                onClick={() => setIncidentFilter('reject_clot')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  incidentFilter === 'reject_clot' ? 'bg-[#a90426] text-white' : 'text-[#a90426] hover:bg-[#ffdad6]'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">grain</span>
                Reject Clot
              </button>
              <button
                type="button"
                onClick={() => setIncidentFilter('hemolysis')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  incidentFilter === 'hemolysis' ? 'bg-[#ba1a1a] text-white' : 'text-[#ba1a1a] hover:bg-[#ffdad9]'
                }`}
              >
                Hemolysis
              </button>
              <button
                type="button"
                onClick={() => setIncidentFilter('critical')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  incidentFilter === 'critical' ? 'bg-[#ffdad6] text-[#93000a]' : 'text-[#93000a] hover:bg-[#ffdad6]/50'
                }`}
              >
                Critical
              </button>
              <button
                type="button"
                onClick={() => setIncidentFilter('tat')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  incidentFilter === 'tat' ? 'bg-[#003e6f] text-white' : 'text-[#003e6f] hover:bg-[#d3e4ff]'
                }`}
              >
                TAT / CVR
              </button>
              <button
                type="button"
                onClick={() => setIncidentFilter('qc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  incidentFilter === 'qc' ? 'bg-[#5e35b1] text-white' : 'text-[#5e35b1] hover:bg-[#ede7f6]'
                }`}
              >
                IQC / Analyzer
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenReportRisk}
              className="px-3.5 py-1.5 bg-[#003e6f] text-white rounded-xl text-xs font-bold hover:bg-[#004881] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              บันทึกใหม่
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#ecf5fe] text-xs font-semibold text-[#414750] border-b border-[#c1c7d2] uppercase">
                <th className="py-3 px-4">รหัสอุบัติการณ์</th>
                <th className="py-3 px-4">หัวข้อ / รายละเอียด</th>
                <th className="py-3 px-4">ขั้นตอน / สิ่งส่งตรวจ</th>
                <th className="py-3 px-4">ผู้ป่วย / HN</th>
                <th className="py-3 px-4">ระดับความรุนแรง</th>
                <th className="py-3 px-4">วันที่ / เวลา</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#141d23] divide-y divide-[#c1c7d2]/70">
              {filteredIncidents.map((incident, idx) => {
                const isClot = incident.type.toLowerCase().includes('clot') || incident.title.toLowerCase().includes('clot');
                return (
                  <tr key={`${incident.id || 'inc'}-${idx}`} className={`transition-colors ${isClot ? 'bg-[#fffbfa] hover:bg-[#ffedea]' : 'hover:bg-[#f6faff]'}`}>
                    <td className="py-3 px-4 font-mono font-bold text-[#003e6f]">
                      {incident.incidentId}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-[#141d23] flex items-center gap-1.5">
                        {isClot && (
                          <span className="bg-[#ffdad6] text-[#93000a] text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                            Reject Clot
                          </span>
                        )}
                        <span className="truncate">{incident.title}</span>
                      </div>
                      <div className="text-[11px] text-[#727781] line-clamp-1">{incident.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#414750]">{incident.stage || incident.type}</div>
                      <div className="text-[11px] text-[#727781]">{incident.specimen}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#003e6f]">
                      {incident.patientHn || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          incident.riskLevel === 'Critical'
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : incident.riskLevel === 'High Risk'
                            ? 'bg-[#ffdad9] text-[#7e0019]'
                            : 'bg-[#d3e4ff] text-[#003e6f]'
                        }`}>
                          {incident.severityMatrix || translateRiskLevel(incident.riskLevel)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#727781]">
                      {incident.date} {incident.time ? `(${incident.time})` : ''}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#006e25]">
                      <span className="bg-[#80f98b]/30 px-2 py-0.5 rounded-full text-[11px] font-bold">
                        {translateStatus(incident.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectIncident(incident)}
                        className="text-[#003e6f] font-bold hover:underline cursor-pointer flex items-center gap-1 justify-end ml-auto"
                      >
                        <span>รายละเอียด</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#727781]">
                    ไม่พบรายการอุบัติการณ์ในตัวกรองนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
