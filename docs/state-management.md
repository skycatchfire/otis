# State Management

Otis uses [Zustand](https://zustand-demo.pmnd.rs/) for global state management, primarily for handling user settings and configuration.

## Settings Store

- **File:** `src/stores/settingsStore.ts`
- **Purpose:** Stores GitHub connection details and configuration state.
- **State Shape:**
  ```ts
  interface Settings {
    organization: string;
    projectId: string;
    token: string;
    isValid: boolean;
  }
  interface SettingsState {
    settings: Settings;
    isConfigured: boolean;
    updateSettings: (settings: Partial<Settings>, validConnection?: boolean) => void;
    clearSettings: () => void;
  }
  ```
- **Persistence:** Uses Zustand's `persist` middleware to save settings in local storage under the key `github-issue-creator-settings`.
- **Usage:**
  - Accessed via the `useSettingsStore` hook in components like `App`, `SettingsModal`, and `IssueCreator`.
  - Controls whether the app is configured and which organization/project/repo is selected.

## Local State

- Components like `IssueCreator` and `IssueForm` use React's `useState` for UI-specific state (e.g., modal open/close, form data, batch of issues).

## Why Zustand?

- Simple, minimal boilerplate for global state.
- No context providers or reducers needed.
- Easy to persist and update settings across the app.
