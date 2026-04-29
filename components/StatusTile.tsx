
import React from 'react';

interface StatusTileProps {
  icon: string;
  label: string;
  value: string;
  subValue: string;
}

const StatusTile: React.FC<StatusTileProps> = ({ icon, label, value, subValue }) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-5 shadow-sm active:scale-95 transition-transform cursor-pointer">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
        <span className="text-[10px] font-bold text-slate-700 dark:text-[#92c9a4] uppercase tracking-tighter">{label}</span>
      </div>
      <div className="flex flex-col">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</h2>
        <p className="text-xs text-slate-700 dark:text-[#92c9a4] font-medium mt-1 leading-tight">{subValue}</p>
      </div>
    </div>
  );
};

export default StatusTile;
