import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { themes } from '../lib/themes';

const HEX = /^#[0-9a-f]{6}$/i;

describe('Tema motoru', () => {
  it('README\'de belirtilen 11 tema tanımlı', () => {
    expect(Object.keys(themes).sort()).toEqual(
      ['beton', 'cini', 'dark', 'garden', 'kilim', 'light', 'mermer', 'obsidyen', 'silver', 'tahta', 'tas'].sort(),
    );
  });

  it('README tablosundaki vurgu renkleri temalarla eşleşiyor', () => {
    expect(themes.light.colors.primary).toBe('#76c893');
    expect(themes.tas.colors.primary).toBe('#9ca3af');
    expect(themes.mermer.colors.primary).toBe('#d4af37');
    expect(themes.obsidyen.colors.primary).toBe('#a855f7');
    expect(themes.cini.colors.primary).toBe('#0ea5e9');
    expect(themes.silver.colors.primary).toBe('#38bdf8');
  });

  it.each(Object.values(themes))('$id: id anahtarla aynı, tüm renkler geçerli hex, tüm ikonlar ve radius tanımlı', (theme) => {
    expect(themes[theme.id]).toBe(theme);
    for (const c of Object.values(theme.colors)) expect(c).toMatch(HEX);
    for (const r of Object.values(theme.radius)) expect(r).toMatch(/^\d+(\.\d+)?(rem|px)$/);
    for (const key of ['panel', 'weather', 'history', 'lands', 'settings', 'water'] as const) {
      expect(theme.icons[key]).toBeTruthy();
    }
  });

  it.each(Object.values(themes).filter(t => t.image))('$id: doku görseli public/ altında mevcut', (theme) => {
    expect(fs.existsSync(path.join(__dirname, '..', 'public', theme.image))).toBe(true);
  });
});
