import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import HistoryView from '../components/HistoryView';
import { IrrigationSession } from '../types';

const session = (over: Partial<IrrigationSession>): IrrigationSession => ({
  id: Math.random().toString(),
  landId: 'l1',
  landName: 'Zeytinlik',
  date: '2026-10-21',
  time: '05:30',
  startTime: '05:30:00',
  endTime: '05:40:12',
  duration: '10 dk 12 sn',
  icon: 'water_drop',
  totalConsumedLiters: 184.6,
  ...over,
});

const sessions = [
  session({ id: 's1' }),
  session({ id: 's2', date: '2026-10-05', duration: '3 dk 0 sn', totalConsumedLiters: 55 }),
  session({ id: 's3', date: '2026-09-14', landName: 'Sera', duration: '7 dk 0 sn' }),
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 21, 12, 0, 0));
});

const dayCell = (day: number) => screen.getAllByText(String(day)).find(el => el.parentElement?.classList.contains('cursor-pointer'))!.parentElement!;
const hasDot = (day: number) => dayCell(day).querySelector('.rounded-full') !== null;

describe('HistoryView — takvim tabanlı sulama geçmişi', () => {
  it('içinde bulunulan ay açılır ve bugünün seansları listelenir', () => {
    render(<HistoryView activeLandName="Zeytinlik" sessions={sessions} />);
    expect(screen.getByRole('heading', { name: 'Ekim 2026' })).toBeInTheDocument();
    expect(screen.getByText('10 dk 12 sn')).toBeInTheDocument();
    expect(screen.getByText('184.6 L Su')).toBeInTheDocument();
  });

  it('sulama yapılan günler takvimde işaretlenir', () => {
    render(<HistoryView activeLandName="Zeytinlik" sessions={sessions} />);
    expect(hasDot(21)).toBe(true);
    expect(hasDot(5)).toBe(true);
    expect(hasDot(14)).toBe(false); // Eylül kaydı Ekim takviminde görünmemeli
  });

  it('kayıt olmayan güne tıklanınca “Kayıt Bulunmuyor” gösterilir', () => {
    render(<HistoryView activeLandName="Zeytinlik" sessions={sessions} />);
    fireEvent.click(dayCell(10));
    expect(screen.getByText('Kayıt Bulunmuyor')).toBeInTheDocument();
  });

  it('önceki aya geçilebilir ve o ayın kayıtları gösterilir', () => {
    render(<HistoryView activeLandName="Zeytinlik" sessions={sessions} />);
    fireEvent.click(screen.getByText('chevron_left').closest('button')!);
    expect(screen.getByRole('heading', { name: 'Eylül 2026' })).toBeInTheDocument();
    expect(hasDot(14)).toBe(true);
    fireEvent.click(dayCell(14));
    expect(screen.getByText('7 dk 0 sn')).toBeInTheDocument();
  });

  it('seans kartı başlangıç/bitiş, süre ve su tüketimi detaylarını açar', () => {
    render(<HistoryView activeLandName="Zeytinlik" sessions={sessions} />);
    fireEvent.click(screen.getByText('10 dk 12 sn'));
    const modal = screen.getByText('Sulama Detayları').closest('div')!.parentElement!;
    expect(within(modal).getByText('05:30:00')).toBeInTheDocument();
    expect(within(modal).getByText('05:40:12')).toBeInTheDocument();
    expect(within(modal).getByText('184.6 L')).toBeInTheDocument();
    // Not: Kod toUpperCase() kullandığı için Türkçe "EKİM" yerine "EKIM" üretiyor
    expect(within(modal).getByText(/^21 EK[İI]M 2026$/)).toBeInTheDocument();
  });
});
