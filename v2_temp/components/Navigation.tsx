
import React from 'react';
import { NavTab } from '../types';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: NavTab.PANEL, label: 'Panel', icon: 'grid_view' },
    { id: NavTab.WEATHER, label: 'Hava Durumu', icon: 'cloud' },
    { id: NavTab.HISTORY, label: 'Geçmiş', icon: 'history' },
    { id: NavTab.LANDS, label: 'Arazilerim', icon: 'landscape' },
    { id: NavTab.SETTINGS, label: 'Ayarlar', icon: 'settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[999] bg-surface-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-border-light dark:border-border-dark pb-8 pt-3 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
      <div className="max-w-md mx-auto flex justify-around items-center px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 min-w-[60px] transition-all duration-300 ${
              activeTab === tab.id 
                ? 'text-primary transform -translate-y-0.5' 
                : 'text-slate-500 dark:text-[#92c9a4] hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            <span className={`material-symbols-outlined transition-all ${activeTab === tab.id ? 'font-bold scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className="text-[9px] font-black uppercase tracking-tighter text-center">
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <span className="w-1 h-1 rounded-full bg-primary mt-0.5 animate-in fade-in zoom-in duration-300"></span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
