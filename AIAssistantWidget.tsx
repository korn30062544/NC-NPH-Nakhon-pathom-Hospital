import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  ChevronDown,
  Database,
  Layers,
} from 'lucide-react';
import { AIMessage, AIDirective, User } from '../types';
import { FusedDataMetrics } from '../utils/multiSourceDataEngine';
import { realtimeFileEngine } from '../utils/realtimeFileEngine';
import { translateRole } from '../utils/labels';

interface AIAssistantWidgetProps {
  fusedMetrics: FusedDataMetrics;
  currentUser: User;
  onExecuteDirective: (directive: AIDirective) => void;
  selectedYear: number;
  currentDept: string;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  fusedMetrics,
  currentUser,
  onExecuteDirective,
  selectedYear,
  currentDept,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [knowledgeStats, setKnowledgeStats] = useState(() => realtimeFileEngine.getAggregatedAIContext());

  useEffect(() => {
    const unsubscribe = realtimeFileEngine.subscribe(() => {
      setKnowledgeStats(realtimeFileEngine.getAggregatedAIContext());
    });
    return () => unsubscribe();
  }, []);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `สวัสดีครับคุณ **${currentUser.name}** 👋 ผมคือ **AI Risk & Quality Assistant** ประจำศูนย์บริหารความเสี่ยง รพ.นครปฐม\n\nพร้อมช่วยวิเคราะห์สถิติจากทุกแหล่งข้อมูล (${fusedMetrics.activeSources} แหล่งที่เปิดใช้งาน) พร้อม Real-time Ingestion จากไฟล์ที่อัปโหลด (${knowledgeStats.totalFilesProcessed} ไฟล์, ${knowledgeStats.totalIncidentsIngested} เคสในฐานความรู้) สรุปแนวโน้มความเสี่ยง หรือช่วยปรับแต่งหน้าจอและกราฟให้คุณได้ทันทีครับ!`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle sending message to Gemini API
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Gather real-time aggregated knowledge base from processed files
      const realtimeKnowledge = realtimeFileEngine.getAggregatedAIContext();

      // Prepare rich contextual snapshot from current multi-source dashboard
      const contextData = {
        currentUser: {
          name: currentUser.name,
          role: currentUser.roleType,
          isAdmin: currentUser.roleType === 'Administrator',
        },
        dashboardState: {
          currentYear: selectedYear,
          currentDepartment: currentDept,
          activeSourcesCount: fusedMetrics.activeSources,
          totalIncidents: fusedMetrics.totalIncidents,
          totalSpecimens: fusedMetrics.totalSpecimens,
          rejectionRatePercent: fusedMetrics.rejectionRate,
          criticalIncidents: fusedMetrics.criticalIncidents,
          highRiskIncidents: fusedMetrics.highRiskIncidents,
          departmentBreakdown: fusedMetrics.departmentCounts,
          topCategories: fusedMetrics.categoryBreakdown.slice(0, 5),
        },
        realtimeIngestedKnowledge: {
          totalFilesProcessed: realtimeKnowledge.totalFilesProcessed,
          totalIncidentsIngested: realtimeKnowledge.totalIncidentsIngested,
          sourceBreakdown: realtimeKnowledge.sourceBreakdown,
          recentExtracts: realtimeKnowledge.recentSummaries.slice(0, 5),
        },
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          contextData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'ขออภัย ไม่ได้รับคำตอบจากระบบ AI',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        directive: data.directive,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If directive returned and user is Admin, auto-execute or allow manual trigger
      if (data.directive && currentUser.roleType === 'Administrator') {
        onExecuteDirective(data.directive);
      }
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **ระบบ AI ขัดข้องชั่วคราว:** ${err.message || 'ไม่สามารถติดต่อ AI Server ได้'} (คุณสามารถตรวจสอบการตั้งค่า GEMINI_API_KEY ได้ที่แถบการตั้งค่า)`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run deep analysis
  const handleRunDeepAnalysis = async () => {
    setIsDeepAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcesSummary: {
            totalSources: fusedMetrics.totalSources,
            activeSources: fusedMetrics.activeSources,
            totalIncidents: fusedMetrics.totalIncidents,
            totalSpecimens: fusedMetrics.totalSpecimens,
            rejectionRate: fusedMetrics.rejectionRate,
            criticalCount: fusedMetrics.criticalIncidents,
          },
          departmentStats: fusedMetrics.departmentCounts,
          currentYear: selectedYear,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          const report = data.analysis;
          const formattedText = `📊 **รายงานสรุปและวิเคราะห์ความเสี่ยงเชิงลึก (AI Quality Audit Report - พ.ศ. ${selectedYear})**\n\n` +
            `**1. สรุปภาพรวม (Executive Summary):**\n${report.executiveSummary || 'วิเคราะห์จากชุดข้อมูลรวมทุกแหล่ง'}\n\n` +
            (report.criticalAlerts && report.criticalAlerts.length > 0 ? `**🚨 จุดวิกฤตที่ต้องเฝ้าระวัง:**\n${report.criticalAlerts.map((a: string) => `• ${a}`).join('\n')}\n\n` : '') +
            (report.trendAnalysis ? `**📈 แนวโน้มสถิติและการเปลี่ยนแปลง:**\n${report.trendAnalysis}\n\n` : '') +
            (report.capaRecommendations && report.capaRecommendations.length > 0 ? `**🛡️ มาตรการป้องกันแก้ไข (CAPA Plan):**\n${report.capaRecommendations.map((c: string, idx: number) => `${idx + 1}. ${c}`).join('\n')}` : '');

          setMessages((prev) => [
            ...prev,
            {
              id: `analysis-${Date.now()}`,
              sender: 'assistant',
              text: formattedText,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              analysisReport: report,
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Deep analysis error:', err);
    } finally {
      setIsDeepAnalyzing(false);
    }
  };

  const quickPrompts = [
    { label: '📊 สรุปภาพรวมความเสี่ยง', prompt: 'ช่วยสรุปภาพรวมอุบัติการณ์ความเสี่ยงและอัตราการปฏิเสธสิ่งส่งตรวจทั้งหมด' },
    { label: '🚨 จุดวิกฤตที่ต้องเฝ้าระวัง', prompt: 'วิเคราะห์อุบัติการณ์ระดับวิกฤต (Critical) และความเสี่ยงสูงที่ต้องจัดการด่วน' },
    { label: '🩸 วิเคราะห์ความปลอดภัยธนาคารเลือด', prompt: 'สรุปรายงานความเสี่ยงของห้องปฏิบัติการธนาคารเลือด (Blood Bank)' },
    { label: '🔄 ปรับเป็นกราฟแท่ง (Bar Chart)', prompt: 'ขอเปลี่ยนการแสดงผลกราฟสถิติเป็นกราฟแท่ง (Bar Chart)' },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          id="ai-assistant-toggle-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer border border-white/20 group"
          title="เปิดผู้ช่วย AI สรุปสถิติและปรับแต่งหน้าจอ"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-ping" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold tracking-wide flex items-center gap-1.5">
              <span>AI Assistant</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded font-medium">Gemini 3.7</span>
            </div>
            <div className="text-[11px] text-blue-100 font-light">วิเคราะห์ข้อมูล & ปรับแต่ง Dashboard</div>
          </div>
        </button>
      )}

      {/* AI Assistant Modal / Window */}
      {isOpen && (
        <div
          id="ai-assistant-window"
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden ${
            isExpanded
              ? 'inset-4 md:inset-10'
              : 'bottom-5 right-5 w-[94vw] sm:w-[460px] h-[640px] max-h-[90vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-indigo-900/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">AI Risk & Quality Intelligence</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    Live Context
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-2">
                  <span>{fusedMetrics.activeSources} Data Sources</span>
                  <span>•</span>
                  <span>{fusedMetrics.totalIncidents} Incidents</span>
                  <span>•</span>
                  <span className="text-amber-300">Rej: {fusedMetrics.rejectionRate}%</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={handleRunDeepAnalysis}
                disabled={isDeepAnalyzing}
                className="p-1.5 hover:bg-white/10 rounded-lg text-xs flex items-center gap-1 text-amber-300 hover:text-amber-200 transition-colors"
                title="วิเคราะห์เชิงลึกอัตโนมัติ"
              >
                <Zap className={`w-4 h-4 ${isDeepAnalyzing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-[11px]">Auto Audit</span>
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
                title={isExpanded ? 'ย่อหน้าต่าง' : 'ขยายเต็มจอ'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Strip */}
          <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-xs text-indigo-950">
            <div className="flex items-center gap-2">
              <span className="font-medium text-indigo-700">ปีสถิติ:</span>
              <span className="px-2 py-0.5 bg-indigo-100/80 rounded font-semibold text-indigo-900">พ.ศ. {selectedYear}</span>
              <span className="text-slate-400">|</span>
              <span className="font-medium text-indigo-700">สิทธิ์:</span>
              <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                currentUser.roleType === 'Administrator' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {translateRole(currentUser.roleType)}
              </span>
            </div>
            {currentUser.roleType === 'Administrator' && (
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> AI Command Enabled
              </span>
            )}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                      isUser
                        ? 'bg-slate-800 text-white'
                        : 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-sm'
                    }`}
                  >
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    {/* Render message formatted with simple markdown */}
                    <div className="whitespace-pre-line break-words space-y-1">
                      {msg.text}
                    </div>

                    {/* Show executed directive badge if applicable */}
                    {msg.directive && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-700 bg-indigo-50/80 px-2.5 py-1.5 rounded-lg">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                          <span>AI Action: {msg.directive.action} ({msg.directive.target || 'auto'})</span>
                        </div>
                        <button
                          onClick={() => onExecuteDirective(msg.directive!)}
                          className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] hover:bg-indigo-700 font-semibold cursor-pointer"
                        >
                          Execute
                        </button>
                      </div>
                    )}

                    <div
                      className={`text-[10px] mt-1.5 text-right ${
                        isUser ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-xs text-slate-600 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                  </div>
                  <span>AI กำลังประมวลผลสถิติและสังเคราะห์คำตอบ...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-full text-[11px] font-medium transition-colors border border-slate-200 hover:border-indigo-200 cursor-pointer shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="พิมพ์คำถาม หรือสั่ง AI ปรับกราฟ/หน้าจอ..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
                title="ส่งข้อความ"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-[10px] text-slate-400 mt-1.5 text-center">
              Powered by Google Gemini 3.7 Flash • Server-Side Security Protected
            </div>
          </div>
        </div>
      )}
    </>
  );
};
