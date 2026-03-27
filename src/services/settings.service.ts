import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'ranchhand_settings';

export interface FarmSettings {
  farmName: string;
  location: string;       // e.g. "Highland, IL"
  climateZone?: string;   // e.g. "6a" — filled in by AI if not set
  units: 'imperial' | 'metric';
}

const DEFAULTS: FarmSettings = {
  farmName: 'My Farm',
  location: '',
  units: 'imperial',
};

class SettingsService {
  private cache: FarmSettings | null = null;

  async get(): Promise<FarmSettings> {
    if (this.cache) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      this.cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
      return this.cache;
    } catch {
      return { ...DEFAULTS };
    }
  }

  async save(updates: Partial<FarmSettings>): Promise<void> {
    const current = await this.get();
    this.cache = { ...current, ...updates };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.cache));
  }

  async getLocation(): Promise<string> {
    const s = await this.get();
    return s.location || '';
  }
}

export const settingsService = new SettingsService();
export default settingsService;
