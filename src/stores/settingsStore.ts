import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  organization: string;
  projectNumber: string;
  token: string;
  isValid: boolean;
}

interface SettingsState {
  settings: Settings;
  isConfigured: boolean;
  updateSettings: (settings: Partial<Settings>, validConnection?: boolean) => void;
  clearSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        organization: '',
        projectNumber: '',
        token: '',
        isValid: false,
      },
      isConfigured: false,
      updateSettings: (newSettings, validConnection) => 
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
            isValid: validConnection ?? state.settings.isValid,
          },
          isConfigured: Boolean(
            newSettings.organization || state.settings.organization && 
            newSettings.token || state.settings.token &&
            (validConnection ?? state.settings.isValid)
          ),
        })),
      clearSettings: () =>
        set({
          settings: {
            organization: '',
            projectNumber: '',
            token: '',
            isValid: false,
          },
          isConfigured: false,
        }),
    }),
    {
      name: 'github-issue-creator-settings',
      partialize: (state) => ({
        settings: {
          organization: state.settings.organization,
          projectNumber: state.settings.projectNumber,
          token: state.settings.token,
          isValid: state.settings.isValid,
        },
        isConfigured: state.isConfigured,
      }),
    }
  )
);