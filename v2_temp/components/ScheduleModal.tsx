
import React, { useState } from 'react';
import Modal from './Modal';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (time: string, day: string) => void;
  currentTime: string;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSave, currentTime }) => {
  const [hour, setHour] = useState(currentTime.split(':')[0] || '05');
  const [minute, setMinute] = useState(currentTime.split(':')[1] || '30');
  
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const handleSave = () => {
    const dayStr = selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    onSave(`${hour}:${minute}`, dayStr);
    onClose();
  };

  // Calendar logic
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthName = today.toLocaleString('tr-TR', { month: 'long' });
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = (firstDayOfMonth + 6) % 7; // Monday start
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekdays = ['PT', 'SA', 'ÇA', 'PE', 'CU', 'CT', 'PZ'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Zamanlayıcı Ayarla">
      <div className="flex flex-col gap-6">
        {/* Stylized Time Picker */}
        <div className="flex justify-center items-center gap-4 bg-surface-light dark:bg-background-dark/30 py-6 rounded-3xl border border-border-light dark:border-border-dark/30">
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setHour(prev => hours[(parseInt(prev) + 1) % 24])} className="text-slate-600 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">expand_less</span>
            </button>
            <div className="text-5xl font-black text-slate-900 dark:text-white w-16 text-center tabular-nums">{hour}</div>
            <button onClick={() => setHour(prev => hours[(parseInt(prev) + 23) % 24])} className="text-slate-600 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
          
          <div className="text-4xl font-black text-primary animate-pulse">:</div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setMinute(prev => minutes[(minutes.indexOf(prev) + 1) % 12])} className="text-slate-600 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">expand_less</span>
            </button>
            <div className="text-5xl font-black text-slate-900 dark:text-white w-16 text-center tabular-nums">{minute}</div>
            <button onClick={() => setMinute(prev => minutes[(minutes.indexOf(prev) + 11) % 12])} className="text-slate-600 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
        </div>

        {/* Calendar Picker */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">TARİH SEÇİN</label>
            <span className="text-xs font-bold text-primary">{monthName} {currentYear}</span>
          </div>
          
          <div className="bg-surface-light dark:bg-surface-dark/40 border border-border-light dark:border-border-dark/30 rounded-2xl p-3">
            <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
              {weekdays.map(wd => (
                <div key={wd} className="text-[8px] font-black text-slate-600">{wd}</div>
              ))}
              
              {/* Empty slots for start of month */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8"></div>
              ))}

              {calendarDays.map(day => {
                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth;
                const isToday = today.getDate() === day && today.getMonth() === currentMonth;
                const isPast = day < today.getDate();

                return (
                  <button
                    key={day}
                    disabled={isPast}
                    onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                    className={`
                      h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-bold transition-all
                      ${isSelected ? 'bg-primary text-background-dark scale-110' : ''}
                      ${!isSelected && isToday ? 'text-primary ring-1 ring-primary/30' : ''}
                      ${!isSelected && !isToday && !isPast ? 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10' : ''}
                      ${isPast ? 'text-slate-400 dark:text-slate-700 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary text-background-dark border border-border-light dark:border-primary font-extrabold text-lg h-14 rounded-2xl glow-button active:scale-95 transition-all mt-2"
        >
          Programı Kaydet
        </button>
      </div>
    </Modal>
  );
};

export default ScheduleModal;
