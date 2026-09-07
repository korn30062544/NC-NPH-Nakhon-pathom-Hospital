import { User, UserRole, UserTier, UploadedFileRecord, RBAC_LIMITS } from '../types';

/**
 * Determine User Tier according to Multi-tier RBAC specifications:
 * 1. Super Admin / Owner: Master privilege, can promote/demote admins, enforce quotas.
 * 2. Admin: Max 8 accounts, appointed by Super Admin, can manage system, delete regular users, delete all files.
 * 3. Logged-in User: Max 500 accounts, can upload files, use AI chat, submit risk reports, delete ONLY own files.
 */
export function getUserTier(user?: User | null): UserTier {
  if (!user) return 'user';
  if (user.roleType === 'Super Admin' || user.role.toLowerCase().includes('super') || user.role.toLowerCase().includes('owner') || user.tier === 'super_admin') {
    return 'super_admin';
  }
  if (user.roleType === 'Administrator' || user.tier === 'admin') {
    return 'admin';
  }
  return 'user';
}

export function isSuperAdmin(user?: User | null): boolean {
  return getUserTier(user) === 'super_admin';
}

export function isAdmin(user?: User | null): boolean {
  const tier = getUserTier(user);
  return tier === 'super_admin' || tier === 'admin';
}

export interface QuotaStats {
  totalUsers: number;
  maxUsers: number;
  userSlotsRemaining: number;
  isUserQuotaFull: boolean;
  adminCount: number;
  maxAdmins: number;
  adminSlotsRemaining: number;
  isAdminQuotaFull: boolean;
  superAdminCount: number;
  regularUserCount: number;
}

export function calculateQuotaStats(users: User[]): QuotaStats {
  const superAdminCount = users.filter((u) => getUserTier(u) === 'super_admin').length;
  const adminCount = users.filter((u) => getUserTier(u) === 'admin').length;
  const regularUserCount = users.filter((u) => getUserTier(u) === 'user').length;
  const totalUsers = users.length;

  return {
    totalUsers,
    maxUsers: RBAC_LIMITS.MAX_USERS,
    userSlotsRemaining: Math.max(0, RBAC_LIMITS.MAX_USERS - totalUsers),
    isUserQuotaFull: totalUsers >= RBAC_LIMITS.MAX_USERS,
    adminCount,
    maxAdmins: RBAC_LIMITS.MAX_ADMINS,
    adminSlotsRemaining: Math.max(0, RBAC_LIMITS.MAX_ADMINS - adminCount),
    isAdminQuotaFull: adminCount >= RBAC_LIMITS.MAX_ADMINS,
    superAdminCount,
    regularUserCount,
  };
}

/**
 * Authorization: Check if current user can promote another user to Admin
 * Condition:
 * 1. Only Super Admin / Owner can promote.
 * 2. Active Admin count must not exceed 8 accounts (Limit 8 Admin accounts).
 * 3. Target user must not already be Super Admin or Admin.
 */
export function canPromoteToAdmin(
  currentUser: User | null,
  targetUser: User,
  currentUsers: User[]
): { allowed: boolean; reason?: string } {
  if (!currentUser) {
    return { allowed: false, reason: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }
  if (!isSuperAdmin(currentUser)) {
    return { allowed: false, reason: 'เฉพาะ Super Admin / Owner เท่านั้นที่มีสิทธิ์แต่งตั้ง Admin' };
  }
  if (getUserTier(targetUser) === 'super_admin') {
    return { allowed: false, reason: 'ผู้ใช้งานท่านนี้เป็น Super Admin อยู่แล้ว' };
  }
  if (getUserTier(targetUser) === 'admin') {
    return { allowed: false, reason: 'ผู้ใช้งานท่านนี้มีสถานะเป็น Admin อยู่แล้ว' };
  }

  const quota = calculateQuotaStats(currentUsers);
  if (quota.adminCount >= RBAC_LIMITS.MAX_ADMINS) {
    return {
      allowed: false,
      reason: `ไม่สามารถแต่งตั้งได้ เนื่องจากจำนวน Admin ครบขีดจำกัดสูงสุด ${RBAC_LIMITS.MAX_ADMINS} บัญชีแล้ว (Limit 8 Admin accounts)`,
    };
  }

  return { allowed: true };
}

/**
 * Authorization: Check if current user can demote an Admin back to User
 * Condition: Only Super Admin / Owner can demote.
 */
export function canDemoteAdmin(
  currentUser: User | null,
  targetUser: User
): { allowed: boolean; reason?: string } {
  if (!currentUser) {
    return { allowed: false, reason: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }
  if (!isSuperAdmin(currentUser)) {
    return { allowed: false, reason: 'เฉพาะ Super Admin / Owner เท่านั้นที่มีสิทธิ์ถอดถอนตำแหน่ง Admin' };
  }
  if (getUserTier(targetUser) === 'super_admin') {
    return { allowed: false, reason: 'ไม่สามารถถอดถอนผู้สร้างระบบ (Super Admin / Owner) ได้' };
  }
  if (getUserTier(targetUser) !== 'admin') {
    return { allowed: false, reason: 'ผู้ใช้งานท่านนี้ไม่ได้เป็น Admin' };
  }

  return { allowed: true };
}

/**
 * Authorization: Check if current user can delete a user account
 * Condition:
 * 1. Super Admin can delete anyone except themselves.
 * 2. Admin can delete ONLY regular users (cannot delete other Admins or Super Admin).
 * 3. Regular users cannot delete any account.
 */
export function canDeleteUser(
  currentUser: User | null,
  targetUser: User
): { allowed: boolean; reason?: string } {
  if (!currentUser) {
    return { allowed: false, reason: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }
  if (currentUser.id === targetUser.id) {
    return { allowed: false, reason: 'ไม่สามารถลบบัญชีของตนเองที่กำลังล็อกอินอยู่ได้' };
  }

  const currentTier = getUserTier(currentUser);
  const targetTier = getUserTier(targetUser);

  if (currentTier === 'super_admin') {
    return { allowed: true };
  }

  if (currentTier === 'admin') {
    if (targetTier === 'super_admin') {
      return { allowed: false, reason: 'Admin ไม่มีสิทธิ์ลบบัญชี Super Admin / Owner' };
    }
    if (targetTier === 'admin') {
      return { allowed: false, reason: 'Admin ไม่มีสิทธิ์ลบบัญชี Admin ท่านอื่น (เฉพาะ Super Admin เท่านั้น)' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'ผู้ใช้ทั่วไปไม่มีสิทธิ์ลบบัญชีผู้ใช้งานในระบบ' };
}

/**
 * Authorization: Check if current user can register/add a new user
 * Condition: Total users must not exceed 500 accounts (Limit 500 User accounts).
 */
export function canRegisterNewUser(
  currentUsers: User[]
): { allowed: boolean; reason?: string } {
  const quota = calculateQuotaStats(currentUsers);
  if (quota.totalUsers >= RBAC_LIMITS.MAX_USERS) {
    return {
      allowed: false,
      reason: `ไม่สามารถเพิ่มผู้ใช้งานได้ เนื่องจากถึงขีดจำกัดสูงสุด ${RBAC_LIMITS.MAX_USERS} บัญชีแล้ว (Limit 500 User accounts)`,
    };
  }
  return { allowed: true };
}

/**
 * [CRITICAL PERMISSION RULE]
 * File Deletion Privilege:
 * - Super Admin / Owner: Can delete ALL files in the system.
 * - Admin: Can delete ALL files in the system.
 * - Logged-in User: Can delete ONLY files where file.ownerId === currentUser.id (owner matching).
 *   Cannot delete other users' files.
 */
export function canDeleteFile(
  currentUser: User | null,
  file: UploadedFileRecord
): { allowed: boolean; reason?: string } {
  if (!currentUser) {
    return { allowed: false, reason: 'กรุณาเข้าสู่ระบบเพื่อจัดการไฟล์' };
  }

  const tier = getUserTier(currentUser);

  // Super Admin & Admin can delete any file
  if (tier === 'super_admin' || tier === 'admin') {
    return { allowed: true };
  }

  // Regular logged-in user can delete ONLY their own files
  if (file.ownerId === currentUser.id || file.ownerEmail === currentUser.email) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `สิทธิ์เฉพาะเจ้าของไฟล์: ไฟล์นี้ถูกอัปโหลดโดย ${file.ownerName || 'ผู้ใช้อื่น'} คุณสามารถลบได้เฉพาะไฟล์ที่ตนเองเป็นคนอัปโหลดเท่านั้น`,
  };
}

/**
 * Helper to get readable Role Badge metadata
 */
export function getRoleBadgeInfo(roleType: UserRole, tier?: UserTier) {
  if (roleType === 'Super Admin' || tier === 'super_admin') {
    return {
      label: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
      shortLabel: 'ผู้ดูแลระบบสูงสุด',
      icon: 'crown',
      badgeClass: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs',
      textClass: 'text-amber-700 font-bold',
      bgClass: 'bg-amber-50 border-amber-200 text-amber-800',
    };
  }
  if (roleType === 'Administrator' || tier === 'admin') {
    return {
      label: 'ผู้ดูแลระบบ (Admin)',
      shortLabel: 'ผู้ดูแลระบบ',
      icon: 'shield',
      badgeClass: 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs',
      textClass: 'text-indigo-700 font-bold',
      bgClass: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    };
  }
  return {
    label: roleType || 'ผู้ใช้งานทั่วไป',
    shortLabel: 'ผู้ใช้งานทั่วไป',
    icon: 'person',
    badgeClass: 'bg-slate-700 text-white',
    textClass: 'text-slate-700 font-semibold',
    bgClass: 'bg-slate-100 border-slate-200 text-slate-700',
  };
}
