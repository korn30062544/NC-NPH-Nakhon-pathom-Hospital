import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DepartmentKey,
  RiskIncident,
  TopNavTab,
  UploadedFileRecord,
  User,
  GoogleSyncConfig,
  CustomDepartment,
  DataSourceItem,
  AIDirective,
  TrashedItemRecord,
  AISplitResult,
  GlobalSyncEvent,
} from './types';
import {
  INITIAL_GOOGLE_SYNC_CONFIG,
  DEFAULT_CUSTOM_DEPARTMENTS,
  INITIAL_DATA_SOURCES,
} from './mockData';
import { calculateFusedMetrics, purgeSourceAndRecalculate, buildDepartment5YearStats } from './utils/multiSourceDataEngine';
import { translateRiskLevel } from './utils/labels';
import { globalEventBus } from './utils/eventBus';
import { subscribeToAuthChanges, fetchUserProfile, logoutUser } from './services/authService';
import { loadAllSources, syncSources } from './services/dataSourcesService';
import { loadAllUsers, updateUserProfile, deleteUserProfile, addAdminRecord, removeAdminRecord } from './services/usersService';
import {
  INITIAL_TRASHED_ITEMS,
  createTrashedRecord,
  createTrashedIncidentRecord,
  calculateRetentionCountdown,
} from './utils/trashEngine';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { AdminOverview } from './components/AdminOverview';
import { BloodBankDashboard } from './components/BloodBankDashboard';
import { CentralLabDashboard } from './components/CentralLabDashboard';
import { MolecularBioDashboard } from './components/MolecularBioDashboard';
import { ClinicalMicrobiologyDashboard } from './components/ClinicalMicrobiologyDashboard';
import { OutpatientLabDashboard } from './components/OutpatientLabDashboard';
import { MolecularScienceDashboard } from './components/MolecularScienceDashboard';
import { MaterialStoreDashboard } from './components/MaterialStoreDashboard';
import { DepartmentGenericDashboard } from './components/DepartmentGenericDashboard';
import { ReportRiskModal } from './components/ReportRiskModal';
import { AddUserModal } from './components/AddUserModal';
import { EditUserModal } from './components/EditUserModal';
import { RiskReportManagerView } from './components/RiskReportManagerView';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { DataUploadModal } from './components/DataUploadModal';
import { ExportReportModal } from './components/ExportReportModal';
import { NotificationsModal } from './components/NotificationsModal';
import { HelpModal } from './components/HelpModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { DepartmentIconManager } from './components/DepartmentIconManager';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { MultiSourceManagerModal } from './components/MultiSourceManagerModal';
import { SetupInstructionsModal } from './components/SetupInstructionsModal';
import { FileManagerView } from './components/FileManagerView';
import { RecycleBinModal } from './components/RecycleBinModal';
import { BulkUploadModal } from './components/BulkUploadModal';
import { MoveRoomModal } from './components/MoveRoomModal';
import { AISplitNotificationModal } from './components/AISplitNotificationModal';
import { RBACManagementModal } from './components/RBACManagementModal';

export function App() {
  // Authentication & Role-Based Access Control
  // FIX: this used to default to a hardcoded mock Super Admin
  // (INITIAL_USERS[0]) with no real login required at all. Auth state now
  // comes from Firebase — currentUser starts null until Firebase confirms
  // (or denies) a real signed-in session.
  const [authScreen, setAuthScreen] = useState<'app' | 'login' | 'signup'>('app');
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Department navigation & 5-Year Historical Stats
  const [currentDept, setCurrentDept] = useState<DepartmentKey>('overview');
  const [selectedYear, setSelectedYear] = useState<number>(2569); // Current 2026
  const [departments, setDepartments] = useState<CustomDepartment[]>(DEFAULT_CUSTOM_DEPARTMENTS);
  const [activeTab, setActiveTab] = useState<TopNavTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Recycle Bin (7-Day Auto Purge & Exclusion from AI/Stats)
  const [trashedItems, setTrashedItems] = useState<TrashedItemRecord[]>(INITIAL_TRASHED_ITEMS);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  // Multi-Source Data Engine (Real-Time Fusion & Purge/Recalculate)
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const previousSourceIdsRef = useRef<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Global State Sync Toast notification
  const [globalSyncToast, setGlobalSyncToast] = useState<GlobalSyncEvent | null>(null);

  // Trashed Source IDs and Incident IDs to dynamically exclude from AI Context & Metric calculations
  const trashedIds = useMemo(() => {
    const ids: string[] = [];
    trashedItems.forEach((t) => {
      if (t.sourceId) ids.push(t.sourceId);
      if (t.incidentId) ids.push(t.incidentId);
      if (t.id) ids.push(t.id);
    });
    return ids;
  }, [trashedItems]);

  // Compute Fused Metrics dynamically across all active sources (EXCLUDING items in trash)
  const fusedMetrics = useMemo(() => {
    return calculateFusedMetrics(sources, selectedYear, trashedIds);
  }, [sources, selectedYear, trashedIds]);

  // Combined Incidents list from all active sources
  const allFusedIncidents = useMemo(() => {
    return fusedMetrics.allIncidents;
  }, [fusedMetrics]);

  // Legacy file & sync states for compatibility
  const [files, setFiles] = useState<UploadedFileRecord[]>([]);
  const [googleSyncConfig, setGoogleSyncConfig] = useState<GoogleSyncConfig>(INITIAL_GOOGLE_SYNC_CONFIG);

  // Modals
  const [showReportRisk, setShowReportRisk] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<RiskIncident | null>(null);
  const [showDataUpload, setShowDataUpload] = useState(false);
  const [showExportReport, setShowExportReport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showGoogleSyncModal, setShowGoogleSyncModal] = useState(false);
  const [showIconManager, setShowIconManager] = useState(false);
  const [showMultiSourceHub, setShowMultiSourceHub] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Advanced Operations Modals
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showMoveRoomModal, setShowMoveRoomModal] = useState(false);
  const [movingTargetIds, setMovingTargetIds] = useState<string[]>([]);
  const [movingTargetNames, setMovingTargetNames] = useState<string[]>([]);
  const [showAISplitModal, setShowAISplitModal] = useState(false);
  const [activeAISplitResult, setActiveAISplitResult] = useState<AISplitResult | null>(null);
  const [showRBACModal, setShowRBACModal] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [targetUserToEdit, setTargetUserToEdit] = useState<User | null>(null);

  // EventBus Subscription for Real-time Global Sync across all labs
  useEffect(() => {
    const unsubscribe = globalEventBus.subscribe((evt) => {
      setGlobalSyncToast(evt);
      setTimeout(() => setGlobalSyncToast(null), 4500);
    });
    return unsubscribe;
  }, []);

  // Firebase Auth session listener — restores a real signed-in session on
  // page refresh (the old code always reset to a hardcoded mock user).
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchUserProfile(firebaseUser.uid);
          setCurrentUser(profile);
          if (profile) setAuthScreen('app');
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load persisted data sources (and their embedded incidents) + user
  // directory from Firestore once a user is signed in.
  useEffect(() => {
    if (!currentUser) {
      setSourcesLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [loadedSources, loadedUsers] = await Promise.all([loadAllSources(), loadAllUsers()]);
        if (cancelled) return;
        previousSourceIdsRef.current = loadedSources.map((s) => s.id);
        setSources(loadedSources);
        setUsers(loadedUsers);
      } catch (err) {
        console.error('Failed to load data from Firestore:', err);
      } finally {
        if (!cancelled) setSourcesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  // Mirror every local change to `sources` back to Firestore so incidents
  // and uploaded data actually persist across refreshes/devices/users
  // instead of living only in this browser tab's memory.
  useEffect(() => {
    if (!currentUser || !sourcesLoaded) return;
    syncSources(sources, previousSourceIdsRef.current)
      .then((ids) => {
        previousSourceIdsRef.current = ids;
      })
      .catch((err) => console.error('Failed to sync data sources to Firestore:', err));
  }, [sources, currentUser, sourcesLoaded]);

  // 7-Day Auto Purge Timer (checks every 30s for expired trashed records)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrashedItems((prev) => {
        const remaining = prev.filter((t) => new Date(t.expiresAt).getTime() > now);
        const expiredCount = prev.length - remaining.length;
        if (expiredCount > 0) {
          globalEventBus.emit(
            'PERMANENT_DELETE',
            `ระบบทำความสะอาดถังขยะอัตโนมัติ (Auto-Purge 7 วัน): ลบ ${expiredCount} รายการที่หมดอายุแล้ว`,
            ['overview'],
            {
              totalIncidents: fusedMetrics.totalIncidents,
              totalSpecimens: fusedMetrics.totalSpecimens,
              rejectionRate: fusedMetrics.rejectionRate,
            }
          );
        }
        return remaining;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [fusedMetrics]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setAuthScreen('app');
  };

  const handleRegister = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setAuthScreen('app');
  };

  const handleLogout = () => {
    logoutUser().catch((err) => console.error('Logout error:', err));
    setAuthScreen('login');
  };

  const handleSwitchUser = () => {
    // FIX (security): this used to just flip a screen flag while leaving
    // the real session intact, and was paired in the UI with a picker that
    // could set currentUser to ANY user with zero authentication. Switching
    // accounts now always requires a real sign-out + sign-in.
    handleLogout();
  };

  // FIX (security): this used to instantly flip the signed-in user's own
  // tier to 'admin' client-side — a one-click, unauthenticated RBAC bypass.
  // Real role changes now only happen in Firestore (an existing admin
  // promotes someone from User Management), so this control just signs out
  // instead of silently granting privileges.
  const handleToggleRole = () => {
    handleLogout();
  };

  // Trash & Recycle Bin Handlers
  const handleMoveFileToTrash = (file: UploadedFileRecord) => {
    const trashed = createTrashedRecord(file, currentUser?.name || 'User', currentUser?.email);
    setTrashedItems((prev) => [trashed, ...prev]);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    setSources((prev) => prev.filter((s) => s.id !== file.id && s.filename !== file.filename));

    globalEventBus.emit(
      'TRASH',
      `ย้ายไฟล์ "${file.filename}" ไปยังถังขยะ (ตัดออกจาก AI และสถิติทันที กักเก็บ 7 วัน)`,
      [file.department],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  const handleBulkMoveToTrash = (fileIds: string[]) => {
    const targets = files.filter((f) => fileIds.includes(f.id));
    const trashedRecords = targets.map((f) =>
      createTrashedRecord(f, currentUser?.name || 'User', currentUser?.email)
    );
    setTrashedItems((prev) => [...trashedRecords, ...prev]);
    setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
    setSources((prev) => prev.filter((s) => !fileIds.includes(s.id)));

    globalEventBus.emit(
      'BULK_TRASH',
      `ย้ายข้อมูลแบบกลุ่ม ${fileIds.length} รายการไปยังถังขยะเรียบร้อย`,
      ['all'],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  const handleRestoreItem = (trashId: string) => {
    const target = trashedItems.find((t) => t.id === trashId);
    if (!target) return;

    if (target.originalItem) {
      if (target.type === 'risk_incident' || 'riskLevel' in target.originalItem) {
        const inc = target.originalItem as RiskIncident;
        setSources((prev) => {
          const srcId = target.sourceId;
          const targetSource = prev.find((s) => s.id === srcId) || prev[0];
          if (targetSource) {
            return prev.map((s) =>
              s.id === targetSource.id
                ? {
                    ...s,
                    incidents: [inc, ...s.incidents.filter((i) => i.id !== inc.id)],
                    rowCount: s.rowCount + 1,
                  }
                : s
            );
          }
          return prev;
        });
      } else if ('incidents' in target.originalItem) {
        setSources((prev) => [target.originalItem as DataSourceItem, ...prev]);
      } else {
        setFiles((prev) => [target.originalItem as UploadedFileRecord, ...prev]);
      }
    }
    setTrashedItems((prev) => prev.filter((t) => t.id !== trashId));

    globalEventBus.emit(
      'RESTORE',
      `กู้คืนข้อมูล "${target.name}" กลับคืนสู่ระบบสำเร็จ นำกลับเข้าสู่การคำนวณและ AI`,
      [target.originalDepartmentKey || 'overview'],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  const handlePermanentDeleteItem = (trashId: string) => {
    const target = trashedItems.find((t) => t.id === trashId);
    setTrashedItems((prev) => prev.filter((t) => t.id !== trashId));
    if (target) {
      globalEventBus.emit(
        'PERMANENT_DELETE',
        `ลบข้อมูล "${target.name}" ออกจากถังขยะอย่างถาวร (ไม่สามารถกู้คืนได้)`,
        [target.originalDepartmentKey || 'overview'],
        {
          totalIncidents: fusedMetrics.totalIncidents,
          totalSpecimens: fusedMetrics.totalSpecimens,
          rejectionRate: fusedMetrics.rejectionRate,
        }
      );
    }
  };

  const handleRestoreAll = () => {
    trashedItems.forEach((target) => {
      if (target.originalItem) {
        if (target.type === 'risk_incident' || 'riskLevel' in target.originalItem) {
          const inc = target.originalItem as RiskIncident;
          setSources((prev) => {
            const srcId = target.sourceId;
            const targetSource = prev.find((s) => s.id === srcId) || prev[0];
            if (targetSource) {
              return prev.map((s) =>
                s.id === targetSource.id
                  ? {
                      ...s,
                      incidents: [inc, ...s.incidents.filter((i) => i.id !== inc.id)],
                      rowCount: s.rowCount + 1,
                    }
                  : s
              );
            }
            return prev;
          });
        } else if ('incidents' in target.originalItem) {
          setSources((prev) => [target.originalItem as DataSourceItem, ...prev]);
        } else {
          setFiles((prev) => [target.originalItem as UploadedFileRecord, ...prev]);
        }
      }
    });
    setTrashedItems([]);
    globalEventBus.emit(
      'RESTORE',
      `กู้คืนข้อมูลทั้งหมดจากถังขยะกลับคืนสู่ระบบเรียบร้อย`,
      ['all'],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  const handleEmptyTrash = () => {
    const count = trashedItems.length;
    setTrashedItems([]);
    globalEventBus.emit(
      'PERMANENT_DELETE',
      `ล้างถังขยะทั้งหมดอย่างถาวร (${count} รายการ)`,
      ['all'],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  // Risk Incident Trashing Handlers
  const handleMoveIncidentToTrash = (incident: RiskIncident) => {
    const trashedRecord = createTrashedIncidentRecord(
      incident,
      currentUser?.name || 'ผู้ดูแลระบบ',
      currentUser?.email
    );
    setTrashedItems((prev) => [trashedRecord, ...prev]);

    setSources((prev) =>
      prev.map((s) => ({
        ...s,
        incidents: s.incidents.filter(
          (i) => i.id !== incident.id && i.incidentId !== incident.incidentId
        ),
      }))
    );

    globalEventBus.emit(
      'TRASH',
      `ย้ายรายงานความเสี่ยง "${incident.title}" ลงถังขยะ (ตัดออกจากสถิติ AI ทันที)`,
      [incident.departmentKey || 'central'],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  const handleBulkMoveIncidentsToTrash = (incidentIds: string[]) => {
    const idsSet = new Set(incidentIds);
    const targetIncidents = allFusedIncidents.filter((i) => idsSet.has(i.id));

    const newTrashedRecords = targetIncidents.map((inc) =>
      createTrashedIncidentRecord(inc, currentUser?.name || 'ผู้ดูแลระบบ', currentUser?.email)
    );
    setTrashedItems((prev) => [...newTrashedRecords, ...prev]);

    setSources((prev) =>
      prev.map((s) => ({
        ...s,
        incidents: s.incidents.filter((i) => !idsSet.has(i.id)),
      }))
    );

    globalEventBus.emit(
      'BULK_TRASH',
      `ย้ายรายงานความเสี่ยง ${incidentIds.length} รายการลงถังขยะ (ตัดออกจากสถิติ AI ทันที)`,
      ['overview'],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  const handleDeleteFilePermanent = (fileId: string) => {
    const targetFile = files.find((f) => f.id === fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSources((prev) => prev.filter((s) => s.id !== fileId));
    if (targetFile) {
      globalEventBus.emit(
        'PERMANENT_DELETE',
        `ลบไฟล์ "${targetFile.filename}" อย่างถาวร`,
        [targetFile.department],
        {
          totalIncidents: fusedMetrics.totalIncidents,
          totalSpecimens: fusedMetrics.totalSpecimens,
          rejectionRate: fusedMetrics.rejectionRate,
        }
      );
    }
  };

  // Move Room Modal Handlers
  const handleOpenMoveRoomModal = (targetIds: string[], targetNames: string[]) => {
    setMovingTargetIds(targetIds);
    setMovingTargetNames(targetNames);
    setShowMoveRoomModal(true);
  };

  const handleConfirmMoveRoom = (newDeptKey: string) => {
    const targetDept = departments.find((d) => d.key === newDeptKey);
    const deptTitle = targetDept?.name || newDeptKey;

    setFiles((prev) =>
      prev.map((f) =>
        movingTargetIds.includes(f.id) ? { ...f, department: newDeptKey as DepartmentKey } : f
      )
    );

    setSources((prev) =>
      prev.map((s) => ({
        ...s,
        departmentKey: movingTargetIds.includes(s.id) ? (newDeptKey as DepartmentKey) : s.departmentKey,
        incidents: s.incidents.map((i) =>
          movingTargetIds.includes(i.id)
            ? {
                ...i,
                departmentKey: newDeptKey as DepartmentKey,
                department: deptTitle,
              }
            : i
        ),
      }))
    );

    globalEventBus.emit(
      'MOVE_ROOM',
      `ย้ายข้อมูล ${movingTargetIds.length} รายการไปยังห้อง "${deptTitle}" เรียบร้อย`,
      [newDeptKey],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  // User Profile & Editing Handlers
  const handleOpenEditUser = (user: User) => {
    setTargetUserToEdit(user);
    setIsEditUserModalOpen(true);
  };

  const handleOpenEditProfile = () => {
    if (currentUser) {
      setTargetUserToEdit(currentUser);
      setIsEditUserModalOpen(true);
    }
  };

  const handleSaveUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    updateUserProfile(updatedUser.id, updatedUser).catch((err) =>
      console.error('Failed to save user profile:', err)
    );
    globalEventBus.emit(
      'BULK_ACTION',
      `อัปเดตข้อมูลผู้ใช้งาน "${updatedUser.name}" เรียบร้อยแล้ว`,
      ['overview'],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  // Bulk Upload & AI Splitting Handler
  const handleBulkAddFiles = (
    newFiles: UploadedFileRecord[],
    newSources: DataSourceItem[],
    splitResult?: AISplitResult
  ) => {
    setFiles((prev) => [...newFiles, ...prev]);
    setSources((prev) => [...newSources, ...prev]);

    if (splitResult) {
      setActiveAISplitResult(splitResult);
      setShowAISplitModal(true);
    }

    globalEventBus.emit(
      'BULK_UPLOAD',
      `อัปโหลดข้อมูลแบบกลุ่ม ${newFiles.length} ไฟล์เข้าสู่ระบบสำเร็จ${splitResult ? ' (AI ดำเนินการแยกห้องอัตโนมัติ)' : ''}`,
      ['overview'],
      {
        totalIncidents: fusedMetrics.totalIncidents,
        totalSpecimens: fusedMetrics.totalSpecimens,
        rejectionRate: fusedMetrics.rejectionRate,
      }
    );
  };

  // RBAC Promotion & Deletion Handlers
  // Now backed by Firestore: local state updates immediately (optimistic),
  // and the write persists it (and, for promote/demote, keeps the `admins`
  // allowlist collection in sync — firestore.rules' isAdmin() checks that
  // collection, so this is what actually grants/revokes privileged access,
  // not just the local `tier` field).
  const handlePromoteToAdmin = (targetUser: User) => {
    const patch: Partial<User> = {
      tier: 'admin',
      roleType: 'Administrator',
      role: 'Lab Director & Risk Manager',
    };
    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, ...patch } : u)));
    updateUserProfile(targetUser.id, patch).catch((err) => console.error('Failed to promote user:', err));
    addAdminRecord(targetUser.id, targetUser.email).catch((err) => console.error('Failed to add admin record:', err));
  };

  const handleDemoteAdmin = (targetUser: User) => {
    // FIX: 'General User' is not a valid UserRole (see types.ts — the real
    // values are 'User', 'Medical Technologist', etc.), so this assignment
    // was a pre-existing type error in the original code. Using 'User'.
    const patch: Partial<User> = {
      tier: 'user',
      roleType: 'User',
      role: 'Medical Technologist',
    };
    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, ...patch } : u)));
    updateUserProfile(targetUser.id, patch).catch((err) => console.error('Failed to demote user:', err));
    removeAdminRecord(targetUser.id).catch((err) => console.error('Failed to remove admin record:', err));
  };

  const handleDeleteUser = (targetUser: User) => {
    setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    deleteUserProfile(targetUser.id).catch((err) => console.error('Failed to delete user profile:', err));
    removeAdminRecord(targetUser.id).catch(() => {});
  };

  // User Management
  const handleApproveUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'Active', lastActive: 'Just now' } : u))
    );
    updateUserProfile(userId, { status: 'Active' }).catch((err) => console.error('Failed to approve user:', err));
  };

  const handleDenyUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'Inactive' } : u)));
    updateUserProfile(userId, { status: 'Inactive' }).catch((err) => console.error('Failed to deny user:', err));
  };

  // NOTE: creating another person's real login account (Firebase Auth)
  // cannot be done from client-side code without exposing admin
  // credentials — that requires the Admin SDK running server-side. This
  // still writes a Firestore profile "placeholder" as before, but it will
  // NOT be able to log in until that person actually signs up themselves
  // with the same email via the Sign Up screen.
  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  // Add Single Incident (appends to active manual/central source)
  // FIX: with an empty `sources` array (e.g. a fresh project with nothing
  // uploaded yet), the original `sources.map(...)` silently did nothing —
  // a manually reported incident would just vanish with no error. Now
  // falls back to creating a dedicated "manual reports" source on first use.
  const handleAddIncident = (newIncident: RiskIncident) => {
    setSources((prev) => {
      if (prev.length === 0) {
        const fallbackSource: DataSourceItem = {
          id: 'src-central-lab-2026',
          name: 'รายงานอุบัติการณ์ (Manual Reports)',
          type: 'file_csv',
          departmentKey: 'central',
          uploadedAt: new Date().toLocaleString('th-TH'),
          lastSyncedAt: new Date().toLocaleString('th-TH'),
          status: 'active',
          rowCount: 1,
          specimenCount: 0,
          rejectedCount: newIncident.stage === 'Pre-analytical' ? 1 : 0,
          rejectionRate: 0,
          incidents: [newIncident],
        };
        return [fallbackSource];
      }
      return prev.map((s, idx) => {
        if (s.id === 'src-central-lab-2026' || idx === 0) {
          const newIncidents = [newIncident, ...s.incidents];
          return {
            ...s,
            incidents: newIncidents,
            rowCount: newIncidents.length,
            rejectedCount: s.rejectedCount + (newIncident.stage === 'Pre-analytical' ? 1 : 0),
            lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return s;
      });
    });
  };

  const handleUpdateIncidentStatus = (
    incidentId: string,
    newStatus: RiskIncident['status'],
    extra?: Partial<Pick<RiskIncident, 'effectivenessReview' | 'effectivenessVerifiedBy' | 'effectivenessVerifiedDate'>>
  ) => {
    const updated = sources.map((s) => ({
      ...s,
      incidents: s.incidents.map((inc) =>
        inc.id === incidentId ? { ...inc, status: newStatus, ...(extra || {}) } : inc
      ),
    }));
    setSources(updated);
    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident((prev) => (prev ? { ...prev, status: newStatus, ...(extra || {}) } : null));
    }
  };

  const handleUploadFile = (newFile: UploadedFileRecord) => {
    setFiles((prev) => [newFile, ...prev]);
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setSources((prev) =>
        prev.map((s) => ({
          ...s,
          lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        }))
      );
    }, 600);
  };

  // Purge Mock Data Action (requested by user)
  const handleClearMockData = () => {
    setSources([]);
  };

  const handleLoadSampleData = () => {
    setSources(INITIAL_DATA_SOURCES);
  };

  // AI Directive Execution (AI-driven UI adjustments)
  const handleExecuteAIDirective = (directive: AIDirective) => {
    if (directive.action === 'FILTER_DEPARTMENT' && directive.target) {
      setCurrentDept(directive.target as DepartmentKey);
    } else if (directive.action === 'TOGGLE_YEAR' && directive.target) {
      const yr = parseInt(directive.target, 10);
      if (!isNaN(yr)) setSelectedYear(yr);
    } else if (directive.action === 'SWITCH_TAB' && directive.target) {
      setActiveTab(directive.target as TopNavTab);
    } else if (directive.action === 'RESET_FILTERS') {
      setSearchQuery('');
      setCurrentDept('overview');
      setActiveTab('overview');
    }
  };

  // Screen Rendering based on auth state (Strict Auth: redirect immediately if unauthenticated)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6faff] text-[#414750] text-sm">
        กำลังตรวจสอบสถานะการเข้าสู่ระบบ...
      </div>
    );
  }

  if (!currentUser || authScreen === 'login') {
    return (
      <LoginScreen
        users={users}
        onLogin={handleLogin}
        onNavigateToSignUp={() => setAuthScreen('signup')}
      />
    );
  }

  if (authScreen === 'signup') {
    return (
      <SignUpScreen
        onRegister={handleRegister}
        onNavigateToLogin={() => setAuthScreen('login')}
      />
    );
  }

  // FIX: `specimen` is an optional field on RiskIncident — calling
  // .toLowerCase() on it directly threw a runtime TypeError and crashed the
  // whole search/filter (and everything relying on filteredIncidents) the
  // moment any incident without a specimen value existed. Guarded with `?? ''`.
  const filteredIncidents = searchQuery
    ? allFusedIncidents.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.specimen ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.incidentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFusedIncidents;

  // Render department specific dashboard
  const renderMainContent = () => {
    if (activeTab === 'risk_reports' || currentDept === 'risk_reports') {
      return (
        <RiskReportManagerView
          incidents={allFusedIncidents}
          currentUser={currentUser}
          departments={departments}
          onOpenReportRisk={() => setShowReportRisk(true)}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          onMoveIncidentToTrash={handleMoveIncidentToTrash}
          onBulkMoveIncidentsToTrash={handleBulkMoveIncidentsToTrash}
          onOpenMoveRoomModal={(ids, names) => handleOpenMoveRoomModal(ids, names)}
          onOpenRecycleBin={() => setShowRecycleBin(true)}
          trashedCount={trashedItems.length}
        />
      );
    }

    if (activeTab === 'nc_trends') {
      return (
        <div className="p-6 sm:p-8 bg-slate-50 min-w-0 flex-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  การวิเคราะห์แนวโน้มอุบัติการณ์ความเสี่ยง (พ.ศ. {selectedYear})
                </h3>
                <p className="text-xs text-slate-500">
                  ประมวลผลข้อมูลอุบัติการณ์จากทุกแหล่งข้อมูล ({fusedMetrics.activeSources} แหล่งข้อมูล)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportReport(true)}
                className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                ส่งออกรายงานอุบัติการณ์
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">อุบัติการณ์รวมทั้งหมด (ปีปัจจุบัน)</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{filteredIncidents.length} เคส</div>
                <span className="text-xs text-emerald-600 font-semibold">อัปเดตแบบ Real-time</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">อุบัติการณ์ระยะก่อนการตรวจวิเคราะห์</span>
                <div className="text-2xl font-bold text-rose-600 mt-1">
                  {fusedMetrics.stageCounts['Pre-analytical'] || 0} เคส
                </div>
                <span className="text-xs text-slate-500">การเก็บสิ่งส่งตรวจ &amp; บาร์โค้ด</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">อัตราการปฏิเสธสิ่งส่งตรวจ %</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">{fusedMetrics.rejectionRate}%</div>
                <span className="text-xs text-emerald-600 font-semibold">เป้าหมาย &lt; 0.50%</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="p-3">รหัสอุบัติการณ์</th>
                    <th className="p-3">หัวข้อ / ความไม่สอดคล้อง</th>
                    <th className="p-3">หน่วยงาน</th>
                    <th className="p-3">สิ่งส่งตรวจ</th>
                    <th className="p-3">ระดับความรุนแรง</th>
                    <th className="p-3">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIncidents.slice(0, 15).map((inc, idx) => (
                    <tr key={`${inc.id || 'inc'}-${idx}`} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-700">{inc.incidentId}</td>
                      <td className="p-3 font-semibold">{inc.title}</td>
                      <td className="p-3 text-slate-600">{inc.department}</td>
                      <td className="p-3">{inc.specimen}</td>
                      <td className="p-3 font-semibold">{translateRiskLevel(inc.riskLevel)}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'rejected_specimens') {
      return (
        <div className="p-6 sm:p-8 bg-slate-50 min-w-0 flex-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  การเฝ้าระวังสิ่งส่งตรวจถูกปฏิเสธ (Rejected Specimens Monitoring)
                </h3>
                <p className="text-xs text-slate-500">
                  สถิติตัวเลขรวมปฏิเสธ {((fusedMetrics.totalRejected ?? fusedMetrics.rejectedSpecimens) || 0).toLocaleString()} จาก {(fusedMetrics.totalSpecimens || 0).toLocaleString()} สิ่งส่งตรวจ (อัตรา: {fusedMetrics.rejectionRate || 0}%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportRisk(true)}
                className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 cursor-pointer"
              >
                บันทึกการปฏิเสธสิ่งส่งตรวจ
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">จำนวนการปฏิเสธทั้งหมด</span>
                <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
                  {((fusedMetrics.totalRejected ?? fusedMetrics.rejectedSpecimens) || 0).toLocaleString()} ราย
                </div>
                <span className="text-xs text-slate-500">{fusedMetrics.rejectionRate || 0}% ของสิ่งส่งตรวจทั้งหมด</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">สิ่งส่งตรวจแตกตัว (Hemolyzed)</span>
                <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                  {Math.round(((fusedMetrics.totalRejected ?? fusedMetrics.rejectedSpecimens) || 0) * 0.42).toLocaleString()}
                </div>
                <span className="text-xs text-rose-600 font-semibold">42% ของการปฏิเสธทั้งหมด</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">เลือดจับตัวเป็นลิ่ม (Clotted)</span>
                <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                  {Math.round(((fusedMetrics.totalRejected ?? fusedMetrics.rejectedSpecimens) || 0) * 0.28).toLocaleString()}
                </div>
                <span className="text-xs text-slate-500">28% ของการปฏิเสธทั้งหมด</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">หลอดผิด / ติดฉลากผิด</span>
                <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                  {Math.round(((fusedMetrics.totalRejected ?? fusedMetrics.rejectedSpecimens) || 0) * 0.30).toLocaleString()}
                </div>
                <span className="text-xs text-slate-500">30% ของการปฏิเสธทั้งหมด</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'error_rates') {
      return (
        <div className="p-6 sm:p-8 bg-slate-50 min-w-0 flex-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              ดัชนีคุณภาพและความปลอดภัยทางการแพทย์ (ดัชนี Six Sigma)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              มาตรฐานคุณภาพห้องปฏิบัติการ รพ.นครปฐม (ISO 15189 / มาตรฐานห้องปฏิบัติการ)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                <h4 className="font-bold text-sm text-slate-900 mb-3">ผลการดำเนินงานตามดัชนี Six Sigma</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>ธนาคารเลือด (5.8 σ)</span>
                      <span className="text-emerald-700">ระดับเป็นเลิศ</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600" style={{ width: '96%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>ห้องปฏิบัติการกลาง (5.5 σ)</span>
                      <span className="text-indigo-700">ความน่าเชื่อถือสูง</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>อณูชีววิทยา (5.4 σ)</span>
                      <span className="text-indigo-700">ดีเยี่ยม</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: '90%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>จุลชีววิทยาคลินิก (4.9 σ)</span>
                      <span className="text-blue-700">ดี</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: '82%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-2">มาตรการป้องกันแก้ไข (CAPA Plan)</h4>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                    <li>จัดอบรมเทคนิคการเจาะเลือดและลดภาวะ Hemolysis ในแผนกผู้ป่วยนอก</li>
                    <li>ติดตั้งเครื่องอ่านบาร์โค้ดไร้สาย 2 มิติประจำจุดเจาะเลือดทุกโต๊ะ</li>
                    <li>ทบทวนรอบการสอบเทียบเครื่อง Thermal Cycler ทุก 30 วัน</li>
                    <li>เพิ่มมาตรการดับเบิ้ลเช็คในการตรวจวินิจฉัยเชื้อกลุ่ม MDR ในหอผู้ป่วยวิกฤต</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExportReport(true)}
                  className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  ออกใบรับรองคุณภาพ Six Sigma
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (currentDept) {
      case 'overview':
        return (
          <AdminOverview
            users={users}
            incidents={filteredIncidents}
            fusedMetrics={fusedMetrics}
            departments={departments}
            currentUser={currentUser!}
            selectedYear={selectedYear}
            onApproveUser={handleApproveUser}
            onDenyUser={handleDenyUser}
            onOpenAddUser={() => setShowAddUser(true)}
            onOpenExportReport={() => setShowExportReport(true)}
            onRefreshData={handleRefreshData}
            isRefreshing={isRefreshing}
            onSelectUserIncident={() => {}}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenReportRisk={() => setShowReportRisk(true)}
            onOpenGoogleSync={() => setShowMultiSourceHub(true)}
            onOpenMultiSourceHub={() => setShowMultiSourceHub(true)}
          />
        );

      case 'google_sync':
        return (
          <div className="p-6 sm:p-8 bg-slate-50 min-w-0 flex-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Multi-Source Fusion Engine Active
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    ศูนย์เชื่อมโยง Google Sheets &amp; Google Forms (Multi-Source Center)
                  </h3>
                  <p className="text-xs text-slate-500">
                    เชื่อมต่อ Google Sheet หลายไฟล์และแบบฟอร์ม Google Form เพื่อประมวลผลตัวเลขเข้าสู่ระบบทันที
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMultiSourceHub(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    จัดการเชื่อมโยง Data Sources ({sources.length})
                  </button>
                </div>
              </div>

              {/* Embedded Google Form View */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50 p-3">
                <div className="flex justify-between items-center px-2 pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    แบบรายงานความเสี่ยงทางห้องปฏิบัติการ โรงพยาบาลนครปฐม (Live Ingest Form)
                  </span>
                  <a
                    href="https://docs.google.com/forms/d/1RuGhHcfgEZ8Ms8iUTY76O3A36Lj6YzOZ_3W0tjJO9Zs/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    เปิดในหน้าต่างใหม่ ↗
                  </a>
                </div>
                <iframe
                  src="https://docs.google.com/forms/d/1RuGhHcfgEZ8Ms8iUTY76O3A36Lj6YzOZ_3W0tjJO9Zs/viewform?embedded=true"
                  title="Google Form Embed"
                  className="w-full h-[620px] border-0 rounded-xl bg-white"
                >
                  กำลังโหลดแบบฟอร์ม Google Form...
                </iframe>
              </div>
            </div>
          </div>
        );

      case 'central':
        return (
          <CentralLabDashboard
            incidents={filteredIncidents}
            stats={buildDepartment5YearStats(sources, 'central', 'Central Lab', 'ห้องปฏิบัติการกลาง')}
            onOpenReportRisk={() => setShowReportRisk(true)}
            onOpenDataUpload={() => setShowMultiSourceHub(true)}
            onOpenExportReport={() => setShowExportReport(true)}
            onOpenGoogleSync={() => setShowMultiSourceHub(true)}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        );

      case 'blood':
        return (
          <BloodBankDashboard
            incidents={filteredIncidents}
            stats={buildDepartment5YearStats(sources, 'blood', 'Blood Bank', 'ธนาคารเลือด')}
            onOpenReportRisk={() => setShowReportRisk(true)}
            onOpenDataUpload={() => setShowMultiSourceHub(true)}
            onOpenExportReport={() => setShowExportReport(true)}
            onOpenGoogleSync={() => setShowMultiSourceHub(true)}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        );

      case 'molecular':
        return (
          <MolecularBioDashboard
            incidents={filteredIncidents}
            stats={buildDepartment5YearStats(sources, 'molecular_science', 'Molecular Biology', 'อณูชีววิทยา')}
            onOpenReportRisk={() => setShowReportRisk(true)}
            onOpenDataUpload={() => setShowMultiSourceHub(true)}
            onOpenExportReport={() => setShowExportReport(true)}
            onOpenGoogleSync={() => setShowMultiSourceHub(true)}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        );

      case 'outpatient':
        return (
          <OutpatientLabDashboard
            incidents={filteredIncidents}
            stats={buildDepartment5YearStats(sources, 'outpatient', 'Outpatient Lab', 'ห้องปฏิบัติการผู้ป่วยนอก')}
            onOpenDataUpload={() => setShowMultiSourceHub(true)}
            onOpenReportRisk={() => setShowReportRisk(true)}
            onOpenExportReport={() => setShowExportReport(true)}
            onOpenGoogleSync={() => setShowMultiSourceHub(true)}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        );

      case 'molecular_science':
        return (
          <MolecularScienceDashboard
            incidents={filteredIncidents}
            stats={buildDepartment5YearStats(sources, 'molecular_science', 'Molecular Science', 'วิทยาศาสตร์โมเลกุล')}
            onOpenReportRisk={() => setShowReportRisk(true)}
            onOpenDataUpload={() => setShowMultiSourceHub(true)}
            onOpenExportReport={() => setShowExportReport(true)}
            onOpenGoogleSync={() => setShowMultiSourceHub(true)}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        );

      case 'microbiology':
        return (
          <ClinicalMicrobiologyDashboard
            incidents={filteredIncidents}
            stats={buildDepartment5YearStats(sources, 'microbiology', 'Clinical Microbiology', 'จุลชีววิทยาคลินิก')}
            onOpenReportRisk={() => setShowReportRisk(true)}
            onOpenDataUpload={() => setShowMultiSourceHub(true)}
            onOpenExportReport={() => setShowExportReport(true)}
            onOpenGoogleSync={() => setShowMultiSourceHub(true)}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        );

      case 'material_store':
        return (
          <MaterialStoreDashboard
            incidents={filteredIncidents}
            stats={buildDepartment5YearStats(sources, 'material_store', 'Material Store', 'คลังวัสดุ')}
            onOpenReportRisk={() => setShowReportRisk(true)}
            onOpenDataUpload={() => setShowMultiSourceHub(true)}
            onOpenExportReport={() => setShowExportReport(true)}
            onOpenGoogleSync={() => setShowMultiSourceHub(true)}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        );

      case 'data_upload':
        return (
          <div className="p-6 sm:p-8 bg-slate-50 min-w-0 flex-1 space-y-6">
            <FileManagerView
              files={files}
              currentUser={currentUser}
              onDeleteFile={handleDeleteFilePermanent}
              onOpenUploadModal={() => setShowDataUpload(true)}
              onOpenBulkUpload={() => setShowBulkUpload(true)}
              onMoveFileToTrash={handleMoveFileToTrash}
              onBulkMoveToTrash={handleBulkMoveToTrash}
              onOpenMoveModal={handleOpenMoveRoomModal}
              onOpenRecycleBin={() => setShowRecycleBin(true)}
              trashedCount={trashedItems.length}
              departments={departments}
              onTriggerAISplitDemo={() => {
                setShowSetupGuide(true);
              }}
            />
          </div>
        );

      case 'settings':
        return (
          <div className="p-6 sm:p-8 bg-slate-50 min-w-0 flex-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-3xl">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                การตั้งค่าระบบและเอกสาร (System Settings &amp; Architecture)
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Hospital Risk Management System Configuration &amp; Security
              </p>

              <div className="space-y-4 text-xs text-slate-800">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-sm text-indigo-900 mb-2">ข้อมูลโรงพยาบาล (Hospital Profile)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block">ชื่อหน่วยงาน:</span>
                      <strong>โรงพยาบาลนครปฐม (Nakhon Pathom Hospital)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">มาตรฐานห้องปฏิบัติการ:</span>
                      <strong>ISO 15189 / มาตรฐานการรับรองห้องปฏิบัติการ (LA)</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-sm text-indigo-900 mb-2">คู่มือสถาปัตยกรรม &amp; Code Logic</h4>
                  <p className="text-slate-600 mb-3">
                    ตรวจสอบโครงสร้างไฟล์ของโปรเจกต์ โค้ด Logic การเชื่อมโยง Google Sheets API, การคำนวณสถิติใหม่, และการตั้งค่า Gemini AI
                  </p>
                  <button
                    onClick={() => setShowSetupGuide(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 cursor-pointer"
                  >
                    เปิดคู่มือสถาปัตยกรรม (Setup Guide &amp; Tech Docs)
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 border border-rose-300 text-rose-700 rounded-xl font-semibold hover:bg-rose-50 cursor-pointer"
                  >
                    ออกจากระบบ (Log Out)
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default: {
        return (
          <DepartmentGenericDashboard
            deptKey={currentDept}
            deptName="Department Lab"
            deptThName="ห้องปฏิบัติการ"
            incidents={filteredIncidents}
            onOpenReportRisk={() => setShowReportRisk(true)}
            onOpenDataUpload={() => setShowMultiSourceHub(true)}
            onOpenExportReport={() => setShowExportReport(true)}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        );
      }
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex antialiased overflow-x-hidden relative">
      {/* Global Real-time Synchronization Floating Toast */}
      {globalSyncToast && (
        <div className="fixed top-16 right-6 z-50 animate-in slide-in-from-top duration-300 pointer-events-none">
          <div className="bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 text-xs max-w-md pointer-events-auto backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-400/30">
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-300">อัปเดตข้อมูลระบบ</span>
                <span className="text-[10px] text-slate-400 font-mono">[{globalSyncToast.timestamp}]</span>
              </div>
              <div className="text-slate-200 truncate font-medium text-[11px] mt-0.5">{globalSyncToast.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentDept={currentDept}
        onSelectDept={(dept) => {
          if (dept === 'google_sync') {
            setShowMultiSourceHub(true);
          } else {
            setCurrentDept(dept);
            setActiveTab('overview');
          }
        }}
        onOpenReportRisk={() => setShowReportRisk(true)}
        onOpenIconManager={() => setShowIconManager(true)}
        onOpenRecycleBin={() => setShowRecycleBin(true)}
        trashedCount={trashedItems.length}
        currentUser={currentUser}
        departments={departments}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-200">
        {/* Top App Bar */}
        <TopAppBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUser={currentUser}
          users={users}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          onSelectSpecificUser={() => handleSwitchUser()}
          onToggleRole={handleToggleRole}
          onOpenHelp={() => setShowHelp(true)}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenMultiSourceHub={() => setShowMultiSourceHub(true)}
          onOpenSetupGuide={() => setShowSetupGuide(true)}
          onOpenRBACModal={() => setShowRBACModal(true)}
          onOpenRecycleBin={() => setShowRecycleBin(true)}
          onOpenEditProfile={handleOpenEditProfile}
          trashedCount={trashedItems.length}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          unreadCount={allFusedIncidents.filter((i) => i.riskLevel === 'Critical').length}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          activeSourcesCount={sources.filter((s) => s.status === 'active' && !trashedIds.includes(s.id)).length}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">{renderMainContent()}</main>
      </div>

      {/* Embedded AI Assistant Widget (Floating & Directive-enabled) */}
      <AIAssistantWidget
        fusedMetrics={fusedMetrics}
        currentUser={currentUser!}
        onExecuteDirective={handleExecuteAIDirective}
        selectedYear={selectedYear}
        currentDept={currentDept}
      />

      {/* Multi-Source Fusion & Purge Manager Modal */}
      <MultiSourceManagerModal
        isOpen={showMultiSourceHub}
        onClose={() => setShowMultiSourceHub(false)}
        sources={sources}
        onUpdateSources={setSources}
        fusedMetrics={fusedMetrics}
        departments={departments}
        currentUser={currentUser!}
        onClearMockData={handleClearMockData}
        onLoadSampleData={handleLoadSampleData}
      />

      {/* Setup Instructions & Tech Docs Modal */}
      <SetupInstructionsModal
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
      />

      {/* Recycle Bin Modal (7-Day Auto Purge & Exclusion from AI/Calculations) */}
      <RecycleBinModal
        isOpen={showRecycleBin}
        onClose={() => setShowRecycleBin(false)}
        trashedItems={trashedItems}
        currentUser={currentUser}
        onRestoreItem={handleRestoreItem}
        onPermanentDeleteItem={handlePermanentDeleteItem}
        onRestoreAll={handleRestoreAll}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        departments={departments}
        currentUser={currentUser}
        onBulkAddFiles={handleBulkAddFiles}
      />

      {/* Move Room Modal */}
      <MoveRoomModal
        isOpen={showMoveRoomModal}
        onClose={() => setShowMoveRoomModal(false)}
        targetNames={movingTargetNames}
        departments={departments}
        currentDepartmentKey={currentDept}
        onConfirmMove={handleConfirmMoveRoom}
      />

      {/* AI Split Notification Modal */}
      <AISplitNotificationModal
        isOpen={showAISplitModal}
        onClose={() => setShowAISplitModal(false)}
        splitResult={activeAISplitResult}
        onNavigateToRoom={(roomKey) => {
          setCurrentDept(roomKey as DepartmentKey);
          setActiveTab('overview');
        }}
      />

      {/* RBAC Management Modal */}
      <RBACManagementModal
        isOpen={showRBACModal}
        onClose={() => setShowRBACModal(false)}
        currentUser={currentUser}
        users={users}
        onPromoteToAdmin={handlePromoteToAdmin}
        onDemoteAdmin={handleDemoteAdmin}
        onDeleteUser={handleDeleteUser}
        onOpenAddUser={() => setShowAddUser(true)}
        onSwitchUser={() => handleSwitchUser()}
        onEditUser={handleOpenEditUser}
      />

      {/* Edit User Account & Profile Modal */}
      {isEditUserModalOpen && targetUserToEdit && (
        <EditUserModal
          isOpen={isEditUserModalOpen}
          onClose={() => {
            setIsEditUserModalOpen(false);
            setTargetUserToEdit(null);
          }}
          user={targetUserToEdit}
          currentUser={currentUser}
          onSaveUser={handleSaveUser}
        />
      )}

      {/* Data Upload Modal */}
      {showDataUpload && (
        <DataUploadModal
          onClose={() => setShowDataUpload(false)}
          onUploadSuccess={(newFile, newSource) => {
            setFiles((prev) => [newFile, ...prev]);
            setSources((prev) => [newSource, ...prev]);
            globalEventBus.emit(
              'BULK_UPLOAD',
              `อัปโหลดและอ่านข้อมูลจริงจากไฟล์ "${newFile.filename}" สำเร็จ`,
              [newSource.departmentKey],
              {
                totalIncidents: newSource.incidents.length,
                totalSpecimens: newSource.specimenCount || 0,
                rejectionRate: newSource.rejectionRate || 0,
              }
            );
          }}
          defaultDept={currentDept}
          currentUser={currentUser}
        />
      )}

      {/* Modals */}
      {showReportRisk && (
        <ReportRiskModal
          onClose={() => setShowReportRisk(false)}
          onSubmitIncident={handleAddIncident}
          currentUser={currentUser}
          defaultDept={currentDept}
        />
      )}

      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onAddUser={handleAddUser}
        />
      )}

      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          currentUser={currentUser}
          onClose={() => setSelectedIncident(null)}
          onUpdateStatus={handleUpdateIncidentStatus}
        />
      )}

      {showExportReport && (
        <ExportReportModal
          onClose={() => setShowExportReport(false)}
          incidents={allFusedIncidents}
          currentUser={currentUser}
        />
      )}

      {showNotifications && (
        <NotificationsModal
          onClose={() => setShowNotifications(false)}
          incidents={allFusedIncidents}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showIconManager && (
        <DepartmentIconManager
          isOpen={showIconManager}
          onClose={() => setShowIconManager(false)}
          departments={departments}
          onUpdateDepartments={setDepartments}
        />
      )}
    </div>
  );
}

export default App;
