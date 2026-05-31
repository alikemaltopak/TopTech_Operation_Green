export interface ThemeConfig {
  id: string;
  name: string;
  image: string;
  isDark: boolean;
  colors: {
    primary: string;
    bgLight: string;
    bgDark: string;
    surfaceLight: string;
    surfaceDark: string;
    borderLight: string;
    borderDark: string;
  };
  radius: {
    default: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  icons: {
    panel: string;
    weather: string;
    history: string;
    lands: string;
    settings: string;
    water: string;
  };
}

export const themes: Record<string, ThemeConfig> = {
  'light': {
    id: 'light', name: 'Açık Tema', image: '', isDark: false,
    colors: { primary: '#76c893', bgLight: '#fdfcf0', bgDark: '#1b2620', surfaceLight: '#f9f7e8', surfaceDark: '#25332b', borderLight: '#e2e8f0', borderDark: '#3a4d42' },
    radius: { default: '0.5rem', lg: '1rem', xl: '1.5rem', '2xl': '2rem' },
    icons: { panel: 'dashboard', weather: 'partly_cloudy_day', history: 'history', lands: 'landscape', settings: 'settings', water: 'water_drop' }
  },
  'dark': {
    id: 'dark', name: 'Koyu Tema', image: '', isDark: true,
    colors: { primary: '#76c893', bgLight: '#fdfcf0', bgDark: '#1b2620', surfaceLight: '#f9f7e8', surfaceDark: '#25332b', borderLight: '#e2e8f0', borderDark: '#3a4d42' },
    radius: { default: '0.5rem', lg: '1rem', xl: '1.5rem', '2xl': '2rem' },
    icons: { panel: 'dashboard', weather: 'partly_cloudy_day', history: 'history', lands: 'landscape', settings: 'settings', water: 'water_drop' }
  },
  'tas': {
    id: 'tas', name: 'Taş', image: '/themes/tas.png', isDark: true,
    colors: { primary: '#9ca3af', bgLight: '#e5e7eb', bgDark: '#111827', surfaceLight: '#f3f4f6', surfaceDark: '#1f2937', borderLight: '#d1d5db', borderDark: '#374151' },
    radius: { default: '0.125rem', lg: '0.125rem', xl: '0.25rem', '2xl': '0.25rem' },
    icons: { panel: 'grid_view', weather: 'cloud', history: 'update', lands: 'terrain', settings: 'tune', water: 'opacity' }
  },
  'mermer': {
    id: 'mermer', name: 'Mermer', image: '/themes/mermer.png', isDark: true,
    colors: { primary: '#d4af37', bgLight: '#fafaf9', bgDark: '#1c1917', surfaceLight: '#ffffff', surfaceDark: '#292524', borderLight: '#e7e5e4', borderDark: '#44403c' },
    radius: { default: '0.25rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem' },
    icons: { panel: 'space_dashboard', weather: 'wb_sunny', history: 'manage_history', lands: 'map', settings: 'admin_panel_settings', water: 'lens_blur' }
  },
  'tahta': {
    id: 'tahta', name: 'Tahta', image: '/themes/tahta.png', isDark: true,
    colors: { primary: '#d97706', bgLight: '#fef3c7', bgDark: '#451a03', surfaceLight: '#fffbeb', surfaceDark: '#78350f', borderLight: '#fde68a', borderDark: '#92400e' },
    radius: { default: '0.375rem', lg: '0.5rem', xl: '1rem', '2xl': '1.5rem' },
    icons: { panel: 'table_restaurant', weather: 'filter_drama', history: 'history_edu', lands: 'forest', settings: 'construction', water: 'eco' }
  },
  'obsidyen': {
    id: 'obsidyen', name: 'Obsidyen', image: '/themes/obsidyen.png', isDark: true,
    colors: { primary: '#a855f7', bgLight: '#f3e8ff', bgDark: '#000000', surfaceLight: '#faf5ff', surfaceDark: '#111111', borderLight: '#e9d5ff', borderDark: '#333333' },
    radius: { default: '0px', lg: '0px', xl: '0px', '2xl': '0px' },
    icons: { panel: 'dataset', weather: 'nights_stay', history: 'change_history', lands: 'volcano', settings: 'memory', water: 'science' }
  },
  'kilim': {
    id: 'kilim', name: 'Kilim', image: '/themes/kilim.png', isDark: true,
    colors: { primary: '#ef4444', bgLight: '#fef2f2', bgDark: '#450a0a', surfaceLight: '#fff5f5', surfaceDark: '#7f1d1d', borderLight: '#fecaca', borderDark: '#991b1b' },
    radius: { default: '0.75rem', lg: '1rem', xl: '1.5rem', '2xl': '2rem' },
    icons: { panel: 'dashboard_customize', weather: 'routine', history: 'auto_stories', lands: 'holiday_village', settings: 'room_preferences', water: 'bloodtype' }
  },
  'beton': {
    id: 'beton', name: 'Beton', image: '/themes/beton.png', isDark: true,
    colors: { primary: '#eab308', bgLight: '#f8fafc', bgDark: '#0f172a', surfaceLight: '#ffffff', surfaceDark: '#1e293b', borderLight: '#e2e8f0', borderDark: '#334155' },
    radius: { default: '0px', lg: '0px', xl: '0px', '2xl': '0px' },
    icons: { panel: 'view_comfy', weather: 'factory', history: 'receipt_long', lands: 'domain', settings: 'build', water: 'oil_barrel' }
  },
  'cini': {
    id: 'cini', name: 'Çini', image: '/themes/cini.png', isDark: true,
    colors: { primary: '#0ea5e9', bgLight: '#f0f9ff', bgDark: '#082f49', surfaceLight: '#ffffff', surfaceDark: '#0c4a6e', borderLight: '#bae6fd', borderDark: '#0369a1' },
    radius: { default: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem' },
    icons: { panel: 'category', weather: 'air', history: 'hourglass_empty', lands: 'mosque', settings: 'palette', water: 'water' }
  },
  'garden': {
    id: 'garden', name: 'Bahçe', image: '/themes/garden.png', isDark: true,
    colors: { primary: '#22c55e', bgLight: '#f0fdf4', bgDark: '#052e16', surfaceLight: '#ffffff', surfaceDark: '#14532d', borderLight: '#bbf7d0', borderDark: '#166534' },
    radius: { default: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem' },
    icons: { panel: 'local_florist', weather: 'sunny', history: 'track_changes', lands: 'yard', settings: 'spa', water: 'dew_point' }
  },
  'silver': {
    id: 'silver', name: 'Gümüş', image: '/themes/silver.png', isDark: true,
    colors: { primary: '#38bdf8', bgLight: '#f8fafc', bgDark: '#020617', surfaceLight: '#ffffff', surfaceDark: '#0f172a', borderLight: '#e2e8f0', borderDark: '#1e293b' },
    radius: { default: '0.25rem', lg: '0.5rem', xl: '1rem', '2xl': '1rem' },
    icons: { panel: 'grid_goldenratio', weather: 'ac_unit', history: 'timeline', lands: 'satellite', settings: 'precision_manufacturing', water: 'water_bottle' }
  }
};
