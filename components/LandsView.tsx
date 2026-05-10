
import React, { useState } from 'react';
import { Land } from '../types';
import Modal from './Modal';

interface LandsViewProps {
  lands: Land[];
  selectedLandId: string;
  onAddLand: (land: Land) => Promise<void>;
  onUpdateLand: (id: string, updates: Partial<Land>) => Promise<void>;
  onSelectLand: (id: string) => void;
}

const defaultImages = [
  '/lands/land_field.png',
  '/lands/olive_grove.png',
  '/lands/modern_greenhouse.png'
];

const LandsView: React.FC<LandsViewProps> = ({ lands, selectedLandId, onAddLand, onUpdateLand, onSelectLand }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLandId, setEditingLandId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    coordinates: ''
  });

  const handleOpenEdit = (land: Land, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLandId(land.id);
    setFormData({
      name: land.name,
      phone: land.phoneNumber || '',
      coordinates: land.coordinates || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingLandId(null);
    setFormData({ name: '', phone: '', coordinates: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      try {
        if (editingLandId) {
          await onUpdateLand(editingLandId, {
            name: formData.name,
            phoneNumber: formData.phone,
            coordinates: formData.coordinates,
            location: formData.coordinates || 'Konum Belirtilmedi'
          });
        } else {
          const newLand: Land = {
            id: Date.now().toString(),
            name: formData.name,
            location: formData.coordinates || 'Konum Belirtilmedi',
            sensorCount: 0,
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600',
            phoneNumber: formData.phone,
            coordinates: formData.coordinates
          };
          await onAddLand(newLand);
        }
        setFormData({ name: '', phone: '', coordinates: '' });
        setIsModalOpen(false);
        setEditingLandId(null);
      } catch (error: any) {
        alert(`Arazi ${editingLandId ? 'güncellenemedi' : 'kaydedilemedi'}. Lütfen veritabanı izinlerinizi kontrol edin.`);
      }
    }
  };

  const openGoogleMaps = () => {
    window.open('https://www.google.com/maps', '_blank');
  };

  return (
    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Arazilerim</h2>
        <span className="text-slate-700 dark:text-[#92c9a4] text-sm font-medium">{lands.length} Toplam</span>
      </div>

      <div className="flex flex-col gap-4">
        {lands.map((land, index) => (
          <div 
            key={land.id} 
            onClick={() => onSelectLand(land.id)}
            className={`group relative overflow-hidden rounded-3xl border ${selectedLandId === land.id ? 'border-primary ring-2 ring-primary/20' : 'border-border-light dark:border-border-dark'} bg-surface-light dark:bg-surface-dark shadow-lg active:scale-[0.98] transition-all cursor-pointer`}
          >
            <div className="h-40 w-full relative">
              <img 
                src={land.image || defaultImages[index % defaultImages.length]} 
                alt={land.name} 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes(defaultImages[index % defaultImages.length])) {
                    target.src = defaultImages[index % defaultImages.length];
                  }
                }}
                className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-white">{land.name}</h3>
                  <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {land.location}
                  </div>
                </div>
                <div className="bg-primary/20 backdrop-blur-md border border-primary/40 rounded-full px-3 py-1.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm font-bold animate-pulse">sensors</span>
                  <span className="text-primary font-bold text-xs">{land.sensorCount} Cihaz</span>
                </div>
              </div>
            </div>
            {selectedLandId === land.id && (
              <div className="absolute top-4 right-5 bg-primary text-background-dark text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                Aktif
              </div>
            )}
            <button 
              onClick={(e) => handleOpenEdit(land, e)}
              className={`absolute top-4 ${selectedLandId === land.id ? 'right-20' : 'right-5'} h-8 w-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all z-10`}
              title="Araziyi Düzenle"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
        ))}

        <button 
          onClick={handleOpenAdd}
          className="w-full mt-2 flex items-center justify-center gap-3 border-2 border-dashed border-primary/40 bg-primary/5 text-primary hover:border-primary/80 hover:bg-primary/10 font-extrabold text-lg h-24 rounded-3xl transition-all active:scale-95 group"
        >
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <span className="material-symbols-outlined font-bold text-2xl">add_circle</span>
          </div>
          <span>Arazi Ekle</span>
        </button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingLandId(null);
        }} 
        title={editingLandId ? "Araziyi Düzenle" : "Yeni Arazi Ekle"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Arazi Adı</label>
            <input 
              type="text" 
              required
              placeholder="Örn: Zeytinlik"
              className="bg-white dark:bg-background-dark/50 border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Arazi Telefon No</label>
            <input 
              type="tel" 
              placeholder="+90 5xx xxx xx xx"
              className="bg-white dark:bg-background-dark/50 border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Arazinin Koordinatları</label>
            <input 
              type="text" 
              placeholder="41.0082, 28.9784"
              className="bg-white dark:bg-background-dark/50 border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600"
              value={formData.coordinates}
              onChange={(e) => setFormData({...formData, coordinates: e.target.value})}
            />
          </div>
          
          <div className="flex flex-col gap-3 mt-2">
            <button 
              type="submit"
              className="w-full bg-primary text-background-dark border border-border-light dark:border-primary font-extrabold text-lg h-14 rounded-2xl glow-button active:scale-95 transition-all"
            >
              Kaydet
            </button>

            <button 
              type="button"
              onClick={openGoogleMaps}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm h-12 rounded-xl border border-border-light dark:border-border-dark/50 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-primary text-xl">map</span>
              <span>Haritadan Bul</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LandsView;
