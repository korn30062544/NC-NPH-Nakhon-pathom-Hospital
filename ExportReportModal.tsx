import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RiskIncident, User } from '../types';
import { translateRiskLevel, translateStatus } from '../utils/labels';

interface ExportReportModalProps {
  onClose: () => void;
  incidents: RiskIncident[];
  currentUser: User | null;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  onClose,
  incidents,
  currentUser,
}) => {
  const [reportType, setReportType] = useState('Monthly Risk Summary');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 2500);
    }, 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl border border-[#c1c7d2] max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-[#003e6f] text-white p-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px]">description</span>
            <div>
              <h3 className="text-lg font-headline-sm font-bold">
                ส่งออกรายงานความเสี่ยง (Export Risk QA Report)
              </h3>
              <p className="text-xs text-white/80">
                Nakhon Pathom Hospital Laboratory Quality Assurance Board
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6 text-[#141d23]">
          {/* Options */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-[#f6faff] p-3 rounded-lg border border-[#c1c7d2]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#414750]">รูปแบบรายงาน:</span>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="h-8 px-2 bg-white border border-[#c1c7d2] rounded text-xs focus:outline-none"
              >
                <option>Monthly Risk Summary (สรุปประจำเดือน)</option>
                <option>5-Year Trend Comprehensive Audit (สรุปแนวโน้ม 5 ปี)</option>
                <option>Non-Conformity &amp; Specimen Rejection Register (ทะเบียนความไม่สอดคล้อง)</option>
                <option>ISO 15189 Quality Control Sheet (เอกสารควบคุมคุณภาพ)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white border border-[#c1c7d2] rounded text-xs font-semibold text-[#003e6f] hover:bg-[#e6eff8] flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                พิมพ์ (Print)
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="px-3.5 py-1.5 bg-[#003e6f] hover:bg-[#004881] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                {downloading ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด PDF (Download)'}
              </button>
            </div>
          </div>

          {downloadSuccess && (
            <div className="p-3 bg-[#80f98b]/30 text-[#007327] rounded text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>ส่งออกรายงานและบันทึกข้อมูลเรียบร้อยแล้ว (Report generated successfully!)</span>
            </div>
          )}

          {/* Printable Preview Sheet */}
          <div className="border border-[#c1c7d2] rounded-lg p-6 bg-white shadow-inner font-body-md text-xs space-y-4">
            {/* Header branding */}
            <div className="flex items-center justify-between border-b pb-4 border-[#003e6f]">
              <div className="flex items-center gap-3">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsUkGZd-X8QPUgtO_-zeu39L0OmkjBVz2sRfwAEdurlIEZ6U-lxS7-ylTQJJG_2nEXsrhNd6kEMBgM0zJybWQ2rXdE4O0hRR8qNNepMWso9UOnypZLA88I3Cpbpqd4P94ib4g0lBZ-5Ni259dzvW4FGx4MSKSRRHt-nkP_eWHkD62EC8J0iZDLPHoWOBUY5mybOZjRqWrtb9OepsGFEp9Vr5y9zG7W1L98-zuLX_xPC8K0FmFcGZM4"
                  alt="Nakhon Pathom Hospital"
                  className="w-12 h-12 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#003e6f]">
                    โรงพยาบาลนครปฐม (Nakhon Pathom Hospital)
                  </h4>
                  <p className="text-[11px] text-[#414750]">
                    กลุ่มงานเทคนิคการแพทย์และพยาธิวิทยาคลินิก (Laboratory Department)
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] text-[#727781]">
                <div>
                  วันที่ออกเอกสาร: <strong>{new Date().toLocaleDateString('th-TH')}</strong>
                </div>
                <div>ผู้รับรอง: {currentUser?.name || 'ผู้จัดการคุณภาพ'}</div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2 bg-[#ecf5fe] rounded">
              <h5 className="font-bold text-sm text-[#003e6f]">{reportType}</h5>
              <p className="text-[11px] text-[#414750]">
                ระบบบริหารความเสี่ยงและติดตามความไม่สอดคล้องของโรงพยาบาล
              </p>
            </div>

            {/* Summary statistics */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 border border-[#c1c7d2] rounded">
                <div className="text-[10px] text-[#727781]">อุบัติการณ์ทั้งหมด</div>
                <div className="text-base font-bold text-[#003e6f]">{incidents.length}</div>
              </div>
              <div className="p-2 border border-[#c1c7d2] rounded">
                <div className="text-[10px] text-[#727781]">วิกฤต / เสี่ยงสูง</div>
                <div className="text-base font-bold text-[#ba1a1a]">
                  {incidents.filter((i) => i.riskLevel === 'Critical' || i.riskLevel === 'High Risk').length}
                </div>
              </div>
              <div className="p-2 border border-[#c1c7d2] rounded">
                <div className="text-[10px] text-[#727781]">แก้ไขเรียบร้อย</div>
                <div className="text-base font-bold text-[#006e25]">
                  {incidents.filter((i) => i.status === 'Resolved').length}
                </div>
              </div>
              <div className="p-2 border border-[#c1c7d2] rounded">
                <div className="text-[10px] text-[#727781]">อยู่ระหว่างตรวจสอบ</div>
                <div className="text-base font-bold text-[#a90426]">
                  {incidents.filter((i) => i.status === 'Under Investigation').length}
                </div>
              </div>
            </div>

            {/* Incident Records Table */}
            <div className="border border-[#c1c7d2] rounded overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#f6faff] border-b border-[#c1c7d2] font-semibold text-[#414750]">
                  <tr>
                    <th className="p-2">รหัส</th>
                    <th className="p-2">หน่วยงาน</th>
                    <th className="p-2">สิ่งส่งตรวจ</th>
                    <th className="p-2">หมวดหมู่</th>
                    <th className="p-2">ระดับ</th>
                    <th className="p-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c1c7d2]/60">
                  {incidents.slice(0, 5).map((inc, idx) => (
                    <tr key={`${inc.id || 'inc'}-${idx}`}>
                      <td className="p-2 font-mono font-bold">{inc.incidentId}</td>
                      <td className="p-2">{inc.department}</td>
                      <td className="p-2">{inc.specimen}</td>
                      <td className="p-2">{inc.type}</td>
                      <td className="p-2 font-semibold">{translateRiskLevel(inc.riskLevel)}</td>
                      <td className="p-2">{translateStatus(inc.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Area */}
            <div className="pt-6 flex justify-between text-center text-[11px] text-[#414750]">
              <div className="w-48">
                <div className="border-b border-[#727781] pb-6 mb-1"></div>
                <div>(ลงชื่อผู้รายงาน / Reporter)</div>
              </div>
              <div className="w-48">
                <div className="border-b border-[#727781] pb-6 mb-1"></div>
                <div>(ลงชื่อประธานคณะกรรมการความเสี่ยง)</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
