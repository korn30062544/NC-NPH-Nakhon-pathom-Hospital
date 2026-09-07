import React, { useState } from 'react';
import { DepartmentKey, RiskIncident, UploadedFileRecord } from '../types';
import { translateRiskLevel, translateStatus } from '../utils/labels';

interface DepartmentGenericDashboardProps {
  deptKey: DepartmentKey;
  deptName: string;
  deptThName: string;
  incidents: RiskIncident[];
  onOpenReportRisk: () => void;
  onOpenDataUpload: () => void;
  onOpenExportReport: () => void;
  onSelectIncident: (incident: RiskIncident) => void;
}

export const DepartmentGenericDashboard: React.FC<DepartmentGenericDashboardProps> = ({
  deptKey,
  deptName,
  deptThName,
  incidents,
  onOpenReportRisk,
  onOpenDataUpload,
  onOpenExportReport,
  onSelectIncident,
}) => {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const deptIncidents = incidents.filter(
    (i) => i.departmentKey === deptKey || i.department.toLowerCase().includes(deptName.toLowerCase())
  );

  // Custom mock stats per department
  const getDeptMetrics = () => {
    switch (deptKey) {
      case 'central':
        return {
          metric1: { label: 'Daily Specimen Load', val: '2,840', sub: '+3.8% vs last month', icon: 'biotech', status: 'positive' },
          metric2: { label: 'Serum Hemolysis Rate', val: '0.45%', sub: 'Target: < 0.50%', icon: 'water_drop', status: 'neutral' },
          metric3: { label: 'Critical Call Notification TAT', val: '8.4 mins', sub: '-1.2 mins faster', icon: 'phone_in_talk', status: 'positive' },
        };
      case 'blood':
        return {
          metric1: { label: 'Crossmatch Volume', val: '468 units', sub: '99.8% compatibility', icon: 'bloodtype', status: 'positive' },
          metric2: { label: 'Adverse Reaction Rate', val: '0.01%', sub: 'Target: < 0.02%', icon: 'shield_with_heart', status: 'positive' },
          metric3: { label: 'Cold-Chain Deviation Log', val: '0 alerts', sub: 'Temp 2.0°C - 6.0°C intact', icon: 'ac_unit', status: 'positive' },
        };
      case 'molecular_science':
        return {
          metric1: { label: 'NextGen Sequencing Runs', val: '84 runs', sub: '99.2% cluster density', icon: 'dna', status: 'positive' },
          metric2: { label: 'Amplification Quality Index', val: '98.5%', sub: '+0.7% QA index', icon: 'science', status: 'positive' },
          metric3: { label: 'Reagent Lot Validation', val: '100%', sub: 'All 14 lots certified', icon: 'verified', status: 'positive' },
        };
      case 'material_store':
        return {
          metric1: { label: 'Reagent Stock Turnover', val: '14.2 days', sub: 'Optimal inventory flow', icon: 'inventory', status: 'positive' },
          metric2: { label: 'Near-Expiry Items (<30d)', val: '2 lots', sub: 'Action items queued', icon: 'event_busy', status: 'warning' },
          metric3: { label: 'Automated Stock Ingest', val: '99.6%', sub: 'Barcode verification rate', icon: 'qr_code_scanner', status: 'positive' },
        };
      default:
        return {
          metric1: { label: 'Total Incidents Logged', val: '14', sub: '-2 vs last month', icon: 'warning', status: 'positive' },
          metric2: { label: 'Average Resolution Time', val: '24 hrs', sub: 'Target: < 48 hrs', icon: 'schedule', status: 'positive' },
          metric3: { label: 'Compliance Score', val: '98.2%', sub: 'ISO 15189 standard', icon: 'verified', status: 'positive' },
        };
    }
  };

  const metrics = getDeptMetrics();

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-[#ecf5fe] min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h3 className="text-2xl sm:text-3xl font-display-lg text-[#141d23] font-bold">
            {deptName}{' '}
            <span className="text-lg font-headline-md text-[#414750] font-normal">
              ({deptThName})
            </span>
          </h3>
          <p className="text-sm font-body-lg text-[#414750] mt-1">
            Departmental risk metrics, non-conformity logs, and quality assurance data.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-md text-[#414750] uppercase font-semibold">
              {metrics.metric1.label}
            </span>
            <span className="material-symbols-outlined text-[#003e6f] bg-[#d3e4ff] p-1 rounded-md text-[20px]">
              {metrics.metric1.icon}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-display-lg text-[#141d23] font-bold">{metrics.metric1.val}</div>
            <div className="text-xs text-[#006e25] font-semibold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              {metrics.metric1.sub}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-md text-[#414750] uppercase font-semibold">
              {metrics.metric2.label}
            </span>
            <span className="material-symbols-outlined text-[#006e25] bg-[#80f98b]/30 p-1 rounded-md text-[20px]">
              {metrics.metric2.icon}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-display-lg text-[#141d23] font-bold">{metrics.metric2.val}</div>
            <div className="text-xs text-[#414750] font-medium flex items-center gap-1 mt-1">
              {metrics.metric2.sub}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#c1c7d2] rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-label-md text-[#414750] uppercase font-semibold">
              {metrics.metric3.label}
            </span>
            <span className="material-symbols-outlined text-[#003e6f] bg-[#d3e4ff] p-1 rounded-md text-[20px]">
              {metrics.metric3.icon}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-display-lg text-[#141d23] font-bold">{metrics.metric3.val}</div>
            <div className="text-xs text-[#006e25] font-semibold flex items-center gap-1 mt-1">
              {metrics.metric3.sub}
            </div>
          </div>
        </div>
      </div>

      {/* Department Risk Log Table */}
      <div className="bg-white border border-[#c1c7d2] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#c1c7d2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#f6faff]">
          <div>
            <h4 className="text-base font-headline-sm text-[#141d23] font-bold">
              ทะเบียนอุบัติการณ์และความเสี่ยง — {deptName}
            </h4>
            <p className="text-xs text-[#727781]">บันทึกด้านคุณภาพและความปลอดภัย</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDataUpload}
              className="px-3 py-1.5 bg-[#005596] text-white rounded-lg font-label-md text-xs font-semibold hover:bg-[#003e6f] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              Upload Department Data
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#ecf5fe] text-xs font-label-md text-[#414750] border-b border-[#c1c7d2] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">รหัสอุบัติการณ์</th>
                <th className="py-3 px-4 font-semibold">หัวข้อ / รายละเอียด</th>
                <th className="py-3 px-4 font-semibold">สิ่งส่งตรวจ / เป้าหมาย</th>
                <th className="py-3 px-4 font-semibold">ระดับความเสี่ยง</th>
                <th className="py-3 px-4 font-semibold">วันที่</th>
                <th className="py-3 px-4 font-semibold">สถานะ</th>
                <th className="py-3 px-4 font-semibold text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="text-sm font-body-md text-[#141d23] divide-y divide-[#c1c7d2]/70">
              {deptIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#727781] text-xs">
                    ไม่มีรายการความเสี่ยงคงค้างในห้องปฏิบัติการนี้ (No Active Incidents)
                  </td>
                </tr>
              ) : (
                deptIncidents.map((incident, idx) => {
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
                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs text-[#141d23]">{incident.title}</div>
                        <div className="text-[11px] text-[#727781] line-clamp-1">
                          {incident.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-[#141d23]">
                        {incident.specimen}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${badgeColor}`}>
                          {translateRiskLevel(incident.riskLevel)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#727781]">{incident.date}</td>
                      <td className="py-3 px-4 text-xs font-medium text-[#006e25]">
                        {translateStatus(incident.status)}
                      </td>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
