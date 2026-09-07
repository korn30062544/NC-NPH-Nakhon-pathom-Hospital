import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  X,
  FileText,
  Table,
  CheckCircle,
  Database,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { TrashedItemRecord, User } from '../types';
import { calculateRetentionCountdown } from '../utils/trashEngine';
import { getUserTier } from '../utils/rbacEngine';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashedItems: TrashedItemRecord[];
  currentUser: User | null;
  onRestoreItem: (trashId: string) => void;
  onPermanentDeleteItem: (trashId: string) => void;
  onRestoreAll: () => void;
  onEmptyTrash: () => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  trashedItems,
  currentUser,
  onRestoreItem,
  onPermanentDeleteItem,
  onRestoreAll,
  onEmptyTrash,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTier = getUserTier(currentUser);
  const isPrivileged = currentTier === 'super_admin' || currentTier === 'admin';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === trashedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(trashedItems.map((item) => item.id));
    }
  };

  const handleBulkRestore = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => onRestoreItem(id));
    showToast(`กู้คืนข้อมูลสำเร็จ ${selectedIds.length} รายการ (ส่งข้อมูลกลับเข้า AI และสถิติ Real-time แล้ว)`);
    setSelectedIds([]);
  };

  const handleBulkPermanentDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`ยืนยันการลบถาวร ${selectedIds.length} รายการ? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      selectedIds.forEach((id) => onPermanentDeleteItem(id));
      showToast(`ลบถาวรสำเร็จ ${selectedIds.length} รายการ`);
      setSelectedIds([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">ถังขยะระบบ (Recycle Bin & 7-Day Auto Purge)</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30">
                  {trashedItems.length} รายการ
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                กักเก็บไฟล์/ลิงก์ไว้ 7 วัน ก่อนลบถาวรอัตโนมัติ สามารถกู้คืนกลับมาคำนวณสถิติใหม่ได้ตลอดเวลา
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exclusion Logic Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950">
              [เงื่อนไขสำคัญ - Exclusion Logic]:
            </span>{' '}
            ไฟล์และข้อมูลที่อยู่ในถังขยะ จะถูก<strong>ตัดออกจากการประมวลผล AI โดยสิ้นเชิง</strong> และจะไม่ถูกนำมาคำนวณในสถิติใดๆ ของทุกหน้าเว็บ เมื่อกด <strong>"กู้คืน (Restore)"</strong> ระบบจะนำไฟล์กลับมาคำนวณสถิติทันทีแบบ Real-time
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-600 text-white text-xs font-semibold px-5 py-2 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Action Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={trashedItems.length > 0 && selectedIds.length === trashedItems.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>เลือกทั้งหมด ({selectedIds.length}/{trashedItems.length})</span>
            </label>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkRestore}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>กู้คืนที่เลือก ({selectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkPermanentDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบถาวรที่เลือก ({selectedIds.length})</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {trashedItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onRestoreAll();
                    showToast('กู้คืนไฟล์และลิงก์ทั้งหมดกลับสู่ระบบเรียบร้อยแล้ว');
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>กู้คืนทั้งหมด</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('ยืนยันการล้างถังขยะทั้งหมด? ไฟล์ทั้งหมดจะถูกลบถาวรทันที')) {
                      onEmptyTrash();
                      showToast('ล้างถังขยะทั้งหมดเรียบร้อยแล้ว');
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ล้างถังขยะ (Empty Trash)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {trashedItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Trash2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-700 mb-1">ถังขยะว่างเปล่า</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ไม่มีไฟล์หรือลิงก์ข้อมูลที่ถูกย้ายลงถังขยะ ข้อมูลที่กำลังใช้งานอยู่ทั้งหมดจะถูก AI ประมวลผลและนำมาแสดงผลแบบ Real-time
              </p>
            </div>
          ) : (
            trashedItems.map((item) => {
              const countdown = calculateRetentionCountdown(item.trashedAt, item.expiresAt);
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />

                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                      {item.type === 'google_sheet' ? (
                        <Table className="w-5 h-5 text-emerald-600" />
                      ) : item.type === 'risk_incident' ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate max-w-md">
                          {item.name || item.filename}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.originalDepartmentKey}
                        </span>
                        {item.type === 'risk_incident' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            รายงานความเสี่ยง (Incident)
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Excluded from AI
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                        <span>จำนวนแถว: <strong className="text-slate-700">{item.rowCount}</strong></span>
                        <span>•</span>
                        <span>ย้ายลงถังขยะโดย: {item.trashedBy}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{countdown.formattedRemaining}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onRestoreItem(item.id);
                        showToast(`กู้คืน "${item.name}" สำเร็จ! AI นำกลับมาคำนวณสถิติทันที`);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="กู้คืนกลับมาใช้งานและคำนวณสถิติใหม่"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>กู้คืน (Restore)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`ยืนยันการลบถาวร "${item.name}"?`)) {
                          onPermanentDeleteItem(item.id);
                          showToast(`ลบถาวร "${item.name}" แล้ว`);
                        }
                      }}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      title="ลบถาวรทันที"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>ระบบจะลบไฟล์ที่อยู่ในถังขยะทิ้งอัตโนมัติเมื่อครบ 7 วัน (7-Day Auto Purge System)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </motion.div>
    </div>
  );
};
