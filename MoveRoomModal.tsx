import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FolderSymlink, Building2, ArrowRight, X, Check } from 'lucide-react';
import { CustomDepartment } from '../types';

interface MoveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNames: string[];
  departments: CustomDepartment[];
  currentDepartmentKey?: string;
  onConfirmMove: (newDeptKey: string) => void;
}

export const MoveRoomModal: React.FC<MoveRoomModalProps> = ({
  isOpen,
  onClose,
  targetNames,
  departments,
  currentDepartmentKey,
  onConfirmMove,
}) => {
  const [selectedDeptKey, setSelectedDeptKey] = useState<string>(
    departments.find((d) => d.key !== currentDepartmentKey && d.key !== 'all')?.key || 'blood'
  );

  if (!isOpen) return null;

  const validDepts = departments.filter((d) => d.key !== 'all' && d.key !== 'overview' && d.key !== 'sources');

  const handleSave = () => {
    onConfirmMove(selectedDeptKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FolderSymlink className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">ย้ายหมวดหมู่ / ห้องแล็บ (Move to Room)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เลือกห้องหรือหมวดหมู่ปลายทางที่ต้องการจัดเก็บ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">รายการที่เลือก ({targetNames.length} รายการ):</span>
            <div className="mt-1 max-h-24 overflow-y-auto space-y-1">
              {targetNames.map((name, i) => (
                <div key={i} className="truncate text-slate-600 font-mono text-[11px]">
                  • {name}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              เลือกห้องแล็บ / หมวดหมู่ปลายทาง:
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {validDepts.map((dept) => {
                const isSelected = selectedDeptKey === dept.key;
                return (
                  <button
                    key={dept.key}
                    type="button"
                    onClick={() => setSelectedDeptKey(dept.key)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: dept.color || '#4f46e5' }}
                      >
                        {dept.nameTh ? dept.nameTh.substring(0, 1) : 'L'}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{dept.nameTh || dept.name}</div>
                        <div className="text-[11px] text-slate-500">{dept.nameEn || dept.key}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>ยืนยันการย้าย</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
