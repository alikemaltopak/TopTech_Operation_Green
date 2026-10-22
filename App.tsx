
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavTab, GardenStatus, Land, WeatherCondition, ForecastDay, IrrigationSession } from './types';
import { subscribeToLands, subscribeToHistory, addHistorySession, addLand, updateUserDocument, updateLand, subscribeToUserSettings, updateUserSettings, deleteLand } from './lib/db';
import { auth, storage } from './lib/firebase';
import { onAuthStateChanged, signOut, updateProfile, User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { themes } from './lib/themes';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import LandsView from './components/LandsView';
import HistoryView from './components/HistoryView';
import WeatherView from './components/WeatherView';
import Modal from './components/Modal';
import LoginView from './components/LoginView';
import AppIntro from './components/AppIntro';
import VerifyEmailView from './components/VerifyEmailView';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.PANEL);
  const [user, setUser] = useState<any>(null); // Firebase user (sadece e-postası doğrulanmış)
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDeviceInfoModalOpen, setIsDeviceInfoModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isThemesModalOpen, setIsThemesModalOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem('toptech_theme');
    return saved || 'dark';
  });

  // Theme effect
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const currentTheme = themes[theme] || themes['dark'];
    
    if (currentTheme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Set dynamic properties based on the selected theme
    if (currentTheme.image) {
      root.classList.add('theme-textured');
      root.style.setProperty('--theme-img', `url("${currentTheme.image}")`);
    } else {
      root.classList.remove('theme-textured');
      root.style.removeProperty('--theme-img');
    }
    
    // Apply colors
    root.style.setProperty('--color-primary', currentTheme.colors.primary);
    root.style.setProperty('--color-bg-light', currentTheme.colors.bgLight);
    root.style.setProperty('--color-bg-dark', currentTheme.colors.bgDark);
    root.style.setProperty('--color-surface-light', currentTheme.colors.surfaceLight);
    root.style.setProperty('--color-surface-dark', currentTheme.colors.surfaceDark);
    root.style.setProperty('--color-border-light', currentTheme.colors.borderLight);
    root.style.setProperty('--color-border-dark', currentTheme.colors.borderDark);

    // Apply border radius
    root.style.setProperty('--radius-default', currentTheme.radius.default);
    root.style.setProperty('--radius-lg', currentTheme.radius.lg);
    root.style.setProperty('--radius-xl', currentTheme.radius.xl);
    root.style.setProperty('--radius-2xl', currentTheme.radius['2xl']);

    localStorage.setItem('toptech_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  const [historySessions, setHistorySessions] = useState<IrrigationSession[]>([]);
  const currentSessionRef = useRef<{ startTime: Date; landId: string; landName: string; durationMinutes?: number } | null>(null);
  const physicsConsumedRef = useRef<number>(0); // Fizik motorundan gelen toplam tüketim

  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string>('');

  const [status, setStatus] = useState<GardenStatus>({
    moisture: 65,
    temperature: 24,
    battery: 88,
    waterSaved: 120,
    waterRemaining: 3000,
    tankCapacity: 3000,
    baseHeightMeters: 0.5,
    netWaterHeightMeters: 1.65,
    pipeLengthMeters: 20,
    irrigationType: 'drip',
    dripperCount: 300,
    dripperFlowRateLph: 8.0,
    valveSize: 'DN20',
    nextSchedule: "05:30",
    nextScheduleDay: "Belirtilmedi",
    isIrrigating: false,
    isOnline: true,
    isScheduleActive: false,
    condition: 'Sunny',
    forecast: []
  });

  const [activeNotification, setActiveNotification] = useState<{ title: string; message: string; landName: string } | null>(null);
  const lastNotifiedTimeRef = useRef<string>('');

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.email && firebaseUser.emailVerified) {
        setUnverifiedUser(null);
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, photoURL: firebaseUser.photoURL });
        updateUserDocument(firebaseUser.email).catch(console.error);
      } else if (firebaseUser?.email) {
        // Doğrulanmamış hesap: kullanıcı verileri yüklenmez
        setUser(null);
        setUnverifiedUser(firebaseUser);
      } else {
        setUser(null);
        setUnverifiedUser(null);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.email || !auth.currentUser) return;
    if (!file.type.startsWith('image/') || file.size > MAX_PHOTO_BYTES) {
      alert("Lütfen 5 MB'tan küçük bir resim dosyası seçin.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      // Dosya yolu e-posta yerine kullanıcı kimliğini içerir; Storage kuralları sadece sahibinin yazmasına izin verir
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}/${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      setUser((prev: any) => ({ ...prev, photoURL: downloadURL }));
      alert("Profil fotoğrafı başarıyla güncellendi!");
    } catch (error) {
      console.error("Fotoğraf yükleme hatası:", error);
      alert("Fotoğraf yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

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

    const unsubscribeSettings = subscribeToUserSettings(user.email, (settings) => {
      if (settings) {
        setStatus(prev => ({
          ...prev,
          tankCapacity: settings.tankCapacity !== undefined ? settings.tankCapacity : 3000,
          waterRemaining: settings.waterRemaining !== undefined ? settings.waterRemaining : (prev.waterRemaining ?? 3000),
          baseHeightMeters: settings.baseHeightMeters !== undefined ? settings.baseHeightMeters : 0.5,
          netWaterHeightMeters: settings.netWaterHeightMeters !== undefined ? settings.netWaterHeightMeters : 1.65,
          pipeLengthMeters: settings.pipeLengthMeters !== undefined ? settings.pipeLengthMeters : 20,
          irrigationType: settings.irrigationType !== undefined ? settings.irrigationType : 'drip',
          dripperCount: settings.dripperCount !== undefined ? settings.dripperCount : 300,
          dripperFlowRateLph: settings.dripperFlowRateLph !== undefined ? settings.dripperFlowRateLph : 8.0,
          valveSize: settings.valveSize !== undefined ? settings.valveSize : 'DN20',
          isScheduleActive: settings.isScheduleActive !== undefined ? settings.isScheduleActive : false,
          nextSchedule: settings.nextSchedule !== undefined ? settings.nextSchedule : "05:30",
          nextScheduleDay: settings.nextScheduleDay !== undefined ? settings.nextScheduleDay : "Belirtilmedi",
        }));
      }
    });

    return () => {
      unsubscribeLands();
      unsubscribeHistory();
      unsubscribeSettings();
    };
  }, [user]);

  const handleLogin = (userData: any) => {
    // onAuthStateChanged will handle setting the user, but we want to show intro
    setShowIntro(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
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
        // Su tüketimi artık WaterIrrigationPhysicsEngine tarafından hesaplanıyor
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  const handleStartIrrigation = useCallback((minutes?: number, forceState?: boolean) => {
    const activeLand = lands.find(l => l.id === selectedLandId);

    setStatus(prev => {
      const starting = forceState !== undefined ? forceState : !prev.isIrrigating;

      if (starting) {
        if (activeLand?.phoneNumber) {
          const command = minutes ? `ON${minutes}` : "ON";
          const smsUri = `sms:${activeLand.phoneNumber}?body=${encodeURIComponent(command)}`;
          window.location.href = smsUri;
        }

        // Record start time
        currentSessionRef.current = {
          startTime: new Date(),
          landId: selectedLandId,
          landName: activeLand?.name || "Bilinmeyen Arazi",
          durationMinutes: minutes
        };
        physicsConsumedRef.current = 0;
      } else {
        if (activeLand?.phoneNumber) {
          const smsUri = `sms:${activeLand.phoneNumber}?body=OFF`;
          window.location.href = smsUri;
        }

        const consumedLiters = physicsConsumedRef.current || 0;
        const newWaterRemaining = Math.max(0, Math.round((prev.waterRemaining - consumedLiters) * 10) / 10);

        // Record end time and create session
        if (currentSessionRef.current) {
          const now = new Date();
          const start = currentSessionRef.current.startTime;
          const diffMs = now.getTime() - start.getTime();
          const totalSeconds = Math.floor(diffMs / 1000);
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;

          const localYear = now.getFullYear();
          const localMonth = String(now.getMonth() + 1).padStart(2, '0');
          const localDay = String(now.getDate()).padStart(2, '0');
          const localDateStr = `${localYear}-${localMonth}-${localDay}`;

          const newSession = {
            landId: currentSessionRef.current.landId,
            landName: currentSessionRef.current.landName,
            date: localDateStr,
            time: start.toTimeString().slice(0, 5),
            startTime: start.toTimeString().slice(0, 8),
            endTime: now.toTimeString().slice(0, 8),
            duration: `${mins} dk ${secs} sn`,
            icon: 'water_drop',
            totalConsumedLiters: Math.round(consumedLiters * 10) / 10
          };

          if (user?.email) {
            addHistorySession(user.email, newSession).catch(console.error);
            updateUserSettings(user.email, { waterRemaining: newWaterRemaining }).catch(console.error);
          }
          currentSessionRef.current = null;
        } else {
          if (user?.email) {
            updateUserSettings(user.email, { waterRemaining: newWaterRemaining }).catch(console.error);
          }
        }

        physicsConsumedRef.current = 0;

        return {
          ...prev,
          isIrrigating: false,
          waterRemaining: newWaterRemaining
        };
      }

      return { ...prev, isIrrigating: starting };
    });
  }, [selectedLandId, lands, user]);

  const handleRefillTank = useCallback(() => {
    setStatus(prev => {
      const fullCapacity = prev.tankCapacity;
      if (user?.email) {
        updateUserSettings(user.email, { waterRemaining: fullCapacity }).catch(console.error);
      }
      return { ...prev, waterRemaining: fullCapacity };
    });
  }, [user]);

  const handleUpdateSchedule = useCallback((time: string, day: string) => {
    setStatus(prev => ({ ...prev, nextSchedule: time, nextScheduleDay: day, isScheduleActive: true }));
    if (user?.email) {
      updateUserSettings(user.email, {
        nextSchedule: time,
        nextScheduleDay: day,
        isScheduleActive: true
      }).catch(console.error);
    }
  }, [user]);

  const handleToggleSchedule = useCallback(() => {
    setStatus(prev => {
      const nextVal = !prev.isScheduleActive;
      if (user?.email) {
        updateUserSettings(user.email, { isScheduleActive: nextVal }).catch(console.error);
      }
      return { ...prev, isScheduleActive: nextVal };
    });
  }, [user]);

  // Automated Schedule Checker & Notification System
  useEffect(() => {
    if (!user || !status.isScheduleActive || !status.nextSchedule) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // Trigger notification when current time matches schedule and we haven't notified in this minute
      if (currentHourMin === status.nextSchedule && lastNotifiedTimeRef.current !== currentHourMin) {
        lastNotifiedTimeRef.current = currentHourMin;
        
        const activeLand = lands.find(l => l.id === selectedLandId);
        const landName = activeLand?.name || "Bahçeniz";
        const title = "Toptech Otomatik Sulama";
        const message = `Zamanı geldi! "${landName}" araziniz için planlanan otomatik sulama seansı başlıyor.`;
        
        // 1. Show in-app sliding alert toast banner
        setActiveNotification({ title, message, landName });
        
        // 2. Trigger browser native push notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body: message,
              icon: '/favicon.ico'
            });
          } catch (e) {
            console.error("Browser notification failed:", e);
          }
        }
        
        // 3. Automatically turn on physical-simulated irrigation
        handleStartIrrigation(10);
      }

      // Reset the lock when past the schedule minute
      if (currentHourMin !== status.nextSchedule) {
        lastNotifiedTimeRef.current = '';
      }
    };

    const interval = setInterval(checkSchedule, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [user, status.isScheduleActive, status.nextSchedule, lands, selectedLandId, handleStartIrrigation]);

  // Auto dismiss toast notification after 10 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  const handleAddLand = async (newLand: Land) => {
    if (!user?.email) return;
    try {
      const { id, ...landData } = newLand;
      const newId = await addLand(user.email, landData as any);
      setSelectedLandId(newId);
      setActiveTab(NavTab.PANEL);
    } catch (e: any) {
      console.error("Error adding land:", e);
      throw e;
    }
  };

  const handleUpdateLand = async (landId: string, updates: Partial<Land>) => {
    if (!user?.email) return;
    try {
      await updateLand(user.email, landId, updates);
    } catch (e: any) {
      console.error("Error updating land:", e);
      throw e;
    }
  };

  const handleDeleteLand = async (landId: string) => {
    if (!user?.email) return;
    try {
      await deleteLand(user.email, landId);
    } catch (e: any) {
      console.error("Error deleting land:", e);
      alert("Arazi silinirken bir hata oluştu.");
    }
  };

  const handleSelectLand = (id: string) => {
    setSelectedLandId(id);
    setActiveTab(NavTab.PANEL);
  };

  const handleIntroComplete = useCallback(() => setShowIntro(false), []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (unverifiedUser) {
    return (
      <VerifyEmailView
        firebaseUser={unverifiedUser}
        onVerified={() => {
          setUser({ uid: unverifiedUser.uid, email: unverifiedUser.email, photoURL: unverifiedUser.photoURL });
          updateUserDocument(unverifiedUser.email!).catch(console.error);
          setUnverifiedUser(null);
          setShowIntro(true);
        }}
      />
    );
  }

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const activeLand = lands.find(l => l.id === selectedLandId);
  const currentThemeConfig = themes[theme] || themes['dark'];

  return (
    <>
      {activeNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 animate-in slide-in-from-top duration-500">
          <div className="bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-xl border border-primary/30 rounded-3xl p-5 shadow-2xl flex items-start gap-4 ring-1 ring-black/5 dark:ring-white/10">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 animate-bounce">
              <span className="material-symbols-outlined text-2xl font-bold">notifications_active</span>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{activeNotification.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{activeNotification.message}</p>
            </div>
            <button 
              onClick={() => setActiveNotification(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {showIntro && <AppIntro onComplete={handleIntroComplete} />}

      {!showIntro && (
        <div className="flex flex-col min-h-screen pb-24 relative animate-in fade-in duration-1000">
          <Header
            isOnline={status.isOnline}
            onProfileClick={() => setIsProfileModalOpen(true)}
            theme={theme}
            onThemeToggle={toggleTheme}
            userPhotoURL={user?.photoURL}
          />

          <main className="flex-1 max-w-md mx-auto w-full px-4 overflow-x-hidden">
            {activeTab === NavTab.PANEL && (
              <Dashboard
                status={status}
                activeLandName={activeLand?.name || "Arazi Seçilmedi"}
                activeLandPhoneNumber={activeLand?.phoneNumber}
                onIrrigate={handleStartIrrigation}
                onUpdateSchedule={handleUpdateSchedule}
                onToggleSchedule={handleToggleSchedule}
                currentSession={currentSessionRef.current}
                onPhysicsUpdate={(consumed: number) => { physicsConsumedRef.current = consumed; }}
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
                onUpdateLand={handleUpdateLand}
                onDeleteLand={handleDeleteLand}
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
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setStatus(prev => ({ ...prev, tankCapacity: val }));
                        if (user?.email) {
                          updateUserSettings(user.email, { tankCapacity: val }).catch(console.error);
                        }
                      }}
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
                        <span className="font-bold text-sm">Sistem Bilgisi</span>
                      </div>
                      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>
                    <button
                      onClick={() => setIsThemesModalOpen(true)}
                      className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark hover:border-primary/50 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-500">palette</span>
                        <span className="font-bold text-sm">Temalar</span>
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
                <div className="h-24 w-24 rounded-3xl bg-slate-100 dark:bg-surface-dark border-2 border-primary/40 flex items-center justify-center relative z-10 overflow-hidden">
                  {isUploadingPhoto ? (
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="material-symbols-outlined text-primary text-6xl">account_circle</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-[-10px] z-10">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  ref={cameraInputRef}
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-surface-dark border border-border-light/20 dark:border-border-dark/50 rounded-xl text-xs font-bold text-slate-700 dark:text-white hover:border-primary/50 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">image</span>
                  Galeriden Seç
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  Fotoğraf Çek
                </button>
              </div>

              <div className="text-center">
                <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{user.email?.split('@')[0].toUpperCase() || 'TOPTECH USER'}</h4>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">PLATINUM MEMBER</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="bg-slate-100 dark:bg-black/30 p-4 rounded-2xl border border-border-light dark:border-border-dark flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-600 dark:text-[#92c9a4]/60 text-sm">mail</span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-[#92c9a4]/60 uppercase tracking-wider">E-posta</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{user.email}</span>
                </div>

                <div className="bg-slate-100 dark:bg-black/30 p-4 rounded-2xl border border-border-light dark:border-border-dark flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-600 dark:text-[#92c9a4]/60 text-sm">calendar_month</span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-[#92c9a4]/60 uppercase tracking-wider">Kayıt Tarihi</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Haziran 2024</span>
                </div>

                <div className="bg-slate-100 dark:bg-black/30 p-4 rounded-2xl border border-border-light dark:border-border-dark flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-600 dark:text-[#92c9a4]/60 text-sm">grid_view</span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-[#92c9a4]/60 uppercase tracking-wider">Toplam Arazi</span>
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

          {/* Sistem Bilgisi Modal */}
          <Modal
            isOpen={isDeviceInfoModalOpen}
            onClose={() => setIsDeviceInfoModalOpen(false)}
            title="Sistem Bilgisi"
          >
            <div className="flex flex-col gap-4">
              {/* Depo Doldur Butonu */}
              <button
                onClick={handleRefillTank}
                className="w-full p-4 rounded-2xl bg-blue-500/15 border border-blue-500/40 text-blue-400 font-black flex items-center justify-center gap-3 hover:bg-blue-500/25 transition-all active:scale-95 shadow-lg"
              >
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
                <span>DEPOYU TAMAMEN DOLDUR (%100)</span>
              </button>

              {/* Depo & Vana Fizik Ayarları */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-black/30 border border-border-light dark:border-border-dark">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary">engineering</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Depo & Vana Fizik Ayarları</span>
                </div>

                {/* Sehpa Yüksekliği */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Sehpa Yüksekliği</span>
                    <span className="text-xs font-black text-primary">{status.baseHeightMeters.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={status.baseHeightMeters}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setStatus(prev => ({ ...prev, baseHeightMeters: val }));
                      if (user?.email) {
                        updateUserSettings(user.email, { baseHeightMeters: val }).catch(console.error);
                      }
                    }}
                    className="w-full h-2 bg-slate-200 dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Net Su Yüksekliği */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Net Su Yüksekliği</span>
                    <span className="text-xs font-black text-primary">{status.netWaterHeightMeters.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={status.netWaterHeightMeters}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setStatus(prev => ({ ...prev, netWaterHeightMeters: val }));
                      if (user?.email) {
                        updateUserSettings(user.email, { netWaterHeightMeters: val }).catch(console.error);
                      }
                    }}
                    className="w-full h-2 bg-slate-200 dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Sulama Yöntemi Seçimi */}
                <div className="mb-4">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">Sulama Yöntemi</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setStatus(prev => ({ ...prev, irrigationType: 'drip' }));
                        if (user?.email) {
                          updateUserSettings(user.email, { irrigationType: 'drip' }).catch(console.error);
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 ${
                        (status.irrigationType || 'drip') === 'drip'
                          ? 'bg-primary text-background-dark border-primary shadow-md'
                          : 'border-border-light dark:border-border-dark text-slate-700 dark:text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">water_drop</span>
                      <span>Damla Sulama</span>
                    </button>
                    <button
                      onClick={() => {
                        setStatus(prev => ({ ...prev, irrigationType: 'free_flow' }));
                        if (user?.email) {
                          updateUserSettings(user.email, { irrigationType: 'free_flow' }).catch(console.error);
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 ${
                        status.irrigationType === 'free_flow'
                          ? 'bg-primary text-background-dark border-primary shadow-md'
                          : 'border-border-light dark:border-border-dark text-slate-700 dark:text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">waves</span>
                      <span>Serbest Akış (Açık Boru)</span>
                    </button>
                  </div>
                </div>

                {/* Damla Sulama Modunda: Damlatıcı Delik Sayısı */}
                {(status.irrigationType || 'drip') === 'drip' ? (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Damlatıcı / Delik Sayısı</span>
                      <span className="text-xs font-black text-primary">{status.dripperCount || 300} Adet</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="3000"
                      step="20"
                      value={status.dripperCount || 300}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setStatus(prev => ({ ...prev, dripperCount: val }));
                        if (user?.email) {
                          updateUserSettings(user.email, { dripperCount: val }).catch(console.error);
                        }
                      }}
                      className="w-full h-2 bg-slate-200 dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between gap-1 mt-2">
                      {[40, 100, 300, 500, 1000].map(cnt => (
                        <button
                          key={cnt}
                          onClick={() => {
                            setStatus(prev => ({ ...prev, dripperCount: cnt }));
                            if (user?.email) {
                              updateUserSettings(user.email, { dripperCount: cnt }).catch(console.error);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all ${
                            (status.dripperCount || 300) === cnt
                              ? 'bg-primary text-background-dark border-primary'
                              : 'border-border-light dark:border-border-dark text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {cnt} Adet
                        </button>
                      ))}
                    </div>

                    {/* Damlatıcı Debisi Seçimi */}
                    <div className="mt-3">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Delik / Damlatıcı Tipi (Debi)</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { lph: 2.0, label: '2 L/h' },
                          { lph: 4.0, label: '4 L/h' },
                          { lph: 8.0, label: '8 L/h' },
                          { lph: 12.0, label: '12 L/h' }
                        ].map(opt => (
                          <button
                            key={opt.lph}
                            onClick={() => {
                              setStatus(prev => ({ ...prev, dripperFlowRateLph: opt.lph }));
                              if (user?.email) {
                                updateUserSettings(user.email, { dripperFlowRateLph: opt.lph }).catch(console.error);
                              }
                            }}
                            className={`py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                              (status.dripperFlowRateLph || 8.0) === opt.lph
                                ? 'bg-primary text-background-dark border-primary shadow-sm'
                                : 'border-border-light dark:border-border-dark text-slate-600 dark:text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Serbest Akış Modunda: Boru Uzunluğu */
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Boru / Hat Uzunluğu</span>
                      <span className="text-xs font-black text-primary">{status.pipeLengthMeters || 20} m</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={status.pipeLengthMeters || 20}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setStatus(prev => ({ ...prev, pipeLengthMeters: val }));
                        if (user?.email) {
                          updateUserSettings(user.email, { pipeLengthMeters: val }).catch(console.error);
                        }
                      }}
                      className="w-full h-2 bg-slate-200 dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                )}

                {/* Motorlu Vana Çapı (Sabit DN20 - 20mm) */}
                <div className="flex items-center justify-between pt-2 border-t border-border-light/20 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Motorlu Vana Çapı</span>
                  <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    20 mm (DN20)
                  </span>
                </div>
              </div>

              {/* Hardware Status Tile */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-black/30 border border-border-light dark:border-border-dark flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-yellow-400">solar_power</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Güneş Paneli</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-yellow-400 uppercase">ŞARJ OLUYOR</span>
                  <span className="text-[10px] text-slate-600 dark:text-[#92c9a4]/60">14.2V Giriş</span>
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

          {/* Themes Modal */}
          <Modal
            isOpen={isThemesModalOpen}
            onClose={() => setIsThemesModalOpen(false)}
            title="Tema Ayarları"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Genel Tema</h3>
                <button
                  onClick={() => setTheme('light')}
                  className={`w-full p-4 rounded-2xl border flex justify-between items-center transition-all ${theme === 'light'
                      ? 'border-primary bg-primary/10'
                      : 'border-border-light dark:border-border-dark bg-slate-100 dark:bg-background-dark/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${theme === 'light' ? 'text-primary' : 'text-slate-500'}`}>light_mode</span>
                    <span className={`font-bold ${theme === 'light' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Açık Tema</span>
                  </div>
                  {theme === 'light' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`w-full p-4 rounded-2xl border flex justify-between items-center transition-all ${theme === 'dark'
                      ? 'border-primary bg-primary/10'
                      : 'border-border-light dark:border-border-dark bg-slate-100 dark:bg-background-dark/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${theme === 'dark' ? 'text-primary' : 'text-slate-500'}`}>dark_mode</span>
                    <span className={`font-bold ${theme === 'dark' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Koyu Tema</span>
                  </div>
                  {theme === 'dark' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Görsel Temalar (Doku)</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'tas', name: 'Taş' },
                    { id: 'mermer', name: 'Mermer' },
                    { id: 'tahta', name: 'Tahta' },
                    { id: 'obsidyen', name: 'Obsidyen' },
                    { id: 'kilim', name: 'Kilim' },
                    { id: 'beton', name: 'Beton' },
                    { id: 'cini', name: 'Çini' },
                    { id: 'garden', name: 'Bahçe' },
                    { id: 'silver', name: 'Gümüş' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all relative ${theme === t.id
                          ? 'border-primary'
                          : 'border-transparent hover:border-border-light dark:hover:border-border-dark'
                        }`}
                    >
                      <div className="absolute inset-0 z-0">
                        {t.id === 'tas' && <img src="/themes/tas.png" alt={t.name} className="w-full h-full object-cover" />}
                        {t.id === 'mermer' && <img src="/themes/mermer.png" alt={t.name} className="w-full h-full object-cover" />}
                        {t.id === 'tahta' && <img src="/themes/tahta.png" alt={t.name} className="w-full h-full object-cover" />}
                        {t.id === 'obsidyen' && <img src="/themes/obsidyen.png" alt={t.name} className="w-full h-full object-cover" />}
                        {t.id === 'kilim' && <img src="/themes/kilim.png" alt={t.name} className="w-full h-full object-cover" />}
                        {t.id === 'beton' && <img src="/themes/beton.png" alt={t.name} className="w-full h-full object-cover" />}
                        {t.id === 'cini' && <img src="/themes/cini.png" alt={t.name} className="w-full h-full object-cover" />}
                        {t.id === 'garden' && <img src="/themes/garden.png" alt={t.name} className="w-full h-full object-cover" />}
                        {t.id === 'silver' && <img src="/themes/silver.png" alt={t.name} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-black/40"></div>
                      </div>
                      <span className={`relative z-10 text-xs font-bold text-white drop-shadow-md`}>{t.name}</span>
                      {theme === t.id && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center p-2">
                          <span className="material-symbols-outlined text-white/50 text-4xl">check</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsThemesModalOpen(false)}
                className="w-full mt-4 bg-primary text-background-dark border border-border-light dark:border-primary font-extrabold text-lg h-14 rounded-2xl active:scale-95 transition-all"
              >
                Tamam
              </button>
            </div>
          </Modal>

          <Navigation activeTab={activeTab} onTabChange={setActiveTab} themeIcons={currentThemeConfig.icons} />
        </div>
      )}
    </>
  );
};

export default App;
