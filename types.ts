
export enum NavTab {
  PANEL = 'panel',
  HISTORY = 'history',
  WEATHER = 'weather',
  LANDS = 'lands',
  SETTINGS = 'settings'
}

export type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'PartlyCloudy';

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: WeatherCondition;
}

export interface GardenStatus {
  moisture: number;
  temperature: number;
  battery: number;
  waterSaved: number;
  waterRemaining: number;
  tankCapacity: number; // Added for user-defined tank capacity
  nextSchedule: string;
  nextScheduleDay: string;
  isIrrigating: boolean;
  isOnline: boolean;
  isScheduleActive: boolean; // Tracking if the schedule is enabled
  condition: WeatherCondition;
  forecast?: ForecastDay[];
}

export interface Land {
  id: string;
  name: string;
  location: string;
  sensorCount: number;
  image: string;
  phoneNumber?: string;
  coordinates?: string;
}

export interface IrrigationSession {
  id: string;
  landId: string;
  landName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  duration: string;
  icon: string;
}
