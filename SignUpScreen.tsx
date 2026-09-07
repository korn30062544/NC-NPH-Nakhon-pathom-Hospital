import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, DepartmentKey } from '../types';
import { registerUser } from '../services/authService';

interface SignUpScreenProps {
  onRegister: (newUser: User) => void;
  onNavigateToLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onRegister,
  onNavigateToLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [department, setDepartment] = useState('central');
  const [position, setPosition] = useState('นักเทคนิคการแพทย์ปฏิบัติการ');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function mapFirebaseError(err: any): string {
    const code = err?.code || '';
    if (code.includes('email-already-in-use')) {
      return 'อีเมลนี้มีบัญชีผู้ใช้งานอยู่แล้ว กรุณาเข้าสู่ระบบแทน';
    }
    if (code.includes('weak-password')) {
      return 'รหัสผ่านไม่ปลอดภัยเพียงพอ กรุณาใช้รหัสผ่านที่ยาวและซับซ้อนขึ้น';
    }
    if (code.includes('invalid-email')) {
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    return err?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gmail.trim() || !gmail.includes('@')) {
      setErrorMsg('กรุณากรอก Gmail ที่ถูกต้อง (เช่น yourname@gmail.com) เพื่อใช้เป็น Username');
      return;
    }

    if (!gmail.toLowerCase().endsWith('@gmail.com')) {
      setErrorMsg('กรุณาใช้อีเมลของ Google (@gmail.com) เป็นชื่อผู้ใช้งาน (Username)');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ - นามสกุล ให้ครบถ้วน');
      return;
    }

    if (!licenseNumber.trim()) {
      setErrorMsg('กรุณากรอกเลขใบอนุญาตประกอบวิชาชีพ (เลข ทนพ.)');
      return;
    }

    if (!department) {
      setErrorMsg('กรุณาเลือกห้องปฏิบัติการที่สังกัด');
      return;
    }

    if (!position.trim()) {
      setErrorMsg('กรุณาระบุตำแหน่งหน้าที่การทำงาน');
      return;
    }

    const deptMap: Record<string, { name: string; key: DepartmentKey }> = {
      central: { name: 'Central Lab (ห้องแล็บกลาง)', key: 'central' },
      blood: { name: 'Blood Bank (ธนาคารเลือด)', key: 'blood' },
      molecular: { name: 'Molecular Biology (อณูชีววิทยา)', key: 'molecular' },
      microbiology: { name: 'Clinical Microbiology (จุลชีววิทยา)', key: 'microbiology' },
      outpatient: { name: 'Outpatient Lab (ผู้ป่วยนอก OPD)', key: 'outpatient' },
      molecular_science: { name: 'Molecular Science (อณูชีวโมเลกุล)', key: 'molecular_science' },
      material_store: { name: 'Science Material Store (คลังพัสดุแล็บ)', key: 'material_store' },
    };

    const deptInfo = deptMap[department] || { name: 'Central Lab (ห้องแล็บกลาง)', key: 'central' };

    // Auto-formatted license
    const formattedLicense = licenseNumber.trim().startsWith('ทนพ.')
      ? licenseNumber.trim()
      : `ทนพ. ${licenseNumber.trim()}`;

    setErrorMsg('');
    setSubmitting(true);
    try {
      const newUser = await registerUser({
        email: gmail.trim(),
        password,
        fullName: fullName.trim(),
        licenseNumber: formattedLicense,
        departmentName: deptInfo.name,
        departmentKey: deptInfo.key,
        position: position.trim(),
      });
      setSuccessMsg('ลงทะเบียนสำเร็จ! กำลังนำท่านเข้าสู่ระบบศูนย์รายงานความเสี่ยงแล็บ...');
      setTimeout(() => {
        onRegister(newUser);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(mapFirebaseError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f6faff] text-[#141d23] min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[1060px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col lg:flex-row overflow-hidden min-h-[660px]"
      >
        {/* Left Panel: Graphic / Brand Context */}
        <div className="hidden lg:flex w-5/12 bg-gradient-to-br from-[#003e6f] via-[#005596] to-[#002849] p-8 flex-col justify-between relative overflow-hidden text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center p-1 backdrop-blur-xs border border-white/30">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsUkGZd-X8QPUgtO_-zeu39L0OmkjBVz2sRfwAEdurlIEZ6U-lxS7-ylTQJJG_2nEXsrhNd6kEMBgM0zJybWQ2rXdE4O0hRR8qNNepMWso9UOnypZLA88I3Cpbpqd4P94ib4g0lBZ-5Ni259dzvW4FGx4MSKSRRHt-nkP_eWHkD62EC8J0iZDLPHoWOBUY5mybOZjRqWrtb9OepsGFEp9Vr5y9zG7W1L98-zuLX_xPC8K0FmFcGZM4"
                  alt="Nakhon Pathom Hospital Logo"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-bold text-base text-white leading-tight">
                  โรงพยาบาลนครปฐม
                </h1>
                <p className="text-xs text-sky-200">
                  กลุ่มงานเทคนิคการแพทย์และพยาธิวิทยาคลินิก
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-8">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/20 text-sky-200 inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
                ระบบลงทะเบียนบุคลากรทางห้องปฏิบัติการ
              </span>
              <h2 className="text-2xl font-black text-white leading-snug">
                สมัครสมาชิกเพื่อเข้าใช้งานระบบรายงานความเสี่ยง &amp; AI Analytics
              </h2>
              <p className="text-xs text-sky-100/80 leading-relaxed">
                บันทึกอุบัติการณ์ความเสี่ยง (Incident Report), จัดการไฟล์ข้อมูล และวิเคราะห์ดัชนีคุณภาพห้องปฏิบัติการแบบ Real-time ตามมาตรฐาน ISO 15189 / HA
              </p>
            </div>

            {/* Checklist items */}
            <div className="mt-8 space-y-2.5 text-xs text-sky-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                <span>ยืนยันตัวตนด้วยบัญชี Gmail และเลข ทนพ.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                <span>Contextual Routing แยกสถิติอัตโนมัติตามห้องปฏิบัติการ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                <span>เชื่อมต่อ AI ผู้ช่วยวิเคราะห์ความเสี่ยงและแนวโน้ม NC</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-6 border-t border-white/15">
            <div className="flex items-center gap-3 text-xs text-sky-200">
              <span className="material-symbols-outlined text-[20px] text-amber-300">security</span>
              <span>ระบบรักษาความปลอดภัยระดับองค์กร รองรับโควตา 500 บัญชีผู้ใช้</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Sign Up Form */}
        <div className="w-full lg:w-7/12 p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
          <div className="max-w-[480px] mx-auto">
            <div className="mb-5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl text-[#003e6f] font-bold">
                  ลงทะเบียนผู้ใช้งานใหม่
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  User Registration Form (สำหรับบุคลากรทางการแพทย์)
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
              >
                <span>เข้าสู่ระบบ</span>
                <span className="material-symbols-outlined text-[16px]">login</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-200">
                <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Gmail (ใช้เป็น Username) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1" htmlFor="gmail">
                  <span className="material-symbols-outlined text-[16px] text-red-500">mail</span>
                  <span>Gmail (ใช้เป็น Username ในการเข้าสู่ระบบ) *</span>
                </label>
                <input
                  id="gmail"
                  type="email"
                  placeholder="เช่น yourname@gmail.com"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800 transition-all font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  ต้องใช้อีเมล Google (@gmail.com) สำหรับยืนยันตัวตน
                </p>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1" htmlFor="password">
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">key</span>
                    <span>รหัสผ่าน (Password) *</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 pl-3.5 pr-9 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1" htmlFor="confirmPassword">
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">lock_reset</span>
                    <span>ยืนยันรหัสผ่าน *</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Full Name & License Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1" htmlFor="fullName">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">badge</span>
                    <span>ชื่อ - นามสกุล *</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="เช่น ทนพ. สมเกียรติ มั่นคง"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1" htmlFor="licenseNumber">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">verified</span>
                    <span>เลข ทนพ. (ใบอนุญาตฯ) *</span>
                  </label>
                  <input
                    id="licenseNumber"
                    type="text"
                    placeholder="เช่น ทนพ. 15420"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              {/* Department & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1" htmlFor="department">
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">biotech</span>
                    <span>ห้องปฏิบัติการที่สังกัด *</span>
                  </label>
                  <div className="relative">
                    <select
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-10 pl-3.5 pr-8 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-800 appearance-none font-medium transition-all"
                      required
                    >
                      <option value="central">Central Lab (ห้องปฏิบัติการกลาง)</option>
                      <option value="blood">Blood Bank (ธนาคารเลือด)</option>
                      <option value="microbiology">Clinical Microbiology (จุลชีววิทยา)</option>
                      <option value="molecular">Molecular Biology (อณูชีววิทยา)</option>
                      <option value="outpatient">Outpatient Lab (ห้องเจาะเลือด OPD)</option>
                      <option value="molecular_science">Molecular Science (อณูชีวโมเลกุล)</option>
                      <option value="material_store">Science Material Store (คลังพัสดุแล็บ)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-500">
                      <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1" htmlFor="position">
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">work</span>
                    <span>ตำแหน่งหน้าที่ *</span>
                  </label>
                  <input
                    id="position"
                    type="text"
                    placeholder="เช่น นักเทคนิคการแพทย์ปฏิบัติการ"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-800 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>{submitting ? 'กำลังสมัครสมาชิก...' : 'ยืนยันการสมัครสมาชิก'}</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  มีบัญชีอยู่แล้ว?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    เข้าสู่ระบบที่นี่
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
