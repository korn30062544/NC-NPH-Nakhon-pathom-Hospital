import React, { useState } from 'react';
import { CustomDepartment } from '../types';

interface DepartmentIconManagerProps {
  isOpen: boolean;
  onClose: () => void;
  departments: CustomDepartment[];
  onSaveDepartments: (departments: CustomDepartment[]) => void;
  onResetDefaults: () => void;
}

// Available icon choices suited for clinical labs, hospitals, quality control, blood bank, inventory, etc.
export const AVAILABLE_ICONS = [
  { id: 'biotech', name: 'Biotech Lab', category: 'Laboratory' },
  { id: 'science', name: 'Science & Flask', category: 'Laboratory' },
  { id: 'bloodtype', name: 'Blood Bank', category: 'Medical' },
  { id: 'dna', name: 'Molecular DNA', category: 'Laboratory' },
  { id: 'coronavirus', name: 'Microbiology', category: 'Laboratory' },
  { id: 'vaccines', name: 'Vaccines / Phlebotomy', category: 'Medical' },
  { id: 'inventory_2', name: 'Material Store', category: 'Inventory' },
  { id: 'dashboard', name: 'Overview Dashboard', category: 'Analytics' },
  { id: 'monitor_heart', name: 'Critical Care / Heart', category: 'Medical' },
  { id: 'health_and_safety', name: 'Safety / Quality', category: 'Quality' },
  { id: 'medical_services', name: 'Medical Services', category: 'Medical' },
  { id: 'local_hospital', name: 'Hospital', category: 'Medical' },
  { id: 'thermostat', name: 'Cold Chain / Temp', category: 'Laboratory' },
  { id: 'sanitizer', name: 'Hygiene & Clean', category: 'Safety' },
  { id: 'emergency', name: 'Stat / Emergency', category: 'Medical' },
  { id: 'verified', name: 'ISO / QC Passed', category: 'Quality' },
  { id: 'analytics', name: 'Analytics & Trends', category: 'Analytics' },
  { id: 'bar_chart', name: 'Bar Chart', category: 'Analytics' },
  { id: 'assignment_turned_in', name: 'Compliance Checklist', category: 'Quality' },
  { id: 'warning', name: 'Risk Alert', category: 'Safety' },
  { id: 'shield', name: 'Biosafety Shield', category: 'Safety' },
  { id: 'package_2', name: 'Reagent Package', category: 'Inventory' },
  { id: 'folder', name: 'Document Archive', category: 'General' },
  { id: 'description', name: 'SOP / Forms', category: 'General' },
  { id: 'database', name: 'Database Storage', category: 'General' },
  { id: 'hub', name: 'Inter-Department Network', category: 'General' },
  { id: 'group_work', name: 'Team Collaboration', category: 'General' },
  { id: 'sync', name: 'Real-time Sync', category: 'General' },
  { id: 'qr_code_scanner', name: 'Barcode / LIS Scanner', category: 'Laboratory' },
  { id: 'tune', name: 'Equipment Calibrator', category: 'Laboratory' },
];

const PRESET_COLORS = [
  '#003e6f', // Navy
  '#1b60a2', // Blue
  '#ba1a1a', // Crimson
  '#006e25', // Green
  '#7b5800', // Amber
  '#525e7d', // Slate Blue
  '#8f4e00', // Brown Orange
  '#4a6267', // Teal Grey
  '#684fa3', // Purple
  '#9c4146', // Rose
  '#136b6c', // Cyan
  '#5b5e66', // Charcoal
];

export const DepartmentIconManager: React.FC<DepartmentIconManagerProps> = ({
  isOpen,
  onClose,
  departments,
  onSaveDepartments,
  onResetDefaults,
}) => {
  const [deptList, setDeptList] = useState<CustomDepartment[]>(departments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Department Form State
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newNameTh, setNewNameTh] = useState('');
  const [newIcon, setNewIcon] = useState('biotech');
  const [newBadgeColor, setNewBadgeColor] = useState('#1b60a2');

  if (!isOpen) return null;

  const handleUpdateDepartment = (key: string, updates: Partial<CustomDepartment>) => {
    setDeptList((prev) =>
      prev.map((d) => (d.key === key ? { ...d, ...updates } : d))
    );
  };

  const handleRemoveDepartment = (key: string) => {
    if (confirm('คุณต้องการลบห้องปฏิบัติการ/ไอคอนนี้ใช่หรือไม่?')) {
      setDeptList((prev) => prev.filter((d) => d.key !== key));
      if (editingId === key) setEditingId(null);
    }
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newNameTh.trim()) {
      alert('กรุณาระบุรหัสและชื่อภาษาไทยของแผนก');
      return;
    }

    // Clean key
    const sanitizedKey = newKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (deptList.some((d) => d.key === sanitizedKey)) {
      alert('รหัสแผนกนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น');
      return;
    }

    const newDept: CustomDepartment = {
      key: sanitizedKey,
      name: newName.trim() || newNameTh.trim(),
      nameTh: newNameTh.trim(),
      icon: newIcon,
      badgeColor: newBadgeColor,
      order: deptList.length + 1,
      isDefault: false,
    };

    setDeptList((prev) => [...prev, newDept]);
    setNewKey('');
    setNewName('');
    setNewNameTh('');
    setShowAddForm(false);
  };

  const handleSaveAndClose = () => {
    onSaveDepartments(deptList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#c1c7d2] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#003e6f] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                จัดการและปรับแต่งห้องปฏิบัติการ / แผนก & ไอคอน
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                เพิ่ม แก้ไข ลบ หรือเปลี่ยนไอคอนประจำห้องปฏิบัติการได้ตามต้องการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Top Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#f6faff] p-3.5 rounded-xl border border-[#c1c7d2]">
            <div className="text-xs text-[#414750]">
              <span className="font-bold text-[#141d23]">รายการห้องแล็บปัจจุบัน: </span>
              {deptList.length} แผนก (สามารถคลิกเปลี่ยนไอคอน สี หรือชื่อได้ทันที)
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-[#003e6f] text-white text-xs font-bold rounded-lg hover:bg-[#002d52] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showAddForm ? 'close' : 'add'}
                </span>
                {showAddForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มห้องแล็บ / แผนกใหม่'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('คุณต้องการรีเซ็ตรายการแผนกกลับเป็นค่าเริ่มต้นโรงพยาบาลหรือไม่?')) {
                    onResetDefaults();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-white text-[#ba1a1a] border border-[#ba1a1a]/30 text-xs font-semibold rounded-lg hover:bg-[#fff0f0] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                คืนค่าเริ่มต้น
              </button>
            </div>
          </div>

          {/* Add New Department Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateDepartment}
              className="bg-[#ecf5fe] p-4 rounded-xl border-2 border-[#003e6f]/20 space-y-4 animate-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#003e6f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  เพิ่มห้องปฏิบัติการ / แผนกใหม่
                </h3>
                <span className="text-[11px] text-[#727781]">* จำเป็นต้องกรอก</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#141d23] mb-1">
                    ชื่อภาษาไทย (เช่น ห้องแล็บพันธุศาสตร์) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newNameTh}
                    onChange={(e) => setNewNameTh(e.target.value)}
                    placeholder="ห้องปฏิบัติการเคมีคลินิก..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141d23] mb-1">
                    ชื่อภาษาอังกฤษ (English Name)
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Clinical Chemistry Lab"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141d23] mb-1">
                    รหัสอ้างอิงระบบ (Key: ภาษาอังกฤษตัวเล็ก/ขีดล่าง) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="e.g. chemistry_lab"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#c1c7d2] bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#003e6f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141d23] mb-1">
                    โทนสีธีมประจำแผนก
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewBadgeColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                          newBadgeColor === color
                            ? 'ring-2 ring-offset-2 ring-[#003e6f] scale-110'
                            : 'border-white/50 opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Choose Icon from Grid */}
              <div>
                <label className="block text-xs font-semibold text-[#141d23] mb-1.5">
                  เลือกไอคอนประจำแผนก ({AVAILABLE_ICONS.length} ไอคอนให้เลือก):
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-36 overflow-y-auto p-2 bg-white rounded-lg border border-[#c1c7d2]">
                  {AVAILABLE_ICONS.map((ico) => {
                    const isSelected = newIcon === ico.id;
                    return (
                      <button
                        key={ico.id}
                        type="button"
                        onClick={() => setNewIcon(ico.id)}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#003e6f] text-white shadow-xs scale-105'
                            : 'hover:bg-[#f6faff] text-[#414750]'
                        }`}
                        title={`${ico.name} (${ico.category})`}
                      >
                        <span className="material-symbols-outlined text-[22px]">{ico.id}</span>
                        <span className="text-[9px] mt-0.5 truncate max-w-full text-center">
                          {ico.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-white border border-[#c1c7d2] text-xs font-semibold text-[#414750] rounded-lg hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#006e25] text-white text-xs font-bold rounded-lg hover:bg-[#00531c] flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  บันทึกแผนกใหม่
                </button>
              </div>
            </form>
          )}

          {/* List of Departments */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#414750] uppercase tracking-wider">
              รายการห้องปฏิบัติการและไอคอนนำทาง
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deptList.map((dept) => {
                const isEditing = editingId === dept.key;

                return (
                  <div
                    key={dept.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isEditing
                        ? 'border-[#003e6f] bg-[#f6faff] ring-2 ring-[#003e6f]/20 shadow-sm'
                        : 'border-[#c1c7d2] bg-white hover:border-[#003e6f]/40'
                    }`}
                  >
                    {isEditing ? (
                      /* Editing Mode */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#003e6f]">
                            แก้ไขข้อมูล: {dept.key}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs text-[#727781] hover:text-[#141d23]"
                          >
                            เสร็จสิ้น
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#414750] mb-0.5">
                            ชื่อภาษาไทย
                          </label>
                          <input
                            type="text"
                            value={dept.nameTh}
                            onChange={(e) =>
                              handleUpdateDepartment(dept.key, { nameTh: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-1 focus:ring-[#003e6f]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#414750] mb-0.5">
                            ชื่อภาษาอังกฤษ
                          </label>
                          <input
                            type="text"
                            value={dept.name}
                            onChange={(e) =>
                              handleUpdateDepartment(dept.key, { name: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#c1c7d2] bg-white focus:outline-none focus:ring-1 focus:ring-[#003e6f]"
                          />
                        </div>

                        {/* Icon Picker */}
                        <div>
                          <label className="block text-[11px] font-semibold text-[#414750] mb-1">
                            เลือกไอคอน
                          </label>
                          <div className="grid grid-cols-6 gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white rounded-lg border border-[#c1c7d2]">
                            {AVAILABLE_ICONS.map((ico) => (
                              <button
                                key={ico.id}
                                type="button"
                                onClick={() =>
                                  handleUpdateDepartment(dept.key, { icon: ico.id })
                                }
                                className={`p-1.5 rounded flex items-center justify-center cursor-pointer ${
                                  dept.icon === ico.id
                                    ? 'bg-[#003e6f] text-white'
                                    : 'hover:bg-[#f6faff] text-[#414750]'
                                }`}
                                title={ico.name}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {ico.id}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Color Picker */}
                        <div>
                          <label className="block text-[11px] font-semibold text-[#414750] mb-1">
                            สีประจำแผนก
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  handleUpdateDepartment(dept.key, { badgeColor: c })
                                }
                                style={{ backgroundColor: c }}
                                className={`w-5 h-5 rounded-full border cursor-pointer ${
                                  dept.badgeColor === c
                                    ? 'ring-2 ring-offset-1 ring-[#003e6f] scale-110'
                                    : 'border-white/50 opacity-80 hover:opacity-100'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            style={{
                              backgroundColor: `${dept.badgeColor || '#003e6f'}15`,
                              color: dept.badgeColor || '#003e6f',
                              borderColor: `${dept.badgeColor || '#003e6f'}30`,
                            }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                          >
                            <span className="material-symbols-outlined text-[22px]">
                              {dept.icon}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-[#141d23] truncate">
                              {dept.nameTh}
                            </h4>
                            <p className="text-[11px] text-[#727781] truncate font-mono">
                              {dept.name} · ({dept.key})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingId(dept.key)}
                            className="p-1.5 text-[#414750] hover:text-[#003e6f] hover:bg-[#ecf5fe] rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขชื่อและไอคอน"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDepartment(dept.key)}
                            className="p-1.5 text-[#ba1a1a] hover:bg-[#fff0f0] rounded-lg transition-colors cursor-pointer"
                            title="ลบแผนก"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#f6faff] border-t border-[#c1c7d2] flex items-center justify-between">
          <div className="text-xs text-[#727781] hidden sm:block">
            * การเปลี่ยนแปลงไอคอนและเมนูจะอัปเดตบนแถบด้านข้าง (Sidebar) ทันที
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#c1c7d2] text-xs font-semibold text-[#414750] rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2 bg-[#003e6f] text-white text-xs font-bold rounded-xl hover:bg-[#002d52] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              บันทึกการเปลี่ยนแปลงทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
