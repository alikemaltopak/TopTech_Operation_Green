
import React, { useState, useEffect, useRef } from 'react';
import { GardenStatus } from '../types';
import WeatherHero from './WeatherHero';
import StatusTile from './StatusTile';
import ScheduleModal from './ScheduleModal';

interface DashboardProps {
  status: GardenStatus;
  activeLandName: string;
  onIrrigate: (minutes?: number) => void;
  onUpdateSchedule: (time: string, day: string) => void;
  onToggleSchedule: () => void;
  currentSession?: { startTime: Date; durationMinutes?: number } | null;
}

const PlantAnimation: React.FC<{ progress: number; isIrrigating: boolean }> = ({ progress, isIrrigating }) => {
  const isFinished = progress >= 1;
  const growthScale = 0.75 + progress * 0.25;
  
  return (
    <div className="flex flex-col items-center justify-center py-2 relative">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Advanced Background Glows */}
        <div 
          className={`absolute inset-0 rounded-full blur-[50px] transition-all duration-1000 ${isIrrigating ? 'bg-primary/25 opacity-70' : 'bg-primary/5 opacity-20'}`}
        ></div>
        
        {/* Precise Technical Orbital Ring */}
        <svg className="absolute w-full h-full -rotate-90 pointer-events-none">
          <circle 
            cx="128" cy="128" r="110" 
            fill="transparent" 
            stroke="currentColor" 
            strokeWidth="0.5" 
            className="text-slate-200 dark:text-surface-dark opacity-30"
          />
          <circle 
            cx="128" cy="128" r="110" 
            fill="transparent" 
            stroke="url(#proRoseGradient)" 
            strokeWidth="4" 
            strokeDasharray="691" 
            strokeDashoffset={691 * (1 - progress)}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
          <defs>
            <linearGradient id="proRoseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#76c893" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
        </svg>

        {/* Professional Rose Morphing Animation */}
        <div 
          className="relative z-10 transition-all duration-1000 ease-out" 
          style={{ 
            transform: `scale(${growthScale}) translateY(${(1 - progress) * 12}px)`,
            filter: `drop-shadow(0 0 15px ${isFinished ? 'rgba(225, 29, 72, 0.4)' : 'rgba(19, 236, 91, 0.2)'})`
          }}
        >
          <svg width="160" height="160" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stalk */}
            <path 
              d="M50 98C50 98 48 82 50 45" 
              stroke={isFinished ? "#13ec5b" : "#2d5a3c"} 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              className="transition-all duration-1000"
            />
            
            {/* Organic Leaves with Motion */}
            <path 
              d="M50 78C32 78 18 58 50 65" 
              fill={isIrrigating ? "#13ec5b" : "#2d5a3c"} 
              className="transition-all duration-1000 opacity-90"
              style={{ transform: `rotate(${-12 + progress * 12}deg)`, transformOrigin: '50px 78px' }}
            />
            <path 
              d="M50 72C68 72 82 52 50 58" 
              fill={isIrrigating ? "#13ec5b" : "#2d5a3c"} 
              className="transition-all duration-1000 opacity-90"
              style={{ transform: `rotate(${12 - progress * 12}deg)`, transformOrigin: '50px 72px' }}
            />

            {/* Bloom Cluster */}
            <g style={{ opacity: Math.max(0, (progress - 0.2) * 1.5), transform: `scale(${0.4 + progress * 0.6})`, transformOrigin: '50px 40px' }} className="transition-all duration-700">
              {/* Petals with shading */}
              <circle cx="50" cy="35" r="16" fill="#881337" className="transition-all duration-1000" />
              <path d="M50 20C35 20 25 35 50 45C75 35 65 20 50 20Z" fill="#be123c" style={{ transformOrigin: '50px 35px', transform: `rotate(${-15 + progress * 15}deg)` }} />
              <path d="M35 45C35 35 50 25 50 45C50 65 35 55 35 45Z" fill="#e11d48" style={{ opacity: 0.9 }} />
              <path d="M65 45C65 35 50 25 50 45C50 65 65 55 65 45Z" fill="#e11d48" style={{ opacity: 0.9 }} />
              <circle cx="50" cy="48" r="13" fill="#f43f5e" />
              
              {/* Core Detail */}
              <circle cx="50" cy="40" r="6" fill="#fb7185" className="animate-pulse" />
            </g>
          </svg>
        </div>

        {/* Rain particles */}
        {isIrrigating && !isFinished && (
          <div className="absolute top-0 w-full h-1/2 overflow-hidden flex justify-around opacity-40 pointer-events-none">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className={`w-[1px] h-8 bg-gradient-to-b from-blue-300 to-transparent animate-[rain_0.7s_infinite]`}
                style={{ animationDelay: `${i * 0.12}s`, left: `${i * 16}%` }}
              ></div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex flex-col items-center gap-1.5">
         <div className={`px-10 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 border ${isIrrigating ? 'bg-primary text-background-dark border-primary shadow-xl shadow-primary/20 animate-pulse' : 'bg-surface-dark text-slate-500 border-white/5'}`}>
            {isFinished ? 'BAŞARIYLA TAMAMLANDI' : isIrrigating ? 'ARAZİ SULANIYOR...' : 'SİSTEM HAZIR'}
         </div>
         {isIrrigating && (
           <div className="flex items-center gap-2 text-[9px] font-black text-primary/60 tracking-widest mt-1">
             <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
             OTOMASYON AKTİF
           </div>
         )}
      </div>

      <style>{`
        @keyframes rain {
          0% { transform: translateY(-40px); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(130px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ status, activeLandName, onIrrigate, onUpdateSchedule, onToggleSchedule, currentSession }) => {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(10);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const adjustMinutes = (amount: number) => {
    if (status.isIrrigating) return;
    setSelectedMinutes(prev => Math.max(1, Math.min(120, prev + amount)));
  };

  const startIrrigation = () => {
    if (!status.isIrrigating) {
      setTimeLeft(selectedMinutes * 60);
      onIrrigate(selectedMinutes);
    } else {
      stopIrrigation();
    }
  };

  const stopIrrigation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(0);
    if (status.isIrrigating) onIrrigate();
  };

  // Initialize timer on mount or when session changes
  useEffect(() => {
    if (status.isIrrigating && currentSession?.startTime && currentSession.durationMinutes) {
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000);
      const remaining = (currentSession.durationMinutes * 60) - elapsedSeconds;
      
      if (remaining > 0) {
        setTimeLeft(remaining);
        setSelectedMinutes(currentSession.durationMinutes);
      } else {
        setTimeLeft(0);
        onIrrigate(); // force stop if already expired
      }
    } else if (!status.isIrrigating) {
      setTimeLeft(0);
    }
  }, [status.isIrrigating, currentSession]);

  // Handle countdown interval
  useEffect(() => {
    if (status.isIrrigating && timeLeft > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            onIrrigate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!status.isIrrigating) {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status.isIrrigating, timeLeft > 0]);

  const progress = (timeLeft === 0 && !status.isIrrigating) ? 0 : 
                   (timeLeft === 0 && status.isIrrigating) ? 0 : 
                   Math.max(0, Math.min(1, (selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)));
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tankPercentage = Math.round((status.waterRemaining / status.tankCapacity) * 100);

  return (
    <div className="animate-in fade-in duration-700 pb-12 overflow-x-hidden">
      {/* System Status Header */}
      <div className="mt-6 mb-2 text-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeLandName}</h1>
        <p className="text-slate-600 dark:text-[#92c9a4] text-[9px] font-black uppercase tracking-[0.25em] mt-1 opacity-60">
          PRO-SULAMA PANELİ v2.5
        </p>
      </div>

      {/* Hero Animation Area */}
      <div className="mb-4">
         <PlantAnimation progress={progress} isIrrigating={status.isIrrigating} />
      </div>

      {/* Controller Card - FIXED Centering and Clipping */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-[2.5rem] border border-border-light dark:border-border-dark p-6 shadow-2xl relative overflow-hidden backdrop-blur-md mx-1 text-slate-900 dark:text-white">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="flex flex-col items-center gap-5 w-full">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] text-center">SULAMA SÜRESİ KONTROLÜ</span>
            
            {/* Grid Layout for Perfect Centering */}
            <div className="grid grid-cols-5 items-center w-full px-1">
              {/* Left Button */}
              <div className="col-span-1 flex justify-start">
                <button 
                  onClick={() => adjustMinutes(-1)}
                  disabled={status.isIrrigating}
                  className="h-12 w-12 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary transition-all active:scale-90 disabled:opacity-5"
                >
                  <span className="material-symbols-outlined text-2xl">remove</span>
                </button>
              </div>

              {/* Center Counter */}
              <div className="col-span-3 flex flex-col items-center justify-center">
                <div className="text-5xl font-black text-slate-900 dark:text-primary tabular-nums leading-none tracking-tight">
                  {status.isIrrigating ? formatTime(timeLeft) : selectedMinutes}
                </div>
                <div className="text-[10px] font-black text-primary tracking-[0.2em] mt-3 uppercase whitespace-nowrap">
                  {status.isIrrigating ? 'KALAN SÜRE' : 'DAKİKA'}
                </div>
              </div>

              {/* Right Button */}
              <div className="col-span-1 flex justify-end">
                <button 
                  onClick={() => adjustMinutes(1)}
                  disabled={status.isIrrigating}
                  className="h-12 w-12 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary transition-all active:scale-90 disabled:opacity-5"
                >
                  <span className="material-symbols-outlined text-2xl">add</span>
                </button>
              </div>
            </div>
            
            {/* Quick Presets Slider */}
            {!status.isIrrigating && (
              <div className="flex gap-2 w-full justify-center py-1">
                {[5, 10, 15, 30].map(m => (
                  <button 
                    key={m}
                    onClick={() => setSelectedMinutes(m)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black border transition-all ${selectedMinutes === m ? 'bg-primary text-background-dark border-primary shadow-lg shadow-primary/20' : 'border-border-light dark:border-border-dark text-slate-700 dark:text-slate-300 hover:bg-white/5'}`}
                  >
                    {m} DK
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Large Action Button */}
          <button 
            onClick={startIrrigation}
            className={`w-full flex items-center justify-center gap-4 ${status.isIrrigating ? 'bg-rose-500 text-white border-rose-600' : 'bg-primary text-background-dark border-border-light dark:border-primary'} border font-black text-xl h-20 rounded-[2rem] glow-button transition-all active:scale-[0.98] shadow-2xl relative group`}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${status.isIrrigating ? 'bg-white/20' : 'bg-black/10'}`}>
              <span className={`material-symbols-outlined text-2xl font-bold ${status.isIrrigating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                {status.isIrrigating ? 'cached' : 'water_drop'}
              </span>
            </div>
            <span>{status.isIrrigating ? 'DURDUR' : 'BAŞLAT'}</span>
          </button>
        </div>
      </div>

      {/* Grid Status Tiles */}
      <div className="grid grid-cols-2 gap-4 mt-8 px-1">
        <StatusTile 
          icon="opacity" 
          label="Toprak Nemi" 
          value={`%${Math.round(status.moisture)}`} 
          subValue={status.moisture > 60 ? "Seviye İdeal" : "Kritik Seviye"} 
        />
        
        {/* Custom Next Session Tile with Toggle */}
        <div 
          onClick={() => setIsScheduleModalOpen(true)}
          className="flex flex-col gap-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-5 shadow-sm active:scale-95 transition-transform cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className={`material-symbols-outlined transition-colors text-2xl ${status.isScheduleActive ? 'text-primary' : 'text-slate-700'}`}>event_note</span>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] font-black text-slate-600 dark:text-[#92c9a4] uppercase tracking-tighter">SONRAKİ OTURUM</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={status.isScheduleActive} 
                  onChange={onToggleSchedule} 
                />
                <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none dark:bg-border-dark rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary transition-colors"></div>
              </label>
            </div>
          </div>
          <div className={`flex flex-col transition-opacity duration-300 ${status.isScheduleActive ? 'opacity-100' : 'opacity-30'}`}>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{status.nextSchedule}</h2>
            <p className="text-xs text-slate-700 dark:text-[#92c9a4] font-medium mt-1 leading-tight">{status.nextScheduleDay}</p>
          </div>
        </div>
        
        {/* Tank Level Card Updated - Label and Sub-label cleanup */}
        <div className="col-span-2 flex items-center justify-between gap-4 rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-400 text-4xl">database</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">{status.waterRemaining.toFixed(1)}L</h2>
                <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">MEVCUT DOLULUK</span>
              </div>
              <p className="text-[9px] text-slate-700 dark:text-[#92c9a4] font-bold uppercase tracking-[0.2em] mt-1 opacity-70">Sistem Kapasite Verisi</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">%{tankPercentage}</span>
            <div className="w-16 h-1 bg-slate-100 dark:bg-border-dark rounded-full mt-2 overflow-hidden">
                <div 
                    className="h-full bg-blue-400 transition-all duration-1000" 
                    style={{ width: `${tankPercentage}%` }}
                ></div>
            </div>
          </div>
        </div>
      </div>

      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        onSave={onUpdateSchedule}
        currentTime={status.nextSchedule}
      />
    </div>
  );
};

export default Dashboard;
