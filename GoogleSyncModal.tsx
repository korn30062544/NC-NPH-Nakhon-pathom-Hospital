import React, { useState } from 'react';
import { GoogleSyncConfig, RiskIncident, GoogleSheetResource, GoogleFormResource, CustomDepartment } from '../types';
import { syncAndProcessGoogleSheet, parseCsvRows } from '../utils/googleSheetsSync';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSyncConfig;
  onUpdateConfig: (newConfig: GoogleSyncConfig) => void;
  incidents: RiskIncident[];
  onSetIncidents: (incidents: RiskIncident[]) => void;
  onClearMockData: () => void;
  onLoadSampleData: () => void;
  departments: CustomDepartment[];
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  incidents,
  onSetIncidents,
  onClearMockData,
  onLoadSampleData,
  departments,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'forms' | 'live_calculation' | 'embed_form'>('sheets');
  const [sheetResources, setSheetResources] = useState<GoogleSheetResource[]>(config.sheets || []);
  const [formResources, setFormResources] = useState<GoogleFormResource[]>(config.forms || []);
  const [selectedFormIndex, setSelectedFormIndex] = useState(0);

  // New Sheet Form
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetUrl, setNewSheetUrl] = useState('');
  const [newSheetDept, setNewSheetDept] = useState('all');
  const [newSheetTab, setNewSheetTab] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);

  // New Form Form
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormUrl, setNewFormUrl] = useState('');
  const [newFormDept, setNewFormDept] = useState('all');
  const [newFormDesc, setNewFormDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Syncing states
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handler: Add new Google Sheet
  const handleAddSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim() || !newSheetUrl.trim()) return;

    const newSheet: GoogleSheetResource = {
      id: `sheet-${Date.now()}`,
      title: newSheetTitle.trim(),
      type: 'sheet',
      url: newSheetUrl.trim(),
      departmentKey: newSheetDept,
      sheetTabName: newSheetTab.trim() || undefined,
      autoSync: true,
      status: 'pending',
      rowCount: 0,
    };

    const updated = [...sheetResources, newSheet];
    setSheetResources(updated);
    onUpdateConfig({ ...config, sheets: updated });
    setNewSheetTitle('');
    setNewSheetUrl('');
    setNewSheetTab('');
    setShowAddSheet(false);
  };

  // Handler: Remove Google Sheet
  const handleRemoveSheet = (id: string) => {
    const updated = sheetResources.filter((s) => s.id !== id);
    setSheetResources(updated);
    onUpdateConfig({ ...config, sheets: updated });
  };

  // Handler: Add new Google Form
  const handleAddForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim() || !newFormUrl.trim()) return;

    // Convert viewform url to embed if needed
    let embed = newFormUrl.trim();
    if (embed.includes('docs.google.com/forms') && !embed.includes('embedded=true')) {
      embed = embed.includes('?') ? `${embed}&embedded=true` : `${embed}?embedded=true`;
    }

    const newForm: GoogleFormResource = {
      id: `form-${Date.now()}`,
      title: newFormTitle.trim(),
      type: 'form',
      url: newFormUrl.trim(),
      embedUrl: embed,
      departmentKey: newFormDept,
      description: newFormDesc.trim(),
    };

    const updated = [...formResources, newForm];
    setFormResources(updated);
    onUpdateConfig({ ...config, forms: updated });
    setNewFormTitle('');
    setNewFormUrl('');
    setNewFormDesc('');
    setShowAddForm(false);
  };

  // Handler: Remove Google Form
  const handleRemoveForm = (id: string) => {
    const updated = formResources.filter((f) => f.id !== id);
    setFormResources(updated);
    onUpdateConfig({ ...config, forms: updated });
  };

  // Handler: Process numerical data from a single Google Sheet
  const handleSyncSingleSheet = async (sheet: GoogleSheetResource) => {
    setProcessingStatus(`กำลังดึงข้อมูลและประมวลผลตัวเลขจาก: ${sheet.title}...`);
    const { updatedResource, newIncidents } = await syncAndProcessGoogleSheet(sheet);

    if (updatedResource.status === 'connected' && updatedResource.summaryMetrics) {
      // Update sheet resource state
      const updatedSheets = sheetResources.map((s) => (s.id === sheet.id ? updatedResource : s));
      setSheetResources(updatedSheets);
      onUpdateConfig({ ...config, sheets: updatedSheets });

      // If incidents were extracted, append or merge
      if (newIncidents && newIncidents.length > 0) {
        onSetIncidents([...newIncidents, ...incidents.filter((i) => !i.id.startsWith('gsheet-'))]);
      }
      setProcessingStatus(
        `ประมวลผลเสร็จสิ้น: ${sheet.title} (ตัวเลขรวม: ${updatedResource.summaryMetrics?.totalIncidents ?? 0} อุบัติการณ์, ${(updatedResource.summaryMetrics?.totalSpecimens ?? 0).toLocaleString()} สิ่งส่งตรวจ)`
      );
    } else {
      setProcessingStatus(
        `ไม่สามารถดึงข้อมูลได้: ${updatedResource.errorMessage || 'โปรดตรวจสอบการแชร์ไฟล์เป็น Anyone with link'}`
      );
    }
  };

  // Handler: Process all Google Sheets
  const handleProcessAllSheets = async () => {
    setIsProcessingAll(true);
    setProcessingStatus('กำลังเชื่อมต่อและประมวลผลตัวเลขจาก Google Sheets ทั้งหมด...');

    let allNewIncidents: RiskIncident[] = [];
    const updatedSheets = [...sheetResources];

    for (let i = 0; i < updatedSheets.length; i++) {
      const sheet = updatedSheets[i];
      setProcessingStatus(`กำลังประมวลผล (${i + 1}/${updatedSheets.length}): ${sheet.title}...`);
      const { updatedResource, newIncidents } = await syncAndProcessGoogleSheet(sheet);

      if (updatedResource.summaryMetrics) {
        updatedSheets[i] = updatedResource;
        if (newIncidents && newIncidents.length > 0) {
          allNewIncidents = [...allNewIncidents, ...newIncidents];
        }
      }
    }

    setSheetResources(updatedSheets);
    onUpdateConfig({ ...config, sheets: updatedSheets });

    if (allNewIncidents.length > 0) {
      onSetIncidents(allNewIncidents);
      setProcessingStatus(
        `ประมวลผลสำเร็จทุกชีต! อัปเดต ${allNewIncidents.length} รายการตัวเลขอุบัติการณ์เข้าสู่แดชบอร์ด`
      );
    } else {
      setProcessingStatus('ประมวลผลเสร็จสิ้น: ข้อมูลสถิติและตัวเลขถูกคำนวณและอัปเดตเรียบร้อยแล้ว');
    }

    setIsProcessingAll(false);
  };

  // Calculate grand totals across all processed sheets
  const grandTotalIncidents = sheetResources.reduce((sum, s) => sum + (s.summaryMetrics?.totalIncidents || 0), 0);
  const grandTotalSpecimens = sheetResources.reduce((sum, s) => sum + (s.summaryMetrics?.totalSpecimens || 0), 0);
  const grandTotalRejected = sheetResources.reduce((sum, s) => sum + (s.summaryMetrics?.rejectedCount || 0), 0);
  const avgRejectionRate = grandTotalSpecimens > 0 ? ((grandTotalRejected / grandTotalSpecimens) * 100).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#c1c7d2] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#c1c7d2] flex justify-between items-center bg-[#003e6f] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-[24px]">sync_alt</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#80f98b] text-[#004e18] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006e25] animate-pulse"></span>
                  Multi-Link Integration
                </span>
                <span className="text-xs text-white/80 font-mono">Google Sheets &amp; Google Forms</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mt-0.5">
                ศูนย์จัดการหลายลิงก์ Google Sheets / Forms &amp; ประมวลผลตัวเลข
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#c1c7d2] px-4 bg-white text-xs font-bold gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'border-[#003e6f] text-[#003e6f]'
                : 'border-transparent text-[#727781] hover:text-[#141d23]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">table_chart</span>
            Google Sheets ({sheetResources.length} ชีต)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forms')}
            className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'forms'
                ? 'border-[#003e6f] text-[#003e6f]'
                : 'border-transparent text-[#727781] hover:text-[#141d23]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dynamic_form</span>
            Google Forms ({formResources.length} ฟอร์ม)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('live_calculation')}
            className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'live_calculation'
                ? 'border-[#003e6f] text-[#003e6f]'
                : 'border-transparent text-[#727781] hover:text-[#141d23]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calculate</span>
            ผลลัพธ์การประมวลผลตัวเลข
          </button>
          {formResources.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('embed_form')}
              className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'embed_form'
                  ? 'border-[#003e6f] text-[#003e6f]'
                  : 'border-transparent text-[#727781] hover:text-[#141d23]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">open_in_browser</span>
              เปิดกรอก Google Form ในแอป
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-[#f8fbff] space-y-4">
          {/* Status Alert if any */}
          {processingStatus && (
            <div className="p-3 bg-[#ecf5fe] border border-[#003e6f]/30 rounded-xl text-xs text-[#003e6f] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>{processingStatus}</span>
              </div>
              <button
                type="button"
                onClick={() => setProcessingStatus(null)}
                className="text-[#727781] hover:text-[#141d23] text-xs"
              >
                ปิด
              </button>
            </div>
          )}

          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#c1c7d2]">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#141d23]">
                    รายการ Google Sheets ที่เชื่อมต่อ ({sheetResources.length} ชีต)
                  </h4>
                  <p className="text-[11px] text-[#727781] mt-0.5">
                    แนบลิงก์ Google Sheets ได้หลายอันเพื่อดึงข้อมูลและประมวลผลตัวเลขอัตโนมัติ
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddSheet(!showAddSheet)}
                    className="px-3 py-1.5 bg-[#003e6f] text-white text-xs font-bold rounded-lg hover:bg-[#002d52] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    แนบลิงก์ชีตใหม่
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingAll || sheetResources.length === 0}
                    onClick={handleProcessAllSheets}
                    className="px-3 py-1.5 bg-[#006e25] text-white text-xs font-bold rounded-lg hover:bg-[#00531c] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">calculate</span>
                    ประมวลผลตัวเลขทั้งหมด
                  </button>
                </div>
              </div>

              {/* Add Sheet Form */}
              {showAddSheet && (
                <form
                  onSubmit={handleAddSheet}
                  className="bg-white p-4 rounded-xl border-2 border-[#003e6f]/30 space-y-3 animate-in slide-in-from-top-2"
                >
                  <h5 className="text-xs font-bold text-[#003e6f] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add_link</span>
                    เพิ่มลิงก์ Google Sheet ใหม่
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#141d23] mb-1">
                        ชื่อหัวข้อ / คำอธิบายชีต *
                      </label>
                      <input
                        type="text"
                        required
                        value={newSheetTitle}
                        onChange={(e) => setNewSheetTitle(e.target.value)}
                        placeholder="เช่น บันทึกการปฏิเสธสิ่งส่งตรวจ ปี 2569"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#141d23] mb-1">
                        ห้องปฏิบัติการ / แผนก
                      </label>
                      <select
                        value={newSheetDept}
                        onChange={(e) => setNewSheetDept(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                      >
                        <option value="all">ทุกแผนก (ภาพรวม All Overview)</option>
                        {departments.map((d) => (
                          <option key={d.key} value={d.key}>
                            {d.nameTh} ({d.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-[#141d23] mb-1">
                        URL ของ Google Sheets (แชร์แบบ Anyone with link can view) *
                      </label>
                      <input
                        type="url"
                        required
                        value={newSheetUrl}
                        onChange={(e) => setNewSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1xxxx.../edit"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#141d23] mb-1">
                        ชื่อ Sheet Tab (ไม่บังคับ ถ้าไม่ระบุจะดึงชีตแรก)
                      </label>
                      <input
                        type="text"
                        value={newSheetTab}
                        onChange={(e) => setNewSheetTab(e.target.value)}
                        placeholder="เช่น Sheet1 หรือ Rejection_2569"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSheet(false)}
                      className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-[#414750] rounded-lg hover:bg-gray-200"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#003e6f] text-white text-xs font-bold rounded-lg hover:bg-[#002d52]"
                    >
                      บันทึกลิงก์ชีต
                    </button>
                  </div>
                </form>
              )}

              {/* List of Sheet Cards */}
              <div className="grid grid-cols-1 gap-3">
                {sheetResources.length === 0 ? (
                  <div className="bg-white p-6 rounded-xl border border-[#c1c7d2] text-center space-y-2">
                    <span className="material-symbols-outlined text-[32px] text-[#727781]">table_chart</span>
                    <p className="text-xs text-[#727781]">ยังไม่มี Google Sheets ที่แนบในระบบ</p>
                    <button
                      type="button"
                      onClick={() => setShowAddSheet(true)}
                      className="px-3 py-1.5 bg-[#003e6f] text-white text-xs font-bold rounded-lg hover:bg-[#002d52]"
                    >
                      แนบลิงก์ Google Sheet แรก
                    </button>
                  </div>
                ) : (
                  sheetResources.map((sheet) => (
                    <div
                      key={sheet.id}
                      className="bg-white p-4 rounded-xl border border-[#c1c7d2] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#003e6f]/40 transition-all"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-[#006e25]/10 text-[#006e25] text-[10px] font-bold rounded-md border border-[#006e25]/20">
                            Google Sheets
                          </span>
                          <span className="px-2 py-0.5 bg-[#ecf5fe] text-[#003e6f] text-[10px] font-semibold rounded-md">
                            {departments.find((d) => d.key === sheet.departmentKey)?.nameTh || 'ทุกแผนก'}
                          </span>
                          {sheet.lastSyncTime && (
                            <span className="text-[10px] text-[#727781]">
                              ซิงค์ล่าสุด: {sheet.lastSyncTime}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs sm:text-sm font-bold text-[#141d23] truncate">
                          {sheet.title}
                        </h5>
                        <p className="text-[11px] text-[#727781] truncate font-mono max-w-md">
                          {sheet.url}
                        </p>
                        {sheet.summaryMetrics && (
                          <div className="flex items-center gap-3 text-[11px] text-[#003e6f] font-semibold pt-1">
                            <span>อุบัติการณ์: {sheet.summaryMetrics.totalIncidents ?? 0} เคส</span>
                            <span>·</span>
                            <span>สิ่งส่งตรวจ: {(sheet.summaryMetrics.totalSpecimens ?? 0).toLocaleString()}</span>
                            <span>·</span>
                            <span>Reject: {sheet.summaryMetrics.rejectionRate ?? 0}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSyncSingleSheet(sheet)}
                          className="px-3 py-1.5 bg-[#ecf5fe] hover:bg-[#dbeafe] text-[#003e6f] text-xs font-bold rounded-lg border border-[#003e6f]/20 transition-colors flex items-center gap-1 cursor-pointer"
                          title="ดึงข้อมูลและคำนวณตัวเลขชีตนี้"
                        >
                          <span className="material-symbols-outlined text-[16px]">sync</span>
                          ประมวลผล
                        </button>
                        <a
                          href={sheet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[#414750] hover:text-[#003e6f] hover:bg-gray-100 rounded-lg"
                          title="เปิดใน Google Sheets"
                        >
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveSheet(sheet.id)}
                          className="p-1.5 text-[#ba1a1a] hover:bg-[#fff0f0] rounded-lg cursor-pointer"
                          title="ลบลิงก์นี้"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE FORMS */}
          {activeTab === 'forms' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#c1c7d2]">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#141d23]">
                    รายการ Google Forms สำหรับรายงาน ({formResources.length} ฟอร์ม)
                  </h4>
                  <p className="text-[11px] text-[#727781] mt-0.5">
                    แนบ Google Form หลายลิงก์เพื่อเปิดกรอกในแอป หรือส่งลิงก์ให้วอร์ดและแผนกต่างๆ รายงานเข้ามา
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3 py-1.5 bg-[#003e6f] text-white text-xs font-bold rounded-lg hover:bg-[#002d52] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  แนบลิงก์ Google Form ใหม่
                </button>
              </div>

              {/* Add Form Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddForm}
                  className="bg-white p-4 rounded-xl border-2 border-[#003e6f]/30 space-y-3 animate-in slide-in-from-top-2"
                >
                  <h5 className="text-xs font-bold text-[#003e6f] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">dynamic_form</span>
                    เพิ่มลิงก์ Google Form ใหม่
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#141d23] mb-1">
                        ชื่อแบบฟอร์ม *
                      </label>
                      <input
                        type="text"
                        required
                        value={newFormTitle}
                        onChange={(e) => setNewFormTitle(e.target.value)}
                        placeholder="เช่น แบบรายงานปฏิเสธสิ่งส่งตรวจ (OPD/IPD)"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#141d23] mb-1">
                        แผนกที่เกี่ยวข้อง
                      </label>
                      <select
                        value={newFormDept}
                        onChange={(e) => setNewFormDept(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                      >
                        <option value="all">ทุกแผนก (ภาพรวม)</option>
                        {departments.map((d) => (
                          <option key={d.key} value={d.key}>
                            {d.nameTh}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-[#141d23] mb-1">
                        URL ของ Google Form (viewform หรือ URL ทั่วไป) *
                      </label>
                      <input
                        type="url"
                        required
                        value={newFormUrl}
                        onChange={(e) => setNewFormUrl(e.target.value)}
                        placeholder="https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-[#141d23] mb-1">
                        คำอธิบายเพิ่มเติม
                      </label>
                      <input
                        type="text"
                        value={newFormDesc}
                        onChange={(e) => setNewFormDesc(e.target.value)}
                        placeholder="เช่น สำหรับพยาบาลและเจ้าหน้าที่ห้องแล็บรายงานข้อผิดพลาดสิ่งส่งตรวจ"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-[#414750] rounded-lg hover:bg-gray-200"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#003e6f] text-white text-xs font-bold rounded-lg hover:bg-[#002d52]"
                    >
                      บันทึกลิงก์ฟอร์ม
                    </button>
                  </div>
                </form>
              )}

              {/* List of Form Cards */}
              <div className="grid grid-cols-1 gap-3">
                {formResources.map((form, idx) => (
                  <div
                    key={form.id}
                    className="bg-white p-4 rounded-xl border border-[#c1c7d2] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#684fa3]/10 text-[#684fa3] text-[10px] font-bold rounded-md border border-[#684fa3]/20">
                          Google Form
                        </span>
                        <span className="px-2 py-0.5 bg-[#ecf5fe] text-[#003e6f] text-[10px] font-semibold rounded-md">
                          {departments.find((d) => d.key === form.departmentKey)?.nameTh || 'ทุกแผนก'}
                        </span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-[#141d23]">
                        {form.title}
                      </h5>
                      {form.description && (
                        <p className="text-[11px] text-[#727781]">{form.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFormIndex(idx);
                          setActiveTab('embed_form');
                        }}
                        className="px-3 py-1.5 bg-[#003e6f] text-white text-xs font-bold rounded-lg hover:bg-[#002d52] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                        เปิดกรอกในแอป
                      </button>
                      <a
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-[#414750] hover:text-[#003e6f] hover:bg-gray-100 rounded-lg"
                        title="เปิดในแท็บใหม่"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveForm(form.id)}
                        className="p-1.5 text-[#ba1a1a] hover:bg-[#fff0f0] rounded-lg cursor-pointer"
                        title="ลบฟอร์ม"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE CALCULATION & DATA CLEANUP */}
          {activeTab === 'live_calculation' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-[#c1c7d2]">
                  <div className="text-[11px] text-[#727781] font-semibold">อุบัติการณ์รวมคำนวณได้</div>
                  <div className="text-xl font-bold text-[#ba1a1a] mt-1">
                    {grandTotalIncidents.toLocaleString()} <span className="text-xs font-normal">เคส</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#c1c7d2]">
                  <div className="text-[11px] text-[#727781] font-semibold">สิ่งส่งตรวจรวม</div>
                  <div className="text-xl font-bold text-[#003e6f] mt-1">
                    {grandTotalSpecimens.toLocaleString()} <span className="text-xs font-normal">ตัวอย่าง</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#c1c7d2]">
                  <div className="text-[11px] text-[#727781] font-semibold">ยอดปฏิเสธสิ่งส่งตรวจ</div>
                  <div className="text-xl font-bold text-[#ba1a1a] mt-1">
                    {grandTotalRejected.toLocaleString()} <span className="text-xs font-normal">เคส</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#c1c7d2]">
                  <div className="text-[11px] text-[#727781] font-semibold">อัตรา Reject เฉลี่ย</div>
                  <div className="text-xl font-bold text-[#006e25] mt-1">
                    {avgRejectionRate}%
                  </div>
                </div>
              </div>

              {/* Data Cleanup / Mock Data Action */}
              <div className="bg-white p-4 rounded-xl border border-[#c1c7d2] space-y-3">
                <h4 className="text-xs sm:text-sm font-bold text-[#141d23] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">cleaning_services</span>
                  จัดการข้อมูล (Data Cleanup &amp; Real Data Enforcement)
                </h4>
                <p className="text-xs text-[#414750]">
                  คุณสามารถเลือกล้างข้อมูลจำลองที่ระบบตั้งไว้ แล้วแทนที่ด้วยข้อมูลตัวเลขจริงจาก Google Sheets ได้ทันที:
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('คุณต้องการลบข้อมูลจำลองทั้งหมดและแสดงผลเฉพาะข้อมูลจาก Google Sheets จริงหรือไม่?')) {
                        onClearMockData();
                        alert('ล้างข้อมูลจำลองเรียบร้อยแล้ว');
                      }
                    }}
                    className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                    ลบข้อมูลที่เมคขึ้นมา (ใช้เฉพาะข้อมูลจริง)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadSampleData();
                      alert('โหลดชุดข้อมูลสถิติโรงพยาบาลมาตรฐานเรียบร้อยแล้ว');
                    }}
                    className="px-4 py-2 bg-white border border-[#c1c7d2] hover:bg-[#f6faff] text-[#003e6f] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">restore</span>
                    โหลดชุดข้อมูลสถิติทดสอบ (5 ปี)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EMBEDDED FORM */}
          {activeTab === 'embed_form' && formResources.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#c1c7d2]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#141d23]">เลือกแบบฟอร์ม:</span>
                  <select
                    value={selectedFormIndex}
                    onChange={(e) => setSelectedFormIndex(Number(e.target.value))}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[#c1c7d2] bg-white font-medium"
                  >
                    {formResources.map((f, i) => (
                      <option key={f.id} value={i}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                </div>
                <a
                  href={formResources[selectedFormIndex]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#003e6f] hover:underline flex items-center gap-1"
                >
                  <span>เปิดเต็มจอในแท็บใหม่</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>

              {/* Form Iframe */}
              <div className="bg-white rounded-xl border border-[#c1c7d2] overflow-hidden shadow-xs h-[520px]">
                <iframe
                  src={formResources[selectedFormIndex]?.embedUrl || formResources[selectedFormIndex]?.url}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                  title={formResources[selectedFormIndex]?.title}
                  className="w-full h-full"
                >
                  กำลังโหลดแบบฟอร์ม Google Form...
                </iframe>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f6faff] border-t border-[#c1c7d2] flex items-center justify-between">
          <div className="text-xs text-[#727781]">
            * ข้อมูลจาก Google Sheets จะถูกคำนวณและอัปเดตลงกราฟและตัวชี้วัดทันที
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#003e6f] text-white text-xs font-bold rounded-xl hover:bg-[#002d52] cursor-pointer shadow-xs"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
