import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, RBAC_LIMITS } from '../types';
import { translateUserStatus } from '../utils/labels';
import {
  getUserTier,
  isSuperAdmin,
  isAdmin,
  calculateQuotaStats,
  canPromoteToAdmin,
  canDemoteAdmin,
  canDeleteUser,
  getRoleBadgeInfo,
} from '../utils/rbacEngine';

interface RBACManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  users: User[];
  onPromoteToAdmin: (targetUser: User) => void;
  onDemoteAdmin: (targetUser: User) => void;
  onDeleteUser: (targetUser: User) => void;
  onOpenAddUser: () => void;
  onSwitchUser?: (user: User) => void;
  onEditUser?: (user: User) => void;
}

export const RBACManagementModal: React.FC<RBACManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onPromoteToAdmin,
  onDemoteAdmin,
  onDeleteUser,
  onOpenAddUser,
  onSwitchUser,
  onEditUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'user'>('all');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const quota = calculateQuotaStats(users);
  const currentTier = getUserTier(currentUser);
  const isOwner = isSuperAdmin(currentUser);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handlePromote = (targetUser: User) => {
    const check = canPromoteToAdmin(currentUser, targetUser, users);
    if (!check.allowed) {
      showToast(check.reason || 'ไม่สามารถแต่งตั้งได้', 'error');
      return;
    }
    onPromoteToAdmin(targetUser);
    showToast(`แต่งตั้ง ${targetUser.name} เป็น Admin สำเร็จ (โควตา Admin ปัจจุบัน: ${quota.adminCount + 1}/${RBAC_LIMITS.MAX_ADMINS})`, 'success');
  };

  const handleDemote = (targetUser: User) => {
    const check = canDemoteAdmin(currentUser, targetUser);
    if (!check.allowed) {
      showToast(check.reason || 'ไม่สามารถถอดถอนได้', 'error');
      return;
    }
    onDemoteAdmin(targetUser);
    showToast(`ถอดถอน ${targetUser.name} กลับเป็น User เรียบร้อย (โควตา Admin ว่างลง 1 ที่)`, 'success');
  };

  const handleDelete = (targetUser: User) => {
    const check = canDeleteUser(currentUser, targetUser);
    if (!check.allowed) {
      showToast(check.reason || 'ไม่มีสิทธิ์ลบบัญชีนี้', 'error');
      return;
    }
    if (confirm(`ยืนยันการลบบัญชี "${targetUser.name}" (${targetUser.email}) ออกจากระบบ?`)) {
      onDeleteUser(targetUser);
      showToast(`ลบบัญชี ${targetUser.name} ออกจากระบบเรียบร้อย`, 'success');
    }
  };

  const filteredUsers = users.filter((u) => {
    const tier = getUserTier(u);
    if (roleFilter !== 'all' && tier !== roleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <span className="material-symbols-outlined text-[28px]">verified_user</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  ระบบจัดการสิทธิ์ผู้ใช้งาน (Multi-Tier RBAC Management)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                  Role Hierarchy
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Super Admin (Owner) • Admin (จำกัดสูงสุด 8 คน) • Users (รองรับ 500 บัญชี)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* Feedback Toast */}
        <AnimatePresence>
          {feedbackToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mx-6 mt-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-md ${
                feedbackToast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {feedbackToast.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{feedbackToast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/60">
          {/* Quota & Hierarchy Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Super Admin / Owner */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">crown</span>
                    Super Admin / Owner
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[11px] font-bold">
                    Master Tier
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-950">
                  {quota.superAdminCount} บัญชี
                </div>
                <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                  สิทธิ์สูงสุดในระบบ สามารถแต่งตั้ง (Promote) หรือถอดถอน (Demote) สิทธิ์ Admin ได้ตลอดเวลา
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex items-center justify-between text-[11px] font-medium text-amber-900">
                <span>สถานะผู้ล็อกอินปัจจุบัน:</span>
                <span className="font-bold">
                  {isOwner ? '👑 คุณคือ Super Admin' : '👤 ไม่ใช่ Super Admin'}
                </span>
              </div>
            </div>

            {/* Card 2: Admin Quota (Max 8) */}
            <div className={`border rounded-xl p-4.5 shadow-xs flex flex-col justify-between ${
              quota.isAdminQuotaFull
                ? 'bg-rose-50 border-rose-300'
                : 'bg-indigo-50/80 border-indigo-200'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-indigo-600">shield</span>
                    Admin (ผู้ดูแลระบบ)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    quota.isAdminQuotaFull
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-indigo-600 text-white'
                  }`}>
                    จำกัดสูงสุด {RBAC_LIMITS.MAX_ADMINS} คน
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-950">
                    {quota.adminCount} / {RBAC_LIMITS.MAX_ADMINS}
                  </span>
                  <span className="text-xs text-indigo-700 font-semibold">
                    (ว่างอีก {quota.adminSlotsRemaining} ตำแหน่ง)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-500 ${
                      quota.isAdminQuotaFull ? 'bg-rose-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${(quota.adminCount / RBAC_LIMITS.MAX_ADMINS) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-indigo-800/80 mt-2 leading-relaxed">
                  จัดการเนื้อหา, ลบบัญชีผู้ใช้ทั่วไป, และจัดการ/ลบไฟล์ทั้งหมดในระบบได้
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-indigo-200/80 text-[11px] text-indigo-900 font-medium">
                {quota.isAdminQuotaFull ? (
                  <span className="text-rose-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    โควตา Admin เต็ม 8 บัญชีแล้ว (ต้อง Demote คนเดิมก่อนแต่งตั้งใหม่)
                  </span>
                ) : (
                  <span>สามารถแต่งตั้งเพิ่มได้อีก {quota.adminSlotsRemaining} ท่าน</span>
                )}
              </div>
            </div>

            {/* Card 3: User Quota (Max 500) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-slate-600">group</span>
                    Logged-in Users
                  </span>
                  <span className="px-2 py-0.5 bg-slate-700 text-white rounded text-[11px] font-bold">
                    รองรับ {RBAC_LIMITS.MAX_USERS} บัญชี
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {quota.totalUsers} / {RBAC_LIMITS.MAX_USERS}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    (ว่าง {quota.userSlotsRemaining} บัญชี)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(quota.totalUsers / RBAC_LIMITS.MAX_USERS) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  อัปโหลดไฟล์, ใช้งาน AI Chat, ส่งรายงานความเสี่ยง (ลบได้เฉพาะไฟล์ของตนเองเท่านั้น)
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>สิทธิ์จัดการไฟล์:</span>
                <span className="font-bold text-amber-700">ลบเฉพาะไฟล์ที่ตนเองเป็น Owner</span>
              </div>
            </div>
          </div>

          {/* Table Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อีเมล, แผนก..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Role filter pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    roleFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({users.length})
                </button>
                <button
                  onClick={() => setRoleFilter('super_admin')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    roleFilter === 'super_admin' ? 'bg-amber-500 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Super Admin ({quota.superAdminCount})
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    roleFilter === 'admin' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin ({quota.adminCount}/8)
                </button>
                <button
                  onClick={() => setRoleFilter('user')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    roleFilter === 'user' ? 'bg-slate-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Users ({quota.regularUserCount})
                </button>
              </div>
            </div>

            {/* Add User Action */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={onOpenAddUser}
                disabled={quota.isUserQuotaFull}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                  quota.isUserQuotaFull
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                เพิ่มบัญชีผู้ใช้งาน ({quota.totalUsers}/500)
              </button>
            </div>
          </div>

          {/* User Accounts Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                    <th className="py-3 px-4">ผู้ใช้งาน (User & Profile)</th>
                    <th className="py-3 px-4">ตำแหน่ง & แผนก</th>
                    <th className="py-3 px-4">ระดับสิทธิ์ (Role Tier)</th>
                    <th className="py-3 px-4">การแต่งตั้ง / สิทธิ์ไฟล์</th>
                    <th className="py-3 px-4 text-right">การจัดการสิทธิ์ (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((user) => {
                    const tier = getUserTier(user);
                    const badge = getRoleBadgeInfo(user.roleType, tier);
                    const isSelf = currentUser?.id === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelf ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        {/* User Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0"
                              style={{ backgroundColor: user.avatarBg || '#4f46e5' }}
                            >
                              {user.avatarText || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {user.name}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                    คุณ
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px]">{user.email}</div>
                              <div className="text-slate-400 text-[10px]">ID: {user.employeeId}</div>
                            </div>
                          </div>
                        </td>

                        {/* Dept & Role Title */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{user.position || user.role}</div>
                          <div className="text-slate-500 text-[11px]">{user.department}</div>
                          {user.licenseNumber && (
                            <div className="text-[10px] text-amber-700 font-mono font-semibold mt-0.5">
                              {user.licenseNumber}
                            </div>
                          )}
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            ● {translateUserStatus(user.status)}
                          </div>
                        </td>

                        {/* Role Tier Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.badgeClass}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {badge.icon}
                            </span>
                            {badge.shortLabel}
                          </span>
                        </td>

                        {/* Appointment & File privilege */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {tier === 'super_admin' ? (
                            <div>
                              <span className="font-bold text-amber-700">👑 System Owner</span>
                              <p className="text-[10px] text-slate-500">จัดการและลบได้ทุกไฟล์ในระบบ</p>
                            </div>
                          ) : tier === 'admin' ? (
                            <div>
                              <span className="font-bold text-indigo-700">🛡️ ได้รับแต่งตั้งโดย Super Admin</span>
                              <p className="text-[10px] text-slate-500">
                                {user.appointedBy ? `โดย: ${user.appointedBy}` : 'มีสิทธิ์ลบทุกไฟล์และลบ User ได้'}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-slate-700">👤 ผู้ใช้ทั่วไป</span>
                              <p className="text-[10px] text-amber-700 font-medium">
                                🔒 ลบได้เฉพาะไฟล์ที่ตนเองเป็น Owner
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Switch to this user (for testing RBAC instantly) */}
                            {onSwitchUser && !isSelf && (
                              <button
                                onClick={() => onSwitchUser(user)}
                                title="สลับมาล็อกอินเป็นผู้ใช้นี้เพื่อทดสอบสิทธิ์"
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                              >
                                สลับทดสอบ
                              </button>
                            )}

                            {/* Edit User (Super Admin/Admin or Self) */}
                            {onEditUser && (isOwner || currentTier === 'admin' || isSelf) && (
                              <button
                                onClick={() => onEditUser(user)}
                                title="แก้ไขข้อมูล (ชื่อ, รหัสผ่าน, แผนก, ตำแหน่ง, เลข ทนพ.)"
                                className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-sky-200/60"
                              >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                <span>แก้ไข</span>
                              </button>
                            )}

                            {/* Promote to Admin (Super Admin only) */}
                            {isOwner && tier === 'user' && (
                              <button
                                onClick={() => handlePromote(user)}
                                disabled={quota.isAdminQuotaFull}
                                title={
                                  quota.isAdminQuotaFull
                                    ? `โควตา Admin เต็ม ${RBAC_LIMITS.MAX_ADMINS} คนแล้ว`
                                    : 'แต่งตั้งเป็น Admin'
                                }
                                className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                                  quota.isAdminQuotaFull
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                                แต่งตั้ง Admin
                              </button>
                            )}

                            {/* Demote to User (Super Admin only) */}
                            {isOwner && tier === 'admin' && (
                              <button
                                onClick={() => handleDemote(user)}
                                title="ถอดถอนตำแหน่ง Admin กลับเป็น User ทั่วไป"
                                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                                ปลดเป็น User
                              </button>
                            )}

                            {/* Delete User Account (Super Admin or Admin) */}
                            {!isSelf && (
                              <button
                                onClick={() => handleDelete(user)}
                                disabled={!canDeleteUser(currentUser, user).allowed}
                                title={
                                  !canDeleteUser(currentUser, user).allowed
                                    ? canDeleteUser(currentUser, user).reason
                                    : 'ลบบัญชีผู้ใช้งาน'
                                }
                                className={`p-1.5 rounded transition-colors ${
                                  canDeleteUser(currentUser, user).allowed
                                    ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                                    : 'text-slate-300 cursor-not-allowed'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RBAC Policy Reference Footer */}
          <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <span className="material-symbols-outlined text-[18px]">security</span>
              <span>สรุปกฎและสิทธิ์การใช้งาน (Multi-Tier RBAC & File Deletion Rules):</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 text-[11px] pt-1">
              <li className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="font-bold text-amber-300 block mb-0.5">1. Super Admin / Owner:</span>
                สิทธิ์สูงสุด แต่งตั้ง/ถอดถอน Admin ได้ตลอดเวลา ควบคุมโควตา และลบไฟล์ได้ทั้งหมด
              </li>
              <li className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="font-bold text-indigo-300 block mb-0.5">2. Admin (จำกัด 8 คน):</span>
                ได้รับการแต่งตั้งจาก Super Admin จัดการระบบ ลบบัญชีผู้ใช้ทั่วไป และลบได้ทุกไฟล์
              </li>
              <li className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="font-bold text-emerald-300 block mb-0.5">3. Users (รองรับ 500 คน):</span>
                อัปโหลดไฟล์, แชท AI, ส่งรายงานความเสี่ยง | <strong>[สำคัญ] ลบได้เฉพาะไฟล์ที่ตนเองเป็น Owner</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium">
            กำลังแสดง {filteredUsers.length} จากทั้งหมด {users.length} บัญชี
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </motion.div>
    </div>
  );
};
