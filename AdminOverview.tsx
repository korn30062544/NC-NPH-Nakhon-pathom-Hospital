import React, { useState } from 'react';
import { User, RiskIncident, RiskStage, CustomDepartment, UploadedFileRecord, RBAC_LIMITS } from '../types';
import { FusedDataMetrics } from '../utils/multiSourceDataEngine';
import { translateStage, translateStatus, translateRiskLevel } from '../utils/labels';
import { DynamicChartGrid } from './DynamicChartGrid';
import {
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  Database,
  Layers,
  Sparkles,
  TrendingDown,
  Calendar,
  Shield,
  Crown,
  Users,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react';
import {
  getUserTier,
  isSuperAdmin,
  isAdmin as checkIsAdmin,
  calculateQuotaStats,
  canPromoteToAdmin,
  canDemoteAdmin,
  canDeleteUser,
  getRoleBadgeInfo,
} from '../utils/rbacEngine';

interface AdminOverviewProps {
  users: User[];
  incidents?: RiskIncident[];
  fusedMetrics: FusedDataMetrics;
  departments: CustomDepartment[];
  currentUser: User;
  selectedYear: number;
  uploadedFiles?: UploadedFileRecord[];
  onApproveUser: (userId: string) => void;
  onDenyUser: (userId: string) => void;
  onOpenAddUser: () => void;
  onOpenExportReport: () => void;
  onRefreshData: () => void;
  onSelectUserIncident: (user: User) => void;
  onSelectIncident?: (incident: RiskIncident) => void;
  onDeleteIncident?: (incidentId: string) => void;
  onOpenReportRisk?: () => void;
  onOpenGoogleSync?: () => void;
  onOpenMultiSourceHub?: () => void;
  onOpenRBACModal?: () => void;
  onPromoteToAdmin?: (user: User) => void;
  onDemoteAdmin?: (user: User) => void;
  onDeleteUserAccount?: (user: User) => void;
  isRefreshing?: boolean;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  users,
  incidents = [],
  fusedMetrics,
  departments,
  currentUser,
  selectedYear,
  uploadedFiles = [],
  onApproveUser,
  onDenyUser,
  onOpenAddUser,
  onOpenExportReport,
  onRefreshData,
  onSelectIncident,
  onDeleteIncident,
  onOpenReportRisk,
  onOpenGoogleSync,
  onOpenMultiSourceHub,
  onOpenRBACModal,
  onPromoteToAdmin,
  onDemoteAdmin,
  onDeleteUserAccount,
  isRefreshing = false,
}) => {
  const [tableSearch, setTableSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const userItemsPerPage = 6;

  // Incident log filter states
  const [incidentSearch, setIncidentSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('all');
  const [incidentPage, setIncidentPage] = useState(1);
  const incidentItemsPerPage = 6;

  const quota = calculateQuotaStats(users);
  const isOwner = isSuperAdmin(currentUser);
  const currentTier = getUserTier(currentUser);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(tableSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(tableSearch.toLowerCase()) ||
      u.status.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(tableSearch.toLowerCase()))
  );

  const totalUserPages = Math.ceil(filteredUsers.length / userItemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * userItemsPerPage,
    userPage * userItemsPerPage
  );

  // Filter incidents from fused dataset
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      inc.incidentId.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      inc.department.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      inc.specimen.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      (inc.patientHn && inc.patientHn.toLowerCase().includes(incidentSearch.toLowerCase())) ||
      inc.type.toLowerCase().includes(incidentSearch.toLowerCase());

    const matchesStage =
      selectedStageFilter === 'all' || inc.stage === selectedStageFilter;

    const matchesSeverity =
      selectedSeverityFilter === 'all' ||
      inc.riskLevel === selectedSeverityFilter ||
      inc.severityMatrix === selectedSeverityFilter;

    return matchesSearch && matchesStage && matchesSeverity;
  });

  const totalIncidentPages = Math.ceil(filteredIncidents.length / incidentItemsPerPage) || 1;
  const paginatedIncidents = filteredIncidents.slice(
    (incidentPage - 1) * incidentItemsPerPage,
    incidentPage * incidentItemsPerPage
  );

  // Helper for Stage Badge
  const getStageBadge = (stg: RiskStage) => {
    switch (stg) {
      case 'Pre-analytical':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Analytical':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Post-analytical':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getSeverityBadge = (lvl: string) => {
    switch (lvl) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High Risk':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Moderate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col gap-6 bg-slate-50 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              ศูนย์บริหารความเสี่ยง รพ.นครปฐม
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Multi-Source Connected ({fusedMetrics.activeSources} Sources)
            </span>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              ข้อมูลย้อนหลัง 5 ปี (พ.ศ. {selectedYear})
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            ภาพรวมสถิติความเสี่ยงและการปฏิเสธสิ่งส่งตรวจ (Hospital Risk Overview)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ประมวลผลข้อมูลตัวเลขรวมจาก Google Sheets, Google Forms, และไฟล์ Excel/CSV แบบ Real-Time Recalculate
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {onOpenMultiSourceHub && (
            <button
              type="button"
              onClick={onOpenMultiSourceHub}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Database className="w-4 h-4" />
              จัดการแหล่งข้อมูล (Data Hub)
            </button>
          )}

          {onOpenReportRisk && (
            <button
              type="button"
              onClick={onOpenReportRisk}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              รายงานความเสี่ยง (Report)
            </button>
          )}

          <button
            type="button"
            onClick={onOpenExportReport}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>

          <button
            type="button"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-75"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'กำลังโหลด...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards (Fused & Recalculated) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Incidents */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs text-slate-500 font-semibold">อุบัติการณ์สะสมรวม (Recalculated)</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {(fusedMetrics.totalIncidents ?? 0).toLocaleString()} เคส
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              จาก {fusedMetrics.activeSources || 0} แหล่งข้อมูลที่เปิดใช้งาน
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Rejection Rate */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs text-slate-500 font-semibold">อัตราการปฏิเสธสิ่งส่งตรวจ (Rejection)</span>
            <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
              {fusedMetrics.rejectionRate || 0}%
            </div>
            <span className="text-[11px] text-slate-500">
              ปฏิเสธ {((fusedMetrics.totalRejected ?? fusedMetrics.rejectedSpecimens) || 0).toLocaleString()} จาก {(fusedMetrics.totalSpecimens || 0).toLocaleString()} สิ่งส่งตรวจ
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Critical & High Risk */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs text-slate-500 font-semibold">ความเสี่ยงระดับวิกฤต (Critical)</span>
            <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
              {fusedMetrics.criticalIncidents} เคส
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">
              ความเสี่ยงสูง {fusedMetrics.highRiskIncidents} เคส
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Connected Sources */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs text-slate-500 font-semibold">แหล่งข้อมูลที่เชื่อมต่อ (Data Sources)</span>
            <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
              {fusedMetrics.activeSources} / {fusedMetrics.totalSources}
            </div>
            <button
              onClick={onOpenMultiSourceHub}
              className="text-[11px] text-indigo-600 hover:underline font-semibold flex items-center gap-0.5 mt-0.5 cursor-pointer"
            >
              เปิดศูนย์ควบคุม Data Hub →
            </button>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Dynamic Customizable Charts Grid (Bar, Line, Donut, Area, Radar) */}
      <DynamicChartGrid
        fusedMetrics={fusedMetrics}
        currentUser={currentUser}
        departments={departments}
        currentDept="all"
        selectedYear={selectedYear}
      />

      {/* Incidents Table (Full width) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                ทะเบียนรายงานอุบัติการณ์และความเสี่ยง (Live Incident Log - Fused Dataset)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              รวมข้อมูลที่ประมวลผลจากทุกแหล่ง พร้อมระดับความรุนแรงทางการแพทย์ Level A-I ({filteredIncidents.length} รายการ)
            </p>
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={incidentSearch}
                onChange={(e) => {
                  setIncidentSearch(e.target.value);
                  setIncidentPage(1);
                }}
                placeholder="ค้นหา HN, อุบัติการณ์..."
                className="pl-8 pr-3 py-1.5 h-8.5 w-full bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 outline-none"
              />
            </div>

            {/* Stage Filter */}
            <select
              value={selectedStageFilter}
              onChange={(e) => {
                setSelectedStageFilter(e.target.value);
                setIncidentPage(1);
              }}
              className="h-8.5 px-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:border-indigo-600 outline-none font-medium"
            >
              <option value="all">ทุกขั้นตอน (All Stages)</option>
              <option value="Pre-analytical">ก่อนการตรวจวิเคราะห์</option>
              <option value="Analytical">ระหว่างการตรวจวิเคราะห์</option>
              <option value="Post-analytical">หลังการตรวจวิเคราะห์</option>
              <option value="General/Storage">ทั่วไป/คลังพัสดุ</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverityFilter}
              onChange={(e) => {
                setSelectedSeverityFilter(e.target.value);
                setIncidentPage(1);
              }}
              className="h-8.5 px-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:border-indigo-600 outline-none font-medium"
            >
              <option value="all">ทุกระดับความรุนแรง</option>
              <option value="Critical">Critical (วิกฤต)</option>
              <option value="High Risk">High Risk (สูง)</option>
              <option value="Moderate">Moderate (ปานกลาง)</option>
              <option value="Low Risk">Low Risk (ต่ำ)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">รหัส / วันที่</th>
                <th className="py-3 px-4">หัวข้อเหตุการณ์ความเสี่ยง</th>
                <th className="py-3 px-4">ห้องปฏิบัติการ &amp; HN</th>
                <th className="py-3 px-4">ขั้นตอน &amp; ระดับ (Matrix)</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-800 divide-y divide-slate-100">
              {paginatedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ไม่พบรายการอุบัติการณ์ที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                paginatedIncidents.map((inc, idx) => (
                  <tr key={`${inc.id || 'inc'}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 block">
                        {inc.incidentId}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {inc.date} {inc.time ? `(${inc.time})` : ''}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 max-w-xs line-clamp-1">
                        {inc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {inc.type} • {inc.specimen}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {inc.department}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 block">
                        {inc.patientHn ? `HN: ${inc.patientHn}` : inc.location || 'หน่วยงานผู้ป่วย'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStageBadge(inc.stage)}`}>
                          {translateStage(inc.stage)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getSeverityBadge(inc.riskLevel)}`}>
                          {inc.severityMatrix || translateRiskLevel(inc.riskLevel)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {translateStatus(inc.status)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectIncident && onSelectIncident(inc)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          ตรวจสอบ
                        </button>
                        {onDeleteIncident && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`ยืนยันการลบรายการอุบัติการณ์ "${inc.incidentId}: ${inc.title}" ออกจากระบบ?`)) {
                                onDeleteIncident(inc.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="ลบข้อมูลอุบัติการณ์นี้ (Delete)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Incident Table Pagination */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
          <span>
            แสดง {paginatedIncidents.length ? (incidentPage - 1) * incidentItemsPerPage + 1 : 0} ถึง{' '}
            {Math.min(incidentPage * incidentItemsPerPage, filteredIncidents.length)} จาก {filteredIncidents.length} รายการ
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={incidentPage === 1}
              onClick={() => setIncidentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center border border-slate-300 disabled:opacity-40 cursor-pointer"
            >
              ‹
            </button>
            {Array.from({ length: totalIncidentPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setIncidentPage(pg)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-semibold cursor-pointer ${
                  incidentPage === pg
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={incidentPage === totalIncidentPages}
              onClick={() => setIncidentPage((p) => Math.min(totalIncidentPages, p + 1))}
              className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center border border-slate-300 disabled:opacity-40 cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* User Management Table (Admin & Super Admin RBAC View) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                ระบบจัดการผู้ใช้งานและระดับสิทธิ์ (Multi-Tier RBAC Management)
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                Admin: {quota.adminCount}/{RBAC_LIMITS.MAX_ADMINS} • Users: {quota.totalUsers}/{RBAC_LIMITS.MAX_USERS}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Super Admin แต่งตั้ง/ถอดถอน Admin (จำกัด 8 คน) • Users ทั่วไป (รองรับ 500 บัญชี)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="ค้นหาผู้ใช้, แผนก, ID..."
                className="pl-8 pr-3 py-1.5 h-8.5 w-full bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 outline-none"
              />
            </div>

            {onOpenRBACModal && (
              <button
                type="button"
                onClick={onOpenRBACModal}
                className="px-3.5 py-1.5 h-8.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>เปิดศูนย์ RBAC Hub</span>
              </button>
            )}

            {(isOwner || currentTier === 'admin') && (
              <button
                type="button"
                onClick={onOpenAddUser}
                disabled={quota.isUserQuotaFull}
                className="px-3.5 py-1.5 h-8.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มผู้ใช้ ({quota.totalUsers}/500)
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">ผู้ใช้งาน / โปรไฟล์</th>
                <th className="py-3 px-4">หน่วยงาน</th>
                <th className="py-3 px-4">ระดับสิทธิ์ (Role Tier)</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">ใช้งานล่าสุด</th>
                <th className="py-3 px-4 text-right">การจัดการสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-800 divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ใช้ที่ตรงกับการค้นหา
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isPending = user.status === 'Pending Approval';
                  const uTier = getUserTier(user);
                  const badge = getRoleBadgeInfo(user.roleType, uTier);
                  const isSelf = currentUser.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isPending ? 'bg-rose-50/50' : isSelf ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white border border-slate-200"
                              style={{ backgroundColor: user.avatarBg || '#4f46e5' }}
                            >
                              {user.avatarText || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {user.name}
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                  คุณ
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {user.role} ({user.employeeId || 'ID-N/A'})
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-600">{user.department}</td>

                      {/* Role Tier Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.badgeClass}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {badge.icon}
                          </span>
                          {badge.shortLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                            รออนุมัติ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ใช้งานได้
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {user.lastActive}
                      </td>

                      {/* Actions & RBAC */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onDenyUser(user.id)}
                                className="text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                              >
                                ปฏิเสธ
                              </button>
                              <button
                                type="button"
                                onClick={() => onApproveUser(user.id)}
                                className="text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                              >
                                อนุมัติ
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Super Admin: Promote user to Admin */}
                              {isOwner && uTier === 'user' && onPromoteToAdmin && (
                                <button
                                  type="button"
                                  onClick={() => onPromoteToAdmin(user)}
                                  disabled={quota.isAdminQuotaFull}
                                  title={
                                    quota.isAdminQuotaFull
                                      ? 'โควตา Admin เต็ม 8 คนแล้ว'
                                      : 'แต่งตั้งเป็น Admin'
                                  }
                                  className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                                    quota.isAdminQuotaFull
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                                  }`}
                                >
                                  <ArrowUp className="w-3 h-3" />
                                  <span>แต่งตั้ง</span>
                                </button>
                              )}

                              {/* Super Admin: Demote Admin to User */}
                              {isOwner && uTier === 'admin' && onDemoteAdmin && (
                                <button
                                  type="button"
                                  onClick={() => onDemoteAdmin(user)}
                                  title="ถอดถอน Admin กลับเป็น User ทั่วไป"
                                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                  <span>ปลด Admin</span>
                                </button>
                              )}

                              {/* Delete User (Super Admin or Admin deleting regular user) */}
                              {!isSelf && onDeleteUserAccount && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteUserAccount(user)}
                                  disabled={!canDeleteUser(currentUser, user).allowed}
                                  title={
                                    !canDeleteUser(currentUser, user).allowed
                                      ? canDeleteUser(currentUser, user).reason
                                      : 'ลบบัญชีผู้ใช้'
                                  }
                                  className={`p-1.5 rounded transition-colors ${
                                    canDeleteUser(currentUser, user).allowed
                                      ? 'text-rose-600 hover:bg-rose-50'
                                      : 'text-slate-300 cursor-not-allowed'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
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
