import React, { useState } from 'react';
import Modal from './Modal';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (time: string, day: string) => void;
  currentTime: string;
  phoneNumber?: string;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSave, currentTime, phoneNumber }) => {
  const [hour, setHour] = useState(currentTime.split(':')[0] || '08');
  const [minute, setMinute] = useState(currentTime.split(':')[1] || '00');
  const [durationMinutes, setDurationMinutes] = useState(20);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  // Calculate End Time
  const startMins = parseInt(hour, 10) * 60 + parseInt(minute, 10);
  const endMins = (startMins + durationMinutes) % 1440;
  const endHour = String(Math.floor(endMins / 60)).padStart(2, '0');
  const endMinute = String(endMins % 60).padStart(2, '0');

  // Format Date for SMS: GG.AA.YY
  const dayFormatted = String(selectedDate.getDate()).padStart(2, '0');
  const monthFormatted = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const yearFormatted = String(selectedDate.getFullYear()).slice(-2);
  const dateFormatted = `${dayFormatted}.${monthFormatted}.${yearFormatted}`;

  // Generated SETALARM SMS Command
  const smsCommand = `SETALARM:${dateFormatted}-${hour}.${minute},${endHour}.${endMinute}`;
  const syncTimeCommand = `SETTIME:${dateFormatted}-${hour}.${minute}`;

  const handleSave = (sendSms: boolean = true) => {
    const dayStr = selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    onSave(`${hour}:${minute}`, dayStr);

    if (sendSms) {
      if (!phoneNumber) {
        alert("Bu arazi için telefon numarası tanımlanmamış. Kısa mesaj gönderebilmek için lütfen Arazilerim menüsünden telefon numarasını tanımlayın.");
      } else {
        const smsUri = `sms:${phoneNumber}?body=${encodeURIComponent(smsCommand)}`;
        window.location.href = smsUri;
      }
    }
    onClose();
  };

  const handleSyncTime = () => {
    if (!phoneNumber) {
      alert("Bu arazi için telefon numarası tanımlanmamış. Lütfen Arazilerim menüsünden telefon numarasını girin.");
      return;
    }
    const smsUri = `sms:${phoneNumber}?body=${encodeURIComponent(syncTimeCommand)}`;
    window.location.href = smsUri;
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
    <Modal isOpen={isOpen} onClose={onClose} title="Zamanlayıcı & RTC Alarm Ayarla">
      <div className="flex flex-col gap-5">
        {/* Time Picker */}
        <div className="flex justify-center items-center gap-4 bg-surface-light dark:bg-black/30 py-5 rounded-3xl border border-border-light dark:border-border-dark">
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setHour(prev => hours[(parseInt(prev) + 1) % 24])} className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">expand_less</span>
            </button>
            <div className="text-5xl font-black text-slate-900 dark:text-white w-16 text-center tabular-nums">{hour}</div>
            <button onClick={() => setHour(prev => hours[(parseInt(prev) + 23) % 24])} className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>

          <div className="text-4xl font-black text-primary animate-pulse">:</div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setMinute(prev => minutes[(minutes.indexOf(prev) + 1) % 12])} className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">expand_less</span>
            </button>
            <div className="text-5xl font-black text-slate-900 dark:text-white w-16 text-center tabular-nums">{minute}</div>
            <button onClick={() => setMinute(prev => minutes[(minutes.indexOf(prev) + 11) % 12])} className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
        </div>

        {/* Custom Duration Selection */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">SULAMA SÜRESİ (DAKİKA)</label>
            <span className="text-xs font-black text-primary">{durationMinutes} DAKİKA</span>
          </div>

          <div className="flex items-center gap-3 bg-surface-light dark:bg-black/20 border border-border-light dark:border-border-dark p-3 rounded-2xl">
            <button
              onClick={() => setDurationMinutes(prev => Math.max(1, prev - 1))}
              className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-all font-black text-lg active:scale-95"
            >
              -
            </button>

            <input
              type="range"
              min="1"
              max="180"
              step="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-slate-200 dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-primary"
            />

            <button
              onClick={() => setDurationMinutes(prev => Math.min(180, prev + 1))}
              className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-all font-black text-lg active:scale-95"
            >
              +
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex gap-2 overflow-x-auto py-1">
            {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(d => (
              <button
                key={d}
                onClick={() => setDurationMinutes(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                  durationMinutes === d
                    ? 'bg-primary text-background-dark border-primary shadow-md'
                    : 'border-border-light dark:border-border-dark text-slate-700 dark:text-slate-300 hover:bg-white/5'
                }`}
              >
                {d} DK
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Picker */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">TARİH SEÇİN</label>
            <span className="text-xs font-bold text-primary">{monthName} {currentYear}</span>
          </div>

          <div className="bg-surface-light dark:bg-black/20 border border-border-light dark:border-border-dark rounded-2xl p-3">
            <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
              {weekdays.map(wd => (
                <div key={wd} className="text-[8px] font-black text-slate-600 dark:text-slate-400">{wd}</div>
              ))}

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

        {/* SETALARM SMS Command Preview Box */}
        <div className="bg-slate-900/90 dark:bg-black/50 border border-primary/30 rounded-2xl p-4 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">sms</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-wider">OTOMASYON ALARM SMS FORMATI</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {durationMinutes} DK SÜRE
            </span>
          </div>

          <div className="bg-black/60 border border-primary/20 rounded-xl p-3 font-mono text-center text-sm font-black text-emerald-400 tracking-wider select-all">
            {smsCommand}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1 pt-1 border-t border-white/5">
            <span>Açılış: <b className="text-white">{hour}.{minute}</b></span>
            <span>Kapanış: <b className="text-white">{endHour}.{endMinute}</b></span>
            <span>Tarih: <b className="text-white">{dateFormatted}</b></span>
          </div>
        </div>

        {/* Save & Trigger SMS Action */}
        <button
          onClick={() => handleSave(true)}
          className="w-full bg-primary text-background-dark border border-border-light dark:border-primary font-black text-base h-14 rounded-2xl glow-button active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
        >
          <span className="material-symbols-outlined font-bold">send</span>
          <span>PROGRAMI KAYDET VE SMS GÖNDER</span>
        </button>
      </div>
    </Modal>
  );
};

export default ScheduleModal;
