import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScheduleModal from '../components/ScheduleModal';

const PHONE = '+905551112233';

function renderModal(props: Partial<ComponentProps<typeof ScheduleModal>> = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <ScheduleModal isOpen onClose={onClose} onSave={onSave} currentTime="05:30" phoneNumber={PHONE} {...props} />,
  );
  return { onSave, onClose };
}

beforeEach(() => {
  // Sadece Date'i sabitliyoruz: 21 Ekim 2026, 10:00
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 21, 10, 0, 0));
});

describe('ScheduleModal — RTC alarm (SETALARM) SMS komutu', () => {
  it('varsayılan 20 dk süre ile doğru SETALARM komutunu üretir', () => {
    renderModal();
    expect(screen.getByText('SETALARM:21.10.26-05.30,05.50')).toBeInTheDocument();
  });

  it('süre ön ayarı değişince kapanış saati yeniden hesaplanır', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: '90 DK' }));
    expect(screen.getByText('SETALARM:21.10.26-05.30,07.00')).toBeInTheDocument();
  });

  it('gece yarısını geçen sulamada kapanış saati 00:xx olarak sarılır', () => {
    renderModal({ currentTime: '23:30' });
    fireEvent.click(screen.getByRole('button', { name: '60 DK' }));
    expect(screen.getByText('SETALARM:21.10.26-23.30,00.30')).toBeInTheDocument();
  });

  it('süre 1–180 dk aralığında sınırlanır', () => {
    renderModal();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: '-' }));
    expect(screen.getByText('1 DAKİKA')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider'), { target: { value: '180' } });
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByText('180 DAKİKA')).toBeInTheDocument();
  });

  it('geçmiş günler seçilemez; ileri bir gün seçilince komut tarihi değişir', () => {
    renderModal();
    expect(screen.getByRole('button', { name: '20' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '25' }));
    expect(screen.getByText('SETALARM:25.10.26-05.30,05.50')).toBeInTheDocument();
  });

  it('kaydet: planı üst bileşene iletir ve cihaza SMS uygulamasını açar', () => {
    const { onSave, onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /PROGRAMI KAYDET VE SMS GÖNDER/ }));
    expect(onSave).toHaveBeenCalledWith('05:30', '21 Ekim');
    expect(window.location.href).toBe(`sms:${PHONE}?body=${encodeURIComponent('SETALARM:21.10.26-05.30,05.50')}`);
    expect(onClose).toHaveBeenCalled();
  });

  it('arazinin telefon numarası yoksa SMS göndermez, kullanıcıyı uyarır ama planı kaydeder', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { onSave } = renderModal({ phoneNumber: undefined });
    fireEvent.click(screen.getByRole('button', { name: /PROGRAMI KAYDET VE SMS GÖNDER/ }));
    expect(onSave).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('telefon numarası tanımlanmamış'));
    expect(window.location.href).not.toMatch(/^sms:/);
    alertSpy.mockRestore();
  });
});
