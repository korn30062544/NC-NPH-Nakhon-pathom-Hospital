import React, { useState } from 'react';
import { RiskIncident, Department5YearStats } from '../types';
import { YearSelectorBar } from './YearSelectorBar';
import { translateRiskLevel, translateStatus } from '../utils/labels';

interface BloodBankDashboardProps {
  incidents: RiskIncident[];
  stats: Department5YearStats;
  onOpenReportRisk: () => void;
  onOpenDataUpload: () => void;
  onOpenExportReport: () => void;
  onOpenGoogleSync: () => void;
  onSelectIncident: (incident: RiskIncident) => void;
}

export const BloodBankDashboard: React.FC<BloodBankDashboardProps> = ({
  incidents,
  stats,
  onOpenReportRisk,
  onOpenDataUpload,
  onOpenExportReport,
  onOpenGoogleSync,
  onSelectIncident,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  const bloodStats: Department5YearStats = stats;
  const yearlyData = bloodStats.yearlyData;

  const currentYearData =
    yearlyData.find((y) => y.year === selectedYear) || yearlyData[yearlyData.length - 1];

  const bloodIncidents = incidents.filter(
    (i) => i.departmentKey === 'blood' || i.department.toLowerCase().includes('blood')
  );

  // Maximum value for bar scaling in 5-year chart
  const maxYearIncidents = Math.max(...yearlyData.map((d) => d.totalIncidents), 120);

  // Total reject specimen stats for current selected year
  const totalSpecimens = currentYearData.totalSpecimens;
  const rejectedCount = currentYearData.rejectedSpecimens;
  const rejectionRate = currentYearData.rejectionRate;
  const wrongBloodCases = currentYearData.wrongBloodDispenseCases ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-[#ecf5fe] min-w-0 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c1c7d2] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 flex items-center justify-center text-[#ba1a1a]">
            <span className="material-symbols-outlined text-[28px] fill">bloodtype</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#ba1a1a] text-white px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase">
                High Critical Lab Unit
              </span>
              <span className="text-xs text-[#006e25] bg-[#80f98b]/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006e25]"></span>
                Zero Wrong Transfusion (2568-2569)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#003e6f] mt-0.5">
              ห้องธนาคารเลือด (Blood Bank)
            </h2>
            <p className="text-xs sm:text-sm text-[#414750]">
              ระบบควบคุมความปลอดภัยด้านการให้เลือด การวิเคราะห์สิ่งส่งตรวจถูกปฏิเสธ (Reject Specimen) และสถิติย้อนหลัง 5-10 ปี
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={onOpenGoogleSync}
            className="px-3 py-1.5 bg-[#f6faff] border border-[#005596]/40 text-[#003e6f] rounded-lg text-xs font-semibold hover:bg-[#d3e4ff]/50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#007327]">sync_saved_locally</span>
            Google Sheets/Form
          </button>

          <button
            type="button"
            onClick={onOpenDataUpload}
            className="px-3 py-1.5 bg-white border border-[#c1c7d2] text-[#414750] rounded-lg text-xs font-semibold hover:bg-[#e0e9f2] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            อัปโหลดไฟล์ LIS
          </button>

          <button
            type="button"
            onClick={onOpenExportReport}
            className="px-3 py-1.5 bg-white border border-[#c1c7d2] text-[#003e6f] rounded-lg text-xs font-semibold hover:bg-[#e0e9f2] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export Report
          </button>

          <button
            type="button"
            onClick={onOpenReportRisk}
            className="px-3.5 py-1.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_alert</span>
            รายงานความเสี่ยงธนาคารเลือด
          </button>
        </div>
      </div>

      {/* Year Selector with 5-Year default and 10-Year historical data */}
      <YearSelectorBar
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        yearlyData={yearlyData}
        latestYear={2569}
        deptThName="ห้องธนาคารเลือด"
      />

      {/* 4 Essential Blood Bank Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Wrong Blood / Wrong Recipient */}
        <div className="bg-white border-2 border-[#ba1a1a]/40 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#ba1a1a] uppercase tracking-wider">
              จ่ายเลือดผิดคน / ผิดชนิด (Sentinel Event)
            </span>
            <span className="material-symbols-outlined text-[#ba1a1a] bg-[#ffdad9] p-1 rounded-md text-[18px]">
              warning
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#141d23]">
              {wrongBloodCases}{' '}
              <span className="text-sm font-normal text-[#727781]">เคส / ปี {selectedYear}</span>
            </div>
            <p className="text-xs text-[#006e25] font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              {wrongBloodCases === 0 ? 'ปลอดภัย 100% (Zero Error)' : 'เกิดเหตุคลาดเคลื่อน'}
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded border border-[#c1c7d2]/50">
            เทียบ 5 ปีย้อนหลัง: 2565 (3 เคส) ➔ 2569 (0 เคส)
          </div>
        </div>

        {/* KPI 2: Total Received vs Rejected Specimens */}
        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase tracking-wider">
              ยอดรับสิ่งส่งตรวจทั้งหมด (Total Cases)
            </span>
            <span className="material-symbols-outlined text-[#003e6f] bg-[#d3e4ff] p-1 rounded-md text-[18px]">
              biotech
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#141d23]">
              {(totalSpecimens || 0).toLocaleString()}{' '}
              <span className="text-sm font-normal text-[#727781]">หลอด</span>
            </div>
            <p className="text-xs text-[#414750] mt-1">
              สิ่งส่งตรวจถูกปฏิเสธ (Rejected):{' '}
              <span className="font-bold text-[#ba1a1a]">{(rejectedCount || 0).toLocaleString()} หลอด</span>
            </p>
          </div>
          <div className="text-[11px] text-[#006e25] font-semibold bg-[#80f98b]/20 p-1.5 rounded">
            อัตราผ่านการตรวจ: {(100 - (rejectionRate || 0)).toFixed(2)}%
          </div>
        </div>

        {/* KPI 3: Rejection Rate % */}
        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase tracking-wider">
              อัตราการปฏิเสธสิ่งส่งตรวจ (Reject Rate)
            </span>
            <span className="material-symbols-outlined text-[#ba1a1a] bg-[#ffdad9] p-1 rounded-md text-[18px]">
              do_not_disturb_on
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#ba1a1a]">
              {rejectionRate.toFixed(2)}%
            </div>
            <p className="text-xs text-[#006e25] font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_down</span>
              เป้าหมายโรงพยาบาล: &lt; 1.00% (ผ่านเกณฑ์)
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded border border-[#c1c7d2]/50">
            ลดลงจาก 1.48% (2565) สู่ 0.42% (2569)
          </div>
        </div>

        {/* KPI 4: 5-Year Overall Trend */}
        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase tracking-wider">
              แนวโน้มความเสี่ยง 5 ปี (Overall 5Y Trend)
            </span>
            <span className="material-symbols-outlined text-[#006e25] bg-[#80f98b]/30 p-1 rounded-md text-[18px]">
              insights
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#006e25]">
              {bloodStats.overallTrendPercent}%
            </div>
            <p className="text-xs text-[#006e25] font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              อุบัติการณ์ความเสี่ยงลดลงต่อเนื่อง
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded border border-[#c1c7d2]/50">
            เกณฑ์มาตรฐานสากล ISO 15189 &amp; HA
          </div>
        </div>
      </div>

      {/* SECTION 1: DETAILED REJECT SPECIMEN ANALYSIS (Pie Chart + Detailed Reason Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Rejection Reason Percent Breakdown Table & Progress (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#c1c7d2] p-5 shadow-xs">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">fact_check</span>
                <h3 className="text-base sm:text-lg font-bold text-[#141d23]">
                  วิเคราะห์สาเหตุการปฏิเสธสิ่งส่งตรวจ (Reject Specimen Reasons)
                </h3>
              </div>
              <p className="text-xs text-[#727781] mt-0.5">
                จำแนกตามสาเหตุ จำนวนครั้ง และคิดเป็นเปอร์เซ็นต์ของสิ่งส่งตรวจที่ถูกปฏิเสธทั้งหมดในปี {selectedYear} ({rejectedCount} หลอด)
              </p>
            </div>
            <span className="bg-[#ecf5fe] text-[#003e6f] font-mono text-xs px-2.5 py-1 rounded-lg font-bold">
              ปี {selectedYear}
            </span>
          </div>

          <div className="space-y-3.5">
            {(currentYearData.rejectionReasons || []).map((reason, idx) => {
              // Color palette for causes
              const barColors = [
                'bg-[#ba1a1a]', // Hemolysis (Top)
                'bg-[#003e6f]', // Clotted
                'bg-[#005596]', // Mislabeled
                'bg-[#e26d00]', // Underfilled
                'bg-[#727781]', // Wrong tube
                'bg-[#a90426]', // Expired
              ];
              const color = barColors[idx % barColors.length];

              return (
                <div key={idx} className="bg-[#f6faff] p-3 rounded-lg border border-[#c1c7d2]/60 hover:bg-[#ecf5fe] transition-colors">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <div className="font-semibold text-[#141d23] flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
                      <span>{reason.reasonTh}</span>
                      <span className="text-[#727781] font-normal hidden sm:inline">({reason.reason})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#141d23] font-mono">{reason.count} หลอด</span>
                      <span className="text-[#ba1a1a] font-bold ml-2 font-mono">
                        ({reason.percentageOfRejections.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-[#c1c7d2]/40 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${reason.percentageOfRejections}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-[#fff8e1] rounded-lg border border-[#ffe082] text-xs text-[#8d6e63]">
            <span className="font-bold text-[#5d4037]">ข้อเสนอแนะนักเทคนิคการแพทย์ (MT Recommendation):</span>{' '}
            สาเหตุหลักของ Reject Specimen ในธนาคารเลือดเกิดจาก <strong>เลือดแตกตัว (Hemolysis ~42%)</strong> และ{' '}
            <strong>เลือดแข็งตัว (Clotted ~27%)</strong> ควรเน้นย้ำการผสมเลือดกับสารกันเลือดแข็ง EDTA ทันทีหลังเจาะ 8-10 ครั้ง
          </div>
        </div>

        {/* Right Col: Pie / Donut Chart & Transfusion Error 5-Year Bar Chart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Donut Chart Component */}
          <div className="bg-white rounded-xl border border-[#c1c7d2] p-5 shadow-xs flex flex-col justify-between flex-1">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-[#141d23] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#003e6f] text-[18px]">pie_chart</span>
                สัดส่วนสาเหตุ Reject Specimen (%)
              </h4>
              <span className="text-[11px] text-[#727781] font-mono">Total {rejectedCount}</span>
            </div>

            {/* Custom Pie Visual */}
            <div className="flex items-center justify-center my-3">
              <div
                className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full shadow-xs flex items-center justify-center"
                style={{
                  background:
                    'conic-gradient(#ba1a1a 0% 42.1%, #003e6f 42.1% 69.1%, #005596 69.1% 81.6%, #e26d00 81.6% 93.4%, #727781 93.4% 98%, #a90426 98% 100%)',
                }}
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-xl font-bold text-[#ba1a1a]">{rejectionRate}%</span>
                  <span className="text-[10px] text-[#727781]">อัตราการปฏิเสธ</span>
                </div>
              </div>
            </div>

            {/* Mini Legend */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a] shrink-0"></span>
                <span className="truncate">Hemolysis: 42.1%</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#003e6f] shrink-0"></span>
                <span className="truncate">Clotted: 27.0%</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#005596] shrink-0"></span>
                <span className="truncate">Mislabeled: 12.5%</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#e26d00] shrink-0"></span>
                <span className="truncate">Underfilled: 11.8%</span>
              </div>
            </div>
          </div>

          {/* 5-Year Wrong Blood Transfused Comparison Box */}
          <div className="bg-[#fffbfa] rounded-xl border-2 border-[#ba1a1a]/30 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">gavel</span>
                <h4 className="text-xs sm:text-sm font-bold text-[#ba1a1a]">
                  สถิติจ่ายเลือดผิดคน/ผิดชนิด ย้อนหลัง 5 ปี
                </h4>
              </div>
              <span className="text-[11px] bg-[#ffdad9] text-[#7e0019] px-2 py-0.5 rounded font-bold">
                Zero Error Goal
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center pt-1">
              {yearlyData.map((y) => {
                const count = y.wrongBloodDispenseCases ?? 0;
                const isZero = count === 0;
                return (
                  <div
                    key={y.year}
                    className={`p-2 rounded-lg border ${
                      isZero
                        ? 'bg-[#80f98b]/20 border-[#006e25]/40 text-[#006e25]'
                        : 'bg-[#ffdad9]/60 border-[#ba1a1a]/40 text-[#ba1a1a]'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{y.year}</div>
                    <div className="text-xl font-extrabold my-0.5">{count}</div>
                    <div className="text-[10px] font-semibold">{isZero ? 'ผ่าน (0)' : 'เคส'}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-[#414750] mt-2.5">
              💡 ผลสำเร็จ: มีการนำระบบ 2-Step Barcode Confirmation บังคับสแกนที่เตียงผู้ป่วย ทำให้ <strong>2 ปีล่าสุด (2568-2569) เกิด 0 เคส</strong>
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: HISTORICAL BAR CHARTS & CATEGORY ANALYSIS */}
      <div className="bg-white rounded-xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#003e6f] text-[22px]">stacked_bar_chart</span>
              <h3 className="text-lg font-bold text-[#141d23]">
                สถิติความเสี่ยงย้อนหลัง (พ.ศ. 2560 - 2569) แยกตามหมวดหมู่
              </h3>
            </div>
            <p className="text-xs text-[#727781] mt-0.5">
              Historical Risk Trends &amp; NC Categories in Blood Bank
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#ecf5fe] p-1 rounded-lg border border-[#c1c7d2]/60">
            <span className="text-xs font-semibold px-2 text-[#414750]">หมวดหมู่:</span>
            <button
              type="button"
              onClick={() => setSelectedCategoryTab('all')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryTab === 'all'
                  ? 'bg-[#003e6f] text-white shadow-xs'
                  : 'text-[#414750] hover:bg-[#d3e4ff]'
              }`}
            >
              ทั้งหมด (Total)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryTab('reject')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryTab === 'reject'
                  ? 'bg-[#003e6f] text-white shadow-xs'
                  : 'text-[#414750] hover:bg-[#d3e4ff]'
              }`}
            >
              Reject Specimen
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryTab('crossmatch')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryTab === 'crossmatch'
                  ? 'bg-[#003e6f] text-white shadow-xs'
                  : 'text-[#414750] hover:bg-[#d3e4ff]'
              }`}
            >
              Crossmatch Discrepancy
            </button>
          </div>
        </div>

        {/* 5-Year Interactive Bar Chart Visual */}
        <div className="h-64 flex items-end gap-4 sm:gap-8 pt-8 border-b border-l border-[#c1c7d2] px-4 sm:px-8 relative">
          {/* Y Axis Guides */}
          <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-[11px] font-mono text-[#727781] py-1">
            <span>120</span>
            <span>90</span>
            <span>60</span>
            <span>30</span>
            <span>0</span>
          </div>

          <div className="absolute inset-0 flex flex-col justify-between pt-8 pb-0 px-4 pointer-events-none">
            <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
            <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
            <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
            <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
            <div className="w-full border-t-0"></div>
          </div>

          {yearlyData.map((d, index) => {
            const heightPct = Math.min(100, Math.round((d.totalIncidents / maxYearIncidents) * 100));
            const isSelected = selectedYear === d.year;

            // Trend indicator vs previous year
            const prevYear = index > 0 ? yearlyData[index - 1] : null;
            const diff = prevYear ? d.totalIncidents - prevYear.totalIncidents : 0;
            const pctChange = prevYear
              ? (((d.totalIncidents - prevYear.totalIncidents) / prevYear.totalIncidents) * 100).toFixed(1)
              : null;

            return (
              <div
                key={d.year}
                onClick={() => setSelectedYear(d.year)}
                className="flex-1 flex flex-col items-center group relative z-10 h-full justify-end cursor-pointer"
              >
                {/* Floating Tooltip Pill */}
                <div className="mb-1 text-center">
                  <span className="text-xs font-mono font-bold text-[#003e6f] block">
                    {d.totalIncidents}
                  </span>
                  {pctChange !== null && (
                    <span
                      className={`text-[10px] font-bold block ${
                        diff <= 0 ? 'text-[#006e25]' : 'text-[#ba1a1a]'
                      }`}
                    >
                      {diff <= 0 ? `▼ ${Math.abs(Number(pctChange))}%` : `▲ +${pctChange}%`}
                    </span>
                  )}
                </div>

                {/* The Bar */}
                <div
                  className={`w-full max-w-[56px] rounded-t-lg transition-all duration-300 shadow-sm ${
                    isSelected
                      ? 'bg-[#003e6f] ring-2 ring-[#005596] ring-offset-2'
                      : 'bg-[#a90426] group-hover:bg-[#005596]'
                  }`}
                  style={{ height: `${heightPct}%` }}
                ></div>

                {/* X Axis Label */}
                <span
                  className={`mt-2 text-xs font-bold ${
                    isSelected ? 'text-[#003e6f] underline' : 'text-[#414750]'
                  }`}
                >
                  {d.year}
                </span>
                <span className="text-[10px] text-[#727781]">
                  (Reject {d.rejectedSpecimens})
                </span>
              </div>
            );
          })}
        </div>

        {/* 5-Year Statistical Summary & MT Review */}
        <div className="mt-6 p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2] flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#003e6f] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">clinical_notes</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#003e6f]">
              ข้อสรุปทางเทคนิคการแพทย์และการวิเคราะห์แนวโน้ม 5 ปี (MT Statistical Clinical Review)
            </h4>
            <p className="text-xs text-[#414750] mt-1 leading-relaxed">
              {bloodStats.mtSummary}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="bg-[#80f98b]/30 text-[#007327] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                ✓ อัตรา Reject Specimen ลดลง 71.6% จากปี 2019
              </span>
              <span className="bg-[#d3e4ff] text-[#003e6f] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                ✓ Crossmatch Error ลดลงจาก 28 รายการ ➔ 14 รายการ
              </span>
              <span className="bg-[#ffdad9] text-[#7e0019] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                ✓ ความผิดพลาดในการจ่ายเลือดเป็น 0 เคส
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: BLOOD BANK RECENT RISK INCIDENTS TABLE */}
      <div className="bg-white rounded-xl border border-[#c1c7d2] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#c1c7d2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#f6faff]">
          <div>
            <h4 className="text-base font-bold text-[#141d23]">
              รายการบันทึกอุบัติการณ์ความเสี่ยง ธนาคารเลือด (Incident Log)
            </h4>
            <p className="text-xs text-[#727781]">บันทึกการแก้ไขและมาตรการป้องกัน CAPA แบบ Real-time</p>
          </div>

          <button
            type="button"
            onClick={onOpenReportRisk}
            className="px-3 py-1.5 bg-[#003e6f] text-white rounded-lg text-xs font-semibold hover:bg-[#004881] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            เพิ่มรายการความเสี่ยงใหม่
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#ecf5fe] text-xs font-semibold text-[#414750] border-b border-[#c1c7d2] uppercase tracking-wider">
                <th className="py-3 px-4">รหัสอุบัติการณ์</th>
                <th className="py-3 px-4">รายการความเสี่ยง (Title / Description)</th>
                <th className="py-3 px-4">สิ่งส่งตรวจ (Specimen)</th>
                <th className="py-3 px-4">ระดับความเสี่ยง</th>
                <th className="py-3 px-4">วันที่บันทึก</th>
                <th className="py-3 px-4">สถานะ (Status)</th>
                <th className="py-3 px-4 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#141d23] divide-y divide-[#c1c7d2]/70">
              {bloodIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#727781]">
                    ไม่มีรายการความเสี่ยงคงค้างในห้องธนาคารเลือด
                  </td>
                </tr>
              ) : (
                bloodIncidents.map((incident, idx) => {
                  let badgeColor = 'bg-[#80f98b]/30 text-[#007327]';
                  if (incident.riskLevel === 'Critical') badgeColor = 'bg-[#ffdad6] text-[#93000a]';
                  else if (incident.riskLevel === 'High Risk') badgeColor = 'bg-[#ffdad9] text-[#7e0019]';
                  else if (incident.riskLevel === 'Moderate') badgeColor = 'bg-[#d3e4ff] text-[#003e6f]';

                  return (
                    <tr key={`${incident.id || 'inc'}-${idx}`} className="hover:bg-[#f6faff] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#003e6f]">
                        {incident.incidentId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#141d23]">{incident.title}</div>
                        <div className="text-[11px] text-[#727781] line-clamp-1">
                          {incident.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{incident.specimen}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded font-semibold ${badgeColor}`}>
                          {translateRiskLevel(incident.riskLevel)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#727781]">{incident.date}</td>
                      <td className="py-3 px-4 font-semibold text-[#006e25]">
                        {translateStatus(incident.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectIncident(incident)}
                          className="text-[#003e6f] hover:text-[#005596] font-bold hover:underline"
                        >
                          ดูรายละเอียด / CAPA
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
