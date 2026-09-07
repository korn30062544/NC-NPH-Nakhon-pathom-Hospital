import React, { useState } from 'react';
import { RiskIncident, Department5YearStats } from '../types';
import { YearSelectorBar } from './YearSelectorBar';
import { translateRiskLevel } from '../utils/labels';

interface ClinicalMicrobiologyDashboardProps {
  onOpenReportRisk: () => void;
  onOpenDataUpload: () => void;
  onOpenExportReport: () => void;
  onOpenGoogleSync?: () => void;
  onSelectIncident: (incident: RiskIncident) => void;
  incidents: RiskIncident[];
  stats: Department5YearStats;
}

export const ClinicalMicrobiologyDashboard: React.FC<ClinicalMicrobiologyDashboardProps> = ({
  onOpenReportRisk,
  onOpenDataUpload,
  onOpenExportReport,
  onOpenGoogleSync,
  onSelectIncident,
  incidents,
  stats,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const microStats: Department5YearStats = stats;
  const yearlyData = microStats.yearlyData;

  const currentYearData =
    yearlyData.find((y) => y.year === selectedYear) || yearlyData[yearlyData.length - 1];

  const microIncidents = incidents.filter(
    (i) => i.departmentKey === 'microbiology' || i.department === 'Clinical Microbiology'
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-[#ecf5fe] min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-display-lg text-[#141d23] font-bold">
            Clinical Microbiology{' '}
            <span className="text-lg font-headline-md text-[#414750] font-normal">
              (ห้องจุลชีววิทยาคลินิก)
            </span>
          </h3>
          <p className="text-sm font-body-lg text-[#414750] mt-1">
            Departmental Risk Overview &amp; Historical Quality Assurance Analysis
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            Report Incident
          </button>
        </div>
      </div>

      {/* Year Selector with 5-Year default and 10-Year historical data */}
      <YearSelectorBar
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        yearlyData={yearlyData}
        latestYear={2569}
        deptThName="ห้องจุลชีววิทยาคลินิก"
      />

      {/* Top Stat & Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Critical Incidents */}
        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-md text-[#414750] font-semibold">
              Critical Incidents
            </span>
            <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">
              crisis_alert
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-display-lg text-[#141d23] font-bold">3</div>
            <div className="text-xs text-[#ba1a1a] font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              +1 this month
            </div>
          </div>
        </div>

        {/* Card 2: TAT Delay */}
        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-md text-[#414750] font-semibold">
              TAT Delay (&gt;48h)
            </span>
            <span className="material-symbols-outlined text-[#003e6f] text-[20px]">
              timelapse
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-display-lg text-[#141d23] font-bold">12%</div>
            <div className="text-xs text-[#727781] font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">remove</span>
              No change from last month
            </div>
          </div>
        </div>

        {/* Card 3: ID Error */}
        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-md text-[#414750] font-semibold">
              ID Error (AST)
            </span>
            <span className="material-symbols-outlined text-[#006e25] text-[20px]">
              verified
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-display-lg text-[#141d23] font-bold">0.4%</div>
            <div className="text-xs text-[#006e25] font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
              -0.2% improved
            </div>
          </div>
        </div>

        {/* Card 4: Upload Data */}
        <div
          onClick={onOpenDataUpload}
          className="bg-white border border-dashed border-[#003e6f] rounded-xl p-4 flex flex-col justify-between shadow-xs hover:bg-[#d3e4ff]/30 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-md text-[#003e6f] font-bold">
              Upload Data
            </span>
            <span className="material-symbols-outlined text-[#003e6f] text-[20px] group-hover:scale-110 transition-transform">
              upload_file
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#414750]">นำเข้าไฟล์บันทึก AST/LIS</span>
            <span className="bg-[#003e6f] text-white text-[11px] font-semibold px-2 py-1 rounded">
              อัปโหลดไฟล์
            </span>
          </div>
        </div>
      </div>

      {/* 5-Year Trend + Risk by Specimen */}
      <div className="grid grid-cols-12 gap-5">
        {/* 5-Year Trend Dual-bar chart (8 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-[#c1c7d2] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[340px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-headline-sm text-[#141d23] font-bold">
                สถิติย้อนหลัง (พ.ศ. 2560 - 2569)
              </h4>
              <p className="text-xs text-[#727781]">
                แนวโน้มเปรียบเทียบการปนเปื้อนเลือดเพาะเชื้อและคุณภาพ
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#003e6f] rounded-xs"></span>
                <span className="text-[#414750]">อุบัติการณ์</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#007327] rounded-xs"></span>
                <span className="text-[#414750]">ปีที่เลือก</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[220px] flex items-end justify-around gap-2 px-4 pb-2 border-b border-[#c1c7d2] relative">
            {yearlyData.map((d) => {
              const heightPct = Math.min(100, Math.round((d.totalIncidents / 60) * 100));
              const isSelected = selectedYear === d.year;
              return (
                <button
                  key={d.year}
                  type="button"
                  onClick={() => setSelectedYear(d.year)}
                  className={`flex flex-col items-center gap-2 group cursor-pointer transition-all ${
                    isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-end gap-1.5 h-44">
                    <div
                      className={`w-6 sm:w-8 rounded-t transition-all ${
                        isSelected ? 'bg-[#007327] ring-2 ring-[#007327]/30' : 'bg-[#003e6f] group-hover:bg-[#005596]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`ปี ${d.year}: ${d.totalIncidents} เคส`}
                    ></div>
                  </div>
                  <span
                    className={`text-xs font-mono transition-colors ${
                      isSelected ? 'text-[#007327] font-bold underline' : 'text-[#414750]'
                    }`}
                  >
                    {d.year}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Risk by Specimen (4 cols) */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-[#c1c7d2] rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[340px]">
          <h4 className="text-base font-headline-sm text-[#141d23] font-bold">
            Risk by Specimen (YTD)
          </h4>

          <div className="flex-1 flex flex-col items-center justify-center my-2">
            <div
              className="relative w-40 h-40 rounded-full shadow-sm flex items-center justify-center"
              style={{
                background:
                  'conic-gradient(#003e6f 0% 45%, #a90426 45% 75%, #006e25 75% 100%)',
              }}
            >
              <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-2xl font-headline-md text-[#141d23] font-bold">
                  412
                </span>
                <span className="text-[10px] font-label-md text-[#727781]">
                  Total Samples
                </span>
              </div>
            </div>
          </div>

          <div className="w-full space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-body-md">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#003e6f]"></span>
                <span className="text-[#141d23]">Urine (45%)</span>
              </div>
              <span className="font-mono font-semibold">185</span>
            </div>
            <div className="flex items-center justify-between text-xs font-body-md">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a90426]"></span>
                <span className="text-[#141d23]">Blood (30%)</span>
              </div>
              <span className="font-mono font-semibold">124</span>
            </div>
            <div className="flex items-center justify-between text-xs font-body-md">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006e25]"></span>
                <span className="text-[#141d23]">Sputum (25%)</span>
              </div>
              <span className="font-mono font-semibold">103</span>
            </div>
          </div>
        </div>

        {/* Recent Clinical Microbiology Risks Table */}
        <div className="col-span-12 bg-white border border-[#c1c7d2] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#c1c7d2] flex justify-between items-center bg-[#f6faff]">
            <div>
              <h4 className="text-base font-headline-sm text-[#141d23] font-bold">
                Recent Clinical Microbiology Risks
              </h4>
              <p className="text-xs text-[#727781]">Logged non-conformities and quality alerts</p>
            </div>
            <button
              type="button"
              onClick={onOpenReportRisk}
              className="text-xs font-label-md text-[#003e6f] font-semibold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">add</span> Report New
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#ecf5fe] text-xs font-label-md text-[#414750] border-b border-[#c1c7d2] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">รหัสอุบัติการณ์</th>
                  <th className="py-3 px-4 font-semibold">สิ่งส่งตรวจ</th>
                  <th className="py-3 px-4 font-semibold">ประเภท</th>
                  <th className="py-3 px-4 font-semibold">ระดับความเสี่ยง</th>
                  <th className="py-3 px-4 font-semibold">วันที่</th>
                  <th className="py-3 px-4 font-semibold text-right">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="text-sm font-body-md text-[#141d23] divide-y divide-[#c1c7d2]/70">
                {microIncidents.map((incident, idx) => {
                  let badgeColor = 'bg-[#80f98b]/30 text-[#007327]';
                  if (incident.riskLevel === 'Critical') {
                    badgeColor = 'bg-[#ffdad6] text-[#93000a]';
                  } else if (incident.riskLevel === 'High Risk') {
                    badgeColor = 'bg-[#ffdad9] text-[#7e0019]';
                  } else if (incident.riskLevel === 'Moderate') {
                    badgeColor = 'bg-[#d3e4ff] text-[#003e6f]';
                  }

                  return (
                    <tr key={`${incident.id || 'inc'}-${idx}`} className="hover:bg-[#f6faff] transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-xs text-[#003e6f]">
                        {incident.incidentId}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-[#141d23]">
                        {incident.specimen}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#414750]">{incident.type}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${badgeColor}`}>
                          {translateRiskLevel(incident.riskLevel)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#727781]">{incident.date}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectIncident(incident)}
                          className="text-[#003e6f] hover:text-[#005596] text-xs font-semibold hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
