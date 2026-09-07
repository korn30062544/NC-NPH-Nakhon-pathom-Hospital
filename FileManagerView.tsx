import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadedFileRecord, User, CustomDepartment } from '../types';
import { canDeleteFile, getUserTier, getRoleBadgeInfo } from '../utils/rbacEngine';

interface FileManagerViewProps {
  files: UploadedFileRecord[];
  currentUser: User | null;
  onDeleteFile: (fileId: string) => void;
  onOpenUploadModal: () => void;
  onInspectFile?: (file: UploadedFileRecord) => void;
  onMoveFileToTrash?: (file: UploadedFileRecord) => void;
  onBulkMoveToTrash?: (fileIds: string[]) => void;
  onOpenMoveModal?: (fileIds: string[], fileNames: string[]) => void;
  onOpenRecycleBin?: () => void;
  trashedCount?: number;
  onOpenBulkUpload?: () => void;
  onTriggerAISplitDemo?: () => void;
  departments?: CustomDepartment[];
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  files,
  currentUser,
  onDeleteFile,
  onOpenUploadModal,
  onMoveFileToTrash,
  onBulkMoveToTrash,
  onOpenMoveModal,
  onOpenRecycleBin,
  trashedCount = 0,
  onOpenBulkUpload,
  onTriggerAISplitDemo,
  departments = [],
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'others'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileForDetail, setSelectedFileForDetail] = useState<UploadedFileRecord | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const currentTier = getUserTier(currentUser);
  const roleBadge = getRoleBadgeInfo(currentUser?.roleType || 'User', currentTier);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleSendToTrash = (file: UploadedFileRecord) => {
    const check = canDeleteFile(currentUser, file);
    if (!check.allowed) {
      showToast(check.reason || 'คุณไม่มีสิทธิ์ลบไฟล์นี้', 'error');
      return;
    }

    if (onMoveFileToTrash) {
      onMoveFileToTrash(file);
      showToast(`ย้ายไฟล์ "${file.filename}" ไปยังถังขยะเรียบร้อย (ระบบตัดออกจาก AI และสถิติทันที กู้คืนได้ใน 7 วัน)`, 'success');
    } else {
      onDeleteFile(file.id);
      showToast(`ลบไฟล์ "${file.filename}" สำเร็จ`, 'success');
    }

    if (selectedFileForDetail?.id === file.id) {
      setSelectedFileForDetail(null);
    }
  };

  const handleDeletePermanent = (file: UploadedFileRecord) => {
    const check = canDeleteFile(currentUser, file);
    if (!check.allowed) {
      showToast(check.reason || 'คุณไม่มีสิทธิ์ลบไฟล์นี้', 'error');
      return;
    }

    if (confirm(`ยืนยันการลบไฟล์ "${file.filename}" ออกจากระบบทันที?`)) {
      onDeleteFile(file.id);
      showToast(`ลบไฟล์ "${file.filename}" ออกจากระบบเรียบร้อย`, 'success');
      if (selectedFileForDetail?.id === file.id) {
        setSelectedFileForDetail(null);
      }
    }
  };

  const filteredFiles = files.filter((f) => {
    const isMine = f.ownerId === currentUser?.id || f.ownerEmail === currentUser?.email;
    if (filterMode === 'mine' && !isMine) return false;
    if (filterMode === 'others' && isMine) return false;
    if (deptFilter !== 'all' && f.department !== deptFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        f.filename.toLowerCase().includes(q) ||
        f.ownerName.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const myFilesCount = files.filter(
    (f) => f.ownerId === currentUser?.id || f.ownerEmail === currentUser?.email
  ).length;

  // Toggle Single Selection
  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  // Toggle Select All
  const handleToggleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map((f) => f.id));
    }
  };

  // Bulk Move to Trash
  const handleBulkTrash = () => {
    if (selectedFileIds.length === 0) return;

    // Filter allowed files based on RBAC
    const filesToTrash = files.filter((f) => selectedFileIds.includes(f.id));
    const unauthorized = filesToTrash.filter((f) => !canDeleteFile(currentUser, f).allowed);

    if (unauthorized.length > 0 && currentTier === 'user') {
      showToast(`มี ${unauthorized.length} ไฟล์ที่คุณไม่มีสิทธิ์ลบ (ลบได้เฉพาะไฟล์ของตนเอง)`, 'error');
      return;
    }

    if (onBulkMoveToTrash) {
      onBulkMoveToTrash(selectedFileIds);
      showToast(`ย้ายไฟล์ ${selectedFileIds.length} รายการไปยังถังขยะเรียบร้อย (ระบบตัดออกจาก AI และสถิติ Real-time แล้ว)`, 'success');
    } else {
      selectedFileIds.forEach((id) => onDeleteFile(id));
      showToast(`ลบไฟล์ ${selectedFileIds.length} รายการสำเร็จ`, 'success');
    }

    setSelectedFileIds([]);
  };

  // Bulk Move Room
  const handleBulkMoveRoom = () => {
    if (selectedFileIds.length === 0) return;
    const selectedFiles = files.filter((f) => selectedFileIds.includes(f.id));
    const names = selectedFiles.map((f) => f.filename);

    if (onOpenMoveModal) {
      onOpenMoveModal(selectedFileIds, names);
    } else {
      showToast(`เปิดฟังก์ชันย้ายหมวดหมู่ ${selectedFileIds.length} รายการ`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-md ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-rose-50 text-rose-900 border border-rose-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {feedbackToast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedbackToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner: RBAC Permission & Real-Time Engine Info */}
      <div className="bg-gradient-to-r from-slate-900 via-[#003e6f] to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-sky-300 shadow-inner">
              <span className="material-symbols-outlined text-[30px]">cloud_sync</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  ระบบจัดการไฟล์และประมวลผลข้อมูล Real-Time
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Event Engine Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                ไฟล์ทั้งหมดจะถูก Background Workers ประมวลผลและส่งต่อเข้า AI Context ทันที
              </p>
            </div>
          </div>

          {/* Current User Role & File Deletion Policy Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-xs flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0"
              style={{ backgroundColor: currentUser?.avatarBg || '#4f46e5' }}
            >
              {currentUser?.avatarText || 'U'}
            </div>
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>{currentUser?.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${roleBadge.badgeClass}`}>
                  {roleBadge.shortLabel}
                </span>
              </div>
              <div className="text-[11px] text-sky-200 mt-0.5">
                {currentTier === 'super_admin' ? (
                  <span className="text-amber-300 font-semibold">👑 สิทธิ์ Super Admin: ลบได้ทุกไฟล์ในระบบ</span>
                ) : currentTier === 'admin' ? (
                  <span className="text-indigo-200 font-semibold">🛡️ สิทธิ์ Admin: ลบได้ทุกไฟล์ในระบบ</span>
                ) : (
                  <span className="text-emerald-300 font-semibold">🔒 สิทธิ์ User: ลบได้เฉพาะไฟล์ที่ตนเองอัปโหลด</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-60">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อไฟล์, เจ้าของ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterMode === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({files.length})
            </button>
            <button
              onClick={() => setFilterMode('mine')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterMode === 'mine' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ไฟล์ของฉัน ({myFilesCount})
            </button>
            <button
              onClick={() => setFilterMode('others')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterMode === 'others' ? 'bg-slate-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ไฟล์ผู้อื่น ({files.length - myFilesCount})
            </button>
          </div>

          {/* Department Select */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">ทุกแผนก</option>
            <option value="Central Lab">ห้องปฏิบัติการกลาง</option>
            <option value="Blood Bank">ธนาคารเลือด</option>
            <option value="Clinical Microbiology">จุลชีววิทยาคลินิก</option>
            <option value="Outpatient Lab">ห้องปฏิบัติการผู้ป่วยนอก</option>
            <option value="Molecular Biology">อณูชีววิทยา</option>
          </select>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Recycle Bin Button with Badge */}
          {onOpenRecycleBin && (
            <button
              onClick={onOpenRecycleBin}
              className="relative px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="เปิดถังขยะ (Recycle Bin 7 วัน)"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-600">delete_sweep</span>
              <span>ถังขยะระบบ</span>
              {trashedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                  {trashedCount}
                </span>
              )}
            </button>
          )}

          {/* Bulk Upload Button */}
          {onOpenBulkUpload && (
            <button
              onClick={onOpenBulkUpload}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="เพิ่มไฟล์หรือลิงก์พร้อมกันหลายรายการ"
            >
              <span className="material-symbols-outlined text-[18px] text-purple-700">library_add</span>
              <span>อัปโหลดหลายไฟล์</span>
            </button>
          )}

          {/* AI Split Demo */}
          {onTriggerAISplitDemo && (
            <button
              onClick={onTriggerAISplitDemo}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="ทดสอบฟังก์ชันแยกข้อมูลหลายห้องอัตโนมัติด้วย AI"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">auto_awesome</span>
              <span>AI แยกข้อมูลหลายห้อง</span>
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={onOpenUploadModal}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-[#003e6f] hover:from-indigo-700 hover:to-[#002f54] text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            อัปโหลดไฟล์ (Upload)
          </button>
        </div>
      </div>

      {/* Floating Multi-Select Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedFileIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-indigo-900 text-white rounded-xl p-3.5 shadow-xl border border-indigo-700 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-mono font-bold text-xs">
                {selectedFileIds.length}
              </span>
              <span className="text-xs font-semibold">
                เลือกอยู่ <strong>{selectedFileIds.length}</strong> จาก {filteredFiles.length} รายการ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkMoveRoom}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-indigo-500 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
                ย้ายห้องปฏิบัติการ ({selectedFileIds.length})
              </button>

              <button
                onClick={handleBulkTrash}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                ย้ายลงถังขยะพร้อมกัน ({selectedFileIds.length})
              </button>

              <button
                onClick={() => setSelectedFileIds([])}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Files Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="เลือกทั้งหมด"
                  />
                </th>
                <th className="py-3 px-3">ชื่อไฟล์ (File Details)</th>
                <th className="py-3 px-3">ผู้อัปโหลด / เจ้าของ (Owner)</th>
                <th className="py-3 px-3">แผนก</th>
                <th className="py-3 px-3">ข้อมูลที่สกัดได้</th>
                <th className="py-3 px-3">สถานะ Real-time &amp; AI</th>
                <th className="py-3 px-3 text-right">การจัดการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <span className="material-symbols-outlined text-[36px] block mb-1 text-slate-300">
                      folder_off
                    </span>
                    ไม่พบไฟล์ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const isMine = file.ownerId === currentUser?.id || file.ownerEmail === currentUser?.email;
                  const deleteCheck = canDeleteFile(currentUser, file);
                  const isSelected = selectedFileIds.includes(file.id);

                  return (
                    <tr
                      key={file.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/60'
                          : isMine
                          ? 'bg-indigo-50/20'
                          : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectFile(file.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* File Info */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                              {file.filename.endsWith('.csv') ? 'table_chart' : 'description'}
                            </span>
                          </div>
                          <div>
                            <button
                              onClick={() => setSelectedFileForDetail(file)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors flex items-center gap-1.5"
                            >
                              <span>{file.filename}</span>
                              <span className="material-symbols-outlined text-[14px] text-slate-400">
                                visibility
                              </span>
                            </button>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{file.fileSize || '1.2 MB'}</span>
                              <span>•</span>
                              <span>{file.uploadDate}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span>{file.ownerName}</span>
                              {isMine && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                  ไฟล์ของฉัน
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{file.ownerRole || 'User'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                          {file.department}
                        </span>
                      </td>

                      {/* Extracted Stats */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-slate-800">
                          {typeof file.records === 'number'
                            ? `${file.records.toLocaleString()} แถว`
                            : file.records}
                        </div>
                        {file.rejectionRate !== undefined && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            Reject Rate: {file.rejectionRate}%
                          </div>
                        )}
                      </td>

                      {/* Real-time Status & AI Ingestion */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              file.status === 'Completed' || file.status === 'Processed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {file.status === 'Completed' || file.status === 'Processed'
                                ? 'check_circle'
                                : 'sync'}
                            </span>
                            {file.status === 'Completed' || file.status === 'Processed'
                              ? 'ประมวลผลสำเร็จ 100%'
                              : 'กำลังประมวลผล...'}
                          </span>

                          <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-semibold">
                            <span className="material-symbols-outlined text-[12px]">psychology</span>
                            <span>{file.aiIngested !== false ? 'AI Context ซิงค์แล้ว' : 'รอส่งเข้า AI'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions (Move Room, Trash, Delete) */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Move Room Icon */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenMoveModal) {
                                onOpenMoveModal([file.id], [file.filename]);
                              }
                            }}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="ย้ายห้องปฏิบัติการ / หมวดหมู่"
                          >
                            <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                          </button>

                          {/* Send to Trash Icon (7-day Recycle Bin) */}
                          {deleteCheck.allowed && (
                            <button
                              type="button"
                              onClick={() => handleSendToTrash(file)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ย้ายลงถังขยะ (Recycle Bin 7 วัน)"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}

                          {/* Permanent Delete Button */}
                          {deleteCheck.allowed ? (
                            <button
                              type="button"
                              onClick={() => handleDeletePermanent(file)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-md text-[11px] flex items-center gap-0.5 transition-colors border border-rose-200 cursor-pointer"
                              title={
                                currentTier === 'super_admin'
                                  ? 'ลบถาวร (สิทธิ์ Super Admin)'
                                  : currentTier === 'admin'
                                  ? 'ลบถาวร (สิทธิ์ Admin)'
                                  : 'ลบไฟล์ของตนเอง'
                              }
                            >
                              <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                              <span>ลบ</span>
                            </button>
                          ) : (
                            <span
                              className="text-[11px] text-slate-400 italic"
                              title={deleteCheck.reason}
                            >
                              ไม่มีสิทธิ์ลบ
                            </span>
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

      {/* File Detail Modal */}
      {selectedFileForDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-indigo-600">
                  analytics
                </span>
                <h3 className="font-bold text-base">
                  รายละเอียดไฟล์และบริบท AI
                </h3>
              </div>
              <button
                onClick={() => setSelectedFileForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">ชื่อไฟล์:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedFileForDetail.filename}</p>
                </div>
                <div>
                  <span className="text-slate-500">เจ้าของไฟล์ (Owner):</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedFileForDetail.ownerName}</p>
                </div>
                <div>
                  <span className="text-slate-500">แผนก:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedFileForDetail.department}</p>
                </div>
                <div>
                  <span className="text-slate-500">ขนาด / วันที่:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedFileForDetail.fileSize} • {selectedFileForDetail.uploadDate}
                  </p>
                </div>
              </div>

              {/* AI Context Snippet */}
              <div>
                <span className="font-bold text-indigo-700 flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  ข้อมูลบริบทที่ AI นำไปใช้ (AI Context Knowledge):
                </span>
                <div className="bg-slate-900 text-sky-200 p-3.5 rounded-xl font-mono text-[11px] whitespace-pre-wrap border border-slate-800 leading-relaxed">
                  {selectedFileForDetail.aiContextSnippet ||
                    `[ไฟล์: ${selectedFileForDetail.filename}] สกัดข้อมูล ${selectedFileForDetail.records} แถวเข้าสู่ AI Context เรียบร้อย`}
                </div>
              </div>

              {/* Processing Logs */}
              {selectedFileForDetail.logs && selectedFileForDetail.logs.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">ประวัติการประมวลผล (Processing Logs):</span>
                  <div className="bg-slate-100 p-2.5 rounded-xl space-y-1 font-mono text-[10px] max-h-28 overflow-y-auto">
                    {selectedFileForDetail.logs.map((l, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-400">[{l.timestamp}]</span>
                        <span className="text-slate-700">{l.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-200">
              <div className="flex items-center gap-2">
                {canDeleteFile(currentUser, selectedFileForDetail).allowed && (
                  <>
                    <button
                      onClick={() => handleSendToTrash(selectedFileForDetail)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg transition-colors border border-rose-200 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>ย้ายลงถังขยะ (7 วัน)</span>
                    </button>
                    <button
                      onClick={() => handleDeletePermanent(selectedFileForDetail)}
                      className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-800 font-semibold rounded-lg transition-colors border border-slate-200 text-xs cursor-pointer"
                    >
                      ลบถาวร
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedFileForDetail(null)}
                className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors"
              >
                ปิด
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
