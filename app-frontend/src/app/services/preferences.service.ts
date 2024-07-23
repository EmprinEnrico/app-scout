import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  constructor() {}

  async set(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value),
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async clear(): Promise<void> {
    await Preferences.clear();
  }
}
