import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, Link2, Plus, Trash2, CheckCircle2, Sparkles, X, FileSpreadsheet } from 'lucide-react';
import { CustomDepartment, DataSourceItem, UploadedFileRecord } from '../types';
import { ingestUploadedFile } from '../utils/fileIngestion';
import { fetchAndParseGoogleSheet } from '../utils/multiSourceDataEngine';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: CustomDepartment[];
  currentUser: any;
  onBulkAddFiles: (files: UploadedFileRecord[], newSources: DataSourceItem[], splitResults?: any) => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  departments,
  currentUser,
  onBulkAddFiles,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'links'>('files');
  const [enableAISplitting, setEnableAISplitting] = useState(true);
  const [selectedDeptKey, setSelectedDeptKey] = useState('central');
  const [linkInput, setLinkInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const validDepts = departments.filter((d) => d.key !== 'all' && d.key !== 'overview' && d.key !== 'sources');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleProcessBulk = async () => {
    setIsProcessing(true);
    try {
      const newFileRecords: UploadedFileRecord[] = [];
      const newSources: DataSourceItem[] = [];
      const deptObj = departments.find((d) => d.key === selectedDeptKey);
      const deptName = deptObj?.nameTh || deptObj?.nameEn || 'Central Lab';

      if (activeTab === 'files') {
        for (const file of selectedFiles) {
          const result = await ingestUploadedFile(file, deptName, currentUser);
          newFileRecords.push(result.fileRecord);
          newSources.push(result.source);
        }
      } else {
        const lines = linkInput.split('\n').map((l) => l.trim()).filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          const url = lines[i];
          const isForm = url.includes('forms') || url.includes('/forms/');
          if (isForm) {
            newSources.push({
              id: `src-form-${Date.now()}-${i}`,
              name: `Google Form #${i + 1}`,
              type: 'google_form',
              departmentKey: selectedDeptKey,
              url,
              uploadedAt: new Date().toLocaleString('th-TH'),
              status: 'active',
              rowCount: 0,
              specimenCount: 0,
              rejectedCount: 0,
              rejectionRate: 0,
              incidents: [],
              errorMessage: 'Google Form เป็นแบบฟอร์มรับข้อมูล ไม่ใช่แหล่งข้อมูลโดยตรง กรุณาเชื่อม Google Sheet ที่รับคำตอบจากฟอร์ม',
            });
          } else {
            const sourceId = `src-sheet-${Date.now()}-${i}`;
            const parsed = await fetchAndParseGoogleSheet(url, sourceId, selectedDeptKey);
            newSources.push({
              id: sourceId,
              name: `Google Sheet #${i + 1}`,
              type: 'google_sheet',
              departmentKey: selectedDeptKey,
              url,
              uploadedAt: new Date().toLocaleString('th-TH'),
              lastSyncedAt: new Date().toLocaleString('th-TH'),
              status: 'active',
              rowCount: parsed.rawRowsCount,
              specimenCount: parsed.totalSpecimens,
              rejectedCount: parsed.rejectedCount,
              rejectionRate: parsed.totalSpecimens > 0 ? Number(((parsed.rejectedCount / parsed.totalSpecimens) * 100).toFixed(2)) : 0,
              incidents: parsed.incidents,
            });
          }
        }
      }

      // AI splitting demo is intentionally disabled: routing now follows real source rows only.
      onBulkAddFiles(newFileRecords, newSources);
      onClose();
    } catch (err) {
      console.error('Bulk ingestion failed:', err);
      alert(err instanceof Error ? err.message : 'ไม่สามารถนำเข้าข้อมูลได้');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">เพิ่มหลายรายการพร้อมกัน (Bulk Ingestion)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                อัปโหลดไฟล์หลายไฟล์ หรือวางลิงก์ Google Sheets / Forms หลายลิงก์พร้อมกัน
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

        {/* Tab switch */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>อัปโหลดหลายไฟล์ (Bulk Files)</span>
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'links'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>เพิ่มหลายลิงก์ (Bulk Links)</span>
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-purple-900 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 cursor-pointer">
            <input
              type="checkbox"
              checked={enableAISplitting}
              onChange={(e) => setEnableAISplitting(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-purple-300"
            />
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Auto Routeting (แตกข้อมูลหลายห้องอัตโนมัติ)</span>
          </label>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'files' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 rounded-2xl p-6 text-center transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bulk-file-input"
                />
                <label htmlFor="bulk-file-input" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">คลิกเพื่อเลือกไฟล์หลายไฟล์พร้อมกัน</div>
                  <div className="text-xs text-slate-500 mt-1">
                    รองรับ .CSV, .XLSX (สามารถเลือกไฟล์รวมเพื่อทดสอบ AI แยกห้องอัตโนมัติได้)
                  </div>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>ไฟล์ที่เลือก ({selectedFiles.length} ไฟล์):</span>
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      ล้างทั้งหมด
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {selectedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <span className="font-semibold text-slate-800 truncate max-w-sm">{f.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-400 text-[11px]">{(f.size / 1024).toFixed(1)} KB</span>
                          <button
                            onClick={() => removeFile(i)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                วางลิงก์ Google Sheets หรือ Google Forms (1 บรรทัดต่อ 1 ลิงก์):
              </label>
              <textarea
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0&#10;https://docs.google.com/forms/d/e/1FAIpQLScD9c8y.../viewform"
                rows={5}
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500">
                Tip: หากใส่ลิงก์ที่มีข้อมูลของหลายแผนก และเปิดใช้งาน Auto Routeting ระบบจะทำการแตกและกระจายข้อมูลไปตามห้องแล็บให้อัตโนมัติ
              </p>
            </div>
          )}

          {/* Department Select fallback */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ห้องแล็บเริ่มต้น (กรณีข้อมูลไม่ได้แยกอัตโนมัติ):
            </label>
            <select
              value={selectedDeptKey}
              onChange={(e) => setSelectedDeptKey(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              {validDepts.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.nameTh || d.name} ({d.nameEn || d.key})
                </option>
              ))}
            </select>
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
            onClick={handleProcessBulk}
            disabled={isProcessing || (activeTab === 'files' && selectedFiles.length === 0) || (activeTab === 'links' && !linkInput.trim())}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isProcessing ? (
              <span>กำลังประมวลผล AI...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>นำเข้าข้อมูลแบบกลุ่ม (Start Ingestion)</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
