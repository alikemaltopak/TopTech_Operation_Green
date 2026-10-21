import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Uygulama SMS göndermek için `window.location.href = "sms:..."` kullanıyor.
// jsdom gerçek navigasyon yapamadığı için href'i yakalayan bir stub kuruyoruz;
// testler gönderilen SMS URI'sini `window.location.href` üzerinden okur.
const locationStub = { href: 'http://localhost/' } as Location;
Object.defineProperty(window, 'location', { value: locationStub, writable: true });

afterEach(() => {
  cleanup();
  locationStub.href = 'http://localhost/';
  localStorage.clear();
  vi.useRealTimers();
});
