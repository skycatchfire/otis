import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IssueRow } from '../components/IssueCreator';

interface Settings {
  organization: string;
  projectId: string;
  token: string;
  isValid: boolean;
  selectedRepo?: string;
}

interface SettingsState {
  settings: Settings;
  isConfigured: boolean;
  lastUsedTemplate?: string;
  lastUsedFields?: Record<string, string>;
  draftIssues: IssueRow[];
  updateSettings: (settings: Partial<Settings>, validConnection?: boolean) => void;
  clearSettings: () => void;
  setLastUsedTemplate: (template: string) => void;
  setLastUsedFields: (fields: Record<string, string>) => void;
  setDraftIssues: (issues: IssueRow[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        organization: '',
        projectId: '',
        token: '',
        isValid: false,
        selectedRepo: '',
      },
      isConfigured: false,
      lastUsedTemplate: '',
      lastUsedFields: {},
      draftIssues: [],
      updateSettings: (newSettings, validConnection) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
            isValid: validConnection ?? state.settings.isValid,
          },
          isConfigured: Boolean(
            newSettings.organization ||
              (state.settings.organization && newSettings.token) ||
              (state.settings.token && (validConnection ?? state.settings.isValid))
          ),
        })),
      clearSettings: () =>
        set({
          settings: {
            organization: '',
            projectId: '',
            token: '',
            isValid: false,
            selectedRepo: '',
          },
          isConfigured: false,
          lastUsedTemplate: '',
          lastUsedFields: {},
          draftIssues: [],
        }),
      setLastUsedTemplate: (template) => set({ lastUsedTemplate: template }),
      setLastUsedFields: (fields) => set({ lastUsedFields: fields }),
      setDraftIssues: (issues) => set({ draftIssues: issues }),
    }),
    {
      name: 'github-issue-creator-settings',
      partialize: (state) => ({
        settings: {
          organization: state.settings.organization,
          projectId: state.settings.projectId,
          token: state.settings.token,
          isValid: state.settings.isValid,
          selectedRepo: state.settings.selectedRepo,
        },
        isConfigured: state.isConfigured,
        lastUsedTemplate: state.lastUsedTemplate,
        lastUsedFields: state.lastUsedFields,
        draftIssues: state.draftIssues,
      }),
    }
  )
);
