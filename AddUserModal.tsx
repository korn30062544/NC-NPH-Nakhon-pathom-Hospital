import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DepartmentKey, User, UserRole } from '../types';

interface AddUserModalProps {
  onClose: () => void;
  onAddUser: (newUser: User) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onAddUser }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Medical Technologist');
  const [roleType, setRoleType] = useState<UserRole>('Lab Staff');
  const [departmentKey, setDepartmentKey] = useState<DepartmentKey>('central');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<'Active' | 'Pending Approval'>('Active');
  const [errorMsg, setErrorMsg] = useState('');

  const deptMap: Record<DepartmentKey, string> = {
    overview: 'ห้องปฏิบัติการกลาง',
    central: 'ห้องปฏิบัติการกลาง',
    blood: 'ธนาคารเลือด',
    molecular: 'อณูชีววิทยา',
    outpatient: 'ห้องปฏิบัติการผู้ป่วยนอก',
    molecular_science: 'อณูชีวโมเลกุล',
    microbiology: 'จุลชีววิทยาคลินิก',
    material_store: 'คลังวัสดุวิทยาศาสตร์',
    data_upload: 'ห้องปฏิบัติการกลาง',
    settings: 'ห้องปฏิบัติการกลาง',
    google_sync: 'ห้องปฏิบัติการกลาง',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุล (User Name)');
      return;
    }
    if (!employeeId.trim()) {
      setErrorMsg('กรุณาระบุรหัสพนักงาน (Employee ID)');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('กรุณาระบุอีเมลที่ถูกต้อง (Email Address)');
      return;
    }

    const nameParts = name.trim().split(' ');
    const initials = nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      roleType: roleType,
      department: deptMap[departmentKey],
      departmentKey: departmentKey,
      status: status,
      lastActive: 'Just now',
      email: email.trim(),
      employeeId: employeeId.trim(),
      avatarText: initials,
      avatarBg: roleType === 'Administrator' ? '#d3e4ff' : '#80f98b',
    };

    onAddUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl border border-[#c1c7d2] max-w-lg w-full overflow-hidden"
      >
        <div className="bg-[#003e6f] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px]">person_add</span>
            <h3 className="text-lg font-headline-sm font-bold">
              เพิ่มผู้ใช้งานใหม่ (Add New User)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[#141d23]">
          {errorMsg && (
            <div className="p-3 bg-[#ffdad6] text-[#93000a] rounded text-xs flex items-center gap-2 border border-[#ba1a1a]/20">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              ชื่อ-นามสกุล (Full Name) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Somchai Prasert"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 border border-[#c1c7d2] rounded focus:border-[#003e6f] focus:outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                รหัสพนักงาน (EMP ID) *
              </label>
              <input
                type="text"
                required
                placeholder="EMP-1234"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-10 px-3 border border-[#c1c7d2] rounded focus:border-[#003e6f] focus:outline-none font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                ตำแหน่ง (Position Title)
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3 border border-[#c1c7d2] rounded focus:border-[#003e6f] focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                บทบาท (Role Level)
              </label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value as UserRole)}
                className="w-full h-10 px-3 border border-[#c1c7d2] rounded focus:border-[#003e6f] focus:outline-none text-sm"
              >
                <option value="Lab Staff">Lab Staff (เจ้าหน้าที่แล็บ)</option>
                <option value="Administrator">Administrator (ผู้ดูแลระบบ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                ห้องปฏิบัติการ (Department)
              </label>
              <select
                value={departmentKey}
                onChange={(e) => setDepartmentKey(e.target.value as DepartmentKey)}
                className="w-full h-10 px-3 border border-[#c1c7d2] rounded focus:border-[#003e6f] focus:outline-none text-sm"
              >
                <option value="central">ห้องปฏิบัติการกลาง (Central Lab)</option>
                <option value="blood">ธนาคารเลือด (Blood Bank)</option>
                <option value="molecular">อณูชีววิทยา (Molecular Biology)</option>
                <option value="outpatient">ห้องปฏิบัติการผู้ป่วยนอก (Outpatient Lab)</option>
                <option value="molecular_science">อณูชีวโมเลกุล (Molecular Science)</option>
                <option value="microbiology">จุลชีววิทยาคลินิก (Clinical Microbiology)</option>
                <option value="material_store">คลังวัสดุวิทยาศาสตร์ (Material Store)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              อีเมล (Hospital Email) *
            </label>
            <input
              type="email"
              required
              placeholder="user@hospital.th"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 border border-[#c1c7d2] rounded focus:border-[#003e6f] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              สถานะเริ่มต้น (Initial Status)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'Active'}
                  onChange={() => setStatus('Active')}
                />
                Active (ใช้งานได้ทันที)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'Pending Approval'}
                  onChange={() => setStatus('Pending Approval')}
                />
                Pending Approval (รออนุมัติ)
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#c1c7d2] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#414750] hover:bg-[#e6eff8] rounded font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#005596] hover:bg-[#003e6f] text-white rounded font-semibold text-sm transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              เพิ่มผู้ใช้งาน (Save User)
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
