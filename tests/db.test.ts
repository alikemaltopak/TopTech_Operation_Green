import { describe, it, expect, vi, beforeEach } from 'vitest';

// Firestore SDK'sını taklit ederek lib/db.ts'nin hangi yola ne yazdığını doğruluyoruz.
const fs = vi.hoisted(() => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  collection: vi.fn((_db: unknown, path: string) => ({ path })),
  getDoc: vi.fn(),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  addDoc: vi.fn(async () => ({ id: 'new-id' })),
  deleteDoc: vi.fn(async () => {}),
  query: vi.fn((ref: { path: string }, ...constraints: unknown[]) => ({ ...ref, constraints })),
  orderBy: vi.fn((field: string, dir: string) => ({ field, dir })),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}));

vi.mock('firebase/firestore', () => fs);
vi.mock('../lib/firebase', () => ({ db: {} }));

import {
  updateUserDocument,
  updateUserSettings,
  addLand,
  updateLand,
  deleteLand,
  subscribeToLands,
  addHistorySession,
  subscribeToHistory,
  subscribeToUserSettings,
} from '../lib/db';

const EMAIL = 'ali.kemal@example.com';
const USER_ID = 'ali_kemal_example_com';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('lib/db — Firestore veri katmanı', () => {
  it('e-posta adresini güvenli kullanıcı kimliğine çevirir ve kullanıcıya özel yola yazar', async () => {
    await updateUserSettings(EMAIL, { tankCapacity: 5000 });
    expect(fs.doc).toHaveBeenCalledWith({}, 'users', USER_ID);
    expect(fs.updateDoc).toHaveBeenCalledWith({ path: `users/${USER_ID}` }, { tankCapacity: 5000 });
  });

  it('yeni kullanıcıya tüm varsayılan ayarları yazar (3000 L depo, damla sulama, 05:30 plan)', async () => {
    fs.getDoc.mockResolvedValueOnce({ exists: () => false });
    await updateUserDocument(EMAIL);
    expect(fs.setDoc).toHaveBeenCalledTimes(1);
    const [, data] = fs.setDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(data).toMatchObject({
      email: EMAIL,
      tankCapacity: 3000,
      waterRemaining: 3000,
      baseHeightMeters: 0.5,
      netWaterHeightMeters: 1.65,
      pipeLengthMeters: 20,
      irrigationType: 'drip',
      dripperCount: 300,
      dripperFlowRateLph: 8,
      valveSize: 'DN20',
      isScheduleActive: false,
      nextSchedule: '05:30',
    });
    expect(fs.updateDoc).not.toHaveBeenCalled();
  });

  it('mevcut kullanıcının ayarlarını EZMEZ, sadece eksik alanları tamamlar', async () => {
    fs.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ tankCapacity: 10000, irrigationType: 'free_flow', nextSchedule: '06:00' }),
    });
    await updateUserDocument(EMAIL);
    expect(fs.setDoc).not.toHaveBeenCalled();
    const [, updates] = fs.updateDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(updates.lastLogin).toBe('SERVER_TS');
    expect(updates).not.toHaveProperty('tankCapacity');
    expect(updates).not.toHaveProperty('irrigationType');
    expect(updates).not.toHaveProperty('nextSchedule');
    expect(updates).toMatchObject({ waterRemaining: 3000, dripperCount: 300, isScheduleActive: false });
  });

  it('arazi ekleme/güncelleme/silme doğru alt koleksiyona gider', async () => {
    const id = await addLand(EMAIL, { name: 'Zeytinlik', location: '-', sensorCount: 0, image: '', phoneNumber: '+905551112233' });
    expect(id).toBe('new-id');
    expect(fs.collection).toHaveBeenCalledWith({}, `users/${USER_ID}/lands`);
    expect(fs.addDoc).toHaveBeenCalledWith(
      { path: `users/${USER_ID}/lands` },
      expect.objectContaining({ name: 'Zeytinlik', phoneNumber: '+905551112233', createdAt: 'SERVER_TS' }),
    );

    await updateLand(EMAIL, 'land-1', { name: 'Yeni Ad' });
    expect(fs.updateDoc).toHaveBeenCalledWith({ path: `users/${USER_ID}/lands/land-1` }, { name: 'Yeni Ad' });

    await deleteLand(EMAIL, 'land-1');
    expect(fs.deleteDoc).toHaveBeenCalledWith({ path: `users/${USER_ID}/lands/land-1` });
  });

  it('sulama oturumu geçmiş koleksiyonuna zaman damgasıyla kaydedilir', async () => {
    await addHistorySession(EMAIL, {
      landId: 'l1', landName: 'Bahçe', date: '2026-10-21', time: '05:30', startTime: '05:30:00',
      endTime: '05:40:00', duration: '10 dk 0 sn', icon: 'water_drop', totalConsumedLiters: 180,
    });
    expect(fs.addDoc).toHaveBeenCalledWith(
      { path: `users/${USER_ID}/history` },
      expect.objectContaining({ landName: 'Bahçe', totalConsumedLiters: 180, createdAt: 'SERVER_TS' }),
    );
  });

  it('araziler ve geçmiş en yeniden eskiye sıralı dinlenir; doküman id\'leri modele eklenir', () => {
    const cb = vi.fn();
    fs.onSnapshot.mockImplementation((_q: unknown, next: (snap: unknown) => void) => {
      next({ docs: [{ id: 'a', data: () => ({ name: 'A' }) }, { id: 'b', data: () => ({ name: 'B' }) }] });
      return () => {};
    });

    subscribeToLands(EMAIL, cb);
    expect(fs.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(cb).toHaveBeenCalledWith([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]);

    const hcb = vi.fn();
    subscribeToHistory(EMAIL, hcb);
    expect(fs.collection).toHaveBeenCalledWith({}, `users/${USER_ID}/history`);
    expect(hcb).toHaveBeenCalledWith([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]);
  });

  it('kullanıcı ayarları dinleyicisi doküman yoksa null döner', () => {
    const cb = vi.fn();
    fs.onSnapshot.mockImplementationOnce((_ref: unknown, next: (snap: unknown) => void) => {
      next({ exists: () => false });
      return () => {};
    });
    subscribeToUserSettings(EMAIL, cb);
    expect(cb).toHaveBeenCalledWith(null);
  });
});
