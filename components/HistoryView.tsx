
import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { IrrigationSession } from '../types';

interface HistoryViewProps {
  activeLandName: string;
  activeLandImage?: string;
  sessions: IrrigationSession[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ activeLandName, activeLandImage, sessions }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(() => today.getDate());
  const [selectedSession, setSelectedSession] = useState<IrrigationSession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const currentMonthName = currentDate.toLocaleString('tr-TR', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  
  // Sulama yapılan günler listesi (dinamik olarak sessions'dan çıkarılır)
  const irrigationDays = useMemo(() => {
    const sessionDays = sessions
      .filter(s => s.date.startsWith(currentMonthStr))
      .map(s => parseInt(s.date.split('-')[2], 10));
    
    return Array.from(new Set([...sessionDays]));
  }, [sessions, currentMonthStr]);

  // Seçilen güne ait tüm oturumlar
  const daySessions = useMemo(() => {
    const selectedDateStr = `${currentMonthStr}-${selectedDay.toString().padStart(2, '0')}`;
    return sessions.filter(s => s.date === selectedDateStr);
  }, [selectedDay, sessions, currentMonthStr]);

  const hasIrrigation = daySessions.length > 0;

  const weekdays = ['PT', 'SA', 'ÇA', 'PE', 'CU', 'CT', 'PZ'];
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedSessionDateFormatted = useMemo(() => {
    if (!selectedSession) return '';
    const [sYear, sMonth, sDay] = selectedSession.date.split('-');
    const sDateObj = new Date(parseInt(sYear), parseInt(sMonth) - 1, parseInt(sDay));
    const sMonthName = sDateObj.toLocaleString('tr-TR', { month: 'long' });
    return `${sDay} ${sMonthName.toUpperCase()} ${sYear}`;
  }, [selectedSession]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      const now = new Date();
      if (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() === now.getMonth()) {
        setSelectedDay(now.getDate());
      } else {
        setSelectedDay(1);
      }
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      const now = new Date();
      if (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() === now.getMonth()) {
        setSelectedDay(now.getDate());
      } else {
        setSelectedDay(1);
      }
      return newDate;
    });
  };

  const handleOpenDetail = (session: IrrigationSession) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sulama Geçmişi</h1>
        <div className="flex items-center gap-2 mt-1">
           <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
           <p className="text-slate-700 dark:text-[#92c9a4] text-xs font-bold uppercase tracking-wider">Sistem Kayıtları</p>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-[2.5rem] p-7 border border-border-light dark:border-border-dark shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-[0.1em]">{currentMonthName} {currentYear}</h3>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevMonth}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-200/60 dark:bg-white/5 text-slate-700 dark:text-primary border border-slate-300/50 dark:border-white/10 hover:bg-slate-300/80 dark:hover:bg-white/10 transition-all active:scale-90"
            >
               <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
            </button>
            <button 
              onClick={handleNextMonth}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-200/60 dark:bg-white/5 text-slate-700 dark:text-primary border border-slate-300/50 dark:border-white/10 hover:bg-slate-300/80 dark:hover:bg-white/10 transition-all active:scale-90"
            >
               <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-5 text-center relative z-10">
          {weekdays.map(wd => (
            <div key={wd} className="text-[10px] font-black text-slate-600 dark:text-[#92c9a4]/40 tracking-[0.2em]">{wd}</div>
          ))}
          
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10"></div>
          ))}

          {calendarDays.map(day => {
            const isSelected = day === selectedDay;
            const dayHasIrrigation = irrigationDays.includes(day);

            return (
              <div 
                key={day} 
                onClick={() => setSelectedDay(day)}
                className="flex flex-col items-center justify-center relative cursor-pointer group"
              >
                <div className={`
                  w-10 h-10 flex items-center justify-center rounded-[12px] text-xs font-black transition-all duration-300
                  ${isSelected 
                    ? 'bg-primary text-background-dark scale-110 shadow-lg shadow-primary/30 ring-4 ring-primary/10' 
                    : 'text-slate-900 dark:text-white hover:bg-white/5'}
                `}>
                  {day}
                </div>
                {dayHasIrrigation && (
                  <div className={`absolute -bottom-1 w-1 h-1 rounded-full transition-all duration-500 ${isSelected ? 'bg-background-dark scale-150' : 'bg-primary'}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Simplified Status View Updated per Screenshot */}
      <div className="flex flex-col gap-4 min-h-[160px]">
        {hasIrrigation ? (
          daySessions.map(session => (
            <div 
              key={session.id}
              onClick={() => handleOpenDetail(session)}
              className="flex flex-col gap-5 p-6 rounded-[2rem] border border-primary/20 bg-surface-light dark:bg-surface-dark shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative cursor-pointer active:scale-[0.98] transition-all group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-[1.25rem] border border-primary/20 overflow-hidden shadow-inner flex items-center justify-center bg-black/20 shrink-0">
                  {activeLandImage ? (
                    <img src={activeLandImage} alt={session.landName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <span className="material-symbols-outlined text-primary text-2xl">landscape</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight uppercase">{session.landName}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.15em] mt-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    SULAMA BAŞARIYLA YAPILDI
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-200 dark:border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 dark:text-[#92c9a4] uppercase tracking-widest">{selectedDay} {currentMonthName.toUpperCase()} {currentYear}</span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base font-bold">check_circle</span>
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">SİSTEM KAYDI ONAYLANDI</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-8 text-center bg-slate-50 dark:bg-black/30 rounded-[2.5rem] border border-dashed border-border-light dark:border-border-dark animate-in fade-in zoom-in duration-500">
             <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-black/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-slate-400 dark:text-[#92c9a4]/60 text-4xl">bedtime</span>
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Kayıt Bulunmuyor</h3>
             <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
               {selectedDay} {currentMonthName} tarihinde {activeLandName} arazisinde bir sulama işlemi gerçekleştirilmedi.
             </p>
          </div>
        )}
      </div>

      {/* Detay Modalı */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title="Sulama Detayları"
      >
        {selectedSession && (
          <div className="flex flex-col gap-6 p-1">
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-border-light/10 dark:border-white/5">
                <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-primary/20">
                   <img src={activeLandImage} className="w-full h-full object-cover" />
                </div>
                 <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">{selectedSession.landName}</h4>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedSessionDateFormatted}</p>
                 </div>
             </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-100 dark:bg-black/30 p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center">
                   <span className="material-symbols-outlined text-primary text-lg mb-1">play_arrow</span>
                   <span className="text-[9px] font-black text-slate-600 dark:text-[#92c9a4]/60 uppercase tracking-widest mb-1">BAŞLANGIÇ</span>
                   <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{selectedSession.startTime}</span>
                </div>
                <div className="bg-slate-100 dark:bg-black/30 p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center">
                   <span className="material-symbols-outlined text-rose-500 text-lg mb-1">stop</span>
                   <span className="text-[9px] font-black text-slate-600 dark:text-[#92c9a4]/60 uppercase tracking-widest mb-1">BİTİŞ</span>
                   <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{selectedSession.endTime}</span>
                </div>
             </div>

             <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl flex flex-col items-center gap-2">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">TOPLAM ÇALIŞMA SÜRESİ</span>
                <div className="flex items-center gap-3">
                   <span className="material-symbols-outlined text-primary font-bold">timer</span>
                   <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{selectedSession.duration}</span>
                </div>
             </div>

             <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full h-14 bg-primary text-background-dark border border-border-light dark:border-primary font-black text-sm rounded-2xl active:scale-95 transition-all mt-2"
             >
                TAMAM
             </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HistoryView;
