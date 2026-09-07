import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiskIncident, User, CustomDepartment, DepartmentKey } from '../types';
import { getUserTier } from '../utils/rbacEngine';
import { translateStage, translateRiskLevel } from '../utils/labels';

interface RiskReportManagerViewProps {
  incidents: RiskIncident[];
  currentUser: User | null;
  departments: CustomDepartment[];
  onOpenReportRisk: () => void;
  onSelectIncident: (incident: RiskIncident) => void;
  onMoveIncidentToTrash: (incident: RiskIncident) => void;
  onBulkMoveIncidentsToTrash: (incidentIds: string[]) => void;
  onOpenMoveRoomModal?: (incidentIds: string[], incidentTitles: string[]) => void;
  onOpenRecycleBin: () => void;
  trashedCount?: number;
}

export const RiskReportManagerView: React.FC<RiskReportManagerViewProps> = ({
  incidents,
  currentUser,
  departments,
  onOpenReportRisk,
  onSelectIncident,
  onMoveIncidentToTrash,
  onBulkMoveIncidentsToTrash,
  onOpenMoveRoomModal,
  onOpenRecycleBin,
  trashedCount = 0,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([]);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const currentTier = getUserTier(currentUser);
  const isSuperAdminOrAdmin = currentTier === 'super_admin' || currentTier === 'admin';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Dept filter
      if (selectedDept !== 'all' && inc.departmentKey !== selectedDept) {
        return false;
      }
      // Risk level filter
      if (selectedRiskLevel !== 'all' && inc.riskLevel !== selectedRiskLevel) {
        return false;
      }
      // Stage filter
      if (selectedStage !== 'all' && inc.stage !== selectedStage) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = inc.title?.toLowerCase().includes(q);
        const matchDept = inc.department?.toLowerCase().includes(q);
        const matchSpecimen = inc.specimen?.toLowerCase().includes(q);
        const matchId = inc.incidentId?.toLowerCase().includes(q);
        const matchHn = inc.patientHn?.toLowerCase().includes(q);
        const matchReporter = inc.reporterName?.toLowerCase().includes(q);
        const matchDesc = inc.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDept && !matchSpecimen && !matchId && !matchHn && !matchReporter && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [incidents, selectedDept, selectedRiskLevel, selectedStage, searchQuery]);

  // Multi-select handlers
  const allFilteredSelected =
    filteredIncidents.length > 0 &&
    filteredIncidents.every((inc) => selectedIncidentIds.includes(inc.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect visible
      const visibleIds = new Set(filteredIncidents.map((i) => i.id));
      setSelectedIncidentIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      // Select all visible
      const visibleIds = filteredIncidents.map((i) => i.id);
      setSelectedIncidentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIncidentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Single Delete / Move to Trash
  const handleSingleTrash = (incident: RiskIncident) => {
    if (confirm(`ย้ายรายงานความเสี่ยง "${incident.title}" ไปยังถังขยะ (Recycle Bin)?\n\nข้อมูลนี้จะถูกตัดออกจากการประมวลผล AI ทันที และสามารถกู้คืนได้ภายใน 7 วัน`)) {
      onMoveIncidentToTrash(incident);
      setSelectedIncidentIds((prev) => prev.filter((id) => id !== incident.id));
      showToast(`ย้ายรายงาน ${incident.incidentId || incident.title} ไปยังถังขยะเรียบร้อย (ตัดออกจากสถิติ AI ทันที)`, 'success');
    }
  };

  // Bulk Delete
  const handleBulkTrash = () => {
    if (selectedIncidentIds.length === 0) return;

    if (
      confirm(
        `ยืนยันการย้ายรายงานความเสี่ยงที่เลือกจำนวน ${selectedIncidentIds.length} รายการ ไปยังถังขยะ (Recycle Bin)?\n\n• รายการทั้งหมดจะถูกตัดออกจากการคำนวณสถิติ AI และ Rejection Rate ทันที\n• ระบบจะเก็บรักษาไว้เป็นเวลา 7 วันก่อนลบถาวร`
      )
    ) {
      onBulkMoveIncidentsToTrash(selectedIncidentIds);
      showToast(
        `ย้ายรายงานความเสี่ยง ${selectedIncidentIds.length} รายการไปยังถังขยะเรียบร้อย (ระบบตัดออกจาก AI Analytics ทันที)`,
        'success'
      );
      setSelectedIncidentIds([]);
    }
  };

  // Bulk Move Room
  const handleBulkMoveRoom = () => {
    if (selectedIncidentIds.length === 0) return;
    const selectedItems = incidents.filter((i) => selectedIncidentIds.includes(i.id));
    const titles = selectedItems.map((i) => i.title);
    if (onOpenMoveRoomModal) {
      onOpenMoveRoomModal(selectedIncidentIds, titles);
    }
  };

  // Stats summaries
  const stats = useMemo(() => {
    const total = filteredIncidents.length;
    const critical = filteredIncidents.filter((i) => i.riskLevel === 'Critical').length;
    const high = filteredIncidents.filter((i) => i.riskLevel === 'High').length;
    const moderate = filteredIncidents.filter((i) => i.riskLevel === 'Moderate').length;
    const low = filteredIncidents.filter((i) => i.riskLevel === 'Low').length;
    return { total, critical, high, moderate, low };
  }, [filteredIncidents]);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const getDeptNameTh = (key: string) => {
    const found = departments.find((d) => d.key === key);
    return found ? found.nameTh : key;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto bg-slate-50 min-w-0 space-y-6">
      {/* Toast */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border text-xs font-semibold ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {feedbackToast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Risk Report Management Engine
            </span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time AI Sync Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            ระบบจัดการรายงานความเสี่ยง (Risk Incident Hub)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            จัดการรายการอุบัติการณ์ความเสี่ยง, เลือกหลายรายการเพื่อลบพร้อมกัน (Bulk Actions), กู้คืนจากถังขยะ 7 วัน, และกระจายสถิติตาม Contextual Analytics
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenRecycleBin}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-rose-600">delete</span>
            <span>ถังขยะ (7 วัน)</span>
            {trashedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                {trashedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenReportRisk}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ รายงานความเสี่ยงใหม่</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">ทั้งหมดที่พบ</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[10px] text-slate-400">รายการในมุมมอง</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase">Critical (วิกฤต)</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.critical}</div>
          <span className="text-[10px] text-rose-500">เฝ้าระวังทันที</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase">High (สูง)</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.high}</div>
          <span className="text-[10px] text-amber-500">ทบทวน RCA ด่วน</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-xs">
          <span className="text-[11px] font-semibold text-yellow-700 uppercase">Moderate (ปานกลาง)</span>
          <div className="text-2xl font-black text-yellow-700 mt-1">{stats.moderate}</div>
          <span className="text-[10px] text-yellow-600">ติดตามรอบเดือน</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase">Low (ต่ำ)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.low}</div>
          <span className="text-[10px] text-emerald-500">บันทึกป้องกันซ้ำ</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 pl-3 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:border-indigo-600"
            >
              <option value="all">ทุกห้องปฏิบัติการ (All Labs)</option>
              {departments.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.nameTh} ({d.name})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-500">
              <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="relative">
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              className="h-9 pl-3 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:border-indigo-600"
            >
              <option value="all">ทุกระดับความเสี่ยง</option>
              <option value="Critical">Critical (วิกฤต)</option>
              <option value="High">High (สูง)</option>
              <option value="Moderate">Moderate (ปานกลาง)</option>
              <option value="Low">Low (ต่ำ)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-500">
              <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
            </div>
          </div>

          {/* Stage Filter */}
          <div className="relative">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="h-9 pl-3 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:outline-none focus:border-indigo-600"
            >
              <option value="all">ทุกขั้นตอน (All Stages)</option>
              <option value="Pre-analytical">Pre-analytical (ก่อนวิเคราะห์)</option>
              <option value="Analytical">Analytical (ระหว่างวิเคราะห์)</option>
              <option value="Post-analytical">Post-analytical (หลังวิเคราะห์)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-500">
              <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส incident, HN, สิ่งส่งตรวจ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all"
          />
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIncidentIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 sticky top-4 z-30"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {selectedIncidentIds.length}
              </span>
              <span className="text-xs font-semibold">
                เลือก {selectedIncidentIds.length} รายการจากทั้งหมด {filteredIncidents.length} รายการ
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenMoveRoomModal && (
                <button
                  type="button"
                  onClick={handleBulkMoveRoom}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
                  <span>ย้ายห้องแล็บ</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleBulkTrash}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>ลบรายการที่เลือก (ย้ายลงถังขยะ 7 วัน)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIncidentIds([])}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    title="เลือกทั้งหมด"
                  />
                </th>
                <th className="py-3.5 px-4">รหัส / วันที่เกิดเหตุ</th>
                <th className="py-3.5 px-4">รายละเอียดอุบัติการณ์ความเสี่ยง</th>
                <th className="py-3.5 px-4">ห้องแล็บ &amp; AI Routing</th>
                <th className="py-3.5 px-4">ขั้นตอน &amp; สิ่งส่งตรวจ</th>
                <th className="py-3.5 px-4">ระดับความเสี่ยง</th>
                <th className="py-3.5 px-4 text-right">การจัดการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-[40px] text-slate-300 block mb-2">
                      inbox
                    </span>
                    ไม่พบรายงานความเสี่ยงตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => {
                  const isSelected = selectedIncidentIds.includes(incident.id);
                  const deptTh = getDeptNameTh(incident.departmentKey || 'central');

                  return (
                    <tr
                      key={incident.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(incident.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                      </td>

                      {/* Incident ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-indigo-700">
                          {incident.incidentId || incident.id.slice(0, 10)}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{incident.date}</div>
                        {incident.patientHn && (
                          <div className="text-[10px] text-slate-400 font-mono">HN: {incident.patientHn}</div>
                        )}
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <button
                          type="button"
                          onClick={() => onSelectIncident(incident)}
                          className="font-bold text-slate-900 hover:text-indigo-600 hover:underline text-left block cursor-pointer leading-tight truncate w-full"
                          title={incident.title}
                        >
                          {incident.title}
                        </button>
                        <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                          {incident.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                        </p>
                        {incident.reporterName && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ผู้รายงาน: {incident.reporterName}
                          </div>
                        )}
                      </td>

                      {/* Lab Dept & AI Contextual Routing Badge */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{deptTh}</div>
                        <div className="mt-1 flex items-center gap-1">
                          <span
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200"
                            title="Contextual Routing: ประมวลผลเฉพาะห้องนี้และภาพรวม Global ไม่ปนกับห้องอื่น"
                          >
                            <span className="material-symbols-outlined text-[12px]">hub</span>
                            <span>{deptTh} + Global</span>
                          </span>
                        </div>
                      </td>

                      {/* Stage & Specimen */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 block">{translateStage(incident.stage)}</span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">
                          {incident.specimen || 'N/A'}
                        </span>
                      </td>

                      {/* Risk Level */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getRiskBadge(
                            incident.riskLevel
                          )}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {translateRiskLevel(incident.riskLevel)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Inspect / View */}
                          <button
                            type="button"
                            onClick={() => onSelectIncident(incident)}
                            title="ดูรายละเอียดอุบัติการณ์"
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>

                          {/* Move Room */}
                          {onOpenMoveRoomModal && (
                            <button
                              type="button"
                              onClick={() => onOpenMoveRoomModal([incident.id], [incident.title])}
                              title="ย้ายไปยังห้องปฏิบัติการอื่น"
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                            </button>
                          )}

                          {/* Delete (Move to Trash) */}
                          <button
                            type="button"
                            onClick={() => handleSingleTrash(incident)}
                            title="ย้ายลงถังขยะ (7 วัน - ตัดออกจาก AI ทันที)"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            แสดง {filteredIncidents.length} จากทั้งหมด {incidents.length} รายการ
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
              Contextual Routing ป้องกันข้อมูลรั่วไหลข้ามห้องแล็บ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
