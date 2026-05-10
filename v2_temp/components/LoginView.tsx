
import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (email: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simüle edilmiş Firebase Auth süreci
    setTimeout(() => {
      onLogin(email);
      setLoading(false);
    }, 1800);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin('google-user@gmail.com');
      setLoading(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-background-light dark:bg-background-dark flex items-center justify-center p-6 overflow-hidden transition-colors duration-500">
      {/* Fütüristik Arka Plan Katmanları */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Teknik Grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#13ec5b 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        {/* Hareketli Neon Işıklar */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Dekoratif Çizgiler */}
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
      </div>

      <div className="w-full max-w-md relative animate-in fade-in zoom-in slide-in-from-bottom-8 duration-700">
        {/* Üst Logo ve Başlık Alanı */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className="h-24 w-24 rounded-[2rem] bg-surface-light dark:bg-surface-dark border border-primary/30 flex items-center justify-center relative z-10 shadow-2xl overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
               <span className="material-symbols-outlined text-primary text-6xl leading-none font-light">verified_user</span>
               {/* Köşe Detayları */}
               <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-primary/40"></div>
               <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-primary/40"></div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2 justify-center">
              TOP<span className="text-primary">TECH</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
               <div className="h-[1px] w-8 bg-primary/20"></div>
               <p className="text-primary text-[9px] font-black uppercase tracking-[0.5em] opacity-80">SMART ECOSYSTEM</p>
               <div className="h-[1px] w-8 bg-primary/20"></div>
            </div>
          </div>
        </div>

        {/* Ana Form Kartı */}
        <div className="bg-surface-light/80 dark:bg-surface-dark/40 backdrop-blur-3xl border border-border-light dark:border-white/5 rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Tarayıcı Işık Efekti (Kenarda) */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
          
          {/* Segmented Switch */}
          <div className="bg-slate-100 dark:bg-black/20 p-1.5 rounded-[1.5rem] flex mb-8 relative border border-border-light dark:border-white/5">
            <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-primary rounded-[1.2rem] shadow-lg shadow-primary/20 transition-all duration-500 ease-out ${isLogin ? 'left-1.5' : 'left-[50%]'}`}
            ></div>
            <button 
              onClick={() => setIsLogin(true)}
              className={`relative z-10 flex-1 py-3 text-[10px] font-black tracking-widest transition-colors duration-300 ${isLogin ? 'text-background-dark' : 'text-slate-600'}`}
            >
              OTURUM AÇ
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`relative z-10 flex-1 py-3 text-[10px] font-black tracking-widest transition-colors duration-300 ${!isLogin ? 'text-background-dark' : 'text-slate-600'}`}
            >
              HESAP OLUŞTUR
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group/input">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] group-focus-within/input:text-primary transition-colors">Kullanıcı Kimliği</label>
                <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-700 group-focus-within/input:text-primary">alternate_email</span>
              </div>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e-posta@toptech.com"
                  className="w-full bg-white dark:bg-black/40 border border-border-light dark:border-white/5 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800"
                />
              </div>
            </div>
            
            <div className="space-y-2 group/input">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] group-focus-within/input:text-primary transition-colors">Erişim Anahtarı</label>
                <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-700 group-focus-within/input:text-primary">lock_open</span>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-black/40 border border-border-light dark:border-white/5 rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden group/btn active:scale-[0.98] transition-all"
            >
              <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover/btn:opacity-40 transition-opacity"></div>
              <div className="relative bg-primary text-background-dark border border-border-light dark:border-primary font-black text-sm h-16 rounded-2xl flex items-center justify-center gap-3 overflow-hidden">
                {loading ? (
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined animate-spin">data_usage</span>
                     <span className="tracking-widest text-[10px]">VERİ İŞLENİYOR...</span>
                  </div>
                ) : (
                  <>
                    <span className="tracking-[0.2em]">{isLogin ? 'SİSTEME GİRİŞ YAP' : 'ÜYELİĞİ TAMAMLA'}</span>
                    <span className="material-symbols-outlined font-bold">arrow_forward</span>
                  </>
                )}
                {/* Buton parlaması */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover/btn:left-full transition-all duration-1000"></div>
              </div>
            </button>
          </form>

          {/* Social Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10"></div>
            <span className="text-[8px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.3em]">DIŞ BAĞLANTI</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-slate-50 dark:bg-white/5 border border-border-light dark:border-white/10 text-slate-900 dark:text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all relative group/google"
          >
            <div className="bg-white p-1 rounded-lg shadow-sm">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase opacity-80 group-hover/google:opacity-100">GOOGLE CLOUD AUTH</span>
          </button>

          {isLogin && (
            <button className="w-full text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] mt-8 hover:text-primary transition-colors">
              ERİŞİMİ Mİ KAYBETTİN?
            </button>
          )}
        </div>

        {/* Alt Bilgi */}
        <div className="mt-12 text-center space-y-2">
           <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-4 bg-primary/20"></div>
              <span className="text-primary/40 text-[8px] font-black uppercase tracking-[0.4em]">SECURE GATEWAY v4.0</span>
              <div className="h-[1px] w-4 bg-primary/20"></div>
           </div>
           <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest">
             © 2025 TOPTECH LABS. TÜM HAKLARI SAKLIDIR.
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
