import { InterviewState } from '../types/interview';

const STORAGE_KEY_STATE = 'interviewpilot_state_v1';
const STORAGE_KEY_API_KEY = 'interviewpilot_gemini_key_v1';
const STORAGE_KEY_VOICE_SETTINGS = 'interviewpilot_voice_settings_v1';

export const storageService = {
  saveState(state: InterviewState): void {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save interview state to localStorage:', e);
    }
  },

  loadState(): InterviewState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATE);
      if (!data) return null;
      return JSON.parse(data) as InterviewState;
    } catch (e) {
      console.warn('Could not load interview state from localStorage:', e);
      return null;
    }
  },

  clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_STATE);
    } catch (e) {
      console.warn('Could not clear interview state:', e);
    }
  },

  getApiKey(): string {
    try {
      return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
    } catch {
      return '';
    }
  },

  saveApiKey(key: string): void {
    try {
      if (key && key.trim()) {
        localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_API_KEY);
      }
    } catch (e) {
      console.warn('Could not save API key:', e);
    }
  },

  removeApiKey(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    } catch (e) {
      console.warn('Could not remove API key:', e);
    }
  },

  getVoiceSettings(): { speechEnabled: boolean; recognitionEnabled: boolean } {
    try {
      const item = localStorage.getItem(STORAGE_KEY_VOICE_SETTINGS);
      if (item) return JSON.parse(item);
    } catch {}
    return { speechEnabled: true, recognitionEnabled: true };
  },

  saveVoiceSettings(settings: { speechEnabled: boolean; recognitionEnabled: boolean }): void {
    try {
      localStorage.setItem(STORAGE_KEY_VOICE_SETTINGS, JSON.stringify(settings));
    } catch {}
  }
};
