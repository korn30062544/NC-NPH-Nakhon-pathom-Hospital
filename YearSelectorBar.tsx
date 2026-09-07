import React from 'react';

interface YearSelectorBarProps {
  selectedYear: number;
  onSelectYear: (year: number) => void;
  yearlyData: { year: number; totalIncidents?: number }[];
  defaultViewCount?: number; // strictly 5 years
  latestYear?: number; // default 2569
  deptThName?: string;
}

export const YearSelectorBar: React.FC<YearSelectorBarProps> = ({
  selectedYear,
  onSelectYear,
  yearlyData,
  defaultViewCount = 5,
  latestYear = 2569,
  deptThName,
}) => {
  // Sorted list of years, filtered to strictly the 5 latest years (พ.ศ. 2565 - 2569)
  const allYears = [...yearlyData].sort((a, b) => a.year - b.year);
  const displayedYears = allYears.slice(-defaultViewCount);

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#c1c7d2] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      {/* Title & Badge */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="w-8 h-8 rounded-lg bg-[#003e6f]/10 text-[#003e6f] flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">calendar_month</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-[#141d23]">
              สถิติความเสี่ยงย้อนหลัง 5 ปี {deptThName ? `(${deptThName})` : ''}
            </span>
            <span className="bg-[#ecf5fe] text-[#003e6f] border border-[#003e6f]/20 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-[#006e25]">verified</span>
              พ.ศ. 2565 – 2569
            </span>
          </div>
          <p className="text-[11px] text-[#727781] mt-0.5">
            แสดงผลสถิติและแนวโน้มความเสี่ยง 5 ปีล่าสุด (เป้าหมายลดอุบัติการณ์ต่อเนื่อง)
          </p>
        </div>
      </div>

      {/* Year Pills */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0">
        {displayedYears.map((item) => {
          const isSelected = selectedYear === item.year;
          const isLatest = item.year === latestYear;
          return (
            <button
              key={item.year}
              type="button"
              onClick={() => onSelectYear(item.year)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#003e6f] text-white shadow-xs ring-2 ring-[#003e6f]/30'
                  : 'bg-[#f6faff] text-[#414750] border border-[#c1c7d2] hover:bg-[#e0e9f2] hover:text-[#003e6f]'
              }`}
            >
              <span>ปี {item.year}</span>
              {isLatest && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    isSelected
                      ? 'bg-[#80f98b] text-[#004e18]'
                      : 'bg-[#80f98b]/40 text-[#006e25]'
                  }`}
                >
                  ล่าสุด
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

