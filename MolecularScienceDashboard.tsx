import React, { useState } from 'react';
import { RiskIncident, Department5YearStats } from '../types';
import { YearSelectorBar } from './YearSelectorBar';

interface MolecularScienceDashboardProps {
  incidents: RiskIncident[];
  stats: Department5YearStats;
  onOpenReportRisk: () => void;
  onOpenDataUpload: () => void;
  onOpenExportReport: () => void;
  onOpenGoogleSync: () => void;
  onSelectIncident: (incident: RiskIncident) => void;
}

export const MolecularScienceDashboard: React.FC<MolecularScienceDashboardProps> = ({
  incidents,
  stats,
  onOpenReportRisk,
  onOpenDataUpload,
  onOpenExportReport,
  onOpenGoogleSync,
  onSelectIncident,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const molSciStats: Department5YearStats = stats;
  const yearlyData = molSciStats.yearlyData;

  const currentYearData =
    yearlyData.find((y) => y.year === selectedYear) || yearlyData[yearlyData.length - 1];

  const molIncidents = incidents.filter(
    (i) => i.departmentKey === 'molecular_science' || i.department.toLowerCase().includes('molecular science')
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-[#ecf5fe] min-w-0 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c1c7d2] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#005596]/10 border border-[#005596]/20 flex items-center justify-center text-[#005596]">
            <span className="material-symbols-outlined text-[28px] fill">dna</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#005596] text-white px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase">
                Advanced Genomics Lab
              </span>
              <span className="text-xs text-[#006e25] bg-[#80f98b]/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006e25]"></span>
                NGS Library Prep &amp; Qubit Validated
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#003e6f] mt-0.5">
              ห้องอณูชีวโมเลกุล (Molecular Science &amp; Genomics)
            </h2>
            <p className="text-xs sm:text-sm text-[#414750]">
              การตรวจถอดรหัสพันธุกรรมขั้นสูง (Next-Generation Sequencing), Liquid Biopsy และการควบคุมความสะอาดของห้องปฏิบัติการ
            </p>
          </div>
        </div>

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
            อัปโหลดข้อมูล NGS
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
            className="px-3.5 py-1.5 bg-[#005596] hover:bg-[#003e6f] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_alert</span>
            รายงานความเสี่ยงโมเลกุล
          </button>
        </div>
      </div>

      {/* Year Selector with 5-Year default and 10-Year historical data */}
      <YearSelectorBar
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        yearlyData={yearlyData}
        latestYear={2569}
        deptThName="ห้องอณูชีวโมเลกุล"
      />

      {/* 4 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase">ยอดตรวจ Genomic Sequencing</span>
            <span className="material-symbols-outlined text-[#003e6f] bg-[#d3e4ff] p-1 rounded-md text-[18px]">
              biotech
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#141d23]">
              {currentYearData.totalSpecimens.toLocaleString()}
            </div>
            <p className="text-xs text-[#006e25] font-semibold mt-1">
              +17.1% เทียบปีก่อน (เติบโตต่อเนื่อง)
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded">
            สิ่งส่งตรวจถูกปฏิเสธ: {currentYearData.rejectedSpecimens} ตัวอย่าง
          </div>
        </div>

        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase">อัตรา Library Prep Failure</span>
            <span className="material-symbols-outlined text-[#006e25] bg-[#80f98b]/30 p-1 rounded-md text-[18px]">
              verified
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#006e25]">0.8%</div>
            <p className="text-xs text-[#006e25] font-semibold mt-1">
              เป้าหมายสากล: &lt; 2.0% (ผ่านเกณฑ์)
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded">
            การควบคุมอุณหภูมิห้องสกัด 20-22°C
          </div>
        </div>

        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase">ตู้แช่ -80°C Cold Storage Logs</span>
            <span className="material-symbols-outlined text-[#003e6f] bg-[#d3e4ff] p-1 rounded-md text-[18px]">
              ac_unit
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#003e6f]">100%</div>
            <p className="text-xs text-[#006e25] font-semibold mt-1">
              อุณหภูมิคงที่ -80°C ± 2.5°C
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded">
            ระบบ IoT Temp Alert 24 ชั่วโมง
          </div>
        </div>

        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase">แนวโน้มความเสี่ยง 5 ปี</span>
            <span className="material-symbols-outlined text-[#006e25] bg-[#80f98b]/30 p-1 rounded-md text-[18px]">
              trending_down
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#006e25]">{molSciStats.overallTrendPercent}%</div>
            <p className="text-xs text-[#006e25] font-semibold mt-1">
              อุบัติการณ์ลดลง 37.5%
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded">
            การนำเข้าหุ่นยนต์เตรียมตัวอย่าง
          </div>
        </div>
      </div>

      {/* 5-Year Historical Bar Chart */}
      <div className="bg-white rounded-xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#141d23]">
              สถิติความเสี่ยงย้อนหลัง (พ.ศ. 2560 - 2569)
            </h3>
            <p className="text-xs text-[#727781] mt-0.5">
              Historical Molecular Science &amp; Advanced Genomics Risk Incidents
            </p>
          </div>
          <span className="text-xs bg-[#ecf5fe] text-[#003e6f] font-bold px-3 py-1 rounded-lg">
            แนวโน้มรวม: {molSciStats.overallTrendPercent}%
          </span>
        </div>

        <div className="h-60 flex items-end gap-4 sm:gap-8 pt-6 border-b border-l border-[#c1c7d2] px-4 sm:px-8 relative">
          <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-[11px] font-mono text-[#727781] py-1">
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span>0</span>
          </div>

          <div className="absolute inset-0 flex flex-col justify-between pt-6 pb-0 px-4 pointer-events-none">
            <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
            <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
            <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
            <div className="w-full border-t border-[#c1c7d2] opacity-30"></div>
            <div className="w-full border-t-0"></div>
          </div>

          {yearlyData.map((d) => {
            const heightPct = Math.min(100, Math.round((d.totalIncidents / 40) * 100));
            const isSelected = selectedYear === d.year;

            return (
              <div
                key={d.year}
                onClick={() => setSelectedYear(d.year)}
                className="flex-1 flex flex-col items-center group relative z-10 h-full justify-end cursor-pointer"
              >
                <span className="mb-1 text-xs font-mono font-bold text-[#003e6f]">
                  {d.totalIncidents}
                </span>

                <div
                  className={`w-full max-w-[56px] rounded-t-lg transition-all duration-300 shadow-sm ${
                    isSelected
                      ? 'bg-[#003e6f] ring-2 ring-[#005596] ring-offset-2'
                      : 'bg-[#a90426] group-hover:bg-[#005596]'
                  }`}
                  style={{ height: `${heightPct}%` }}
                ></div>

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

        {/* MT Clinical Summary */}
        <div className="mt-5 p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2] flex items-start gap-3">
          <span className="material-symbols-outlined text-[#003e6f] text-[24px]">clinical_notes</span>
          <div>
            <h4 className="text-xs font-bold text-[#003e6f]">
              ข้อสรุปและข้อเสนอแนะนักเทคนิคการแพทย์ (MT Review)
            </h4>
            <p className="text-xs text-[#414750] mt-0.5 leading-relaxed">
              {molSciStats.mtSummary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
