import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, DepartmentKey } from '../types';
import { isSuperAdmin, isAdmin } from '../utils/rbacEngine';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  targetUser: User;
  onSaveUser: (updatedUser: User) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser,
  onSaveUser,
}) => {
  const isElevated = isSuperAdmin(currentUser) || isAdmin(currentUser);
  const isEditingSelf = currentUser?.id === targetUser.id;

  const [name, setName] = useState(targetUser.name || '');
  const [password, setPassword] = useState(targetUser.password || '');
  const [confirmPassword, setConfirmPassword] = useState(targetUser.password || '');
  const [licenseNumber, setLicenseNumber] = useState(targetUser.licenseNumber || '');
  const [departmentKey, setDepartmentKey] = useState<DepartmentKey>(targetUser.departmentKey || 'central');
  const [position, setPosition] = useState(targetUser.position || targetUser.role || '');
  const [status, setStatus] = useState<User['status']>(targetUser.status || 'Active');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const deptMap: Record<string, { name: string; key: DepartmentKey }> = {
    central: { name: 'Central Lab (ห้องปฏิบัติการกลาง)', key: 'central' },
    blood: { name: 'Blood Bank (ธนาคารเลือด)', key: 'blood' },
    molecular: { name: 'Molecular Biology (อณูชีววิทยา)', key: 'molecular' },
    microbiology: { name: 'Clinical Microbiology (จุลชีววิทยา)', key: 'microbiology' },
    outpatient: { name: 'Outpatient Lab (ห้องเจาะเลือด OPD)', key: 'outpatient' },
    molecular_science: { name: 'Molecular Science (อณูชีวโมเลกุล)', key: 'molecular_science' },
    material_store: { name: 'Science Material Store (คลังพัสดุแล็บ)', key: 'material_store' },
    overview: { name: 'Hospital Executive & Lab Council', key: 'overview' },
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ - นามสกุล');
      return;
    }

    if (password && password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const deptInfo = deptMap[departmentKey] || deptMap['central'];

    const updatedUser: User = {
      ...targetUser,
      name: name.trim(),
      password: password.trim() ? password.trim() : targetUser.password,
      licenseNumber: isElevated ? licenseNumber.trim() : targetUser.licenseNumber,
      department: isElevated ? deptInfo.name : targetUser.department,
      departmentKey: isElevated ? deptInfo.key : targetUser.departmentKey,
      position: isElevated ? position.trim() : targetUser.position,
      role: isElevated ? position.trim() : targetUser.role,
      status: isElevated ? status : targetUser.status,
    };

    onSaveUser(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isElevated && !isEditingSelf ? `แก้ไขข้อมูลบัญชีผู้ใช้: ${targetUser.name}` : 'แก้ไขข้อมูลส่วนตัว (Profile Settings)'}
              </h3>
              <p className="text-xs text-slate-300">
                {isElevated ? 'สิทธิ์ Admin: ปรับปรุงชื่อ, รหัสผ่าน, แผนก, ตำแหน่ง หรือสถานะ' : 'สิทธิ์ผู้ใช้: ปรับปรุงชื่อและรหัสผ่านส่วนตัว'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-200">
              <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email (Readonly Username) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Gmail (Username)</span>
              <span className="text-[10px] text-slate-400 font-normal">ไม่อนุญาตให้แก้ไขอีเมลหลัก</span>
            </label>
            <input
              type="text"
              disabled
              value={targetUser.email}
              className="w-full h-10 px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700" htmlFor="edit-name">
              ชื่อ - นามสกุล *
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-800 font-medium"
              required
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="edit-pw">
                <span>เปลี่ยนรหัสผ่าน</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-indigo-600 hover:underline"
                >
                  {showPassword ? 'ซ่อน' : 'แสดง'}
                </button>
              </label>
              <input
                id="edit-pw"
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-800 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700" htmlFor="edit-pw-confirm">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                id="edit-pw-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* License Number (Admin editable or User readonly) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>เลขใบอนุญาตประกอบวิชาชีพ (เลข ทนพ.)</span>
              {!isElevated && <span className="text-[10px] text-slate-400">เฉพาะผู้ดูแลระบบแก้ไขได้</span>}
            </label>
            <input
              type="text"
              disabled={!isElevated}
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className={`w-full h-10 px-3.5 border rounded-xl text-xs font-mono ${
                isElevated
                  ? 'bg-white border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Department & Position (Admin editable or User readonly) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>ห้องปฏิบัติการที่สังกัด</span>
                {!isElevated && <span className="text-[10px] text-slate-400">อ่านอย่างเดียว</span>}
              </label>
              {isElevated ? (
                <div className="relative">
                  <select
                    value={departmentKey}
                    onChange={(e) => setDepartmentKey(e.target.value as DepartmentKey)}
                    className="w-full h-10 pl-3 pr-8 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-800 appearance-none font-medium"
                  >
                    <option value="central">Central Lab (แล็บกลาง)</option>
                    <option value="blood">Blood Bank (ธนาคารเลือด)</option>
                    <option value="microbiology">Clinical Microbiology (จุลชีววิทยา)</option>
                    <option value="molecular">Molecular Biology (อณูชีววิทยา)</option>
                    <option value="outpatient">Outpatient Lab (เจาะเลือด OPD)</option>
                    <option value="molecular_science">Molecular Science (อณูชีวโมเลกุล)</option>
                    <option value="material_store">Science Material Store (คลังพัสดุ)</option>
                    <option value="overview">Executive &amp; Quality Council</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  disabled
                  value={targetUser.department}
                  className="w-full h-10 px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>ตำแหน่งหน้าที่</span>
                {!isElevated && <span className="text-[10px] text-slate-400">อ่านอย่างเดียว</span>}
              </label>
              <input
                type="text"
                disabled={!isElevated}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={`w-full h-10 px-3.5 border rounded-xl text-xs ${
                  isElevated
                    ? 'bg-white border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-800 font-medium'
                    : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Status (Admin only) */}
          {isElevated && (
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-slate-700">สถานะการใช้งาน (Account Status)</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={status === 'Active'}
                    onChange={() => setStatus('Active')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>อนุมัติ / ใช้งานได้ปกติ (Active)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="Pending Approval"
                    checked={status === 'Pending Approval'}
                    onChange={() => setStatus('Pending Approval')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>รออนุมัติ (Pending)</span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
