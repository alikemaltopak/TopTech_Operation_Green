
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavTab, GardenStatus, Land, WeatherCondition, ForecastDay, IrrigationSession } from './types';
import { subscribeToLands, subscribeToHistory, addHistorySession, addLand } from './lib/db';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import LandsView from './components/LandsView';
import HistoryView from './components/HistoryView';
import WeatherView from './components/WeatherView';
import Modal from './components/Modal';
import LoginView from './components/LoginView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.PANEL);
  const [user, setUser] = useState<any>(null); // Firebase user
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDeviceInfoModalOpen, setIsDeviceInfoModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('toptech_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  
  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('toptech_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  const [historySessions, setHistorySessions] = useState<IrrigationSession[]>([]);
  const currentSessionRef = useRef<{ startTime: Date; landId: string; landName: string } | null>(null);

  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string>('');

  const [status, setStatus] = useState<GardenStatus>({
    moisture: 65,
    temperature: 24,
    battery: 88,
    waterSaved: 120,
    waterRemaining: 439.5,
    tankCapacity: 500,
    nextSchedule: "05:30",
    nextScheduleDay: "Yarın Sabah",
    isIrrigating: false,
    isOnline: true,
    isScheduleActive: true,
    condition: 'Sunny',
    forecast: []
  });

  // Simulation of persistent login
  useEffect(() => {
    const storedUser = localStorage.getItem('toptech_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsInitializing(false);
  }, []);

  // Firebase DB Subscriptions
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribeLands = subscribeToLands(user.email, (fetchedLands) => {
      setLands(fetchedLands);
      setSelectedLandId(prev => {
        if (!prev && fetchedLands.length > 0) return fetchedLands[0].id;
        if (prev && fetchedLands.length > 0 && !fetchedLands.find(l => l.id === prev)) return fetchedLands[0].id;
        return prev;
      });
    });

    const unsubscribeHistory = subscribeToHistory(user.email, (fetchedSessions) => {
      setHistorySessions(fetchedSessions);
    });

    return () => {
      unsubscribeLands();
      unsubscribeHistory();
    };
  }, [user]);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('toptech_user', JSON.stringify({ email: userData }));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('toptech_user');
    setIsProfileModalOpen(false);
  };

  const mapWeatherCode = (code: number): WeatherCondition => {
    if (code === 0) return 'Sunny';
    if (code >= 1 && code <= 3) return 'PartlyCloudy';
    if (code === 45 || code === 48) return 'Cloudy';
    if (code >= 51) return 'Rainy';
    return 'Sunny';
  };

  const fetchWeather = useCallback(async (coords: string) => {
    try {
      const [lat, lon] = coords.split(',').map(c => c.trim());
      if (!lat || !lon) return;

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
      const data = await response.json();
      
      if (data && data.current_weather) {
        const { temperature, weathercode } = data.current_weather;
        
        const forecast: ForecastDay[] = data.daily.time.map((time: string, i: number) => {
          const date = new Date(time);
          const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
          return {
            date: i === 0 ? 'Bugün' : days[date.getDay()],
            maxTemp: Math.round(data.daily.temperature_2m_max[i]),
            minTemp: Math.round(data.daily.temperature_2m_min[i]),
            condition: mapWeatherCode(data.daily.weathercode[i])
          };
        }).slice(0, 5);

        setStatus(prev => ({
          ...prev,
          temperature: Math.round(temperature),
          condition: mapWeatherCode(weathercode),
          forecast
        }));
      }
    } catch (error) {
      console.error("Weather fetch failed:", error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const activeLand = lands.find(l => l.id === selectedLandId);
    if (activeLand?.coordinates) {
      fetchWeather(activeLand.coordinates);
    }
  }, [selectedLandId, lands, fetchWeather, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        moisture: prev.isIrrigating 
          ? Math.min(100, prev.moisture + 1) 
          : Math.max(0, prev.moisture - 0.05),
        battery: Math.max(0, prev.battery - 0.01),
        waterRemaining: prev.isIrrigating 
          ? Math.max(0, prev.waterRemaining - 0.5) 
          : prev.waterRemaining
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  const handleStartIrrigation = useCallback(() => {
    const activeLand = lands.find(l => l.id === selectedLandId);
    
    setStatus(prev => {
      const starting = !prev.isIrrigating;
      
      if (starting) {
        // Record start time
        currentSessionRef.current = {
          startTime: new Date(),
          landId: selectedLandId,
          landName: activeLand?.name || "Bilinmeyen Arazi"
        };
      } else {
        // Record end time and create session
        if (currentSessionRef.current) {
          const now = new Date();
          const start = currentSessionRef.current.startTime;
          const diffMs = now.getTime() - start.getTime();
          const totalSeconds = Math.floor(diffMs / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          
          const newSession = {
            landId: currentSessionRef.current.landId,
            landName: currentSessionRef.current.landName,
            date: now.toISOString().split('T')[0],
            time: start.toTimeString().slice(0, 5),
            startTime: start.toTimeString().slice(0, 8),
            endTime: now.toTimeString().slice(0, 8),
            duration: `${minutes} dk ${seconds} sn`,
            icon: 'water_drop'
          };
          
          if (user?.email) {
            addHistorySession(user.email, newSession).catch(console.error);
          }
          currentSessionRef.current = null;
        }
      }
      
      return { ...prev, isIrrigating: starting };
    });
  }, [selectedLandId, lands, user]);

  const handleUpdateSchedule = useCallback((time: string, day: string) => {
    setStatus(prev => ({ ...prev, nextSchedule: time, nextScheduleDay: day }));
  }, []);

  const handleToggleSchedule = useCallback(() => {
    setStatus(prev => ({ ...prev, isScheduleActive: !prev.isScheduleActive }));
  }, []);

  const handleAddLand = async (newLand: Land) => {
    if (!user?.email) return;
    try {
      const { id, ...landData } = newLand;
      const newId = await addLand(user.email, landData as any);
      setSelectedLandId(newId);
      setActiveTab(NavTab.PANEL);
    } catch (e) {
      console.error("Error adding land:", e);
    }
  };

  const handleSelectLand = (id: string) => {
    setSelectedLandId(id);
    setActiveTab(NavTab.PANEL);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const activeLand = lands.find(l => l.id === selectedLandId);

  return (
    <div className="flex flex-col min-h-screen pb-24 relative">
      <Header 
        isOnline={status.isOnline} 
        onProfileClick={() => setIsProfileModalOpen(true)}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      
      <main className="flex-1 max-w-md mx-auto w-full px-4 overflow-x-hidden">
        {activeTab === NavTab.PANEL && (
          <Dashboard 
            status={status} 
            activeLandName={activeLand?.name || "Arazi Seçilmedi"}
            onIrrigate={handleStartIrrigation} 
            onUpdateSchedule={handleUpdateSchedule}
            onToggleSchedule={handleToggleSchedule}
          />
        )}
        
        {activeTab === NavTab.WEATHER && (
          <WeatherView 
            status={status}
            activeLandName={activeLand?.name || "Arazi Seçilmedi"}
          />
        )}

        {activeTab === NavTab.HISTORY && (
          <HistoryView 
            activeLandName={activeLand?.name || "Arazi"} 
            activeLandImage={activeLand?.image}
            sessions={historySessions}
          />
        )}

        {activeTab === NavTab.LANDS && (
          <LandsView 
            lands={lands} 
            selectedLandId={selectedLandId}
            onAddLand={handleAddLand}
            onSelectLand={handleSelectLand}
          />
        )}

        {activeTab === NavTab.SETTINGS && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Ayarlar</h2>
              <p className="text-slate-500 dark:text-[#92c9a4] mt-1">Cihaz durumu ve parametreler</p>
            </div>

            <div className="flex flex-col gap-6">
              {/* Profile Card Summary */}
              <div 
                onClick={() => setIsProfileModalOpen(true)}
                className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl border border-border-light dark:border-border-dark flex items-center gap-4 shadow-sm cursor-pointer hover:border-primary/50 transition-all"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-3xl">account_circle</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Aktif Kullanıcı</h3>
                  <p className="text-slate-500 text-sm truncate">{user.email || 'Kullanıcı Bilgisi Yok'}</p>
                </div>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </div>

              {/* Tank Capacity Setting */}
              <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl border border-border-light dark:border-border-dark shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">database</span>
                    <span className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-wider">Tank Kapasitesi</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-primary">{status.tankCapacity}L</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">({(status.tankCapacity / 1000).toFixed(1)} Ton)</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="15000" 
                  step="100"
                  value={status.tankCapacity} 
                  onChange={(e) => setStatus(prev => ({ ...prev, tankCapacity: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-slate-100 dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase">
                  <span>100L</span>
                  <span>15.000L</span>
                </div>
              </div>

              {/* Device Battery */}
              <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl border border-border-light dark:border-border-dark shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-primary text-2xl ${status.battery < 20 ? 'text-red-500 animate-pulse' : ''}`}>
                      {status.battery > 80 ? 'battery_full' : status.battery > 20 ? 'battery_std' : 'battery_alert'}
                    </span>
                    <span className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-wider">Cihaz Bataryası</span>
                  </div>
                  <span className="text-2xl font-black text-primary">{Math.round(status.battery)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-border-dark overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${status.battery < 20 ? 'bg-red-500' : 'bg-primary'}`} 
                    style={{ width: `${status.battery}%` }}
                  ></div>
                </div>
              </div>

              {/* General Settings */}
              <div className="mt-4 flex flex-col gap-3">
                <button className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark hover:border-primary/50 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500">notifications</span>
                    <span className="font-bold text-sm">Bildirim Ayarları</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </button>
                <button 
                  onClick={() => setIsDeviceInfoModalOpen(true)}
                  className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark hover:border-primary/50 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500">info</span>
                    <span className="font-bold text-sm">Cihaz Bilgisi</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Profile Info Modal */}
      <Modal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        title="Kullanıcı Profili"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-125"></div>
            <div className="h-24 w-24 rounded-3xl bg-slate-100 dark:bg-surface-dark border-2 border-primary/40 flex items-center justify-center relative z-10">
              <span className="material-symbols-outlined text-primary text-6xl">account_circle</span>
            </div>
          </div>

          <div className="text-center">
            <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{user.email?.split('@')[0].toUpperCase() || 'TOPTECH USER'}</h4>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">PLATINUM MEMBER</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div className="bg-slate-100 dark:bg-background-dark/30 p-4 rounded-2xl border border-border-light/10 dark:border-border-dark/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-sm">mail</span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">E-posta</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{user.email}</span>
            </div>

            <div className="bg-slate-100 dark:bg-background-dark/30 p-4 rounded-2xl border border-border-light/10 dark:border-border-dark/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-sm">calendar_month</span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kayıt Tarihi</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Haziran 2024</span>
            </div>

            <div className="bg-slate-100 dark:bg-background-dark/30 p-4 rounded-2xl border border-border-light/10 dark:border-border-dark/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-sm">grid_view</span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Toplam Arazi</span>
              </div>
              <span className="text-xs font-bold text-primary">{lands.length} Adet</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-3 bg-red-500/10 border border-border-light dark:border-red-500/20 text-red-500 font-black text-sm h-14 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>OTURUMU KAPAT</span>
          </button>
        </div>
      </Modal>

      {/* Device Info Modal */}
      <Modal 
        isOpen={isDeviceInfoModalOpen} 
        onClose={() => setIsDeviceInfoModalOpen(false)} 
        title="Sistem Cihaz Durumu"
      >
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-background-dark/30 border border-border-light/10 dark:border-border-dark/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">videocam</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Güvenlik Kamerası</span>
            </div>
            <span className="text-xs font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">ÇEVRİMİÇİ</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-background-dark/30 border border-border-light/10 dark:border-border-dark/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-yellow-400">solar_power</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Güneş Paneli</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-yellow-400 uppercase">ŞARJ OLUYOR</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400">14.2V Giriş</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-background-dark/30 border border-border-light/10 dark:border-border-dark/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">tungsten</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Bahçe Aydınlatması</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-primary uppercase">AKTİF</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400">Gece Modu</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-background-dark/30 border border-border-light/10 dark:border-border-dark/50">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-blue-400">sensors</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Nem Sensörleri (x4)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(id => (
                <div key={id} className="flex items-center justify-between bg-slate-200 dark:bg-black/20 p-2 rounded-lg text-[10px]">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">#0{id}</span>
                  <span className="text-primary font-black">AKTİF</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setIsDeviceInfoModalOpen(false)}
            className="w-full mt-4 bg-primary text-background-dark border border-border-light dark:border-primary font-extrabold text-lg h-14 rounded-2xl active:scale-95 transition-all"
          >
            Tamam
          </button>
        </div>
      </Modal>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;
