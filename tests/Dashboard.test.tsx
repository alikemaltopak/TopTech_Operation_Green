import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import { GardenStatus } from '../types';

const baseStatus: GardenStatus = {
  moisture: 65,
  temperature: 24,
  battery: 88,
  waterSaved: 120,
  waterRemaining: 3000,
  tankCapacity: 3000,
  baseHeightMeters: 0.5,
  netWaterHeightMeters: 1.65,
  pipeLengthMeters: 20,
  irrigationType: 'drip',
  dripperCount: 300,
  dripperFlowRateLph: 8,
  valveSize: 'DN20',
  nextSchedule: '05:30',
  nextScheduleDay: 'Belirtilmedi',
  isIrrigating: false,
  isOnline: true,
  isScheduleActive: false,
  condition: 'Sunny',
  forecast: [],
};

function renderDashboard(status: Partial<GardenStatus> = {}, extra: Partial<ComponentProps<typeof Dashboard>> = {}) {
  const props = {
    status: { ...baseStatus, ...status },
    activeLandName: 'Zeytinlik',
    activeLandPhoneNumber: '+905551112233',
    onIrrigate: vi.fn(),
    onUpdateSchedule: vi.fn(),
    onToggleSchedule: vi.fn(),
    onPhysicsUpdate: vi.fn(),
    ...extra,
  };
  const utils = render(<Dashboard {...props} />);
  return { ...utils, props };
}

const durationDisplay = () => screen.getByText('DAKİKA').previousElementSibling as HTMLElement;

describe('Dashboard — manuel sulama kontrolü', () => {
  it('aktif arazinin adını gösterir', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: 'Zeytinlik' })).toBeInTheDocument();
  });

  it('varsayılan süre 10 dk; BAŞLAT seçilen süreyle sulamayı başlatır', () => {
    const { props } = renderDashboard();
    expect(durationDisplay()).toHaveTextContent('10');
    fireEvent.click(screen.getByRole('button', { name: /BAŞLAT/ }));
    expect(props.onIrrigate).toHaveBeenCalledWith(10, true);
  });

  it('hızlı ön ayarlar (5/10/15/30) süreyi değiştirir', () => {
    const { props } = renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: '30 DK' }));
    expect(durationDisplay()).toHaveTextContent('30');
    fireEvent.click(screen.getByRole('button', { name: /BAŞLAT/ }));
    expect(props.onIrrigate).toHaveBeenCalledWith(30, true);
  });

  it('–/+ butonları süreyi 1–120 dk arasında sınırlar', () => {
    renderDashboard();
    const minus = screen.getByText('remove').closest('button')!;
    const plus = screen.getByText('add').closest('button')!;
    for (let i = 0; i < 20; i++) fireEvent.click(minus);
    expect(durationDisplay()).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: '30 DK' }));
    for (let i = 0; i < 100; i++) fireEvent.click(plus);
    expect(durationDisplay()).toHaveTextContent('120');
  });

  it('sulama sırasında DURDUR gösterilir ve basılınca sulama kapatılır', () => {
    const { props } = renderDashboard(
      { isIrrigating: true },
      { currentSession: { startTime: new Date(), durationMinutes: 10 } },
    );
    expect(screen.getByText('KALAN SÜRE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /DURDUR/ }));
    expect(props.onIrrigate).toHaveBeenCalledWith(undefined, false);
  });

  it('geri sayım biter bitmez sulama otomatik durdurulur (OFF tetiklenir)', () => {
    vi.useFakeTimers();
    const { props, rerender } = renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: '5 DK' }));
    fireEvent.click(screen.getByRole('button', { name: /BAŞLAT/ }));
    expect(props.onIrrigate).toHaveBeenCalledWith(5, true);

    // Üst bileşen sulamayı başlattı
    rerender(<Dashboard {...props} status={{ ...baseStatus, isIrrigating: true }} currentSession={{ startTime: new Date(), durationMinutes: 5 }} />);
    expect(screen.getByText('05:00')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(60_000); });
    expect(screen.getByText('04:00')).toBeInTheDocument();
    expect(props.onIrrigate).not.toHaveBeenCalledWith(undefined, false);

    act(() => { vi.advanceTimersByTime(4 * 60_000 + 1000); });
    expect(props.onIrrigate).toHaveBeenCalledWith(undefined, false);
  });

  it('sulama sırasında fizik motoru su tüketimini canlı olarak üst bileşene bildirir', () => {
    vi.useFakeTimers();
    const { props, rerender } = renderDashboard();
    rerender(<Dashboard {...props} status={{ ...baseStatus, isIrrigating: true }} currentSession={{ startTime: new Date(), durationMinutes: 10 }} />);

    act(() => { vi.advanceTimersByTime(60_000); });
    expect(screen.getByText('Anlık Su Analizi')).toBeInTheDocument();
    const reported = (props.onPhysicsUpdate as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0] as number);
    expect(reported.length).toBeGreaterThan(50);
    // 1 dakikada ~18.5 L/dk debi ile ~18 L tüketim beklenir
    expect(reported.at(-1)).toBeGreaterThan(15);
    expect(reported.at(-1)).toBeLessThan(20);
    // Tüketim monoton artar
    for (let i = 1; i < reported.length; i++) expect(reported[i]).toBeGreaterThanOrEqual(reported[i - 1]);
  });

  it('depo seviyesi litre ve yüzde olarak gösterilir', () => {
    renderDashboard({ waterRemaining: 1500, tankCapacity: 3000 });
    expect(screen.getByText('1500.0L')).toBeInTheDocument();
    expect(screen.getByText('%50')).toBeInTheDocument();
  });

  it('nem sensörü değerine göre durum etiketi gösterilir', () => {
    const { unmount } = renderDashboard({ moisture: 72 });
    expect(screen.getByText('Seviye İdeal')).toBeInTheDocument();
    unmount();
    renderDashboard({ moisture: 40 });
    expect(screen.getByText('Kritik Seviye')).toBeInTheDocument();
  });

  it('otomatik zamanlama anahtarı açılıp kapatılabilir ve planlı saat gösterilir', () => {
    const { props } = renderDashboard({ nextSchedule: '06:15', nextScheduleDay: '22 Ekim' });
    expect(screen.getByText('06:15')).toBeInTheDocument();
    expect(screen.getByText('22 Ekim')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(props.onToggleSchedule).toHaveBeenCalled();
  });

  it('“Sonraki Oturum” kutucuğu zamanlayıcı penceresini açar', () => {
    renderDashboard();
    fireEvent.click(screen.getByText('SONRAKİ OTURUM').closest('div.cursor-pointer')!);
    expect(screen.getByText('Zamanlayıcı & RTC Alarm Ayarla')).toBeInTheDocument();
  });
});
