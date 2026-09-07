import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon,
  Activity,
  Sliders,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react';
import { ChartWidgetConfig, ChartType, User, CustomDepartment } from '../types';
import { FusedDataMetrics } from '../utils/multiSourceDataEngine';

interface DynamicChartGridProps {
  fusedMetrics: FusedDataMetrics;
  currentUser: User;
  departments: CustomDepartment[];
  currentDept: string;
  selectedYear: number;
}

const THEME_COLORS = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
];

export const DynamicChartGrid: React.FC<DynamicChartGridProps> = ({
  fusedMetrics,
  currentUser,
  departments,
  currentDept,
  selectedYear,
}) => {
  const isAdmin = currentUser.roleType === 'Administrator';
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Initial Chart Widgets configuration
  const [widgets, setWidgets] = useState<ChartWidgetConfig[]>([
    {
      id: 'widget-monthly-trend',
      title: 'แนวโน้มอุบัติการณ์และสิ่งส่งตรวจรายเดือน',
      titleTh: 'แนวโน้มอุบัติการณ์รายเดือน',
      type: 'area',
      metricKey: 'monthly',
      departmentKey: 'all',
      columnWidth: 'half',
      isVisible: true,
      order: 1,
      description: 'แสดงแนวโน้มจำนวนอุบัติการณ์เปรียบเทียบสิ่งส่งตรวจในแต่ละเดือน',
    },
    {
      id: 'widget-dept-rejection',
      title: 'อัตราการปฏิเสธสิ่งส่งตรวจแยกตามแผนก (%)',
      titleTh: 'อัตราปฏิเสธแยกตามห้องปฏิบัติการ',
      type: 'bar',
      metricKey: 'rejectionRate',
      departmentKey: 'all',
      columnWidth: 'half',
      isVisible: true,
      order: 2,
      description: 'เปรียบเทียบ Rejection Rate % ของแต่ละห้องปฏิบัติการ',
    },
    {
      id: 'widget-category-pie',
      title: 'สัดส่วนสาเหตุความเสี่ยงและอุบัติการณ์ (Categories)',
      titleTh: 'สัดส่วนสาเหตุความเสี่ยง',
      type: 'donut',
      metricKey: 'categories',
      departmentKey: 'all',
      columnWidth: 'half',
      isVisible: true,
      order: 3,
      description: 'สัดส่วนประเภทความเสี่ยงที่พบบ่อยที่สุด',
    },
    {
      id: 'widget-severity-radar',
      title: 'การกระจายตัวระดับความรุนแรง (Risk Severity Matrix)',
      titleTh: 'ระดับความรุนแรง (Risk Matrix)',
      type: 'radar',
      metricKey: 'severity',
      departmentKey: 'all',
      columnWidth: 'half',
      isVisible: true,
      order: 4,
      description: 'วิเคราะห์ระดับความเสี่ยง Critical, High Risk, Moderate, Low Risk',
    },
  ]);

  // Handle Changing Chart Type on the fly
  const handleChangeChartType = (widgetId: string, newType: ChartType) => {
    if (!isAdmin) return;
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, type: newType } : w))
    );
  };

  // Toggle Visibility
  const handleToggleVisibility = (widgetId: string) => {
    if (!isAdmin) return;
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w))
    );
  };

  // Move Widget Order
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    const newWidgets = [...widgets];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newWidgets.length) return;

    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIdx];
    newWidgets[targetIdx] = temp;
    setWidgets(newWidgets.map((w, i) => ({ ...w, order: i + 1 })));
  };

  // Add New Chart Widget
  const handleAddWidget = (metricKey: ChartWidgetConfig['metricKey'], title: string, type: ChartType) => {
    const newWidget: ChartWidgetConfig = {
      id: `custom-widget-${Date.now()}`,
      title,
      titleTh: title,
      type,
      metricKey,
      departmentKey: currentDept,
      columnWidth: 'half',
      isVisible: true,
      order: widgets.length + 1,
    };
    setWidgets([...widgets, newWidget]);
    setShowConfigModal(false);
  };

  // Delete Widget
  const handleDeleteWidget = (widgetId: string) => {
    if (!isAdmin) return;
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  };

  // Format data for Department Comparison
  const deptChartData = Object.keys(fusedMetrics.departmentCounts).map((deptKey) => {
    const deptInfo = departments.find((d) => d.key === deptKey);
    const data = fusedMetrics.departmentCounts[deptKey];
    return {
      name: deptInfo?.nameTh || deptKey,
      rejectionRate: data.rate,
      incidents: data.count,
      specimens: data.specimens,
      rejected: data.rejected,
    };
  });

  // Format data for Severity Radar
  const severityData = [
    { subject: 'วิกฤต (Critical)', value: fusedMetrics.criticalIncidents, fullMark: Math.max(10, fusedMetrics.criticalIncidents * 1.5) },
    { subject: 'ความเสี่ยงสูง (High Risk)', value: fusedMetrics.highRiskIncidents, fullMark: Math.max(10, fusedMetrics.highRiskIncidents * 1.5) },
    { subject: 'ปานกลาง (Moderate)', value: fusedMetrics.moderateIncidents, fullMark: Math.max(10, fusedMetrics.moderateIncidents * 1.5) },
    { subject: 'ความเสี่ยงต่ำ (Low Risk)', value: fusedMetrics.lowRiskIncidents, fullMark: Math.max(10, fusedMetrics.lowRiskIncidents * 1.5) },
    { subject: 'Pre-analytical', value: fusedMetrics.stageCounts['Pre-analytical'] || 0, fullMark: Math.max(10, (fusedMetrics.stageCounts['Pre-analytical'] || 0) * 1.2) },
    { subject: 'Analytical', value: fusedMetrics.stageCounts['Analytical'] || 0, fullMark: Math.max(10, (fusedMetrics.stageCounts['Analytical'] || 0) * 1.2) },
  ];

  // Helper to Render Chart inside Widget
  const renderChart = (widget: ChartWidgetConfig) => {
    switch (widget.metricKey) {
      case 'monthly': {
        if (widget.type === 'bar') {
          return (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fusedMetrics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="incidents" name="อุบัติการณ์ (ครั้ง)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="rejected" name="สิ่งส่งตรวจปฏิเสธ (ราย)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        } else if (widget.type === 'line') {
          return (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={fusedMetrics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="incidents" name="อุบัติการณ์" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="rejected" name="สิ่งส่งตรวจปฏิเสธ" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          );
        } else {
          // Default Area Chart
          return (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={fusedMetrics.monthlyTrend}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="incidents" name="อุบัติการณ์" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncidents)" />
                <Area type="monotone" dataKey="rejected" name="สิ่งส่งตรวจปฏิเสธ" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRejected)" />
              </AreaChart>
            </ResponsiveContainer>
          );
        }
      }

      case 'rejectionRate': {
        if (widget.type === 'line') {
          return (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={deptChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="rejectionRate" name="Rejection Rate %" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          );
        } else {
          return (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px' }} />
                <Bar dataKey="rejectionRate" name="Rejection Rate %" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        }
      }

      case 'categories': {
        const catData = fusedMetrics.categoryBreakdown.slice(0, 6);
        if (widget.type === 'bar') {
          return (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px' }} />
                <Bar dataKey="count" name="จำนวนครั้ง" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        } else {
          // Donut or Pie
          return (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={widget.type === 'donut' ? 60 : 0}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {catData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px' }} />
                <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          );
        }
      }

      case 'severity': {
        if (widget.type === 'bar') {
          return (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px' }} />
                <Bar dataKey="value" name="จำนวนอุบัติการณ์" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        } else {
          // Radar
          return (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={severityData} cx="50%" cy="50%" outerRadius={85}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                <PolarRadiusAxis stroke="#cbd5e1" fontSize={10} />
                <Radar name="ระดับความเสี่ยง" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          );
        }
      }

      default:
        return null;
    }
  };

  const visibleWidgets = widgets.filter((w) => w.isVisible).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              ระบบแสดงผลสถิติและแผนภูมิเชิงโต้ตอบ (Interactive Data Charts)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ประมวลผลข้อมูลรวมจากทุกแหล่ง ({fusedMetrics.activeSources} แหล่งข้อมูล) • แสดงผลสถิติ พ.ศ. {selectedYear}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-center"
          >
            <Sliders className="w-4 h-4" />
            <span>ปรับแต่งแผนภูมิ & กราฟ (Admin Customize)</span>
          </button>
        )}
      </div>

      {/* Dynamic Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleWidgets.map((widget, idx) => (
          <div
            key={widget.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            {/* Widget Card Header */}
            <div className="flex items-start justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{widget.titleTh || widget.title}</h4>
                {widget.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{widget.description}</p>
                )}
              </div>

              {/* Chart Type Selector */}
              {isAdmin && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => handleChangeChartType(widget.id, 'bar')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      widget.type === 'bar' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="เปลี่ยนเป็นกราฟแท่ง (Bar Chart)"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleChangeChartType(widget.id, 'line')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      widget.type === 'line' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="เปลี่ยนเป็นกราฟเส้น (Line Chart)"
                  >
                    <LineChartIcon className="w-3.5 h-3.5" />
                  </button>
                  {(widget.metricKey === 'categories' || widget.metricKey === 'rejectionRate') && (
                    <button
                      onClick={() => handleChangeChartType(widget.id, 'donut')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        widget.type === 'donut' || widget.type === 'pie'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="เปลี่ยนเป็นกราฟวงกลม (Donut / Pie)"
                    >
                      <PieChartIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {widget.metricKey === 'monthly' && (
                    <button
                      onClick={() => handleChangeChartType(widget.id, 'area')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        widget.type === 'area' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="เปลี่ยนเป็นกราฟพื้นที่ (Area Chart)"
                    >
                      <AreaChartIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {widget.metricKey === 'severity' && (
                    <button
                      onClick={() => handleChangeChartType(widget.id, 'radar')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        widget.type === 'radar' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="เปลี่ยนเป็นกราฟเรดาร์ (Radar Chart)"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Chart Body */}
            <div className="w-full flex-1 flex items-center justify-center min-h-[280px]">
              {renderChart(widget)}
            </div>

            {/* Card Footer Info */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>ประเภทแผนภูมิ: <strong className="text-slate-600 uppercase">{widget.type}</strong></span>
              <span>อัปเดตแบบ Real-time</span>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Chart Customizer Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">จัดการและจัดเรียงแผนภูมิ (Chart Management)</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Existing Widgets List */}
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700">รายการแผนภูมิบนแดชบอร์ด</h4>
              {widgets.map((widget, idx) => (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{widget.titleTh || widget.title}</div>
                      <div className="text-[10px] text-slate-500">
                        Type: <span className="uppercase">{widget.type}</span> • Key: {widget.metricKey}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMoveOrder(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-500 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                      title="เลื่อนขึ้น"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(idx, 'down')}
                      disabled={idx === widgets.length - 1}
                      className="p-1 text-slate-500 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                      title="เลื่อนลง"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(widget.id)}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        widget.isVisible ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:bg-slate-200'
                      }`}
                      title={widget.isVisible ? 'ซ่อนแผนภูมินี้' : 'แสดงแผนภูมินี้'}
                    >
                      {widget.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteWidget(widget.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="ลบแผนภูมิ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Presets */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 mb-2">เพิ่มแผนภูมิใหม่ (Quick Add Chart)</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAddWidget('monthly', 'แนวโน้มสถิติรายเดือน (Bar Chart)', 'bar')}
                  className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left text-xs text-slate-800 transition-colors cursor-pointer"
                >
                  <div className="font-semibold">+ สถิติรายเดือน (Bar)</div>
                  <div className="text-[10px] text-slate-500">แท่งเปรียบเทียบอุบัติการณ์</div>
                </button>
                <button
                  onClick={() => handleAddWidget('rejectionRate', 'สัดส่วนปฏิเสธแยกตามแล็บ (Donut)', 'donut')}
                  className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left text-xs text-slate-800 transition-colors cursor-pointer"
                >
                  <div className="font-semibold">+ Rejection Donut Chart</div>
                  <div className="text-[10px] text-slate-500">สัดส่วนวงกลมของแล็บ</div>
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
