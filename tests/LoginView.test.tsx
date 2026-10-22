import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const auth = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(async () => ({ user: { uid: 'u1', email: 'yeni@example.com' } })),
  signInWithEmailAndPassword: vi.fn(async () => ({})),
  sendEmailVerification: vi.fn(async () => {}),
  signInWithPopup: vi.fn(),
}));
vi.mock('firebase/auth', () => auth);
vi.mock('../lib/firebase', () => ({ auth: {}, googleProvider: {} }));

import LoginView from '../components/LoginView';

beforeEach(() => vi.clearAllMocks());

const fill = (container: HTMLElement) => {
  fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'yeni@example.com' } });
  fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'gizli-parola-123' } });
};

describe('Giriş / kayıt', () => {
  it('yeni hesap açılınca doğrulama e-postası gönderilir', async () => {
    const { container } = render(<LoginView onLogin={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'HESAP OLUŞTUR' }));
    fill(container);
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(auth.sendEmailVerification).toHaveBeenCalledWith({ uid: 'u1', email: 'yeni@example.com' }));
  });

  it('mevcut hesapla girişte doğrulama e-postası tekrar gönderilmez', async () => {
    const { container } = render(<LoginView onLogin={vi.fn()} />);
    fill(container);
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(auth.signInWithEmailAndPassword).toHaveBeenCalled());
    expect(auth.sendEmailVerification).not.toHaveBeenCalled();
  });
});
