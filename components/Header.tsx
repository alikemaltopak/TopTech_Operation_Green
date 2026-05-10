
import React from 'react';

interface HeaderProps {
  isOnline: boolean;
  onProfileClick: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  userPhotoURL?: string | null;
}

const Header: React.FC<HeaderProps> = ({ isOnline, onProfileClick, theme, onThemeToggle, userPhotoURL }) => {
  return (
    <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="flex items-center p-4 justify-between max-w-md mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
          <span className="font-bold tracking-tight text-slate-900 dark:text-white">TOPTECH</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isOnline ? 'bg-primary/10 border-primary/20' : 'bg-red-500/10 border-red-500/20'} border`}>
            <span className="relative flex h-2 w-2">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-primary' : 'bg-red-500'}`}></span>
            </span>
            <span className={`${isOnline ? 'text-primary' : 'text-red-500'} text-xs font-bold uppercase tracking-wider`}>
              {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
            </span>
          </div>

          <button 
            onClick={onThemeToggle}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-primary text-lg">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>

        <button 
          onClick={onProfileClick}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm active:scale-90 transition-transform overflow-hidden"
        >
          {userPhotoURL ? (
            <img src={userPhotoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="material-symbols-outlined text-slate-700 dark:text-white">person</span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
