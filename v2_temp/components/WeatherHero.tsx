
import React from 'react';
import { motion } from 'motion/react';
import { WeatherCondition } from '../types';

interface WeatherHeroProps {
  condition: WeatherCondition;
  temperature: number;
}

const WeatherHero: React.FC<WeatherHeroProps> = ({ condition, temperature }) => {
  const getConfig = () => {
    switch (condition) {
      case 'Sunny':
        return {
          icon: 'wb_sunny',
          label: 'Güneşli',
          color: 'text-yellow-400',
          glow: 'shadow-[0_0_50px_rgba(250,204,21,0.3)]',
          bg: 'bg-yellow-400/10',
          animationProps: {
            animate: { rotate: 360 },
            transition: { duration: 12, ease: "linear", repeat: Infinity }
          }
        };
      case 'Rainy':
        return {
          icon: 'rainy',
          label: 'Yağmurlu',
          color: 'text-blue-400',
          glow: 'shadow-[0_0_50px_rgba(96,165,250,0.3)]',
          bg: 'bg-blue-400/10',
          animationProps: {
            animate: { y: [0, -5, 0] },
            transition: { duration: 2, ease: "easeInOut", repeat: Infinity }
          }
        };
      case 'PartlyCloudy':
        return {
          icon: 'partly_cloudy_day',
          label: 'Parçalı Bulutlu',
          color: 'text-slate-300',
          glow: 'shadow-[0_0_50px_rgba(203,213,225,0.2)]',
          bg: 'bg-slate-300/10',
          animationProps: {
            animate: { x: [-3, 3, -3] },
            transition: { duration: 4, ease: "easeInOut", repeat: Infinity }
          }
        };
      case 'Cloudy':
      default:
        return {
          icon: 'filter_drama',
          label: 'Bulutlu',
          color: 'text-slate-400',
          glow: 'shadow-[0_0_50px_rgba(148,163,184,0.2)]',
          bg: 'bg-slate-400/10',
          animationProps: {
            animate: { scale: [1, 1.05, 1] },
            transition: { duration: 4, ease: "easeInOut", repeat: Infinity }
          }
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`relative flex flex-col items-center justify-center w-64 h-64 rounded-full border-4 border-border-light dark:border-surface-dark transition-all duration-700 ${config.bg} ${config.glow}`}>
      <div className="text-center z-10 animate-in zoom-in duration-1000">
        <motion.span 
          {...config.animationProps}
          className={`material-symbols-outlined text-6xl mb-2 transition-colors duration-700 ${config.color} scale-125 block`}
        >
          {config.icon}
        </motion.span>
        <div className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tighter mt-1">
          {temperature}°C
        </div>
        <div className="text-sm font-bold text-slate-600 dark:text-[#92c9a4] uppercase tracking-widest mt-2">
          {config.label}
        </div>
      </div>
      
      {/* Decorative pulse ring */}
      <div className={`absolute inset-0 rounded-full border-2 border-primary/20 animate-ping opacity-20`}></div>
    </div>
  );
};

export default WeatherHero;
