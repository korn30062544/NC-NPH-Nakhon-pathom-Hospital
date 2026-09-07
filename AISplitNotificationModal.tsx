import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, Split, Layers, Building2, ShieldCheck, X } from 'lucide-react';
import { AISplitResult } from '../types';

interface AISplitNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  splitResult: AISplitResult | null;
  onNavigateToRoom?: (roomKey: string) => void;
}

export const AISplitNotificationModal: React.FC<AISplitNotificationModalProps> = ({
  isOpen,
  onClose,
  splitResult,
  onNavigateToRoom,
}) => {
  if (!isOpen || !splitResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">AI Smart Parsing &amp; Multi-Room Routing</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-400/20 text-purple-300 border border-purple-400/40">
                  Auto Splitting Active
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                AI วิเคราะห์เนื้อหาและทำการแยกข้อมูลหลายห้องอัตโนมัติ
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

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-4 flex items-start gap-3">
            <Split className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-950 leading-relaxed">
              <span className="font-bold">ไฟล์ต้นฉบับ:</span>{' '}
              <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-indigo-700 border border-purple-200">
                {splitResult.originalFileName}
              </code>
              <div className="mt-1 text-slate-600">
                ระบบตรวจพบข้อมูลของ <strong>{splitResult.splits.length} แผนก/ห้องแล็บ</strong> ในไฟล์เดียว AI จึงทำการแยกชิ้นส่วนข้อมูล (Data Splitting) ออกเป็น {splitResult.splits.length} ชุด และจัดส่งไปยังห้องและหมวดหมู่ที่ถูกต้องทันที
              </div>
            </div>
          </div>

          {/* Splits Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>ผลลัพธ์การแยกและจัดส่งข้อมูล (Routing Destinations)</span>
            </h4>

            <div className="space-y-2.5">
              {splitResult.splits.map((split, idx) => (
                <div
                  key={split.roomKey}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{split.roomNameTh}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {split.destinationTarget}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span>รายการ: <strong className="text-slate-700">{split.recordCount} แถว</strong></span>
                        <span>•</span>
                        <span>ชนิดส่งตรวจ: <strong className="text-slate-700">{split.specimenType}</strong></span>
                        <span>•</span>
                        <span>อุบัติการณ์ความเสี่ยง: <strong className="text-rose-600">{split.incidentsCount} เคส</strong></span>
                      </div>
                    </div>
                  </div>

                  {onNavigateToRoom && (
                    <button
                      onClick={() => {
                        onNavigateToRoom(split.roomKey);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-center shrink-0"
                    >
                      <span>ดูห้องนี้</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Global State Synced:</strong> ทุกหน้าจอ (Overview, สถิติหลัก, หน้าหมวดหมู่เฉพาะ, และห้องแล็บแต่ละห้อง) ได้รับข้อมูลอัปเดตตรงกันทันทีแล้ว!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            รับทราบและดำเนินการต่อ
          </button>
        </div>
      </motion.div>
    </div>
  );
};
