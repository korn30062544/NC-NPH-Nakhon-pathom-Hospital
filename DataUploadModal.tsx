import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DepartmentKey, UploadedFileRecord, User, FileProcessingLog, DataSourceItem } from '../types';
import { ingestUploadedFile } from '../utils/fileIngestion';

interface DataUploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newFile: UploadedFileRecord, newSource: DataSourceItem) => void;
  defaultDept?: DepartmentKey;
  currentUser?: User | null;
}

export const DataUploadModal: React.FC<DataUploadModalProps> = ({
  onClose,
  onUploadSuccess,
  defaultDept = 'central',
  currentUser,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDept, setUploadDept] = useState<string>('Central Lab');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [liveLogs, setLiveLogs] = useState<FileProcessingLog[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setErrorMsg('');
  };

  const startUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('กรุณาเลือกไฟล์ข้อมูล (Please select a file to upload)');
      return;
    }

    const u: User = currentUser || {
      id: 'usr-guest', name: 'Guest User', email: 'guest@hospital.th', role: 'Medical Technologist',
      roleType: 'Medical Technologist', tier: 'user', department: uploadDept, departmentKey: 'central',
      status: 'Active', lastActive: 'Just now', employeeId: 'MT-TEMP', avatarText: 'GU',
    };

    setIsProcessing(true);
    setProgress(15);
    setCurrentStage('กำลังอ่านเนื้อหาไฟล์จริง...');
    setLiveLogs([{ timestamp: new Date().toLocaleTimeString(), stage: 'Read file', message: `กำลังเปิด ${selectedFile.name}`, type: 'info' }]);
    setErrorMsg('');

    try {
      setProgress(45);
      const { fileRecord, source } = await ingestUploadedFile(selectedFile, uploadDept, u);
      setProgress(90);
      setCurrentStage('กำลังคำนวณสถิติจากข้อมูลจริง...');
      setLiveLogs(fileRecord.logs || []);
      onUploadSuccess(fileRecord, source);
      setProgress(100);
      setCurrentStage('นำเข้าข้อมูลสำเร็จ');
      setIsComplete(true);
      setTimeout(() => onClose(), 500);
    } catch (err: any) {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStage('นำเข้าข้อมูลไม่สำเร็จ');
      setErrorMsg(err?.message || 'ไม่สามารถอ่านไฟล์นี้ได้');
      setLiveLogs((prev) => [...prev, { timestamp: new Date().toLocaleTimeString(), stage: 'Error', message: err?.message || 'Parse failed', type: 'error' }]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#003e6f] to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sky-300">
              <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
            </div>
            <div>
              <h3 className="text-base font-bold">
                อัปโหลดไฟล์ข้อมูล (Real-time File Ingestion)
              </h3>
              <p className="text-xs text-sky-200">
                ประมวลผลพื้นหลังอัตโนมัติ สกัดความเสี่ยง และอัปเดตบริบท AI ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing && !isComplete}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-900 rounded-lg text-xs flex items-center gap-2 border border-rose-200">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current User Owner Info */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                style={{ backgroundColor: currentUser?.avatarBg || '#4f46e5' }}
              >
                {currentUser?.avatarText || 'U'}
              </div>
              <div>
                <span className="text-slate-500">เจ้าของไฟล์ (Owner):</span>{' '}
                <span className="font-bold text-slate-800">{currentUser?.name || 'Guest User'}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              {currentUser?.roleType || 'User'}
            </span>
          </div>

          {/* Department Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              แผนกเป้าหมาย (Target Department)
            </label>
            <select
              value={uploadDept}
              disabled={isProcessing}
              onChange={(e) => setUploadDept(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#003e6f] focus:bg-white focus:outline-none text-xs font-semibold text-slate-800"
            >
              <option value="Central Lab">Central Lab (ห้องปฏิบัติการกลาง)</option>
              <option value="Blood Bank">Blood Bank (ธนาคารเลือด)</option>
              <option value="Molecular Biology">Molecular Biology (ห้องอณูชีววิทยา)</option>
              <option value="Outpatient Lab">Outpatient Lab (ห้องปฏิบัติการผู้ป่วยภายนอก)</option>
              <option value="Clinical Microbiology">Clinical Microbiology (ห้องจุลชีววิทยาคลินิก)</option>
              <option value="Molecular Science">Molecular Science (วิทยาศาสตร์โมเลกุล)</option>
              <option value="Science Material Store">Science Material Store (คลังวัสดุ)</option>
              <option value="All Departments">All Departments (รวมทุกแผนก)</option>
            </select>
          </div>

          {/* Drag & Drop Area */}
          {!isProcessing ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50/60'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt,.pdf,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100/80 text-indigo-700 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-[28px]">upload_file</span>
              </div>
              <p className="text-xs font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                รองรับ CSV, XLSX, XLS, JSON — อ่านข้อมูลจริงจากไฟล์ (PDF จะไม่เดาข้อมูล)
              </p>
              {selectedFile && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  พร้อมนำเข้า ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          ) : (
            /* Live Real-time Processing Pipeline Card */
            <div className="bg-slate-900 text-white rounded-xl p-4.5 space-y-3.5 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                  </span>
                  <span className="text-xs font-bold text-sky-300">
                    {isComplete ? 'ประมวลผลเสร็จสมบูรณ์' : 'Real-time Processing Engine'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {progress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isComplete
                      ? 'bg-emerald-400'
                      : 'bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-400'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-sky-400 animate-spin">
                  {isComplete ? 'done' : 'sync'}
                </span>
                <span>{currentStage}</span>
              </div>

              {/* Live Logs Stream */}
              <div className="bg-black/50 rounded-lg p-3 max-h-36 overflow-y-auto space-y-1.5 font-mono text-[11px] border border-slate-800">
                {liveLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 ${
                      log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>เฉพาะคุณ ({currentUser?.name?.split(' ')[0] || 'User'}) และ Admin ที่จะลบไฟล์นี้ได้</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={startUpload}
                disabled={isProcessing || !selectedFile}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-[#003e6f] hover:from-indigo-700 hover:to-[#002f54] text-white rounded-lg font-bold text-xs transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isProcessing ? 'sync' : 'bolt'}
                </span>
                {isProcessing ? 'กำลังประมวลผล...' : 'เริ่มนำเข้าและสกัดข้อมูลทันที'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

