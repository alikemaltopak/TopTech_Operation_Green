import React, { useState } from 'react';
import { sendEmailVerification, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface VerifyEmailViewProps {
  firebaseUser: User;
  onVerified: () => void;
}

// E-posta doğrulanmadan arazi ve sulama verilerine erişilemez (Firestore kuralları da bunu zorunlu kılar).
const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ firebaseUser, onVerified }) => {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const resend = async () => {
    setBusy(true);
    try {
      await sendEmailVerification(firebaseUser);
      setMessage('Doğrulama e-postası tekrar gönderildi. Gelen kutunuzu (ve spam klasörünü) kontrol edin.');
    } catch {
      setMessage('E-posta gönderilemedi. Birkaç dakika sonra tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  const checkVerified = async () => {
    setBusy(true);
    try {
      await firebaseUser.reload();
      if (firebaseUser.emailVerified) {
        await firebaseUser.getIdToken(true); // jetondaki email_verified bilgisini yenile
        onVerified();
      } else {
        setMessage('E-posta adresiniz henüz doğrulanmamış görünüyor.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-8 shadow-2xl text-center">
        <span className="material-symbols-outlined text-primary text-6xl">mark_email_unread</span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-4">E-postanızı doğrulayın</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
          <b>{firebaseUser.email}</b> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra
          aşağıdaki düğmeye basın. Verilerinizin güvenliği için doğrulanmamış hesaplar arazi bilgilerine erişemez.
        </p>
        {message && <p role="status" className="text-xs font-bold text-primary mt-4">{message}</p>}
        <div className="flex flex-col gap-3 mt-6">
          <button disabled={busy} onClick={checkVerified} className="w-full h-12 rounded-2xl bg-primary text-background-dark font-black disabled:opacity-50">
            DOĞRULADIM, DEVAM ET
          </button>
          <button disabled={busy} onClick={resend} className="w-full h-12 rounded-2xl border border-border-light dark:border-border-dark text-slate-700 dark:text-slate-200 font-bold disabled:opacity-50">
            Doğrulama e-postasını tekrar gönder
          </button>
          <button onClick={() => signOut(auth)} className="text-xs font-bold text-slate-500 mt-2">
            Farklı bir hesapla giriş yap
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailView;
