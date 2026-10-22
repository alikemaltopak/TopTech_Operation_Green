import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';

// ─── Firebase ve veri katmanı taklitleri ───
// Uçtan uca akışı (giriş → arazi → sulama → SMS → geçmiş kaydı) gerçek Firebase olmadan doğruluyoruz.
const mocks = vi.hoisted(() => ({
  lands: [] as unknown[],
  settings: null as Record<string, unknown> | null,
  authUser: null as any,
  auth: { currentUser: null as any },
  storage: {
    ref: vi.fn((_s: unknown, path: string) => ({ path })),
    uploadBytes: vi.fn(async () => {}),
    getDownloadURL: vi.fn(async () => 'https://storage/foto.png'),
  },
  sendEmailVerification: vi.fn(async () => {}),
  db: {
    subscribeToLands: vi.fn(),
    subscribeToHistory: vi.fn(),
    subscribeToUserSettings: vi.fn(),
    addHistorySession: vi.fn(async (_email: string, _session: unknown) => 'h1'),
    addLand: vi.fn(async (_email: string, _land: unknown) => 'new-land'),
    updateLand: vi.fn(async () => {}),
    deleteLand: vi.fn(async () => {}),
    updateUserDocument: vi.fn(async () => {}),
    updateUserSettings: vi.fn(async (_email: string, _updates: Record<string, unknown>) => {}),
  },
}));

vi.mock('../lib/firebase', () => ({ auth: mocks.auth, storage: {}, db: {}, googleProvider: {} }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    mocks.auth.currentUser = mocks.authUser;
    cb(mocks.authUser);
    return () => {};
  },
  signOut: vi.fn(),
  updateProfile: vi.fn(async () => {}),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(async () => ({ user: { uid: 'yeni', email: 'yeni@example.com' } })),
  sendEmailVerification: mocks.sendEmailVerification,
}));
vi.mock('firebase/storage', () => mocks.storage);
vi.mock('../lib/db', () => mocks.db);

import App from '../App';

const PHONE = '+905551112233';
const LANDS = [
  { id: 'l1', name: 'Zeytinlik', location: '38.49, 27.52', sensorCount: 0, image: '', phoneNumber: PHONE, coordinates: '38.49, 27.52' },
  { id: 'l2', name: 'Sera', location: '-', sensorCount: 0, image: '', phoneNumber: '+905554445566', coordinates: '39.93, 32.85' },
];

const weatherResponse = {
  current_weather: { temperature: 27.6, weathercode: 0 },
  daily: {
    time: ['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'],
    weathercode: [0, 2, 45, 61, 95, 0],
    temperature_2m_max: [28.4, 25.1, 22.0, 19.6, 18.2, 20],
    temperature_2m_min: [15.2, 14.0, 12.9, 11.5, 10.1, 9],
  },
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authUser = { uid: 'u1', email: 'ciftci@example.com', emailVerified: true, photoURL: null };
  mocks.lands = LANDS;
  mocks.settings = { tankCapacity: 3000, waterRemaining: 3000, isScheduleActive: false, nextSchedule: '05:30', nextScheduleDay: 'Belirtilmedi' };
  mocks.db.subscribeToLands.mockImplementation((_e: string, cb: (l: unknown[]) => void) => { cb(mocks.lands); return () => {}; });
  mocks.db.subscribeToHistory.mockImplementation((_e: string, cb: (s: unknown[]) => void) => { cb([]); return () => {}; });
  mocks.db.subscribeToUserSettings.mockImplementation((_e: string, cb: (s: unknown) => void) => { cb(mocks.settings); return () => {}; });
  fetchMock = vi.fn(async () => ({ json: async () => weatherResponse }));
  vi.stubGlobal('fetch', fetchMock);
});

const flush = () => act(async () => { await Promise.resolve(); });

async function renderApp() {
  const utils = render(<App />);
  await flush();
  return utils;
}

const clickTab = (label: string) => fireEvent.click(screen.getByText(label).closest('button')!);

describe('App — uçtan uca kullanım senaryoları', () => {
  it('oturum açan kullanıcı için kullanıcı dokümanı oluşturulur ve ilk arazi aktif seçilir', async () => {
    await renderApp();
    expect(mocks.db.updateUserDocument).toHaveBeenCalledWith('ciftci@example.com');
    expect(screen.getByRole('heading', { name: 'Zeytinlik' })).toBeInTheDocument();
  });

  it('Senaryo 2: BAŞLAT → cihaza "ON10" SMS\'i, DURDUR → "OFF" SMS\'i ve geçmişe kayıt', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(new Date(2026, 9, 21, 5, 30, 0));
    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: /BAŞLAT/ }));
    expect(window.location.href).toBe(`sms:${PHONE}?body=ON10`);
    expect(screen.getByRole('button', { name: /DURDUR/ })).toBeInTheDocument();

    // 2 dakika sula
    act(() => { vi.advanceTimersByTime(120_000); });

    fireEvent.click(screen.getByRole('button', { name: /DURDUR/ }));
    expect(window.location.href).toBe(`sms:${PHONE}?body=OFF`);

    expect(mocks.db.addHistorySession).toHaveBeenCalledTimes(1);
    const [email, session] = mocks.db.addHistorySession.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(email).toBe('ciftci@example.com');
    expect(session).toMatchObject({
      landId: 'l1',
      landName: 'Zeytinlik',
      date: '2026-10-21',
      time: '05:30',
      startTime: '05:30:00',
      endTime: '05:32:00',
      duration: '2 dk 0 sn',
    });
    // Fizik motoru ~18.5 L/dk debi hesaplar → 2 dakikada ~37 L
    expect(session.totalConsumedLiters as number).toBeGreaterThan(30);
    expect(session.totalConsumedLiters as number).toBeLessThan(40);

    // Depodaki kalan su, tüketim kadar azaltılarak kaydedilir
    const waterUpdate = mocks.db.updateUserSettings.mock.calls.find(c => 'waterRemaining' in (c[1] as object));
    expect(waterUpdate![1]).toEqual({ waterRemaining: Math.round((3000 - (session.totalConsumedLiters as number)) * 10) / 10 });
  });

  it('zamanlayıcı süresi dolunca sulama kendiliğinden durur ve OFF gönderilir', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 21, 7, 0, 0));
    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: '5 DK' }));
    fireEvent.click(screen.getByRole('button', { name: /BAŞLAT/ }));
    expect(window.location.href).toBe(`sms:${PHONE}?body=ON5`);

    act(() => { vi.advanceTimersByTime(5 * 60_000 + 2000); });
    expect(window.location.href).toBe(`sms:${PHONE}?body=OFF`);
    expect(mocks.db.addHistorySession).toHaveBeenCalledTimes(1);
    const session = mocks.db.addHistorySession.mock.calls[0][1] as Record<string, string>;
    expect(session.duration).toMatch(/^5 dk [0-2] sn$/);
    expect(screen.getByRole('button', { name: /BAŞLAT/ })).toBeInTheDocument();
  });

  it('telefon numarası olmayan arazide SMS uygulaması açılmaz', async () => {
    mocks.lands = [{ ...LANDS[0], phoneNumber: '' }];
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /BAŞLAT/ }));
    expect(window.location.href).not.toMatch(/^sms:/);
  });

  it('Senaryo 3: otomatik zamanlama saati gelince bildirim gösterir ve 10 dk sulama başlatır', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 21, 5, 29, 55));
    mocks.settings = { ...mocks.settings, isScheduleActive: true, nextSchedule: '05:30' };
    await renderApp();

    expect(screen.queryByText('Toptech Otomatik Sulama')).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(10_000); });

    expect(screen.getByText('Toptech Otomatik Sulama')).toBeInTheDocument();
    expect(screen.getByText(/"Zeytinlik" araziniz için planlanan otomatik sulama/)).toBeInTheDocument();
    expect(window.location.href).toBe(`sms:${PHONE}?body=ON10`);

    // Sulama hemen kapanmamalı, 10 dk sürmeli; aynı dakika içinde ikinci kez tetiklenmemeli
    window.location.href = 'http://localhost/';
    act(() => { vi.advanceTimersByTime(20_000); });
    expect(window.location.href).toBe('http://localhost/');
    expect(screen.getByRole('button', { name: /DURDUR/ })).toBeInTheDocument();
    expect(mocks.db.addHistorySession).not.toHaveBeenCalled();
    expect(screen.getByText('09:40')).toBeInTheDocument();

    // Saniye saniye ilerlet ki geri sayım gerçek zamanlı gibi işlesin
    for (let i = 0; i < 10 * 60 && !mocks.db.addHistorySession.mock.calls.length; i++) {
      act(() => { vi.advanceTimersByTime(1000); });
    }
    expect(window.location.href).toBe(`sms:${PHONE}?body=OFF`);
    const session = mocks.db.addHistorySession.mock.calls[0][1] as Record<string, string>;
    expect(session.duration).toMatch(/^10 dk [0-9] sn$/);
  });

  it('zamanlama kapalıysa saat gelse bile sulama başlamaz', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 21, 5, 29, 55));
    await renderApp();
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(window.location.href).not.toMatch(/^sms:/);
  });

  it('zamanlama anahtarı Firestore\'a kaydedilir', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(mocks.db.updateUserSettings).toHaveBeenCalledWith('ciftci@example.com', { isScheduleActive: true });
  });

  it('Senaryo 4: aktif arazinin koordinatlarıyla Open-Meteo\'dan hava durumu ve 5 günlük tahmin çekilir', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 12, 0, 0));
    await renderApp();
    await flush();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('latitude=38.49&longitude=27.52'));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('current_weather=true'));

    clickTab('Hava Durumu');
    expect(screen.getByText('28°C')).toBeInTheDocument(); // 27.6 yuvarlanır
    expect(screen.getByText('Bugün')).toBeInTheDocument();
    expect(screen.getByText('Perşembe')).toBeInTheDocument(); // 22 Ekim 2026
    expect(screen.getByText('Pazar')).toBeInTheDocument(); // 25 Ekim → 5. gün
    expect(screen.queryByText('Pazartesi')).not.toBeInTheDocument(); // 6. gün kırpılır
    // WMO kodu eşlemesi: 0 güneşli, 2 parçalı bulutlu, 45 sisli/bulutlu, 61 & 95 yağmurlu
    const icons = within(screen.getByRole('main')).getAllByText(/^(wb_sunny|partly_cloudy_day|filter_drama|rainy)$/).map(e => e.textContent);
    expect(icons).toEqual(['wb_sunny', 'wb_sunny', 'partly_cloudy_day', 'filter_drama', 'rainy', 'rainy']);
  });

  it('başka bir arazi seçilince hava durumu o arazinin koordinatlarıyla yenilenir ve panele dönülür', async () => {
    await renderApp();
    await flush();
    clickTab('Arazilerim');
    fireEvent.click(screen.getByText('Sera'));
    await flush();
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('latitude=39.93&longitude=32.85'));
    expect(screen.getByRole('heading', { name: 'Sera' })).toBeInTheDocument();
  });

  it('Senaryo 1: yeni arazi eklenince Firestore\'a yazılır, aktif arazi olur ve panele dönülür', async () => {
    await renderApp();
    clickTab('Arazilerim');
    fireEvent.click(screen.getByRole('button', { name: /Arazi Ekle/ }));
    fireEvent.change(screen.getByPlaceholderText('Örn: Zeytinlik'), { target: { value: 'Bağ' } });
    fireEvent.change(screen.getByPlaceholderText('+90 5xx xxx xx xx'), { target: { value: '+905557778899' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await flush();
    await flush();
    expect(mocks.db.addLand).toHaveBeenCalledWith('ciftci@example.com', expect.objectContaining({ name: 'Bağ', phoneNumber: '+905557778899' }));
    expect(mocks.db.addLand.mock.calls[0][1]).not.toHaveProperty('id');
    expect(screen.getByText('SULAMA SÜRESİ KONTROLÜ')).toBeInTheDocument();
  });

  it('Senaryo 6: seçilen tema CSS değişkenlerine uygulanır ve localStorage\'da saklanır', async () => {
    await renderApp();
    clickTab('Ayarlar');
    fireEvent.click(screen.getByText('Temalar').closest('button')!);
    fireEvent.click(screen.getByText('Obsidyen').closest('button')!);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBe('#a855f7');
    expect(root.style.getPropertyValue('--radius-default')).toBe('0px');
    expect(root.classList.contains('theme-textured')).toBe(true);
    expect(localStorage.getItem('toptech_theme')).toBe('obsidyen');

    fireEvent.click(screen.getByText('Açık Tema').closest('button')!);
    expect(root.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('toptech_theme')).toBe('light');
  });

  it('tank kapasitesi ayarı Firestore\'a kaydedilir', async () => {
    await renderApp();
    clickTab('Ayarlar');
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '5000' } });
    expect(mocks.db.updateUserSettings).toHaveBeenCalledWith('ciftci@example.com', { tankCapacity: 5000 });
    expect(screen.getByText('5000L')).toBeInTheDocument();
  });

  it('depo doldurma, kalan suyu tank kapasitesine eşitler', async () => {
    mocks.settings = { ...mocks.settings, waterRemaining: 1200 };
    await renderApp();
    expect(screen.getByText('1200.0L')).toBeInTheDocument();
    clickTab('Ayarlar');
    fireEvent.click(screen.getByText('Sistem Bilgisi').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /DEPOYU TAMAMEN DOLDUR/ }));
    expect(mocks.db.updateUserSettings).toHaveBeenCalledWith('ciftci@example.com', { waterRemaining: 3000 });
  });

  it('damlatıcı debisi (L/h) ayarı fizik motorundaki akış hızını değiştirir', async () => {
    vi.useFakeTimers();
    const measureFlow = async (lph: number) => {
      mocks.settings = { ...mocks.settings, dripperFlowRateLph: lph };
      const { unmount } = await renderApp();
      fireEvent.click(screen.getByRole('button', { name: /BAŞLAT/ }));
      act(() => { vi.advanceTimersByTime(2000); });
      const flow = parseFloat(screen.getByText('L/dk').previousElementSibling!.textContent!);
      unmount();
      return flow;
    };
    const flow8 = await measureFlow(8);
    const flow2 = await measureFlow(2);
    expect(flow8).toBeGreaterThan(10);
    expect(flow2).toBeCloseTo(flow8 / 4, 0);
  });

  it('güvenlik: e-postası doğrulanmamış hesap verilere erişemez, doğrulama ekranı gösterilir', async () => {
    mocks.authUser = { uid: 'u9', email: 'yeni@example.com', emailVerified: false, photoURL: null,
      reload: vi.fn(async () => {}), getIdToken: vi.fn(async () => 'token') };
    await renderApp();
    expect(screen.getByText('E-postanızı doğrulayın')).toBeInTheDocument();
    expect(mocks.db.updateUserDocument).not.toHaveBeenCalled();
    expect(mocks.db.subscribeToLands).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /tekrar gönder/ }));
    await flush();
    expect(mocks.sendEmailVerification).toHaveBeenCalledWith(mocks.authUser);

    // Henüz doğrulamadı
    fireEvent.click(screen.getByRole('button', { name: /DOĞRULADIM/ }));
    await flush();
    expect(screen.getByText(/henüz doğrulanmamış/)).toBeInTheDocument();

    // Doğruladıktan sonra uygulama açılır ve veriler yüklenir
    mocks.authUser.emailVerified = true;
    fireEvent.click(screen.getByRole('button', { name: /DOĞRULADIM/ }));
    await flush();
    await flush();
    expect(mocks.authUser.getIdToken).toHaveBeenCalledWith(true);
    expect(mocks.db.updateUserDocument).toHaveBeenCalledWith('yeni@example.com');
  });

  it('güvenlik: profil fotoğrafı kullanıcı kimliği altına yüklenir; resim olmayan veya büyük dosya reddedilir', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { container } = await renderApp();
    clickTab('Ayarlar');
    fireEvent.click(screen.getByText('Aktif Kullanıcı').closest('div.cursor-pointer')!);
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;

    const big = new File([new Uint8Array(6 * 1024 * 1024)], 'buyuk.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [big] } });
    const html = new File(['<script>'], 'x.html', { type: 'text/html' });
    fireEvent.change(input, { target: { files: [html] } });
    expect(mocks.storage.uploadBytes).not.toHaveBeenCalled();

    const photo = new File([new Uint8Array(100)], 'foto.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [photo] } });
    await flush();
    await flush();
    const path = (mocks.storage.ref.mock.calls[0] as unknown as [unknown, string])[1];
    expect(path).toMatch(/^profiles\/u1\/\d+$/);
    expect(path).not.toContain('@');
    alertSpy.mockRestore();
  });
});
