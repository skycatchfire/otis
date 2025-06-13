# State Management

Otis uses [Zustand](https://zustand-demo.pmnd.rs/) for global state management, primarily for handling user settings, configuration, and drafts.

## Settings Store

- **File:** `src/stores/settingsStore.ts`
- **Purpose:** Stores GitHub connection details, configuration state, theme, and user preferences.
- **State Shape:**
  ```ts
  interface Settings {
    organization: string;
    projectId: string;
    token: string;
    isValid: boolean;
    selectedRepo?: string;
    theme?: string;
  }
  interface SettingsState {
    settings: Settings;
    isConfigured: boolean;
    lastUsedTemplate: string;
    lastUsedFields: Record<string, unknown>;
    draftIssues: IssueRow[];
    updateSettings: (settings: Partial<Settings>, validConnection?: boolean) => void;
    clearSettings: () => void;
    setLastUsedTemplate: (template: string) => void;
    setLastUsedFields: (fields: Record<string, unknown>) => void;
    setDraftIssues: (issues: IssueRow[]) => void;
    setTheme: (theme: string) => void;
  }
  ```
- **Persistence:** Uses Zustand's `persist` middleware to save settings, drafts, and preferences in local storage under the key `github-issue-creator-settings`.
- **Usage:**
  - Accessed via the `useSettingsStore` hook in components like `App`, `SettingsModal`, and `IssueCreator`.
  - Controls whether the app is configured and which organization/project/repo is selected.
  - Persists last used template, fields, and draft issues for user convenience.
  - Theme preference is also persisted and applied globally.

## Local State

- Components like `IssueCreator` and `IssueForm` use React's `useState` for UI-specific state (e.g., modal open/close, form data, batch of issues).

## Why Zustand?

- Simple, minimal boilerplate for global state.
- No context providers or reducers needed.
- Easy to persist and update settings, drafts, and preferences across the app.
