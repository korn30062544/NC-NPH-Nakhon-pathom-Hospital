import React, { useState } from 'react';
import { RiskIncident, Department5YearStats } from '../types';
import { YearSelectorBar } from './YearSelectorBar';

interface MolecularBioDashboardProps {
  onOpenReportRisk: () => void;
  onOpenDataUpload: () => void;
  onOpenExportReport: () => void;
  onOpenGoogleSync?: () => void;
  incidents: RiskIncident[];
  stats: Department5YearStats;
}

export const MolecularBioDashboard: React.FC<MolecularBioDashboardProps> = ({
  onOpenReportRisk,
  onOpenDataUpload,
  onOpenExportReport,
  onOpenGoogleSync,
  incidents,
  stats,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ month: string; value: number } | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2569);

  const molecularStats: Department5YearStats = stats;
  const yearlyData = molecularStats.yearlyData;
  const currentYearData =
    yearlyData.find((y) => y.year === selectedYear) || yearlyData[yearlyData.length - 1];

  const monthlyTrendData = [
    { month: 'ม.ค.', val: 8, prevVal: 11 },
    { month: 'ก.พ.', val: 6, prevVal: 9 },
    { month: 'มี.ค.', val: 5, prevVal: 10 },
    { month: 'เม.ย.', val: 4, prevVal: 7 },
    { month: 'พ.ค.', val: 7, prevVal: 8 },
    { month: 'มิ.ย.', val: 3, prevVal: 6 },
    { month: 'ก.ค.', val: 4, prevVal: 5 },
    { month: 'ส.ค.', val: 2, prevVal: 4 },
    { month: 'ก.ย.', val: 3, prevVal: 4 },
    { month: 'ต.ค.', val: 1, prevVal: 3 },
    { month: 'พ.ย.', val: 2, prevVal: 3 },
    { month: 'ธ.ค.', val: 1, prevVal: 2 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-[#ecf5fe] min-w-0 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-display-lg text-[#141d23] font-bold">
            Molecular Biology{' '}
            <span className="text-lg font-headline-md text-[#414750] font-normal">
              (ห้องอณูชีววิทยา)
            </span>
          </h3>
          <p className="text-sm font-body-lg text-[#414750] mt-1">
            การวิเคราะห์ความเสี่ยงและติดตามประสิทธิภาพการตรวจสารพันธุกรรม (PCR / NGS)
          </p>
        </div>

        <div className="flex gap-2.5">
          {onOpenGoogleSync && (
            <button
              type="button"
              onClick={onOpenGoogleSync}
              className="px-3.5 py-1.5 bg-[#f6faff] border border-[#005596]/40 text-[#003e6f] rounded-lg font-label-md text-xs font-bold hover:bg-[#d3e4ff]/60 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#007327]">sync_saved_locally</span>
              Google Sync
            </button>
          )}
          <button
            type="button"
            onClick={onOpenExportReport}
            className="px-3.5 py-1.5 bg-white border border-[#c1c7d2] rounded-lg text-[#003e6f] font-label-md text-xs font-semibold hover:bg-[#e0e9f2] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
          <button
            type="button"
            onClick={onOpenReportRisk}
            className="px-3.5 py-1.5 bg-[#003e6f] text-white rounded-lg font-label-md text-xs font-semibold hover:bg-[#004881] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_alert</span>
            รายงานความเสี่ยง
          </button>
        </div>
      </div>

      {/* Year Selector with 5-Year default and 10-Year historical data */}
      <YearSelectorBar
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        yearlyData={yearlyData}
        latestYear={2569}
        deptThName="ห้องอณูชีววิทยา"
      />

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-5">
        {/* KPI 1: Critical Incidents */}
        <div className="col-span-12 sm:col-span-4 bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-label-md text-[#414750] uppercase tracking-wider font-semibold">
              อุบัติการณ์วิกฤต (Critical Incidents)
            </span>
            <span className="material-symbols-outlined text-[#ba1a1a] bg-[#ffdad6] p-1 rounded-md text-[20px]">
              warning
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-display-lg text-[#ba1a1a] font-bold">
              {currentYearData.totalIncidents}
            </div>
            <div className="text-xs font-body-md text-[#414750] flex items-center gap-1 mt-1.5">
              <span className="material-symbols-outlined text-[#006e25] text-sm">arrow_downward</span>
              <span className="text-[#006e25] font-semibold">{molecularStats.overallTrendPercent}%</span> จากแนวโน้มรวม
            </div>
          </div>
        </div>

        {/* KPI 2: Contamination Rate */}
        <div className="col-span-12 sm:col-span-4 bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-label-md text-[#414750] uppercase tracking-wider font-semibold">
              อัตราปนเปื้อน (Contamination Rate)
            </span>
            <span className="material-symbols-outlined text-[#006e25] bg-[#80f98b]/30 p-1 rounded-md text-[20px]">
              check_circle
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-display-lg text-[#141d23] font-bold">0.02%</div>
            <div className="text-xs font-body-md text-[#414750] flex items-center gap-1 mt-1.5">
              <span className="text-[#414750]">Target: &lt; 0.05%</span>
              <span className="text-[#006e25] font-semibold text-[11px] bg-[#80f98b]/20 px-1.5 py-0.5 rounded ml-1">
                ผ่านเกณฑ์
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Equipment Downtime */}
        <div className="col-span-12 sm:col-span-4 bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-label-md text-[#414750] uppercase tracking-wider font-semibold">
              ระยะเวลาหยุดทำงานเครื่อง (Downtime)
            </span>
            <span className="material-symbols-outlined text-[#a90426] bg-[#ffdad9] p-1 rounded-md text-[20px]">
              schedule
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-display-lg text-[#141d23] font-bold">0 ชม.</div>
            <div className="text-xs font-body-md text-[#414750] flex items-center gap-1 mt-1.5">
              <span className="text-[#006e25] font-semibold">ระบบพร้อมใช้งาน 100%</span>
            </div>
          </div>
        </div>

        {/* Historical Risk Trends */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col shadow-xs justify-between min-h-[340px]">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-headline-sm text-[#141d23] font-bold">
              สถิติความเสี่ยงย้อนหลัง (พ.ศ. 2560 - 2569)
            </h4>
            <button
              type="button"
              onClick={onOpenExportReport}
              className="text-[#003e6f] hover:bg-[#ecf5fe] py-1 px-2 rounded-lg text-xs font-label-md font-semibold transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">download</span> Export
            </button>
          </div>

          <div className="flex-1 min-h-[220px] flex items-end gap-2 px-4 pb-2 border-b border-[#c1c7d2] relative">
            {/* Y Axis */}
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs font-label-md text-[#727781] text-right pr-2 w-7">
              <span>50</span>
              <span>37</span>
              <span>25</span>
              <span>12</span>
              <span>0</span>
            </div>

            {/* Bars container */}
            <div className="flex-1 flex items-end justify-around h-full ml-8 gap-2">
              {yearlyData.map((d) => {
                const heightPct = Math.min(100, Math.round((d.totalIncidents / 50) * 100));
                const isSelected = selectedYear === d.year;
                return (
                  <div
                    key={d.year}
                    onClick={() => setSelectedYear(d.year)}
                    className="flex flex-col items-center gap-1.5 group w-full cursor-pointer"
                  >
                    <span className="text-[11px] font-mono font-bold text-[#003e6f]">{d.totalIncidents}</span>
                    <div
                      className={`w-full max-w-[42px] rounded-t transition-all ${
                        isSelected
                          ? 'bg-[#003e6f] ring-2 ring-[#005596]'
                          : 'bg-[#003e6f]/50 hover:bg-[#003e6f]/80'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`ปี ${d.year}: ${d.totalIncidents} อุบัติการณ์`}
                    ></div>
                    <span
                      className={`text-xs font-label-md ${
                        isSelected ? 'text-[#003e6f] font-bold underline' : 'text-[#414750]'
                      }`}
                    >
                      {d.year}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Risk Categories (YTD) */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col shadow-xs justify-between min-h-[340px]">
          <h4 className="text-base font-headline-sm text-[#141d23] font-bold mb-3">
            จำแนกตามหมวดหมู่ความเสี่ยง (ปี {selectedYear})
          </h4>

          <div className="flex flex-col gap-3.5 flex-1 justify-center">
            {currentYearData.categoryBreakdown.map((cat, idx) => {
              const pct =
                currentYearData.totalIncidents > 0
                  ? Math.round((cat.count / currentYearData.totalIncidents) * 100)
                  : 0;
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs font-body-md">
                    <span className="text-[#141d23]">{cat.category}</span>
                    <span className="font-mono font-semibold">{cat.count} เคส ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-[#e0e9f2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#003e6f]" style={{ width: `${Math.max(5, pct)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend Analysis (Interactive Line Chart) */}
        <div className="col-span-12 bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h4 className="text-base font-headline-sm text-[#141d23] font-bold">
                แนวโน้มรายเดือนประจำปี {selectedYear}
              </h4>
              <p className="text-xs text-[#727781]">เปรียบเทียบจำนวนอุบัติการณ์รายเดือนกับปีก่อนหน้า</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#003e6f]"></span>
                <span className="text-[#414750]">ปี {selectedYear} (Actual)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#c1c7d2] border-t border-dashed"></span>
                <span className="text-[#727781]">ปี {selectedYear - 1} (Benchmark)</span>
              </div>
            </div>
          </div>

          <div className="w-full h-64 bg-[#f6faff] rounded-lg relative overflow-hidden flex flex-col justify-between border border-[#c1c7d2] p-4">
            {/* SVG line chart */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#003e6f" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#003e6f" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="40" x2="1000" y2="40" stroke="#e0e9f2" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="1000" y2="90" stroke="#e0e9f2" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="1000" y2="140" stroke="#e0e9f2" strokeDasharray="4 4" />

              {/* Previous Year dashed line */}
              <path
                d="M 20 50 L 105 80 L 195 65 L 285 110 L 375 95 L 465 125 L 555 140 L 645 155 L 735 155 L 825 170 L 915 170 L 980 180"
                fill="none"
                stroke="#c1c7d2"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Current Year Area */}
              <path
                d="M 20 90 L 105 120 L 195 135 L 285 150 L 375 105 L 465 165 L 555 150 L 645 180 L 735 165 L 825 190 L 915 180 L 980 190 L 980 200 L 20 200 Z"
                fill="url(#blueGradient)"
              />

              {/* Current Year Line */}
              <path
                d="M 20 90 L 105 120 L 195 135 L 285 150 L 375 105 L 465 165 L 555 150 L 645 180 L 735 165 L 825 190 L 915 180 L 980 190"
                fill="none"
                stroke="#003e6f"
                strokeWidth="3"
              />

              {/* Data points */}
              {monthlyTrendData.map((d, i) => {
                const cx = 20 + i * 87;
                // Calculate y coordinate inverse
                const cy = 200 - d.val * 18;
                return (
                  <g key={d.month} className="cursor-pointer">
                    <circle
                      cx={cx}
                      cy={cy}
                      r={hoveredPoint?.month === d.month ? 6 : 4}
                      fill="#003e6f"
                      stroke="#ffffff"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredPoint({ month: d.month, value: d.val })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[11px] font-label-md text-[#727781] pt-2 border-t border-[#c1c7d2]/50">
              {monthlyTrendData.map((d) => (
                <span
                  key={d.month}
                  className={`text-center ${
                    hoveredPoint?.month === d.month ? 'text-[#003e6f] font-bold' : ''
                  }`}
                >
                  {d.month}
                </span>
              ))}
            </div>

            {/* Floating Tooltip */}
            {hoveredPoint && (
              <div className="absolute top-3 right-4 bg-[#003e6f] text-white text-xs font-semibold py-1 px-3 rounded shadow-md">
                {hoveredPoint.month} {selectedYear}: {hoveredPoint.value} อุบัติการณ์
              </div>
            )}
          </div>
        </div>

        {/* Data Upload Section */}
        <div className="col-span-12 bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-base font-headline-sm text-[#141d23] font-bold">
                Data Upload
              </h4>
              <p className="text-xs font-body-md text-[#414750]">
                อัปโหลดรายงานผลการตรวจวิเคราะห์ทางอณูชีววิทยาเพื่อประมวลผลความเสี่ยง
              </p>
            </div>
          </div>

          <div
            onClick={onOpenDataUpload}
            className="border-2 border-dashed border-[#c1c7d2] rounded-xl p-8 flex flex-col items-center justify-center text-center bg-[#f6faff] hover:bg-[#ecf5fe] transition-colors cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#d3e4ff] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[#003e6f] text-[32px]">
                cloud_upload
              </span>
            </div>
            <h5 className="text-base font-headline-md text-[#141d23] font-bold mb-1">
              ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </h5>
            <p className="text-xs font-body-md text-[#727781] mb-4">
              รองรับไฟล์รูปแบบ: CSV, XLSX, PDF (ขนาดสูงสุด 50MB)
            </p>
            <button
              type="button"
              className="bg-[#003e6f] text-white px-5 py-2 rounded-lg font-label-md text-xs font-semibold hover:bg-[#005596] transition-colors shadow-xs"
            >
              เลือกไฟล์จากเครื่อง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
