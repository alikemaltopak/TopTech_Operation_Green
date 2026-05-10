
import React from 'react';

interface GaugeProps {
  value: number;
}

const Gauge: React.FC<GaugeProps> = ({ value }) => {
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-64 h-64 rounded-full border-8 border-border-light dark:border-surface-dark bg-transparent">
      {/* Circular Progress Background */}
      <svg className="absolute w-full h-full -rotate-90">
        <circle 
          className="text-slate-100 dark:text-surface-dark" 
          cx="128" cy="128" 
          fill="transparent" 
          r={radius} 
          stroke="currentColor" 
          strokeWidth="12"
        ></circle>
        <circle 
          className="text-primary transition-all duration-700 ease-out" 
          cx="128" cy="128" 
          fill="transparent" 
          r={radius} 
          stroke="currentColor" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          strokeWidth="12"
        ></circle>
      </svg>
      
      <div className="text-center z-10">
        <span className="material-symbols-outlined text-primary text-4xl mb-1">opacity</span>
        <div className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tighter transition-all">
          {value}%
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-[#92c9a4] uppercase tracking-widest mt-1">
          Toprak Nemi
        </div>
      </div>

      {/* Status Badge */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${value >= 40 && value <= 80 ? 'bg-primary text-background-dark' : 'bg-red-500 text-white'}`}>
        {value >= 40 && value <= 80 ? 'İDEAL' : value < 40 ? 'DÜŞÜK' : 'YÜKSEK'}
      </div>
    </div>
  );
};

export default Gauge;
