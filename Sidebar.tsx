import React from 'react';
import { DepartmentKey, User, CustomDepartment } from '../types';

interface SidebarProps {
  currentDept: DepartmentKey;
  onSelectDept: (dept: DepartmentKey) => void;
  onOpenReportRisk: () => void;
  onOpenIconManager: () => void;
  onOpenRecycleBin?: () => void;
  trashedCount?: number;
  currentUser: User | null;
  departments: CustomDepartment[];
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentDept,
  onSelectDept,
  onOpenReportRisk,
  onOpenIconManager,
  onOpenRecycleBin,
  trashedCount = 0,
  currentUser,
  departments,
  isOpenMobile,
  onCloseMobile,
}) => {
  const handleNavClick = (key: DepartmentKey) => {
    onSelectDept(key);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`bg-[#f6faff] border-r border-[#c1c7d2] flex flex-col fixed left-0 top-0 h-screen z-50 w-64 transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-[#c1c7d2]">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#e0e9f2] flex items-center justify-center shrink-0 border border-[#c1c7d2]/50 shadow-xs">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsUkGZd-X8QPUgtO_-zeu39L0OmkjBVz2sRfwAEdurlIEZ6U-lxS7-ylTQJJG_2nEXsrhNd6kEMBgM0zJybWQ2rXdE4O0hRR8qNNepMWso9UOnypZLA88I3Cpbpqd4P94ib4g0lBZ-5Ni259dzvW4FGx4MSKSRRHt-nkP_eWHkD62EC8J0iZDLPHoWOBUY5mybOZjRqWrtb9OepsGFEp9Vr5y9zG7W1L98-zuLX_xPC8K0FmFcGZM4"
              alt="Nakhon Pathom Hospital Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-[#003e6f] truncate leading-tight">
              รพ.นครปฐม (Lab Risk)
            </h1>
            <p className="text-[11px] text-[#414750] truncate font-medium">
              ศูนย์รายงานความเสี่ยงแล็บ
            </p>
          </div>
        </div>

        {/* CTA: Report Risk Button */}
        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={onOpenReportRisk}
            className="w-full bg-[#003e6f] hover:bg-[#004881] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>รายงานความเสี่ยง (Report)</span>
          </button>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex-1 overflow-y-auto py-1 px-3 space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-bold text-[#727781] uppercase tracking-wider">
              ห้องปฏิบัติการ &amp; แผนก ({departments.length})
            </span>
            <button
              type="button"
              onClick={onOpenIconManager}
              className="text-[10px] font-bold text-[#003e6f] hover:underline flex items-center gap-0.5 cursor-pointer"
              title="แก้ไข เพิ่ม ลด ไอคอนและห้องปฏิบัติการ"
            >
              <span className="material-symbols-outlined text-[13px]">tune</span>
              <span>แก้ไขไอคอน</span>
            </button>
          </div>

          {departments.map((dept) => {
            const isActive = currentDept === dept.key;
            return (
              <button
                key={dept.key}
                type="button"
                onClick={() => handleNavClick(dept.key as DepartmentKey)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 text-xs font-medium cursor-pointer ${
                  isActive
                    ? 'bg-[#003e6f] text-white shadow-xs font-semibold'
                    : 'text-[#414750] hover:bg-[#e0e9f2] hover:text-[#003e6f]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isActive ? 'text-white' : 'text-[#727781]'
                  }`}
                  style={!isActive && dept.badgeColor ? { color: dept.badgeColor } : undefined}
                >
                  {dept.icon}
                </span>
                <div className="truncate flex-1">
                  <div className="leading-tight truncate">{dept.name}</div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-white/80' : 'text-[#727781]'
                    }`}
                  >
                    {dept.nameTh}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-[#c1c7d2] space-y-1 bg-white/60">
          <button
            type="button"
            onClick={() => handleNavClick('risk_reports')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 text-xs font-medium cursor-pointer ${
              currentDept === 'risk_reports'
                ? 'bg-[#003e6f] text-white shadow-xs font-semibold'
                : 'text-[#414750] hover:bg-[#e0e9f2] hover:text-[#003e6f]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-amber-600">assignment_late</span>
              <span className="font-semibold">จัดการรายงานความเสี่ยง</span>
            </div>
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
              Hub
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('google_sync')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 text-xs font-medium cursor-pointer ${
              currentDept === 'google_sync'
                ? 'bg-[#003e6f] text-white shadow-xs font-semibold'
                : 'text-[#414750] hover:bg-[#e0e9f2] hover:text-[#003e6f]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#006e25]">dataset</span>
              <span>Multi-Source &amp; Sheets</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#006e25] animate-pulse"></span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('data_upload')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 text-xs font-medium cursor-pointer ${
              currentDept === 'data_upload'
                ? 'bg-[#003e6f] text-white shadow-xs font-semibold'
                : 'text-[#414750] hover:bg-[#e0e9f2] hover:text-[#003e6f]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Data Upload (Excel/CSV)</span>
          </button>

          {onOpenRecycleBin && (
            <button
              type="button"
              onClick={onOpenRecycleBin}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 text-xs font-medium cursor-pointer text-rose-700 bg-rose-50/70 hover:bg-rose-100 hover:text-rose-900 border border-rose-200/60"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-rose-600">delete</span>
                <span className="font-semibold">ถังขยะ (7 วัน)</span>
              </div>
              {trashedCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                  {trashedCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenIconManager}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 text-xs font-medium cursor-pointer text-[#414750] hover:bg-[#e0e9f2] hover:text-[#003e6f]"
          >
            <span className="material-symbols-outlined text-[18px] text-[#525e7d]">palette</span>
            <span>จัดการไอคอน &amp; แผนก</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 text-xs font-medium cursor-pointer ${
              currentDept === 'settings'
                ? 'bg-[#003e6f] text-white shadow-xs font-semibold'
                : 'text-[#414750] hover:bg-[#e0e9f2] hover:text-[#003e6f]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings &amp; Docs</span>
          </button>
        </div>
      </aside>
    </>
  );
};
