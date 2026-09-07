import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  FileJson,
  Link,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Database,
  UploadCloud,
  FileUp,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { DataSourceItem, CustomDepartment, User } from '../types';
import {
  isAdmin as checkIsAdmin,
  isSuperAdmin,
  getUserTier,
} from '../utils/rbacEngine';
import {
  parseCSVData,
  parseExcelData,
  parseJSONData,
  fetchAndParseGoogleSheet,
  calculateFusedMetrics,
  FusedDataMetrics,
} from '../utils/multiSourceDataEngine';

interface MultiSourceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: DataSourceItem[];
  onUpdateSources: (newSources: DataSourceItem[]) => void;
  fusedMetrics: FusedDataMetrics;
  departments: CustomDepartment[];
  currentUser: User;
  onClearMockData: () => void;
  onLoadSampleData: () => void;
}

export const MultiSourceManagerModal: React.FC<MultiSourceManagerModalProps> = ({
  isOpen,
  onClose,
  sources,
  onUpdateSources,
  fusedMetrics,
  departments,
  currentUser,
  onClearMockData,
  onLoadSampleData,
}) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'add_sheet' | 'add_file' | 'add_form'>('sources');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Google Sheet Form state
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetUrl, setNewSheetUrl] = useState('');
  const [newSheetDept, setNewSheetDept] = useState('central');
  const [newSheetTab, setNewSheetTab] = useState('');

  // New Google Form state
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormUrl, setNewFormUrl] = useState('');
  const [newFormDept, setNewFormDept] = useState('central');

  // File upload state
  const [selectedFileDept, setSelectedFileDept] = useState('central');
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const isAdmin = checkIsAdmin(currentUser) || isSuperAdmin(currentUser);

  // Toggle Source Active / Disabled (Instant Recalculation)
  const handleToggleSource = (sourceId: string) => {
    if (!isAdmin) {
      setStatusMessage('⚠️ สิทธิ์ไม่เพียงพอ: เฉพาะ Admin หรือ Super Admin เท่านั้นที่สามารถเปิด/ปิดแหล่งข้อมูลได้');
      return;
    }
    const updated = sources.map((s) =>
      s.id === sourceId ? { ...s, status: s.status === 'active' ? ('disabled' as const) : ('active' as const) } : s
    );
    onUpdateSources(updated);
    setStatusMessage('อัปเดตสถานะและคำนวณสถิติใหม่ทันทีเรียบร้อยแล้ว');
  };

  // Dynamic Purge & Recalculate (Completely deletes source & all its records)
  const handlePurgeSource = (sourceId: string, sourceName: string) => {
    if (!isAdmin) {
      setStatusMessage('⚠️ สิทธิ์ไม่เพียงพอ: เฉพาะ Admin หรือ Super Admin เท่านั้นที่สามารถ Purge ลบชุดข้อมูลหลักได้');
      return;
    }
    const updated = sources.filter((s) => s.id !== sourceId);
    onUpdateSources(updated);
    setStatusMessage(`✅ ดำเนินการ Purge ข้อมูลจาก "${sourceName}" ออกจากระบบและ Recalculate สถิติใหม่เรียบร้อย (ไม่มีข้อมูลตกค้าง)`);
  };

  // Add Google Sheet
  const handleAddGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetUrl.trim() || !newSheetTitle.trim()) return;

    setIsProcessing(true);
    setStatusMessage('กำลังเชื่อมต่อและดึงข้อมูลจาก Google Sheets...');

    try {
      const sourceId = `gsheet-${Date.now()}`;
      const { incidents, totalSpecimens, rejectedCount, rawRowsCount } = await fetchAndParseGoogleSheet(
        newSheetUrl.trim(),
        sourceId,
        newSheetDept
      );

      const newSource: DataSourceItem = {
        id: sourceId,
        name: newSheetTitle.trim(),
        type: 'google_sheet',
        departmentKey: newSheetDept,
        url: newSheetUrl.trim(),
        sheetTabName: newSheetTab.trim() || undefined,
        uploadedAt: new Date().toLocaleDateString('th-TH'),
        lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        status: 'active',
        rowCount: rawRowsCount,
        specimenCount: totalSpecimens,
        rejectedCount: rejectedCount,
        rejectionRate: totalSpecimens > 0 ? Number(((rejectedCount / totalSpecimens) * 100).toFixed(2)) : 0,
        incidents,
        autoSync: true,
      };

      onUpdateSources([...sources, newSource]);
      setStatusMessage(`✅ นำเข้า Google Sheet สำเร็จ! ประมวลผลได้ ${incidents.length} อุบัติการณ์, ${totalSpecimens.toLocaleString()} สิ่งส่งตรวจ`);
      setNewSheetTitle('');
      setNewSheetUrl('');
      setNewSheetTab('');
      setActiveTab('sources');
    } catch (err: any) {
      console.error('Add Google Sheet Error:', err);
      setStatusMessage(`❌ เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถดึงข้อมูล Google Sheet ได้'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add Google Form (Response / Embedded Link)
  const handleAddGoogleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim() || !newFormUrl.trim()) return;

    const sourceId = `gform-${Date.now()}`;
    const newSource: DataSourceItem = {
      id: sourceId,
      name: newFormTitle.trim(),
      type: 'google_form',
      departmentKey: newFormDept,
      url: newFormUrl.trim(),
      uploadedAt: new Date().toLocaleDateString('th-TH'),
      lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      rowCount: 0,
      specimenCount: 0,
      rejectedCount: 0,
      rejectionRate: 0,
      incidents: [],
    };

    onUpdateSources([...sources, newSource]);
    setStatusMessage(`✅ บันทึก Google Form สำหรับการรายงานความเสี่ยงแบบ Real-time เรียบร้อย`);
    setNewFormTitle('');
    setNewFormUrl('');
    setActiveTab('sources');
  };

  // Handle Local File Upload (CSV, Excel .xlsx/.xls, JSON)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setStatusMessage(`กำลังอ่านและประมวลผล ${files.length} ไฟล์...`);

    const newSourcesToAdd: DataSourceItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sourceId = `file-${Date.now()}-${i}`;
      const ext = file.name.split('.').pop()?.toLowerCase();

      try {
        if (ext === 'csv') {
          const text = await file.text();
          const { incidents, totalSpecimens, rejectedCount } = parseCSVData(text, sourceId, selectedFileDept);
          newSourcesToAdd.push({
            id: sourceId,
            name: file.name,
            type: 'file_csv',
            departmentKey: selectedFileDept,
            filename: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            uploadedAt: new Date().toLocaleDateString('th-TH'),
            lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            status: 'active',
            rowCount: incidents.length,
            specimenCount: totalSpecimens,
            rejectedCount: rejectedCount,
            rejectionRate: totalSpecimens > 0 ? Number(((rejectedCount / totalSpecimens) * 100).toFixed(2)) : 0,
            incidents,
          });
        } else if (ext === 'xlsx' || ext === 'xls') {
          const buffer = await file.arrayBuffer();
          const { incidents, totalSpecimens, rejectedCount } = parseExcelData(buffer, sourceId, selectedFileDept);
          newSourcesToAdd.push({
            id: sourceId,
            name: file.name,
            type: 'file_excel',
            departmentKey: selectedFileDept,
            filename: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            uploadedAt: new Date().toLocaleDateString('th-TH'),
            lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            status: 'active',
            rowCount: incidents.length,
            specimenCount: totalSpecimens,
            rejectedCount: rejectedCount,
            rejectionRate: totalSpecimens > 0 ? Number(((rejectedCount / totalSpecimens) * 100).toFixed(2)) : 0,
            incidents,
          });
        } else if (ext === 'json') {
          const text = await file.text();
          const { incidents, totalSpecimens, rejectedCount } = parseJSONData(text, sourceId, selectedFileDept);
          newSourcesToAdd.push({
            id: sourceId,
            name: file.name,
            type: 'file_json',
            departmentKey: selectedFileDept,
            filename: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            uploadedAt: new Date().toLocaleDateString('th-TH'),
            lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            status: 'active',
            rowCount: incidents.length,
            specimenCount: totalSpecimens,
            rejectedCount: rejectedCount,
            rejectionRate: totalSpecimens > 0 ? Number(((rejectedCount / totalSpecimens) * 100).toFixed(2)) : 0,
            incidents,
          });
        }
      } catch (err: any) {
        console.error(`Error reading ${file.name}:`, err);
      }
    }

    if (newSourcesToAdd.length > 0) {
      onUpdateSources([...sources, ...newSourcesToAdd]);
      setStatusMessage(`✅ นำเข้าสำเร็จ ${newSourcesToAdd.length} แหล่งข้อมูล! ระบบประมวลผลตัวเลขรวมใหม่ทันที`);
      setActiveTab('sources');
    } else {
      setStatusMessage('❌ ไม่สามารถอ่านรูปแบบไฟล์ที่อัปโหลดได้ (รองรับ .csv, .xlsx, .xls, .json)');
    }

    setIsProcessing(false);
  };

  // Sync / Refresh single Google Sheet
  const handleRefreshSheet = async (sheetSource: DataSourceItem) => {
    if (!sheetSource.url) return;
    setIsProcessing(true);
    setStatusMessage(`กำลังรีเฟรชข้อมูลจาก ${sheetSource.name}...`);

    try {
      const { incidents, totalSpecimens, rejectedCount, rawRowsCount } = await fetchAndParseGoogleSheet(
        sheetSource.url,
        sheetSource.id,
        sheetSource.departmentKey
      );

      const updated = sources.map((s) =>
        s.id === sheetSource.id
          ? {
              ...s,
              rowCount: rawRowsCount,
              specimenCount: totalSpecimens,
              rejectedCount,
              rejectionRate: totalSpecimens > 0 ? Number(((rejectedCount / totalSpecimens) * 100).toFixed(2)) : 0,
              incidents,
              lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              status: 'active' as const,
            }
          : s
      );

      onUpdateSources(updated);
      setStatusMessage(`✅ รีเฟรชข้อมูล "${sheetSource.name}" สำเร็จและ Recalculate ตัวเลขล่าสุดแล้ว`);
    } catch (err: any) {
      setStatusMessage(`❌ รีเฟรชไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'file_csv':
        return <FileText className="w-5 h-5 text-emerald-600" />;
      case 'file_excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-700" />;
      case 'file_json':
        return <FileJson className="w-5 h-5 text-amber-600" />;
      case 'google_sheet':
        return <FileSpreadsheet className="w-5 h-5 text-blue-600" />;
      case 'google_form':
        return <Layers className="w-5 h-5 text-purple-600" />;
      default:
        return <Database className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Database className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Multi-Source Data Management & Fusion Center</h2>
                <span className="text-[11px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-medium">
                  Real-time Purge & Recalculate
                </span>
              </div>
              <p className="text-xs text-slate-300">
                ศูนย์จัดการเชื่อมโยงไฟล์และลิงก์ Google Sheets หลายแหล่ง พร้อมระบบ Purge และคำนวณสถิติใหม่ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Metrics Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-slate-500 font-medium">แหล่งข้อมูลทั้งหมด</div>
            <div className="text-base font-bold text-slate-900">{sources.length} แหล่ง</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-xs">
            <div className="text-emerald-700 font-medium">เปิดใช้งาน (Active)</div>
            <div className="text-base font-bold text-emerald-700">{fusedMetrics.activeSources} แหล่ง</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-xs">
            <div className="text-indigo-700 font-medium">อุบัติการณ์รวม (Recalculated)</div>
            <div className="text-base font-bold text-indigo-900">{(fusedMetrics.totalIncidents ?? 0).toLocaleString()} รายการ</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-xs">
            <div className="text-blue-700 font-medium">สิ่งส่งตรวจรวม</div>
            <div className="text-base font-bold text-blue-900">{(fusedMetrics.totalSpecimens ?? 0).toLocaleString()} รายการ</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-xs">
            <div className="text-amber-700 font-medium">อัตราปฏิเสธเฉลี่ย</div>
            <div className="text-base font-bold text-amber-900">{fusedMetrics.rejectionRate ?? 0}%</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2">
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'sources'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            รายการแหล่งข้อมูลทั้งหมด ({sources.length})
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('add_sheet')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'add_sheet'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Plus className="w-4 h-4" />
                เพิ่ม Google Sheets URL
              </button>
              <button
                onClick={() => setActiveTab('add_file')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'add_file'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileUp className="w-4 h-4" />
                อัปโหลดไฟล์ (CSV, Excel, JSON)
              </button>
              <button
                onClick={() => setActiveTab('add_form')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                  activeTab === 'add_form'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Link className="w-4 h-4" />
                เพิ่ม Google Form
              </button>
            </>
          )}
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div className="mx-6 mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-indigo-400 hover:text-indigo-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Sources List */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    รายการแหล่งข้อมูลที่เชื่อมต่อ (Active & Synced Sources)
                  </h3>
                  <p className="text-xs text-slate-500">
                    เมื่อปิดหรือลบแหล่งข้อมูลใด ระบบจะ Purge และคำนวณสถิติใหม่ทันทีแบบ Real-time
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onClearMockData}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      title="ลบข้อมูลจำลองทั้งหมดและใช้เฉพาะข้อมูลจริง"
                    >
                      ลบข้อมูลจำลอง (Clear Mock Data)
                    </button>
                    <button
                      onClick={onLoadSampleData}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      โหลดชุดข้อมูลตัวอย่าง
                    </button>
                  </div>
                )}
              </div>

              {sources.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700">ยังไม่มีแหล่งข้อมูลในระบบ</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    คุณสามารถเพิ่ม Google Sheets หรืออัปโหลดไฟล์ Excel / CSV เพื่อเริ่มประมวลผลและสร้าง Dashboard อัตโนมัติ
                  </p>
                  {isAdmin && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setActiveTab('add_sheet')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        เพิ่ม Google Sheets
                      </button>
                      <button
                        onClick={() => setActiveTab('add_file')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        อัปโหลดไฟล์
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {sources.map((src) => {
                    const deptObj = departments.find((d) => d.key === src.departmentKey);
                    const isActive = src.status === 'active';

                    return (
                      <div
                        key={src.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-white border-slate-200 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                              {getSourceIcon(src.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900">{src.name}</h4>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium uppercase">
                                  {src.type.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium">
                                  {deptObj?.nameTh || src.departmentKey}
                                </span>
                                {src.sheetTabName && (
                                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
                                    Tab: {src.sheetTabName}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                                <span>แถวข้อมูล: <strong className="text-slate-800">{src.rowCount}</strong></span>
                                <span>สิ่งส่งตรวจ: <strong className="text-slate-800">{(src.specimenCount || 0).toLocaleString()}</strong></span>
                                <span>ปฏิเสธ: <strong className="text-amber-700">{src.rejectedCount || 0}</strong> ({src.rejectionRate || 0}%)</span>
                                <span>อัปเดตล่าสุด: {src.lastSyncedAt || src.uploadedAt}</span>
                                {src.url && (
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px]"
                                  >
                                    เปิดลิงก์ <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Controls */}
                          {isAdmin && (
                            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                              {src.type === 'google_sheet' && (
                                <button
                                  onClick={() => handleRefreshSheet(src)}
                                  disabled={isProcessing}
                                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                  title="รีเฟรชและดึงข้อมูลล่าสุด"
                                >
                                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                                  <span className="hidden sm:inline">ซิงค์ข้อมูล</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleToggleSource(src.id)}
                                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                                  isActive
                                    ? 'text-emerald-700 hover:bg-emerald-50'
                                    : 'text-slate-500 hover:bg-slate-200'
                                }`}
                                title={isActive ? 'ปิดการใช้งานชั่วคราว' : 'เปิดใช้งาน'}
                              >
                                {isActive ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-slate-400" />
                                )}
                                <span className="text-[11px]">{isActive ? 'Active' : 'Disabled'}</span>
                              </button>

                              <button
                                onClick={() => handlePurgeSource(src.id, src.name)}
                                className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                title="Purge และลบชุดข้อมูลนี้ออกทั้งหมด"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-[11px]">ลบถาวร</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Add Google Sheets */}
          {activeTab === 'add_sheet' && (
            <form onSubmit={handleAddGoogleSheet} className="max-w-2xl mx-auto space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 leading-relaxed">
                <strong>คำแนะนำการเชื่อมโยง Google Sheets:</strong>
                <p className="mt-1">
                  1. เปิด Google Sheet ที่ต้องการ แล้วกดปุ่ม <strong>แชร์ (Share)</strong> ด้านขวาบน<br />
                  2. เลือก <strong>"ทุกคนที่มีลิงก์ (Anyone with the link can view)"</strong><br />
                  3. คัดลอก URL ลิงก์มาวางในช่องด้านล่าง ระบบจะดึงและประมวลผลตัวเลขเข้าสู่แดชบอร์ดทันที
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อแหล่งข้อมูล / ชื่อรายงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="เช่น รายงานความเสี่ยงและสิ่งส่งตรวจ ธนาคารเลือด 2569"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Sheet URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={newSheetUrl}
                  onChange={(e) => setNewSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    แผนก / ห้องปฏิบัติการเป้าหมาย
                  </label>
                  <select
                    value={newSheetDept}
                    onChange={(e) => setNewSheetDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="overview">ภาพรวมทั้งโรงพยาบาล (Hospital Overview)</option>
                    {departments.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.nameTh} ({d.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ Sheet Tab (ไม่บังคับ)
                  </label>
                  <input
                    type="text"
                    value={newSheetTab}
                    onChange={(e) => setNewSheetTab(e.target.value)}
                    placeholder="เช่น Sheet1 หรือ BloodBank2026"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('sources')}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{isProcessing ? 'กำลังประมวลผล...' : 'เชื่อมโยงและคำนวณทันที'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Upload Files */}
          {activeTab === 'add_file' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลือกแผนก / ห้องปฏิบัติการสำหรับชุดไฟล์นี้
                </label>
                <select
                  value={selectedFileDept}
                  onChange={(e) => setSelectedFileDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="overview">ภาพรวมทั้งโรงพยาบาล (Hospital Overview)</option>
                  {departments.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.nameTh} ({d.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">
                  ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                </h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  รองรับไฟล์ <strong>CSV (.csv)</strong>, <strong>Excel (.xlsx, .xls)</strong> และ <strong>JSON (.json)</strong>
                </p>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                  <FileUp className="w-4 h-4" />
                  <span>เลือกไฟล์จากเครื่อง (Upload Files)</span>
                  <input
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: Add Google Form */}
          {activeTab === 'add_form' && (
            <form onSubmit={handleAddGoogleForm} className="max-w-2xl mx-auto space-y-4">
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-xs text-purple-900 leading-relaxed">
                <strong>เชื่อมโยงแบบฟอร์มรายงานความเสี่ยง (Google Forms):</strong>
                <p className="mt-1">
                  วางลิงก์ Google Form เพื่อให้เจ้าหน้าที่สามารถเปิดและกรอกรายงานความเสี่ยงได้โดยตรงจากภายในระบบ
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อแบบฟอร์ม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  placeholder="เช่น แบบฟอร์มรายงานอุบัติการณ์ห้องปฏิบัติการจุลชีววิทยา"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Form Link (URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={newFormUrl}
                  onChange={(e) => setNewFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  แผนก / ห้องปฏิบัติการ
                </label>
                <select
                  value={newFormDept}
                  onChange={(e) => setNewFormDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="overview">ภาพรวมทั้งโรงพยาบาล</option>
                  {departments.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.nameTh} ({d.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('sources')}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกแบบฟอร์ม</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            ระบบคำนวณและประมวลผลข้อมูลรวมอัตโนมัติ (Zero-Latency Recalculation Engine)
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
