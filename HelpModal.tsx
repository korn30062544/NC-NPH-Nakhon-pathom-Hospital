import React from 'react';
import { motion } from 'motion/react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl border border-[#c1c7d2] max-w-lg w-full max-h-[85vh] overflow-y-auto"
      >
        <div className="bg-[#003e6f] text-white p-4 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">help</span>
            <h3 className="text-base font-bold font-headline-sm">คู่มือการใช้งาน (System Guide &amp; SOP)</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-[#141d23]">
          <div>
            <h4 className="font-bold text-sm text-[#003e6f] mb-1">
              1. การรายงานความเสี่ยง (Report Risk Incident)
            </h4>
            <p className="text-[#414750] leading-relaxed">
              คลิกปุ่ม <strong>&quot;Report Risk&quot;</strong> ที่แถบเมนูด้านซ้ายหรือหัวตารางเพื่อกรอกข้อมูลเหตุการณ์ไม่พึงประสงค์ ระบุห้องปฏิบัติการ ชนิดสิ่งส่งตรวจ และระดับความรุนแรง (Critical / High / Moderate / Low)
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-[#003e6f] mb-1">
              2. การอัปโหลดข้อมูลจาก LIS (Data Upload)
            </h4>
            <p className="text-[#414750] leading-relaxed">
              รองรับไฟล์ <strong>CSV, XLSX, XLS, PDF</strong> ระบบจะทำการตรวจสอบโครงสร้างข้อมูลและวิเคราะห์แนวโน้มอัตโนมัติเพื่อแสดงผลในแดชบอร์ด 5 ปีย้อนหลัง
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-[#003e6f] mb-1">
              3. การจัดการผู้ใช้งาน (User Management)
            </h4>
            <p className="text-[#414750] leading-relaxed">
              เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้นที่สามารถอนุมัติ (Approve) หรือปฏิเสธ (Deny) คำขอลงทะเบียนของเจ้าหน้าที่ห้องปฏิบัติการได้
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-[#003e6f] mb-1">
              4. แผนกห้องปฏิบัติการที่รองรับ (Supported Departments)
            </h4>
            <ul className="list-disc list-inside text-[#414750] space-y-1">
              <li>Central Lab (ห้องปฏิบัติการกลาง)</li>
              <li>Blood Bank (ธนาคารเลือด)</li>
              <li>Molecular Biology (ห้องอณูชีววิทยา)</li>
              <li>Outpatient Lab (ห้องปฏิบัติการผู้ป่วยภายนอก)</li>
              <li>Molecular Science (วิทยาศาสตร์โมเลกุล)</li>
              <li>Clinical Microbiology (ห้องจุลชีววิทยาคลินิก)</li>
              <li>Science Material Store (คลังวัสดุวิทยาศาสตร์)</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-[#f6faff] border-t border-[#c1c7d2] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#003e6f] text-white rounded text-xs font-semibold hover:bg-[#004881]"
          >
            เข้าใจแล้ว (Got it)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
