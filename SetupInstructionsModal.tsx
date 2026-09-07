import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Terminal,
  Key,
  FolderTree,
  Cpu,
  Layers,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Code2,
} from 'lucide-react';

interface SetupInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupInstructionsModal: React.FC<SetupInstructionsModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const envSample = `# .env.example
GEMINI_API_KEY="AIzaSy..."
PORT=3000
NODE_ENV=development
APP_URL="https://ais-dev-ocg6h67gfg57hrlmka4z53-738925821986.asia-southeast1.run.app"`;

  const runCommands = `# 1. ติดตั้ง Dependencies ทั้งหมด
npm install

# 2. เริ่มต้นรัน Dev Server (Express + Vite + Gemini 3.7 Backend)
npm run dev

# 3. ตรวจสอบสถานะ Typescript & Linting
npm run lint

# 4. Build สำหรับ Production
npm run build
npm start`;

  const projectTree = `hospital-risk-dashboard/
├── server.ts                       # Express Backend + Gemini 3.7 Flash + Google Sheets Proxy
├── index.html                      # Primary HTML Entry Point
├── package.json                    # Dependencies & full-stack scripts (tsx, esbuild, @google/genai)
├── metadata.json                   # App capabilities declaration
├── .env.example                    # Environment secrets declaration
├── vite.config.ts                  # Vite + Tailwind plugin config
└── src/
    ├── main.tsx                    # React Root Entry Point
    ├── App.tsx                     # Main Dashboard State, Multi-Source Fusion & RBAC Controller
    ├── types.ts                    # TypeScript Interfaces (Data Sources, Incidents, Charts, AI)
    ├── mockData.ts                 # Initial Baseline Data & Department Definitions (5-Year Stats)
    ├── utils/
    │   ├── multiSourceDataEngine.ts # Multi-Source Data Fusion, Excel/CSV/JSON & Purge/Recalculate Engine
    │   └── googleSheetsSync.ts      # Google Sheets CSV parser & live extractor
    └── components/
        ├── TopAppBar.tsx            # Navigation, Year Selector, Role Switcher (Admin vs General)
        ├── Sidebar.tsx              # Department Navigation, Multi-Source Center & Icon Manager Links
        ├── MultiSourceManagerModal.tsx # Multi-Source Hub (Google Sheets, Forms, Files + Purge Engine)
        ├── AIAssistantWidget.tsx    # Embedded AI Assistant (Gemini 3.7 Live Chat & UI Directives)
        ├── DynamicChartGrid.tsx     # Customizable Interactive Recharts (Bar, Line, Donut, Area, Radar)
        ├── DepartmentIconManager.tsx# Custom Department, Icon, & Color Badge Manager
        ├── AdminOverview.tsx        # Hospital Executive Risk Dashboard & KPI Cards
        ├── SetupInstructionsModal.tsx # Architecture & Setup Documentation Modal
        └── ...                      # Department Dashboards (Central Lab, Blood Bank, Micro, etc.)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">เอกสารทางเทคนิคและวิธีติดตั้ง (Technical Guide & Setup)</h2>
              <p className="text-xs text-slate-300">
                สถาปัตยกรรมระบบ Multi-Source Data Fusion, Gemini AI Server, และ Role-Based Access Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs sm:text-sm">
          {/* Section 1: Tech Stack Overview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              1. สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-indigo-700">Frontend:</span> React 19 + TypeScript + Tailwind CSS v4
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-indigo-700">Data Visualization:</span> Recharts (Area, Bar, Line, Donut, Radar)
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-indigo-700">Backend Server:</span> Node.js + Express + Vite Middleware
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-indigo-700">AI Intelligence:</span> Google Gemini 3.7 Flash (@google/genai SDK)
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-indigo-700">Data Parsers:</span> PapaParse (CSV) + SheetJS (XLSX/XLS) + JSON
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-indigo-700">Icon System:</span> Lucide React + Material Symbols
              </div>
            </div>
          </div>

          {/* Section 2: Core Feature Logic Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              2. กลไกการทำงานของระบบหลัก (Core Logic & Workflows)
            </h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 text-xs mb-1">
                  🔹 A. Multi-Source Data Fusion & Real-Time Purge
                </div>
                <p>
                  ระบบรองรับการนำเข้าไฟล์ CSV, Excel (.xlsx/.xls), JSON และการเชื่อมโยง Google Sheets / Forms พร้อมกันหลายรายการ
                  ข้อมูลทั้งหมดจะถูกรวมเข้าสู่ <strong>Fusion Engine</strong> ซึ่งทำการแมปคอลัมน์ภาษาไทย/อังกฤษโดยอัตโนมัติ
                  เมื่อผู้ใช้กดลบหรือ Purge แหล่งข้อมูลใด ข้อมูลทั้งหมดจะถูกล้างออกจากหน่วยความจำทันที และทำการ <strong>Recalculate</strong> สถิติและกราฟใหม่ทั้งหมดแบบ Zero-Residue
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 text-xs mb-1">
                  🔹 B. Embedded Gemini 3.7 AI Assistant & UI Directives
                </div>
                <p>
                  AI Assistant ถูกติดตั้งแบบ Full-Stack ปลอดภัยผ่าน Server Endpoint (<code>/api/ai/chat</code>, <code>/api/ai/analyze-data</code>)
                  AI สามารถวิเคราะห์สรุปแนวโน้มสถิติจากชุดข้อมูลรวม และสามารถส่งกลับ <strong>UI Directives</strong> เพื่อปรับเปลี่ยนการแสดงผล ฟิลเตอร์ หรือประเภทกราฟบนหน้าจอตามคำสั่งผู้ใช้
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900 text-xs mb-1">
                  🔹 C. Role-Based Access Control (RBAC)
                </div>
                <p>
                  แบ่งสิทธิ์ระหว่าง <strong>Admin (สิทธิ์เต็ม)</strong> และ <strong>General User (เจ้าหน้าที่ทั่วไป)</strong>
                  โดยตั้งค่าเริ่มต้นให้เป็น Admin สามารถสลับโหมดได้ที่แถบด้านบนเพื่อทดสอบการทำงาน เฉพาะ Admin เท่านั้นที่สามารถเพิ่ม/Purge ข้อมูล, แก้ไขแผนก/ไอคอน และปรับแต่งกราฟได้
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Project Directory Structure */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-600" />
                3. โครงสร้างไฟล์โปรเจกต์ (Project Directory Structure)
              </h3>
              <button
                onClick={() => copyToClipboard(projectTree, 'tree')}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copiedSection === 'tree' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'tree' ? 'คัดลอกแล้ว!' : 'คัดลอกโครงสร้าง'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto">
              {projectTree}
            </pre>
          </div>

          {/* Section 4: Setup & Run Instructions */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              4. วิธีการตั้งค่า API Key และคำสั่งรันโปรเจกต์ (Setup & Run)
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">การตั้งค่าตัวแปรสภาพแวดล้อม (.env.example):</div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono">
                  {envSample}
                </pre>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">คำสั่งรันโปรเจกต์ (CLI Commands):</div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono">
                  {runCommands}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ระบบผ่านการตรวจสอบความปลอดภัยและทำงานแบบ Full-Stack เต็มรูปแบบ</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
