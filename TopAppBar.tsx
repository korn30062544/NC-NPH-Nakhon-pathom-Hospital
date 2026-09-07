import React, { useState } from 'react';
import { TopNavTab, User } from '../types';
import {
  Shield,
  UserCheck,
  Calendar,
  Database,
  BookOpen,
  Search,
  Bell,
  Menu,
  ChevronDown,
  Users,
  Crown,
  Trash2,
} from 'lucide-react';
import { getUserTier, getRoleBadgeInfo } from '../utils/rbacEngine';

interface TopAppBarProps {
  activeTab: TopNavTab;
  onSelectTab: (tab: TopNavTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: User | null;
  users?: User[];
  onLogout: () => void;
  onSwitchUser: () => void;
  onSelectSpecificUser?: (user: User) => void;
  onToggleRole: () => void;
  onOpenHelp: () => void;
  onOpenNotifications: () => void;
  onOpenMultiSourceHub: () => void;
  onOpenSetupGuide: () => void;
  onOpenRBACModal?: () => void;
  onOpenRecycleBin?: () => void;
  onOpenEditProfile?: () => void;
  trashedCount?: number;
  selectedYear: number;
  onSelectYear: (year: number) => void;
  unreadCount?: number;
  onToggleMobileMenu?: () => void;
  activeSourcesCount: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  currentUser,
  users = [],
  onLogout,
  onSwitchUser,
  onSelectSpecificUser,
  onToggleRole,
  onOpenHelp,
  onOpenNotifications,
  onOpenMultiSourceHub,
  onOpenSetupGuide,
  onOpenRBACModal,
  onOpenRecycleBin,
  onOpenEditProfile,
  trashedCount = 0,
  selectedYear,
  onSelectYear,
  unreadCount = 2,
  onToggleMobileMenu,
  activeSourcesCount,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  const tabs: { key: TopNavTab; label: string }[] = [
    { key: 'overview', label: 'ภาพรวม (Overview)' },
    { key: 'risk_reports', label: 'จัดการความเสี่ยง (Risk Reports)' },
    { key: 'nc_trends', label: 'แนวโน้มความเสี่ยง (NC Trends)' },
    { key: 'rejected_specimens', label: 'สิ่งส่งตรวจปฏิเสธ (Rejections)' },
    { key: 'error_rates', label: 'ดัชนีคุณภาพ (Quality Index)' },
  ];

  const years = [2569, 2568, 2567, 2566, 2565]; // Last 5 years

  const tier = getUserTier(currentUser);
  const badgeInfo = getRoleBadgeInfo(currentUser?.roleType || 'User', tier);

  const adminCount = users.filter((u) => u.tier === 'admin' || u.roleType === 'Administrator').length;
  const totalCount = users.length;

  return (
    <header className="bg-white/95 backdrop-blur-xs border-b border-slate-200 flex justify-between items-center w-full px-4 sm:px-6 h-16 sticky top-0 z-30 shadow-xs">
      {/* Left Section: Mobile Menu + Title + Subnav */}
      <div className="flex items-center gap-3 sm:gap-6 h-full">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            NP
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">
              Hospital Risk &amp; Quality Intelligence
            </h2>
            <div className="text-[10px] text-slate-500 hidden sm:block">
              รพ.นครปฐม • Multi-Tier RBAC &amp; Real-Time Engine
            </div>
          </div>
        </div>

        {/* 5-Year Selector */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-indigo-600 ml-1.5" />
          <span className="text-[11px] font-semibold text-slate-600">ปีสถิติ:</span>
          {years.map((yr) => (
            <button
              key={yr}
              onClick={() => onSelectYear(yr)}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedYear === yr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* Top Navigation Tabs */}
        <nav className="hidden lg:flex items-center h-full gap-5 ml-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className={`h-full flex items-center pt-1 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 border-indigo-600 font-bold'
                    : 'text-slate-600 border-transparent hover:text-indigo-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Section: RBAC Management + Multi-Source Hub + Search + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Multi-Tier RBAC Quota Pill & Management Button */}
        {onOpenRBACModal && (
          <button
            onClick={onOpenRBACModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-indigo-600/10 hover:from-amber-500/20 hover:to-indigo-600/20 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 transition-all cursor-pointer shadow-xs"
            title="จัดการสิทธิ์ผู้ใช้งาน (Super Admin / Admin 8 คน / User 500 บัญชี)"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-700" />
            <span className="hidden md:inline">RBAC:</span>
            <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded text-[10px] font-bold">
              Admin {adminCount}/8
            </span>
            <span className="hidden xl:inline text-[10px] text-slate-500 font-normal">
              ({totalCount}/500 Users)
            </span>
          </button>
        )}

        {/* Multi-Source Fusion Hub Button */}
        <button
          onClick={onOpenMultiSourceHub}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          title="จัดการแหล่งข้อมูล Google Sheets & ไฟล์ทั้งหมด"
        >
          <Database className="w-4 h-4 text-indigo-600" />
          <span>จัดการแหล่งข้อมูล</span>
          <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
            {activeSourcesCount}
          </span>
        </button>

        {/* Recycle Bin Button */}
        {onOpenRecycleBin && (
          <button
            onClick={onOpenRecycleBin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="ถังขยะ (Recycle Bin - กักเก็บ 7 วัน พร้อมระบบ Auto-Purge)"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span className="hidden md:inline">ถังขยะ</span>
            {trashedCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                {trashedCount}
              </span>
            )}
          </button>
        )}

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowUserSwitcher(!showUserSwitcher)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              tier === 'super_admin'
                ? 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
                : tier === 'admin'
                ? 'bg-indigo-100 text-indigo-950 border-indigo-300 hover:bg-indigo-200'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
            title="คลิกเพื่อเลือกสลับผู้ใช้งาน/ระดับสิทธิ์ทันที"
          >
            {tier === 'super_admin' ? (
              <Crown className="w-3.5 h-3.5 text-amber-600" />
            ) : tier === 'admin' ? (
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">{badgeInfo.shortLabel}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Quick User Switcher Dropdown */}
          {showUserSwitcher && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowUserSwitcher(false)}
            >
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  สลับผู้ใช้งาน (Test RBAC Hierarchy)
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                  {users.length} คน
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 py-1">
                {users.map((u) => {
                  const uTier = getUserTier(u);
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        if (onSelectSpecificUser) {
                          onSelectSpecificUser(u);
                        } else {
                          onToggleRole();
                        }
                        setShowUserSwitcher(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                        isCurrent ? 'bg-indigo-50/80 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                          style={{ backgroundColor: u.avatarBg || '#4f46e5' }}
                        >
                          {u.avatarText || 'U'}
                        </div>
                        <div className="truncate">
                          <div className="text-xs text-slate-800 truncate font-semibold">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{u.department}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ml-2 ${
                          uTier === 'super_admin'
                            ? 'bg-amber-100 text-amber-800'
                            : uTier === 'admin'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {uTier === 'super_admin' ? '👑 Owner' : uTier === 'admin' ? '🛡️ Admin' : '👤 User'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Technical Guide Button */}
        <button
          type="button"
          onClick={onOpenSetupGuide}
          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="คู่มือสถาปัตยกรรม & คำสั่งติดตั้ง (Setup Guide)"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Search Box */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาอุบัติการณ์, แผนก, HN..."
            className="pl-8 pr-3 py-1.5 h-8.5 w-40 lg:w-52 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
          />
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          title="การแจ้งเตือน (Notifications)"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-indigo-50 flex items-center justify-center">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-bold text-xs text-indigo-700">
                  {currentUser?.avatarText || 'NP'}
                </span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-bold text-xs text-slate-900">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badgeInfo.badgeClass}`}>
                  <Shield className="w-3 h-3" />
                  {badgeInfo.label}
                </div>
              </div>

              <div className="py-1 text-xs">
                {onOpenEditProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenEditProfile();
                    }}
                    className="w-full px-4 py-2 text-left text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    แก้ไขข้อมูลส่วนตัว (Edit Profile)
                  </button>
                )}
                {onOpenRBACModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenRBACModal();
                    }}
                    className="w-full px-4 py-2 text-left text-indigo-900 hover:bg-indigo-50 flex items-center gap-2 font-semibold"
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    จัดการสิทธิ์ผู้ใช้งาน (RBAC Hierarchy)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onToggleRole();
                  }}
                  className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-indigo-600" />
                  สลับสิทธิ์ (Toggle Role)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenMultiSourceHub();
                  }}
                  className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Database className="w-4 h-4 text-indigo-600" />
                  จัดการแหล่งข้อมูล (Data Sources)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenSetupGuide();
                  }}
                  className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  คู่มือสถาปัตยกรรม &amp; Code Logic
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  ออกจากระบบ (Log out)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

