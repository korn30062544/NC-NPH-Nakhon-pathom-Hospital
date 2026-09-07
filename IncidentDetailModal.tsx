import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RiskIncident, User } from '../types';
import { translateRiskLevel, translateStage, translateStatus, translateRcaMethod } from '../utils/labels';

interface IncidentDetailModalProps {
  incident: RiskIncident;
  currentUser: User | null;
  onClose: () => void;
  onUpdateStatus: (
    incidentId: string,
    newStatus: RiskIncident['status'],
    extra?: Partial<Pick<RiskIncident, 'effectivenessReview' | 'effectivenessVerifiedBy' | 'effectivenessVerifiedDate'>>
  ) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  currentUser,
  onClose,
  onUpdateStatus,
}) => {
  const [status, setStatus] = useState(incident.status);
  const [note, setNote] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [effectivenessConfirmed, setEffectivenessConfirmed] = useState(false);

  const handleSave = () => {
    const wantsToClose = status === 'Verified Effective' && !incident.effectivenessReview;
    const extra =
      wantsToClose && effectivenessConfirmed
        ? {
            effectivenessReview:
              note.trim() || 'ตรวจสอบแล้วว่ามาตรการแก้ไข/ป้องกันได้ผลจริง ไม่พบการเกิดซ้ำ',
            effectivenessVerifiedBy: currentUser?.name || 'ไม่ระบุ',
            effectivenessVerifiedDate: new Date().toLocaleDateString('th-TH'),
          }
        : undefined;
    onUpdateStatus(incident.id, status, extra);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  let badgeColor = 'bg-[#80f98b]/30 text-[#007327] border-[#006e25]/30';
  if (incident.riskLevel === 'Critical') {
    badgeColor = 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/40';
  } else if (incident.riskLevel === 'High Risk') {
    badgeColor = 'bg-[#ffdad9] text-[#7e0019] border-[#ba1a1a]/30';
  } else if (incident.riskLevel === 'Moderate') {
    badgeColor = 'bg-[#d3e4ff] text-[#003e6f] border-[#003e6f]/30';
  }

  const stageBadgeStyles: Record<string, string> = {
    'Pre-analytical': 'bg-purple-100 text-purple-800 border-purple-300',
    'Analytical': 'bg-blue-100 text-blue-800 border-blue-300',
    'Post-analytical': 'bg-amber-100 text-amber-800 border-amber-300',
    'General/Storage': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Safety/Environment': 'bg-rose-100 text-rose-800 border-rose-300',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-[#c1c7d2] max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-[#003e6f] text-white p-4 sm:p-5 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs bg-white/20 px-2.5 py-0.5 rounded-md font-bold">
                  {incident.incidentId}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                  {translateRiskLevel(incident.riskLevel)}
                </span>
                {incident.severityMatrix && (
                  <span className="bg-[#ffdad6] text-[#93000a] text-xs font-bold px-2 py-0.5 rounded-full border border-[#ba1a1a]/30">
                    {incident.severityMatrix}
                  </span>
                )}
                {incident.stage && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${stageBadgeStyles[incident.stage] || 'bg-gray-100 text-gray-800'}`}>
                    {translateStage(incident.stage)}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold mt-1 leading-snug">
                {incident.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 text-[#141d23]">
          {savedSuccess && (
            <div className="p-3 bg-[#80f98b]/30 text-[#006e25] rounded-xl text-xs font-bold flex items-center gap-2 border border-[#006e25]/30 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>บันทึกและปรับปรุงสถานะการตรวจสอบเรียบร้อยแล้ว (Updated successfully!)</span>
            </div>
          )}

          {/* Hospital Identification Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#f6faff] rounded-xl border border-[#c1c7d2]">
            <div>
              <span className="text-[11px] font-semibold text-[#727781] block">ห้องปฏิบัติการ</span>
              <strong className="text-xs text-[#003e6f] block">{incident.department}</strong>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#727781] block">รหัสผู้ป่วย (HN)</span>
              <strong className="text-xs font-mono text-[#141d23] block">{incident.patientHn || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#727781] block">หมายเลขสิ่งส่งตรวจ</span>
              <strong className="text-xs font-mono text-[#141d23] block">{incident.labNumber || 'ไม่ระบุ'}</strong>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#727781] block">สถานที่ / หอผู้ป่วย</span>
              <strong className="text-xs text-[#141d23] block">{incident.location || 'หน่วยงานผู้ป่วยใน'}</strong>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#727781] block">ชนิดสิ่งส่งตรวจ</span>
              <strong className="text-xs text-[#141d23] block">{incident.specimen}</strong>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#727781] block">วันและเวลาที่เกิดเหตุ</span>
              <strong className="text-xs text-[#141d23] block">{incident.date} {incident.time ? `(${incident.time})` : ''}</strong>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#727781] block">ผู้รายงาน</span>
              <strong className="text-xs text-[#141d23] block truncate">{incident.reportedBy}</strong>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#727781] block">สถานะข้อมูล</span>
              <span className="text-[11px] font-bold text-[#003e6f] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">database</span>
                บันทึกในฐานข้อมูลกลาง
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase text-[#414750] tracking-wider mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#003e6f]">description</span>
              รายละเอียดเหตุการณ์ (Incident Narrative)
            </h4>
            <p className="text-xs sm:text-sm text-[#141d23] bg-[#ecf5fe] p-3.5 rounded-xl border border-[#c1c7d2]/80 leading-relaxed">
              {incident.description}
            </p>
          </div>

          {/* Clinical Impact & Immediate Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase text-[#414750] tracking-wider mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-600">health_and_safety</span>
                ผลกระทบทางคลินิก (Clinical Impact)
              </h4>
              <p className="text-xs text-[#141d23] bg-[#f6faff] p-3 rounded-xl border border-[#c1c7d2] leading-relaxed">
                {incident.impact || <span className="italic text-[#727781]">ยังไม่ได้ระบุผลกระทบ</span>}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-[#414750] tracking-wider mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#006e25]">bolt</span>
                การแก้ไขเฉพาะหน้าทันที (Immediate Action)
              </h4>
              <p className="text-xs text-[#141d23] bg-[#f6faff] p-3 rounded-xl border border-[#c1c7d2] leading-relaxed">
                {incident.immediateAction || <span className="italic text-[#727781]">ยังไม่ได้ระบุการแก้ไขเฉพาะหน้า</span>}
              </p>
            </div>
          </div>

          {/* Root Cause & CAPA (ISO 15189: RCA + Corrective + Preventive Action) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase text-[#414750] tracking-wider mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">psychology_alt</span>
                สาเหตุที่แท้จริง (Root Cause Analysis)
              </h4>
              <p className="text-xs text-[#141d23] bg-[#f6faff] p-3 rounded-xl border border-[#c1c7d2] leading-relaxed">
                {incident.rootCause || <span className="italic text-[#727781]">ยังไม่ได้วิเคราะห์สาเหตุราก</span>}
              </p>
              {incident.rootCause && (
                <p className="text-[10px] text-[#727781] mt-1">
                  หมวดหมู่: {incident.rootCauseCategory || 'ไม่ระบุ'}
                  {incident.rcaMethod ? ` · วิธีวิเคราะห์: ${translateRcaMethod(incident.rcaMethod)}` : ''}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-[#414750] tracking-wider mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#8a5300]">build_circle</span>
                มาตรการแก้ไข (Corrective Action)
              </h4>
              <p className="text-xs text-[#141d23] bg-[#f6faff] p-3 rounded-xl border border-[#c1c7d2] leading-relaxed">
                {incident.correctiveAction || <span className="italic text-[#727781]">ยังไม่ได้ระบุมาตรการแก้ไข</span>}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-[#414750] tracking-wider mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#003e6f]">security</span>
              มาตรการป้องกันการเกิดซ้ำ (Preventive Action)
            </h4>
            <p className="text-xs text-[#141d23] bg-[#f6faff] p-3 rounded-xl border border-[#c1c7d2] leading-relaxed">
              {incident.preventiveAction || <span className="italic text-[#727781]">ยังไม่ได้ระบุมาตรการป้องกัน</span>}
            </p>
          </div>

          {/* Effectiveness Verification — ISO 15189 requires confirming the
              corrective/preventive action actually worked before closing,
              not just that an action was taken. */}
          <div className="p-4 bg-[#ecf5fe] rounded-xl border border-[#003e6f]/20">
            <h4 className="text-xs font-bold uppercase text-[#003e6f] tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              การยืนยันประสิทธิผล (Effectiveness Verification)
            </h4>
            {incident.effectivenessReview ? (
              <div className="text-xs text-[#141d23] space-y-1">
                <p>{incident.effectivenessReview}</p>
                <p className="text-[10px] text-[#727781]">
                  ยืนยันโดย {incident.effectivenessVerifiedBy || 'ไม่ระบุ'}
                  {incident.effectivenessVerifiedDate ? ` · ${incident.effectivenessVerifiedDate}` : ''}
                </p>
              </div>
            ) : (
              <label className="flex items-start gap-2 text-xs text-[#414750]">
                <input
                  type="checkbox"
                  checked={effectivenessConfirmed}
                  onChange={(e) => setEffectivenessConfirmed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  ยืนยันว่าได้ตรวจสอบแล้วว่ามาตรการแก้ไข/ป้องกันข้างต้นได้ผลจริง และจะบันทึกชื่อผู้ยืนยันเมื่อกด "บันทึกการเปลี่ยนแปลง"
                </span>
              </label>
            )}
          </div>

          {/* Status update — ISO 15189 nonconformity lifecycle */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase text-[#414750] tracking-wider mb-2">
              ปรับปรุงสถานะการตรวจสอบ (Update QA &amp; Investigation Status)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  'Under Investigation',
                  'Action Required',
                  'Corrective Action Implemented',
                  'Verified Effective',
                  'Resolved',
                ] as RiskIncident['status'][]
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  disabled={st === 'Verified Effective' && !incident.effectivenessReview && !effectivenessConfirmed}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed ${
                    status === st
                      ? 'bg-[#003e6f] text-white border-[#003e6f] shadow-xs'
                      : 'bg-white text-[#414750] border-[#c1c7d2] hover:bg-[#e0e9f2]'
                  }`}
                >
                  {translateStatus(st)}
                </button>
              ))}
            </div>
            {status === 'Verified Effective' && !incident.effectivenessReview && (
              <p className="text-[11px] text-[#8a5300] mt-1.5">
                ⓘ ต้องติ๊กยืนยันในกล่อง "การยืนยันประสิทธิผล" ด้านบนก่อน จึงจะปิดสถานะนี้ได้ (ตามข้อกำหนด ISO 15189)
              </p>
            )}
          </div>

          {/* Add audit note */}
          <div>
            <label className="block text-xs font-bold uppercase text-[#414750] tracking-wider mb-1">
              เพิ่มบันทึกการตรวจสอบคุณภาพ (QA &amp; Supervisor Audit Note)
            </label>
            <input
              type="text"
              placeholder="เพิ่มหมายเหตุเพิ่มเติมเกี่ยวกับการแก้ไขและการติดตามผล..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-10 px-3 border border-[#c1c7d2] rounded-xl text-xs focus:border-[#003e6f]"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-[#f6faff] p-4 border-t border-[#c1c7d2] flex flex-wrap items-center justify-between gap-3">
          <a
            href="https://docs.google.com/forms/d/1RuGhHcfgEZ8Ms8iUTY76O3A36Lj6YzOZ_3W0tjJO9Zs/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#005596] hover:text-[#003e6f] font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            เปิดแบบฟอร์ม Google Form ต้นทาง
          </a>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#c1c7d2] rounded-xl text-xs font-semibold text-[#414750] hover:bg-[#e0e9f2] transition-colors cursor-pointer"
            >
              ปิด (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#003e6f] hover:bg-[#004881] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              บันทึกการเปลี่ยนแปลง (Save QA Status)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
