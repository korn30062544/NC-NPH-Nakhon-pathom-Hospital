import React from 'react';
import { motion } from 'motion/react';
import { RiskIncident } from '../types';
import { translateRiskLevel } from '../utils/labels';

interface NotificationsModalProps {
  onClose: () => void;
  incidents: RiskIncident[];
  onSelectIncident: (incident: RiskIncident) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  onClose,
  incidents,
  onSelectIncident,
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl border border-[#c1c7d2] max-w-md w-full overflow-hidden"
      >
        <div className="bg-[#003e6f] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">notifications_active</span>
            <h3 className="text-base font-bold font-headline-sm">การแจ้งเตือนความเสี่ยง (Alerts)</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto space-y-3">
          {incidents.slice(0, 4).map((inc, idx) => (
            <div
              key={`${inc.id || 'inc'}-${idx}`}
              onClick={() => {
                onSelectIncident(inc);
                onClose();
              }}
              className="p-3 bg-[#f6faff] hover:bg-[#ecf5fe] border border-[#c1c7d2] rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono font-bold text-[#003e6f]">{inc.incidentId}</span>
                <span className="text-[11px] text-[#727781]">{inc.date}</span>
              </div>
              <p className="text-xs font-semibold text-[#141d23] line-clamp-1">{inc.title}</p>
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-[#414750]">{inc.department}</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    inc.riskLevel === 'Critical'
                      ? 'bg-[#ffdad6] text-[#93000a]'
                      : 'bg-[#ffdad9] text-[#7e0019]'
                  }`}
                >
                  {translateRiskLevel(inc.riskLevel)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#f6faff] border-t border-[#c1c7d2] text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#003e6f] hover:underline"
          >
            ปิดหน้าต่าง (Close)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
