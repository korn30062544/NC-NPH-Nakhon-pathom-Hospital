import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DepartmentKey, RiskIncident, RiskLevel, RiskStage, SeverityMatrixLevel, User } from '../types';

interface ReportRiskModalProps {
  onClose: () => void;
  onSubmitIncident: (newIncident: RiskIncident) => void;
  currentUser: User | null;
  defaultDept?: DepartmentKey;
}

export const ReportRiskModal: React.FC<ReportRiskModalProps> = ({
  onClose,
  onSubmitIncident,
  currentUser,
  defaultDept = 'central',
}) => {
  // Mode switch: Native App Form vs Live Google Form Embed
  const [formMode, setFormMode] = useState<'app_form' | 'google_form'>('app_form');
  const [activeStep, setActiveStep] = useState<number>(1);

  // Form Fields
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [incidentTime, setIncidentTime] = useState(
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  );
  const [departmentKey, setDepartmentKey] = useState<DepartmentKey>(
    defaultDept === 'overview' || defaultDept === 'data_upload' || defaultDept === 'settings' || defaultDept === 'google_sync'
      ? 'central'
      : defaultDept
  );
  const [location, setLocation] = useState('ห้องปฏิบัติการกลาง (Central Lab)');
  
  // Reporter info
  const [reporterName, setReporterName] = useState(currentUser?.name || 'สมชาย ประเสริฐ');
  const [reporterPosition, setReporterPosition] = useState(
    currentUser?.role || 'นักเทคนิคการแพทย์ (Medical Technologist)'
  );
  const [reporterContact, setReporterContact] = useState('Ext. 1410');

  // Patient & Specimen Info
  const [patientHn, setPatientHn] = useState('');
  const [labNumber, setLabNumber] = useState('');
  const [specimen, setSpecimen] = useState('Whole Blood (EDTA)');
  const [testOrdered, setTestOrdered] = useState('Complete Blood Count (CBC)');

  // Classification & Category
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<RiskStage>('Pre-analytical');
  const [categoryType, setCategoryType] = useState('Mislabeling / Barcode Error');
  
  // Severity Matrix & Level
  const [severityMatrix, setSeverityMatrix] = useState<SeverityMatrixLevel>('Level C');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('Moderate');
  const [harmLevel, setHarmLevel] = useState('No Harm (ไม่เกิดอันตรายต่อผู้ป่วย)');

  // Narrative, Impact, RCA & Action
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [rootCauseCategory, setRootCauseCategory] = useState<RiskIncident['rootCauseCategory']>('Protocol/SOP');
  const [rcaMethod, setRcaMethod] = useState<RiskIncident['rcaMethod']>('5-Why');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleFormEditUrl = 'https://docs.google.com/forms/d/1RuGhHcfgEZ8Ms8iUTY76O3A36Lj6YzOZ_3W0tjJO9Zs/edit';
  const googleFormViewUrl = 'https://docs.google.com/forms/d/1RuGhHcfgEZ8Ms8iUTY76O3A36Lj6YzOZ_3W0tjJO9Zs/viewform';

  const deptNames: Record<DepartmentKey, string> = {
    overview: 'Central Lab',
    central: 'Central Lab (ห้องปฏิบัติการกลาง)',
    blood: 'Blood Bank (ห้องธนาคารเลือด)',
    molecular: 'Molecular Biology (ห้องอณูชีววิทยา)',
    outpatient: 'Outpatient Lab (ห้องปฏิบัติการผู้ป่วยภายนอก)',
    molecular_science: 'Molecular Science (ห้องอณูชีวโมเลกุล)',
    microbiology: 'Clinical Microbiology (ห้องจุลชีววิทยาคลินิก)',
    material_store: 'Science Material Store (ห้องคลังวัสดุวิทยาศาสตร์)',
    data_upload: 'Central Lab',
    settings: 'Central Lab',
    google_sync: 'Central Lab',
  };

  // Severity Matrix level descriptions
  const severityDetails: Record<SeverityMatrixLevel, { title: string; color: string; level: RiskLevel; tag: string }> = {
    'Level A': { title: 'มีโอกาสก่อให้เกิดความคลาดเคลื่อน (Potential)', color: 'bg-[#80f98b]/20 text-[#006e25] border-[#006e25]/30', level: 'Low Risk', tag: 'Near Miss' },
    'Level B': { title: 'เกิดความคลาดเคลื่อนแต่ตรวจพบก่อนรายงานผล', color: 'bg-[#80f98b]/30 text-[#006e25] border-[#006e25]/40', level: 'Low Risk', tag: 'Near Miss' },
    'Level C': { title: 'ความคลาดเคลื่อนถึงผู้ป่วย แต่ไม่เกิดอันตราย', color: 'bg-[#d3e4ff] text-[#003e6f] border-[#003e6f]/30', level: 'Moderate', tag: 'No Harm' },
    'Level D': { title: 'ต้องติดตามเฝ้าระวังผู้ป่วยเพิ่มเติม', color: 'bg-[#d3e4ff] text-[#003e6f] border-[#003e6f]/40', level: 'Moderate', tag: 'Monitoring' },
    'Level E': { title: 'เกิดอันตรายชั่วคราวและต้องให้การรักษาพยาบาล', color: 'bg-[#ffdad9] text-[#7e0019] border-[#ba1a1a]/30', level: 'High Risk', tag: 'Temporary Harm' },
    'Level F': { title: 'เกิดอันตรายชั่วคราวและต้องนอน รพ. นานขึ้น', color: 'bg-[#ffdad9] text-[#7e0019] border-[#ba1a1a]/40', level: 'High Risk', tag: 'Extended Stay' },
    'Level G': { title: 'เกิดอันตรายถาวรแก่ผู้ป่วย (Permanent Harm)', color: 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]', level: 'Critical', tag: 'Sentinel Event' },
    'Level H': { title: 'ต้องทำหัตถการช่วยชีวิต (Life-Sustaining)', color: 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]', level: 'Critical', tag: 'Life Threatening' },
    'Level I': { title: 'ผู้ป่วยเสียชีวิตจากอุบัติการณ์ (Fatal)', color: 'bg-[#ba1a1a] text-white border-[#93000a]', level: 'Critical', tag: 'Death' },
  };

  const handleSelectSeverity = (lvl: SeverityMatrixLevel) => {
    setSeverityMatrix(lvl);
    setRiskLevel(severityDetails[lvl].level);
    setHarmLevel(severityDetails[lvl].tag);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('กรุณาระบุหัวข้อเหตุการณ์ความเสี่ยง (Incident Title)');
      setActiveStep(3);
      return;
    }
    if (!description.trim()) {
      setErrorMsg('กรุณาระบุรายละเอียดเหตุการณ์ที่เกิดขึ้น (Incident Description)');
      setActiveStep(4);
      return;
    }

    setIsSubmitting(true);

    // FIX: incident numbers used to be hardcoded "INC-2023-xxx" no matter
    // what year the incident actually happened in. Now derived from the
    // real incident date (Buddhist Era, matching the rest of the app's
    // year convention e.g. 2569).
    const incidentBEYear = new Date(incidentDate).getFullYear() + 543;
    const generatedIncidentId = `INC-${incidentBEYear}-${Math.floor(100 + Math.random() * 900)}`;
    const newInc: RiskIncident = {
      id: `inc-${Date.now()}`,
      incidentId: generatedIncidentId,
      title: title.trim(),
      department: deptNames[departmentKey].split(' (')[0],
      departmentKey: departmentKey,
      location: location.trim() || 'ห้องปฏิบัติการ',
      specimen: specimen.trim() || 'สิ่งส่งตรวจทั่วไป',
      specimenType: specimen.trim(),
      patientHn: patientHn.trim() || 'N/A',
      labNumber: labNumber.trim() || `LAB-${Math.floor(100000 + Math.random() * 900000)}`,
      type: categoryType,
      stage: stage,
      riskLevel: riskLevel,
      severityMatrix: severityMatrix,
      harmLevel: harmLevel,
      date: new Date(incidentDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      time: incidentTime,
      year: new Date(incidentDate).getFullYear(),
      reportedBy: reporterName.trim() || (currentUser ? currentUser.name : 'Medical Technologist'),
      reporterPosition: reporterPosition.trim(),
      reporterContact: reporterContact.trim(),
      status: 'Under Investigation',
      description: description.trim(),
      // FIX: these five fields used to silently save hardcoded boilerplate
      // Thai sentences into the record whenever left blank (e.g. every
      // incident with no impact typed in got the exact same fabricated
      // "ผลกระทบทางคลินิก" text as if someone had actually assessed it —
      // and correctiveActionPlan was ALWAYS the same fake sentence with no
      // way to enter a real one at all). Left empty instead, so the UI can
      // honestly show "ยังไม่ได้ระบุ" rather than fabricated content.
      impact: impact.trim(),
      rootCause: rootCause.trim(),
      rootCauseCategory: rootCauseCategory,
      rcaMethod: rcaMethod,
      immediateAction: immediateAction.trim(),
      correctiveAction: correctiveAction.trim(),
      preventiveAction: preventiveAction.trim(),
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitIncident(newInc);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-[#c1c7d2] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header with Hospital & Google Form Badge */}
        <div className="bg-[#003e6f] text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-[24px]">assignment_add</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#80f98b]/30 text-[#80f98b] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#80f98b] animate-ping"></span>
                  Google Form Synced
                </span>
                <span className="text-[11px] text-white/80 font-mono">รพ.นครปฐม</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mt-0.5 leading-snug">
                แบบรายงานความเสี่ยงและอุบัติการณ์ทางห้องปฏิบัติการ
              </h3>
              <p className="text-xs text-white/80 hidden sm:block">
                Laboratory Incident &amp; Non-Conformity Reporting Form (ISO 15189 / HA Standard)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="ปิดหน้าต่าง"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Top Control Bar: Switch between App Form & Live Google Form */}
        <div className="bg-[#f6faff] px-4 sm:px-6 py-2.5 border-b border-[#c1c7d2] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormMode('app_form')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                formMode === 'app_form'
                  ? 'bg-[#003e6f] text-white shadow-xs'
                  : 'bg-white text-[#414750] border border-[#c1c7d2] hover:bg-[#e6eff8]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              ฟอร์มบันทึกด่วนในระบบ
            </button>
            <button
              type="button"
              onClick={() => setFormMode('google_form')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                formMode === 'google_form'
                  ? 'bg-[#673ab7] text-white shadow-xs'
                  : 'bg-white text-[#414750] border border-[#c1c7d2] hover:bg-[#e6eff8]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dynamic_form</span>
              แบบฟอร์ม Google Form จริง
            </button>
          </div>

          <a
            href={googleFormEditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#005596] hover:text-[#003e6f] font-semibold flex items-center gap-1 hover:underline ml-auto"
            title="เปิด Google Form ฉบับเต็มในแท็บใหม่"
          >
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            เปิดลิงก์ Google Form ต้นฉบับ
          </a>
        </div>

        {/* Form Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#fafcff]">
          {formMode === 'google_form' ? (
            /* Google Form Live Embed & Direct Access View */
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-[#c1c7d2] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#673ab7]/10 text-[#673ab7] flex items-center justify-center font-bold text-sm">
                    GF
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#141d23]">
                      แบบฟอร์มรายงานความเสี่ยงออนไลน์ (Google Form)
                    </h4>
                    <p className="text-xs text-[#727781]">
                      เชื่อมโยงโดยตรงกับระบบประมวลผลโรงพยาบาลนครปฐม
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={googleFormEditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#673ab7] hover:bg-[#5e35b1] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors flex-1 sm:flex-initial"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    แก้ไขฟอร์ม (Google Form Editor)
                  </a>
                  <a
                    href={googleFormViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#f6faff] hover:bg-[#e0e9f2] text-[#003e6f] border border-[#c1c7d2] rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    กรอกข้อมูลเต็มจอ
                  </a>
                </div>
              </div>

              {/* Embedded Google Form Frame */}
              <div className="bg-white rounded-xl border border-[#c1c7d2] p-2 shadow-xs overflow-hidden">
                <iframe
                  src={googleFormViewUrl}
                  title="Google Form Risk Incident Report"
                  className="w-full h-[520px] rounded-lg border-0"
                >
                  กำลังโหลดแบบฟอร์ม Google Form...
                </iframe>
              </div>
            </div>
          ) : (
            /* Multi-step / Organized Sectioned Native Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3 bg-[#ffdad6] text-[#93000a] rounded-xl text-xs flex items-center gap-2 border border-[#ba1a1a]/30">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step Navigation Pill Indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                {[
                  { step: 1, label: '1. ข้อมูลทั่วไป & วันที่', icon: 'schedule' },
                  { step: 2, label: '2. ผู้ป่วย & สิ่งส่งตรวจ', icon: 'biotech' },
                  { step: 3, label: '3. ประเภท & ระดับความรุนแรง', icon: 'warning' },
                  { step: 4, label: '4. รายละเอียด & RCA', icon: 'description' },
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setActiveStep(s.step)}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeStep === s.step
                        ? 'bg-[#003e6f] text-white border-[#003e6f] shadow-xs'
                        : 'bg-white text-[#727781] border-[#c1c7d2] hover:bg-[#e0e9f2]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>

              {/* SECTION 1: ข้อมูลทั่วไป & ผู้รายงาน */}
              {activeStep === 1 && (
                <div className="bg-white p-5 rounded-xl border border-[#c1c7d2] shadow-xs space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#c1c7d2]/60 text-[#003e6f]">
                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                    <h4 className="font-bold text-sm">ข้อมูลทั่วไปและวันเวลาที่เกิดเหตุ (General &amp; Event Info)</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        วันที่เกิดเหตุ (Incident Date) *
                      </label>
                      <input
                        type="date"
                        required
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        เวลาที่เกิดเหตุ (Incident Time) *
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น 10:30, 23:45"
                        required
                        value={incidentTime}
                        onChange={(e) => setIncidentTime(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        ห้องปฏิบัติการที่รับผิดชอบ (Laboratory Section) *
                      </label>
                      <select
                        value={departmentKey}
                        onChange={(e) => setDepartmentKey(e.target.value as DepartmentKey)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs bg-white font-medium"
                      >
                        <option value="central">Central Lab (ห้องปฏิบัติการกลาง)</option>
                        <option value="blood">Blood Bank (ห้องธนาคารเลือด)</option>
                        <option value="molecular">Molecular Biology (ห้องอณูชีววิทยา)</option>
                        <option value="outpatient">Outpatient Lab (ห้องปฏิบัติการผู้ป่วยภายนอก/เจาะเลือด)</option>
                        <option value="molecular_science">Molecular Science (ห้องอณูชีวโมเลกุล)</option>
                        <option value="microbiology">Clinical Microbiology (ห้องจุลชีววิทยาคลินิก)</option>
                        <option value="material_store">Science Material Store (ห้องคลังวัสดุวิทยาศาสตร์)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        สถานที่เกิดเหตุ / หอผู้ป่วยต้นทาง (Incident Location / Source)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น แผนกฉุกเฉิน (ER), ICU Med, หอผู้ป่วย 5, จุดเจาะเลือด OPD"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#c1c7d2]/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        ชื่อ-นามสกุล ผู้รายงาน
                      </label>
                      <input
                        type="text"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        className="w-full h-9 px-3 border border-[#c1c7d2] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        ตำแหน่ง / บทบาท
                      </label>
                      <input
                        type="text"
                        value={reporterPosition}
                        onChange={(e) => setReporterPosition(e.target.value)}
                        className="w-full h-9 px-3 border border-[#c1c7d2] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        เบอร์โทรศัพท์ภายใน (Ext.)
                      </label>
                      <input
                        type="text"
                        value={reporterContact}
                        onChange={(e) => setReporterContact(e.target.value)}
                        className="w-full h-9 px-3 border border-[#c1c7d2] rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="px-4 py-2 bg-[#003e6f] text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-[#004881]"
                    >
                      ถัดไป: ข้อมูลผู้ป่วย &amp; สิ่งส่งตรวจ
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 2: ข้อมูลผู้ป่วย & สิ่งส่งตรวจ */}
              {activeStep === 2 && (
                <div className="bg-white p-5 rounded-xl border border-[#c1c7d2] shadow-xs space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#c1c7d2]/60 text-[#003e6f]">
                    <span className="material-symbols-outlined text-[20px]">person_search</span>
                    <h4 className="font-bold text-sm">ข้อมูลผู้ป่วยและสิ่งส่งตรวจ (Patient &amp; Specimen Data)</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        รหัสผู้ป่วย (Hospital Number - HN)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น HN-66092144 หรือ N/A หากไม่ระบุ"
                        value={patientHn}
                        onChange={(e) => setPatientHn(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        หมายเลขสิ่งส่งตรวจ / Lab Barcode No.
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น LAB-231028-09"
                        value={labNumber}
                        onChange={(e) => setLabNumber(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        ชนิดของสิ่งส่งตรวจ (Specimen Type) *
                      </label>
                      <select
                        value={specimen}
                        onChange={(e) => setSpecimen(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs bg-white"
                      >
                        <option value="Whole Blood (EDTA)">เลือดครบส่วน (Whole Blood EDTA)</option>
                        <option value="Serum / Clot Gel Tube">ซีรั่ม (Serum / Clot Gel Tube)</option>
                        <option value="Plasma (Lithium Heparin / Sodium Citrate)">พลาสมา (Plasma Heparin/Citrate)</option>
                        <option value="Urine (Clean Catch / Catheterized)">ปัสสาวะ (Urine)</option>
                        <option value="Sputum / Nasopharyngeal Swab">เสมหะ / สิ่งคัดหลั่ง (Sputum / Swab)</option>
                        <option value="Hemoculture Bottle (Aerobic / Anaerobic)">เลือดเพาะเชื้อ (Hemoculture Bottle)</option>
                        <option value="Packed Red Blood Cells (PRBC / Blood Unit)">ถุงเลือดและส่วนประกอบ (PRBC / Blood Product)</option>
                        <option value="CSF / Body Fluid">น้ำไขสันหลังและน้ำเจาะตรวจร่างกาย (CSF/Body Fluid)</option>
                        <option value="Chemical Reagent / QC Material">น้ำยาตรวจ / สารควบคุมคุณภาพ (Reagent/QC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        รายการตรวจวิเคราะห์ที่เกี่ยวข้อง (Test Ordered)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น CBC, Electrolytes, Blood Crossmatch, RT-PCR COVID-19"
                        value={testOrdered}
                        onChange={(e) => setTestOrdered(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-4 py-2 bg-[#f6faff] hover:bg-[#e0e9f2] text-[#414750] text-xs font-bold rounded-lg border border-[#c1c7d2]"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="px-4 py-2 bg-[#003e6f] text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-[#004881]"
                    >
                      ถัดไป: หมวดหมู่ &amp; ระดับความรุนแรง
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 3: ประเภทความเสี่ยง & ระดับความรุนแรง A-I */}
              {activeStep === 3 && (
                <div className="bg-white p-5 rounded-xl border border-[#c1c7d2] shadow-xs space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#c1c7d2]/60 text-[#003e6f]">
                    <span className="material-symbols-outlined text-[20px]">crisis_alert</span>
                    <h4 className="font-bold text-sm">การจำแนกประเภทและระดับความรุนแรง (Risk Classification &amp; Severity)</h4>
                  </div>

                  {/* Incident Title */}
                  <div>
                    <label className="block text-xs font-bold text-[#414750] mb-1">
                      หัวข้อเหตุการณ์ความเสี่ยง (Incident Title) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น เลือดเกิดภาวะ Hemolysis ในหอผู้ป่วย ICU / ติดบาร์โค้ดสลับหลอด"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        ขั้นตอนการตรวจวิเคราะห์ (Workflow Stage)
                      </label>
                      <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value as RiskStage)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs bg-white"
                      >
                        <option value="Pre-analytical">Pre-analytical (ระยะก่อนการตรวจวิเคราะห์)</option>
                        <option value="Analytical">Analytical (ระยะการตรวจวิเคราะห์ในแล็บ)</option>
                        <option value="Post-analytical">Post-analytical (ระยะหลังการตรวจ/รายงานผล)</option>
                        <option value="General/Storage">General/Storage (คลังสินค้าและน้ำยา)</option>
                        <option value="Safety/Environment">Safety/Environment (ความปลอดภัยและชีวอนามัย)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        หมวดหมู่อุบัติการณ์ (Risk Category)
                      </label>
                      <select
                        value={categoryType}
                        onChange={(e) => setCategoryType(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs bg-white"
                      >
                        <option value="Reject Clot / Specimen Rejection">1. Reject Clot: สิ่งส่งตรวจมีลิ่มเลือด / Micro-clot (EDTA/Citrate)</option>
                        <option value="Hemolysis / Specimen Rejection">2. Hemolysis: เลือดแตกตัวในหลอดตรวจ (Hemolyzed Serum/Plasma)</option>
                        <option value="Mislabeling / Barcode Error">3. การระบุตัวตน / ติดบาร์โค้ดผิดพลาด (Mislabeling)</option>
                        <option value="Underfilled Tube / QNS">4. ปริมาณเลือดไม่เพียงพอ (Underfilled / QNS)</option>
                        <option value="Wrong Blood / Incompatibility Alert">5. ความคลาดเคลื่อนทางธนาคารเลือด (Blood Transfusion Risk)</option>
                        <option value="Specimen Contamination">6. การปนเปื้อนสิ่งส่งตรวจ (Contamination)</option>
                        <option value="Turnaround Time (TAT) Exceeded">7. รายงานผลล่าช้าเกินเกณฑ์ (TAT Exceeded)</option>
                        <option value="Critical Value Alert Delay">8. การรายงานผลค่าวิกฤตล่าช้า (Critical Alert Delay)</option>
                        <option value="Instrument Malfunction / Calibration">9. ปัญหาเครื่องมือและ Calibration หลุด</option>
                        <option value="Reagent Expiry & Stock Risk">10. น้ำยาเสื่อมสภาพ / วันหมดอายุ (Reagent Shelf-life)</option>
                        <option value="LIS / Hardware Network Downtime">11. ระบบสารสนเทศ LIS ขัดข้อง (LIS Downtime)</option>
                      </select>
                    </div>
                  </div>

                  {/* Patient Safety Severity Matrix Level A-I */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[#414750]">
                        ระดับความรุนแรงทางการแพทย์ (Severity Matrix Level A - I) *
                      </label>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${severityDetails[severityMatrix].color}`}>
                        {severityMatrix} : {severityDetails[severityMatrix].tag} ({severityDetails[severityMatrix].level})
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                      {(['Level A', 'Level B', 'Level C', 'Level D', 'Level E', 'Level F', 'Level G', 'Level H', 'Level I'] as SeverityMatrixLevel[]).map((lvl) => {
                        const isSelected = severityMatrix === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleSelectSeverity(lvl)}
                            className={`p-2 text-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? severityDetails[lvl].color + ' ring-2 ring-[#003e6f]'
                                : 'bg-[#f6faff] text-[#414750] border-[#c1c7d2] hover:bg-[#e0e9f2]'
                            }`}
                            title={severityDetails[lvl].title}
                          >
                            <div className="font-mono text-xs">{lvl.replace('Level ', '')}</div>
                            <div className="text-[9px] truncate">{severityDetails[lvl].tag}</div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[#727781] mt-1.5 italic">
                      ℹ️ คำอธิบาย: {severityDetails[severityMatrix].title}
                    </p>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="px-4 py-2 bg-[#f6faff] hover:bg-[#e0e9f2] text-[#414750] text-xs font-bold rounded-lg border border-[#c1c7d2]"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(4)}
                      className="px-4 py-2 bg-[#003e6f] text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-[#004881]"
                    >
                      ถัดไป: รายละเอียด &amp; RCA
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 4: รายละเอียดเหตุการณ์ ผลกระทบ และ RCA */}
              {activeStep === 4 && (
                <div className="bg-white p-5 rounded-xl border border-[#c1c7d2] shadow-xs space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#c1c7d2]/60 text-[#003e6f]">
                    <span className="material-symbols-outlined text-[20px]">assignment</span>
                    <h4 className="font-bold text-sm">รายละเอียดเหตุการณ์และการจัดการแก้ไข (Narrative, RCA &amp; Action)</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#414750] mb-1">
                      รายละเอียดเหตุการณ์ที่เกิดขึ้นโดยละเอียด (Detailed Description) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="อธิบายลำดับเหตุการณ์ สิ่งที่พบ และผู้ที่เกี่ยวข้อง..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        ผลกระทบต่อผู้ป่วย / การให้บริการ (Impact)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ผลล่าช้า 45 นาที, ต้องเจาะเลือดซ้ำ, เกือบให้เลือดผิด"
                        value={impact}
                        onChange={(e) => setImpact(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        การแก้ไขปัญหาเฉพาะหน้าทันที (Immediate Action)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น โทรแจ้งแพทย์ทันที, ระงับการรายงานผล, รันซ้ำบนเครื่องสำรอง"
                        value={immediateAction}
                        onChange={(e) => setImmediateAction(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        สาเหตุที่แท้จริงเบื้องต้น (Initial Root Cause)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ขั้นตอนลัดช่วงชั่วโมงเร่งด่วน, อุปกรณ์เสื่อมสภาพ"
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        หมวดหมู่สาเหตุ (RCA Category)
                      </label>
                      <select
                        value={rootCauseCategory}
                        onChange={(e) => setRootCauseCategory(e.target.value as RiskIncident['rootCauseCategory'])}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs bg-white"
                      >
                        <option value="Protocol/SOP">ระเบียบปฏิบัติงาน / SOP</option>
                        <option value="Personnel/Staff">บุคลากร / ทักษะการปฏิบัติงาน</option>
                        <option value="Instrument/Equipment">เครื่องมือ / อุปกรณ์ตรวจวิเคราะห์</option>
                        <option value="System/LIS">ระบบสารสนเทศ LIS / เครือข่าย</option>
                        <option value="Environment">สิ่งแวดล้อม / สถานที่ทำงาน</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#414750] mb-1">
                      วิธีวิเคราะห์สาเหตุราก (RCA Method — ISO 15189)
                    </label>
                    <select
                      value={rcaMethod}
                      onChange={(e) => setRcaMethod(e.target.value as RiskIncident['rcaMethod'])}
                      className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs bg-white sm:w-1/2"
                    >
                      <option value="5-Why">วิเคราะห์ 5 ทำไม (5-Why)</option>
                      <option value="Fishbone">แผนผังก้างปลา (Fishbone/Ishikawa)</option>
                      <option value="Other">อื่นๆ (Other)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        มาตรการแก้ไขเฉพาะกรณีนี้ (Corrective Action)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น เจาะเลือดผู้ป่วยซ้ำ, รายงานผลใหม่หลังแก้ไขข้อมูล"
                        value={correctiveAction}
                        onChange={(e) => setCorrectiveAction(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                      />
                      <p className="text-[10px] text-[#727781] mt-1">
                        แก้ไขผลกระทบของเหตุการณ์นี้โดยเฉพาะ (ต่างจาก Preventive Action ที่ป้องกันการเกิดซ้ำในอนาคต)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#414750] mb-1">
                        ข้อเสนอแนะแนวทางป้องกันการเกิดซ้ำ (Preventive Action)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น จัดอบรมทบทวนเทคนิคการเจาะเลือด, ติดตั้งระบบ Scan Barcode Lock"
                        value={preventiveAction}
                        onChange={(e) => setPreventiveAction(e.target.value)}
                        className="w-full h-10 px-3 border border-[#c1c7d2] rounded-lg focus:border-[#003e6f] text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="px-4 py-2 bg-[#f6faff] hover:bg-[#e0e9f2] text-[#414750] text-xs font-bold rounded-lg border border-[#c1c7d2]"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-[#003e6f] hover:bg-[#004881] text-white rounded-lg font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${isSubmitting ? 'animate-spin' : ''}`}>
                        {isSubmitting ? 'sync' : 'send'}
                      </span>
                      {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกรายงานความเสี่ยง (Submit Report)'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#f6faff] border-t border-[#c1c7d2] flex items-center justify-between text-xs text-[#727781]">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#003e6f]">save</span>
            <span>บันทึกลงระบบฐานข้อมูลกลาง (Saved to central database)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-[#414750] hover:bg-[#e0e9f2] rounded-lg font-semibold"
          >
            ปิด (Close)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
