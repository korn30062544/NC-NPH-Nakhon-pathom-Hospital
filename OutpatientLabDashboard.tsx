import React, { useState } from 'react';
import { RiskIncident, Department5YearStats } from '../types';
import { YearSelectorBar } from './YearSelectorBar';
import { translateRiskLevel, translateStatus } from '../utils/labels';

interface OutpatientLabDashboardProps {
  incidents: RiskIncident[];
  stats: Department5YearStats;
  onOpenReportRisk: () => void;
  onOpenDataUpload: () => void;
  onOpenExportReport: () => void;
  onOpenGoogleSync: () => void;
  onSelectIncident: (incident: RiskIncident) => void;
}

export const OutpatientLabDashboard: React.FC<OutpatientLabDashboardProps> = ({
  incidents,
  stats,
  onOpenReportRisk,
  onOpenDataUpload,
  onOpenExportReport,
  onOpenGoogleSync,
  onSelectIncident,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const opdStats: Department5YearStats = stats;
  const yearlyData = opdStats.yearlyData;

  const currentYearData =
    yearlyData.find((y) => y.year === selectedYear) || yearlyData[yearlyData.length - 1];

  const opdIncidents = incidents.filter(
    (i) => i.departmentKey === 'outpatient' || i.department.toLowerCase().includes('outpatient')
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-[#ecf5fe] min-w-0 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c1c7d2] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#005596]/10 border border-[#005596]/20 flex items-center justify-center text-[#005596]">
            <span className="material-symbols-outlined text-[28px] fill">vaccines</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#005596] text-white px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase">
                Phlebotomy &amp; Patient Safety
              </span>
              <span className="text-xs text-[#006e25] bg-[#80f98b]/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006e25]"></span>
                Queue &amp; Barcode Verification Active
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#003e6f] mt-0.5">
              ห้องปฏิบัติการผู้ป่วยภายนอก (Outpatient Lab)
            </h2>
            <p className="text-xs sm:text-sm text-[#414750]">
              จุดเจาะเก็บสิ่งส่งตรวจผู้ป่วยนอก การระบุตัวตน (Patient ID) และการลดความเสี่ยงชั่วโมงเร่งด่วน
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
            อัปโหลดข้อมูล OPD
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
            รายงานความเสี่ยง OPD
          </button>
        </div>
      </div>

      {/* Year Selector with 5-Year default and 10-Year historical data */}
      <YearSelectorBar
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        yearlyData={yearlyData}
        latestYear={2569}
        deptThName="ห้องปฏิบัติการผู้ป่วยภายนอก"
      />

      {/* 4 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase">ยอดผู้รับบริการเจาะเลือด</span>
            <span className="material-symbols-outlined text-[#003e6f] bg-[#d3e4ff] p-1 rounded-md text-[18px]">
              group
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#141d23]">
              {currentYearData.totalSpecimens.toLocaleString()}
            </div>
            <p className="text-xs text-[#006e25] font-semibold mt-1">
              ~1,100 ราย/วัน ในวันทำการ
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded">
            ความพึงพอใจการบริการ: 96.4%
          </div>
        </div>

        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#ba1a1a] uppercase">อัตราติดสติกเกอร์ผิดคน (Mislabel)</span>
            <span className="material-symbols-outlined text-[#ba1a1a] bg-[#ffdad9] p-1 rounded-md text-[18px]">
              qr_code_2
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#ba1a1a]">
              {currentYearData.categoryBreakdown.find((c) => c.category === 'Mislabeling')?.count || 26} เคส
            </div>
            <p className="text-xs text-[#006e25] font-semibold mt-1">
              ลดลง 53.6% จากปี 2560 (56 เคส)
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded">
            ตรวจพบและแก้ไขก่อนเข้าแลป 100%
          </div>
        </div>

        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase">อัตรา Reject Specimen</span>
            <span className="material-symbols-outlined text-[#003e6f] bg-[#d3e4ff] p-1 rounded-md text-[18px]">
              cancel
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#006e25]">
              {currentYearData.rejectionRate.toFixed(2)}%
            </div>
            <p className="text-xs text-[#006e25] font-semibold mt-1">
              เป้าหมาย: &lt; 0.50% (ผ่านเกณฑ์)
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded">
            ลดลงจาก 0.85% ในปี 2560
          </div>
        </div>

        <div className="bg-white border border-[#c1c7d2] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#414750] uppercase">แนวโน้มรวม (Trend)</span>
            <span className="material-symbols-outlined text-[#006e25] bg-[#80f98b]/30 p-1 rounded-md text-[18px]">
              trending_down
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold text-[#006e25]">{opdStats.overallTrendPercent}%</div>
            <p className="text-xs text-[#006e25] font-semibold mt-1">
              ความเสี่ยง OPD ปรับลดลงต่อเนื่อง
            </p>
          </div>
          <div className="text-[11px] text-[#727781] bg-[#f6faff] p-1.5 rounded">
            ระบบสแกนบาร์โค้ดประจำเตียงเจาะเลือด
          </div>
        </div>
      </div>

      {/* Historical Bar Chart */}
      <div className="bg-white rounded-xl border border-[#c1c7d2] p-5 sm:p-6 shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#141d23]">
              สถิติความเสี่ยงย้อนหลัง (พ.ศ. 2560 - 2569) จุดเจาะเลือดผู้ป่วยนอก
            </h3>
            <p className="text-xs text-[#727781] mt-0.5">
              Outpatient Phlebotomy &amp; Specimen Collection Risk Trends
            </p>
          </div>
          <span className="text-xs bg-[#ecf5fe] text-[#003e6f] font-bold px-3 py-1 rounded-lg">
            แนวโน้มรวม: {opdStats.overallTrendPercent}%
          </span>
        </div>

        <div className="h-60 flex items-end gap-4 sm:gap-8 pt-6 border-b border-l border-[#c1c7d2] px-4 sm:px-8 relative">
          {/* Y Axis */}
          <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-[11px] font-mono text-[#727781] py-1">
            <span>150</span>
            <span>112</span>
            <span>75</span>
            <span>37</span>
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
            const heightPct = Math.min(100, Math.round((d.totalIncidents / 150) * 100));
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
              ข้อสรุปทางเทคนิคการแพทย์และการวิเคราะห์แนวโน้ม 5 ปี (MT Review)
            </h4>
            <p className="text-xs text-[#414750] mt-0.5 leading-relaxed">
              {opdStats.mtSummary}
            </p>
          </div>
        </div>
      </div>

      {/* OPD Incidents Table */}
      <div className="bg-white rounded-xl border border-[#c1c7d2] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#c1c7d2] flex justify-between items-center bg-[#f6faff]">
          <div>
            <h4 className="text-base font-bold text-[#141d23]">รายการอุบัติการณ์ความเสี่ยง ห้องผู้ป่วยนอก (OPD Lab)</h4>
            <p className="text-xs text-[#727781]">บันทึกการระบุตัวตนและข้อผิดพลาดในการเจาะเลือด</p>
          </div>
          <button
            type="button"
            onClick={onOpenReportRisk}
            className="px-3 py-1.5 bg-[#003e6f] text-white rounded-lg text-xs font-semibold hover:bg-[#004881] transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            บันทึกความเสี่ยงใหม่
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#ecf5fe] text-xs font-semibold text-[#414750] border-b border-[#c1c7d2] uppercase">
                <th className="py-3 px-4">รหัสอุบัติการณ์</th>
                <th className="py-3 px-4">หัวข้อ / รายละเอียด</th>
                <th className="py-3 px-4">สิ่งส่งตรวจ</th>
                <th className="py-3 px-4">ระดับความเสี่ยง</th>
                <th className="py-3 px-4">วันที่</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#141d23] divide-y divide-[#c1c7d2]/70">
              {opdIncidents.map((incident, idx) => (
                <tr key={`${incident.id || 'inc'}-${idx}`} className="hover:bg-[#f6faff] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#003e6f]">{incident.incidentId}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#141d23]">{incident.title}</div>
                    <div className="text-[11px] text-[#727781] line-clamp-1">{incident.description}</div>
                  </td>
                  <td className="py-3 px-4">{incident.specimen}</td>
                  <td className="py-3 px-4">
                    <span className="bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded font-bold">
                      {translateRiskLevel(incident.riskLevel)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#727781]">{incident.date}</td>
                  <td className="py-3 px-4 font-semibold text-[#006e25]">{translateStatus(incident.status)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectIncident(incident)}
                      className="text-[#003e6f] font-bold hover:underline"
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
