import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LandsView from '../components/LandsView';
import { Land } from '../types';

const lands: Land[] = [
  { id: 'l1', name: 'Zeytinlik', location: '38.49, 27.52', sensorCount: 0, image: '', phoneNumber: '+905551112233', coordinates: '38.49, 27.52' },
  { id: 'l2', name: 'Sera', location: 'Konum Belirtilmedi', sensorCount: 0, image: '', phoneNumber: '+905554445566' },
];

function renderLands() {
  const props = {
    lands,
    selectedLandId: 'l1',
    onAddLand: vi.fn(async () => {}),
    onUpdateLand: vi.fn(async () => {}),
    onDeleteLand: vi.fn(async () => {}),
    onSelectLand: vi.fn(),
  };
  render(<LandsView {...props} />);
  return props;
}

describe('LandsView — çoklu arazi yönetimi', () => {
  it('tüm arazileri ve toplam sayıyı listeler', () => {
    renderLands();
    expect(screen.getByText('Zeytinlik')).toBeInTheDocument();
    expect(screen.getByText('Sera')).toBeInTheDocument();
    expect(screen.getByText('2 Toplam')).toBeInTheDocument();
  });

  it('araziye tıklamak onu aktif arazi yapar', () => {
    const props = renderLands();
    fireEvent.click(screen.getByText('Sera'));
    expect(props.onSelectLand).toHaveBeenCalledWith('l2');
  });

  it('yeni arazi adı, GSM numarası ve koordinatlarla eklenir', async () => {
    const props = renderLands();
    fireEvent.click(screen.getByRole('button', { name: /Arazi Ekle/ }));
    fireEvent.change(screen.getByPlaceholderText('Örn: Zeytinlik'), { target: { value: 'Bağ' } });
    fireEvent.change(screen.getByPlaceholderText('+90 5xx xxx xx xx'), { target: { value: '+905557778899' } });
    fireEvent.change(screen.getByPlaceholderText('41.0082, 28.9784'), { target: { value: '39.93, 32.85' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));

    await waitFor(() => expect(props.onAddLand).toHaveBeenCalledTimes(1));
    expect(props.onAddLand).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Bağ',
      phoneNumber: '+905557778899',
      coordinates: '39.93, 32.85',
      location: '39.93, 32.85',
    }));
  });

  it('isimsiz arazi kaydedilmez', async () => {
    const props = renderLands();
    fireEvent.click(screen.getByRole('button', { name: /Arazi Ekle/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await new Promise(r => setTimeout(r, 0));
    expect(props.onAddLand).not.toHaveBeenCalled();
  });

  it('mevcut arazi düzenlenebilir (form mevcut değerlerle dolar)', async () => {
    const props = renderLands();
    fireEvent.click(screen.getAllByText('edit')[0].closest('button')!);
    const name = screen.getByPlaceholderText('Örn: Zeytinlik') as HTMLInputElement;
    expect(name.value).toBe('Zeytinlik');
    expect((screen.getByPlaceholderText('+90 5xx xxx xx xx') as HTMLInputElement).value).toBe('+905551112233');
    fireEvent.change(name, { target: { value: 'Büyük Zeytinlik' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(() => expect(props.onUpdateLand).toHaveBeenCalledWith('l1', expect.objectContaining({ name: 'Büyük Zeytinlik' })));
    expect(props.onAddLand).not.toHaveBeenCalled();
  });

  it('arazi silme onay ister; onaylanırsa silinir', () => {
    const props = renderLands();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    fireEvent.click(screen.getAllByText('edit')[1].closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /ARAZİYİ SİL/ }));
    expect(props.onDeleteLand).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /ARAZİYİ SİL/ }));
    expect(props.onDeleteLand).toHaveBeenCalledWith('l2');
    confirmSpy.mockRestore();
  });

  it('kayıt başarısız olursa kullanıcı bilgilendirilir', async () => {
    const props = renderLands();
    props.onAddLand.mockRejectedValueOnce(new Error('permission-denied'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: /Arazi Ekle/ }));
    fireEvent.change(screen.getByPlaceholderText('Örn: Zeytinlik'), { target: { value: 'Bağ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('kaydedilemedi')));
    alertSpy.mockRestore();
  });
});
