import React from 'react';
import { GardenStatus, WeatherCondition } from '../types';

interface WeatherViewProps {
  status: GardenStatus;
  activeLandName: string;
}

const WeatherView: React.FC<WeatherViewProps> = ({ status, activeLandName }) => {
  const getConditionIcon = (condition: WeatherCondition) => {
    switch (condition) {
      case 'Sunny': return 'wb_sunny';
      case 'Rainy': return 'rainy';
      case 'PartlyCloudy': return 'partly_cloudy_day';
      case 'Cloudy': return 'filter_drama';
      default: return 'wb_sunny';
    }
  };

  const getConditionColor = (condition: WeatherCondition) => {
    switch (condition) {
      case 'Sunny': return 'text-yellow-500 dark:text-yellow-400';
      case 'Rainy': return 'text-blue-500 dark:text-blue-400';
      case 'PartlyCloudy': return 'text-slate-500 dark:text-slate-300';
      case 'Cloudy': return 'text-slate-600 dark:text-slate-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hava Durumu</h1>
        <p className="text-slate-600 dark:text-[#92c9a4] mt-1">{activeLandName} bölgesi detaylı raporu</p>
      </div>

      {/* Current Weather Card */}
      <div className="bg-gradient-to-br from-surface-light to-background-light dark:from-surface-dark dark:to-background-dark rounded-3xl p-8 border border-border-light dark:border-border-dark shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        
        <div className="flex justify-between items-center relative z-10">
          <div>
            <div className="text-6xl font-black text-slate-900 dark:text-white">{status.temperature}°C</div>
            <div className="text-lg font-bold text-primary mt-1 uppercase tracking-widest">
              {status.condition === 'Sunny' ? 'Güneşli' : 
               status.condition === 'Rainy' ? 'Yağmurlu' : 
               status.condition === 'PartlyCloudy' ? 'Parçalı Bulutlu' : 'Bulutlu'}
            </div>
          </div>
          <span className={`material-symbols-outlined text-8xl ${getConditionColor(status.condition)}`}>
            {getConditionIcon(status.condition)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10 relative z-10">
          <div className="text-center">
            <div className="text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Nem</div>
            <div className="text-slate-900 dark:text-white font-bold text-lg">%45</div>
          </div>
          <div className="text-center border-x border-slate-300 dark:border-white/10">
            <div className="text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Rüzgar</div>
            <div className="text-slate-900 dark:text-white font-bold text-lg">12km/s</div>
          </div>
          <div className="text-center">
            <div className="text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">UV İndeksi</div>
            <div className="text-slate-900 dark:text-white font-bold text-lg">Orta</div>
          </div>
        </div>
      </div>

      {/* Forecast Section */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-2">5 Günlük Tahmin</h3>
      <div className="flex flex-col gap-3">
        {status.forecast?.map((day, index) => (
          <div key={index} className="flex items-center justify-between p-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light/50 dark:bg-surface-dark/50 backdrop-blur-sm shadow-sm">
            <div className="w-24 font-bold text-slate-900 dark:text-white text-sm">{day.date}</div>
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-xl ${getConditionColor(day.condition)}`}>
                {getConditionIcon(day.condition)}
              </span>
              <span className="text-slate-700 dark:text-slate-400 text-xs font-medium w-16">
                {day.condition === 'Sunny' ? 'Güneşli' : 
                 day.condition === 'Rainy' ? 'Yağmurlu' : 
                 day.condition === 'PartlyCloudy' ? 'Parçalı' : 'Bulutlu'}
              </span>
            </div>
            <div className="flex items-center gap-3 w-20 justify-end">
              <span className="text-slate-900 dark:text-white font-bold">{day.maxTemp}°</span>
              <span className="text-slate-700 font-medium text-xs">{day.minTemp}°</span>
            </div>
          </div>
        )) || (
          <div className="p-8 text-center text-slate-600 italic">Tahmin verileri yükleniyor...</div>
        )}
      </div>
    </div>
  );
};

export default WeatherView;
