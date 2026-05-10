import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AppIntroProps {
  onComplete: () => void;
}

const AppIntro: React.FC<AppIntroProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<'led' | 'logo'>('led');

  useEffect(() => {
    const ledTimer = setTimeout(() => {
      setPhase('logo');
    }, 2500);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Wait for the exit animation to finish
    }, 6500);

    return () => {
      clearTimeout(ledTimer);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-background-dark flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Tech Grid Background */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(rgba(19, 236, 91, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(19, 236, 91, 0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: 'center'
          }}></div>

          <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6 h-[400px]">
            <AnimatePresence mode="wait">
              {phase === 'led' && (
                <motion.div
                  key="led"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ scale: 20, opacity: 0, filter: "blur(5px)" }}
                  transition={{ duration: 0.6, exit: { duration: 0.5, ease: "easeIn" } }}
                  className="flex items-center justify-center"
                >
                  <motion.div 
                    animate={{ opacity: [0.1, 1, 0.1] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(19,236,91,1)]"
                  >
                    <div className="w-full h-full bg-white opacity-50 rounded-full" />
                  </motion.div>
                </motion.div>
              )}

              {phase === 'logo' && (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, type: "spring", bounce: 0.5 }}
                  className="flex flex-col items-center w-full"
                >
                  {/* Logo Droplet Animation */}
                  <div className="relative h-40 w-40 flex items-center justify-center mb-8">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.5, 0.2] }}
                      transition={{ duration: 2, delay: 0.2, times: [0, 0.5, 1] }}
                      className="absolute inset-0 bg-primary rounded-full blur-3xl"
                    />
                    
                    <div className="relative flex items-center justify-center h-full w-full">
                      <span className="material-symbols-outlined text-border-dark text-[120px] absolute z-0">
                        water_drop
                      </span>
                      
                      <motion.div 
                        initial={{ height: "0%" }}
                        animate={{ height: "100%" }}
                        transition={{ duration: 1.2, delay: 0.5, ease: "circIn" }}
                        className="absolute bottom-0 left-0 right-0 overflow-hidden flex justify-center z-10"
                      >
                        <span className="material-symbols-outlined text-primary text-[120px] absolute bottom-0">
                          water_drop
                        </span>
                      </motion.div>
                      
                      <span className="material-symbols-outlined text-white/50 text-[120px] absolute z-20 mix-blend-overlay">
                        water_drop
                      </span>
                    </div>

                     {/* Scanning Line */}
                    <motion.div 
                      initial={{ top: 0, opacity: 0 }}
                      animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1.5, delay: 1.0, ease: "linear" }}
                      className="absolute left-8 right-8 h-1 bg-white shadow-[0_0_15px_rgba(255,255,255,1)] z-30 rounded-full"
                    />
                  </div>

                  {/* Text Reveal */}
                  <div className="flex flex-col items-center overflow-hidden w-full">
                    <motion.h1 
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
                      className="text-5xl font-black text-white tracking-tighter"
                    >
                      TOPTECH
                    </motion.h1>
                  </div>
                  
                  <div className="overflow-hidden mt-2">
                    <motion.div 
                      initial={{ x: "-100%", opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
                      className="flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-primary text-sm animate-spin-slow">settings</span>
                      <p className="text-primary text-xs font-bold uppercase tracking-[0.4em]">
                        Pro-Sulama V2.5
                      </p>
                    </motion.div>
                  </div>

                  {/* Loading Bar */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8, duration: 0.5 }}
                    className="mt-12 w-full max-w-[200px]"
                  >
                    <div className="h-1 bg-surface-dark rounded-full overflow-hidden w-full relative">
                      <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.0, delay: 2.0, ease: "anticipate" }}
                        className="absolute left-0 top-0 bottom-0 bg-primary"
                      />
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.2 }}
                      className="mt-4 flex justify-center items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                      Sistemler Başlatılıyor
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppIntro;
