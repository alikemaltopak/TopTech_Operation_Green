import { WaterIrrigationPhysicsEngine, InstantState } from '../lib/WaterIrrigationPhysicsEngine';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GardenStatus } from '../types';
import WeatherHero from './WeatherHero';
import StatusTile from './StatusTile';
import ScheduleModal from './ScheduleModal';

interface DashboardProps {
  status: GardenStatus;
  activeLandName: string;
  activeLandPhoneNumber?: string;
  onIrrigate: (minutes?: number, forceState?: boolean) => void;
  onRefillTank?: () => void;
  onUpdateSchedule: (time: string, day: string) => void;
  onToggleSchedule: () => void;
  currentSession?: { startTime: Date; durationMinutes?: number } | null;
  onPhysicsUpdate?: (totalConsumedLiters: number) => void;
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

/* ─── Dairesel SVG Gauge Bileşeni ─── */
const CircularGauge: React.FC<{ percentage: number; size?: number; strokeWidth?: number; label: string }> = ({ percentage, size = 100, strokeWidth = 8, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percentage)) / 100);
  
  // Renk: yeşil → sarı → kırmızı
  const getColor = (pct: number) => {
    if (pct > 60) return '#22c55e';
    if (pct > 30) return '#eab308';
    if (pct > 10) return '#f97316';
    return '#ef4444';
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-border-dark opacity-40"
          />
          {/* Value arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="transparent"
            stroke={getColor(percentage)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${getColor(percentage)}40)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
            %{Math.round(percentage)}
          </span>
        </div>
      </div>
      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">{label}</span>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ status, activeLandName, activeLandPhoneNumber, onIrrigate, onRefillTank, onUpdateSchedule, onToggleSchedule, currentSession, onPhysicsUpdate }) => {
  // ─── Physics Engine ───
  const physicsEngineRef = useRef<WaterIrrigationPhysicsEngine | null>(null);
  const [physicsState, setPhysicsState] = useState<InstantState | null>(null);
  const irrigationStartRef = useRef<number | null>(null);
  const [estimatedDrainMin, setEstimatedDrainMin] = useState<number>(0);

  // Initialize engine when config changes
  useEffect(() => {
    const config = {
      capacityLiters: status.tankCapacity,
      baseHeightMeters: status.baseHeightMeters,
      netWaterHeightMeters: status.netWaterHeightMeters,
      pipeLengthMeters: status.pipeLengthMeters || 20,
      irrigationType: status.irrigationType || 'drip',
      dripperCount: status.dripperCount || 300,
      dripperFlowRateLph: status.dripperFlowRateLph || 8.0,
      valveSize: status.valveSize,
    };
    physicsEngineRef.current = new WaterIrrigationPhysicsEngine(config);
    physicsEngineRef.current.resetTank(status.waterRemaining);
    setEstimatedDrainMin(physicsEngineRef.current.getEstimatedDrainTimeMinutes());
  }, [status.tankCapacity, status.baseHeightMeters, status.netWaterHeightMeters, status.pipeLengthMeters, status.irrigationType, status.dripperCount, status.dripperFlowRateLph, status.valveSize, status.waterRemaining]);

  // Physics timer — starts when irrigation begins, cleans up when it ends
  useEffect(() => {
    if (status.isIrrigating && physicsEngineRef.current) {
      // Capture start time in ref (no re-render loop)
      if (irrigationStartRef.current === null) {
        physicsEngineRef.current.startIrrigation();
        irrigationStartRef.current = Date.now();
      }

      const intervalId = window.setInterval(() => {
        if (irrigationStartRef.current && physicsEngineRef.current) {
          const elapsed = Math.floor((Date.now() - irrigationStartRef.current) / 1000);
          const state = physicsEngineRef.current.calculateState(elapsed);
          setPhysicsState(state);
          // Report consumption to parent
          onPhysicsUpdate?.(state.totalConsumedLiters);
        }
      }, 1000);

      return () => window.clearInterval(intervalId);
    } else {
      // Irrigation stopped
      irrigationStartRef.current = null;
      setPhysicsState(null);
    }
  }, [status.isIrrigating, onPhysicsUpdate]);

  // ─── Timer State ───
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
      onIrrigate(selectedMinutes, true);
    } else {
      stopIrrigation();
    }
  };

  const stopIrrigation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(0);
    if (status.isIrrigating) onIrrigate(undefined, false);
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
        onIrrigate(undefined, false); // force stop if already expired
      }
    } else if (!status.isIrrigating) {
      setTimeLeft(0);
    }
  }, [status.isIrrigating, currentSession, onIrrigate]);

  // Handle countdown interval
  useEffect(() => {
    if (status.isIrrigating && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status.isIrrigating, timeLeft > 0]);

  // Trigger explicit stop when countdown reaches 0
  useEffect(() => {
    // Sulama Dashboard dışından (otomatik zamanlama) başlatıldığında timeLeft henüz 0'dır;
    // oturumun süresi gerçekten dolmadıysa durdurma.
    const sessionSecondsLeft = currentSession?.durationMinutes
      ? currentSession.durationMinutes * 60 - Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000)
      : 0;
    if (status.isIrrigating && timeLeft === 0 && irrigationStartRef.current !== null && sessionSecondsLeft <= 0) {
      onIrrigate(undefined, false);
    }
  }, [status.isIrrigating, timeLeft, onIrrigate, currentSession]);

  const progress = (timeLeft === 0 && !status.isIrrigating) ? 0 : 
                   (timeLeft === 0 && status.isIrrigating) ? 0 : 
                   Math.max(0, Math.min(1, (selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)));
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayedWaterRemaining = physicsState && status.isIrrigating 
    ? physicsState.remainingLiters 
    : status.waterRemaining;
  const tankPercentage = Math.round((displayedWaterRemaining / status.tankCapacity) * 100);

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

      {/* ═══════ ANLIK SU ANALİZİ PANELİ (Torricelli Fizik Motoru) ═══════ */}
      {physicsState && status.isIrrigating && (
        <div className="mt-6 mx-1 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <div className="bg-surface-light dark:bg-surface-dark rounded-[2rem] border border-border-light dark:border-border-dark p-6 shadow-2xl relative overflow-hidden">
            {/* Decorative top bar */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-400 text-xl">science</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Anlık Su Analizi</h3>
                  <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em]">TORRİCELLİ İNTEGRAL MODELİ</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">CANLI</span>
              </div>
            </div>

            {/* Gauge + Stats Grid */}
            <div className="flex items-center gap-6 mb-5">
              {/* Circular Gauge */}
              <CircularGauge 
                percentage={physicsState.percentage} 
                size={110} 
                strokeWidth={10} 
                label="DEPO DOLULUK"
              />
              
              {/* Flow Rate - Hero stat */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="bg-slate-50 dark:bg-black/30 rounded-2xl p-4 border border-slate-100 dark:border-border-dark">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-blue-400 text-base">speed</span>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">ANLIK AKIŞ HIZI</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
                      {physicsState.flowRateLitersPerMin.toFixed(1)}
                    </span>
                    <span className="text-xs font-black text-blue-400">L/dk</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                    ({physicsState.flowRateLitersPerSec.toFixed(2)} L/sn)
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Kalan Su */}
              <div className="bg-slate-50 dark:bg-black/30 rounded-xl p-3 border border-slate-100 dark:border-border-dark text-center">
                <span className="material-symbols-outlined text-cyan-400 text-lg mb-1 block">water_drop</span>
                <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums leading-none block">
                  {physicsState.remainingLiters < 1000 
                    ? `${Math.round(physicsState.remainingLiters)}` 
                    : `${(physicsState.remainingLiters / 1000).toFixed(1)}k`}
                </span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mt-1">KALAN (L)</span>
              </div>

              {/* Toplam Tüketim */}
              <div className="bg-slate-50 dark:bg-black/30 rounded-xl p-3 border border-slate-100 dark:border-border-dark text-center">
                <span className="material-symbols-outlined text-orange-400 text-lg mb-1 block">local_fire_department</span>
                <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums leading-none block">
                  {physicsState.totalConsumedLiters < 1000 
                    ? `${Math.round(physicsState.totalConsumedLiters)}` 
                    : `${(physicsState.totalConsumedLiters / 1000).toFixed(1)}k`}
                </span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mt-1">TÜKETİM (L)</span>
              </div>

              {/* Tahmini Boşalma */}
              <div className="bg-slate-50 dark:bg-black/30 rounded-xl p-3 border border-slate-100 dark:border-border-dark text-center">
                <span className="material-symbols-outlined text-amber-400 text-lg mb-1 block">timer</span>
                <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums leading-none block">
                  {estimatedDrainMin < 60 
                    ? `${Math.round(estimatedDrainMin)}` 
                    : `${Math.floor(estimatedDrainMin / 60)}s ${Math.round(estimatedDrainMin % 60)}`}
                </span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mt-1">
                  {estimatedDrainMin < 60 ? 'BOŞALMA (DK)' : 'BOŞALMA'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5">
                <span>DEPO SEVİYESİ</span>
                <span className="tabular-nums">{physicsState.remainingLiters.toFixed(0)}L / {status.tankCapacity}L</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-border-dark rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${physicsState.percentage}%`,
                    background: physicsState.percentage > 60 
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)' 
                      : physicsState.percentage > 30 
                        ? 'linear-gradient(90deg, #eab308, #facc15)' 
                        : 'linear-gradient(90deg, #ef4444, #f87171)'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        
        {/* Tank Level Card */}
        <div className="col-span-2 flex flex-col gap-4 rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-blue-400 text-3xl">database</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{displayedWaterRemaining.toFixed(1)}L</h2>
                  <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">MEVCUT DOLULUK</span>
                </div>
                <p className="text-[9px] text-slate-700 dark:text-[#92c9a4] font-bold uppercase tracking-[0.2em] mt-0.5 opacity-70">
                  {status.tankCapacity}L Kapasite
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">%{tankPercentage}</span>
              <div className="w-16 h-1 bg-slate-100 dark:bg-border-dark rounded-full mt-1.5 overflow-hidden">
                  <div 
                      className="h-full bg-blue-400 transition-all duration-1000" 
                      style={{ width: `${tankPercentage}%` }}
                  ></div>
              </div>
            </div>
          </div>

          {/* Depo Doldur Butonu */}
          {onRefillTank && (
            <button
              onClick={() => {
                onRefillTank();
                physicsEngineRef.current?.resetTank(status.tankCapacity);
              }}
              className="w-full py-2.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">local_shipping</span>
              <span>DEPOYU TAMAMEN DOLDUR (%100)</span>
            </button>
          )}
        </div>
      </div>

      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        onSave={onUpdateSchedule}
        currentTime={status.nextSchedule}
        phoneNumber={activeLandPhoneNumber}
      />
    </div>
  );
};

export default Dashboard;
