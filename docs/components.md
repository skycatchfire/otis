# Components

## App

- **Purpose:** The root component. Handles layout, theme, and conditional rendering based on configuration state.
- **Key Features:**
  - Renders the `Header`, `SettingsModal`, and main content area.
  - Shows a welcome/configuration prompt if not connected to GitHub.
  - Displays the `IssueCreator` when configured.

## Header

- **Purpose:** Displays the app title and a slot for actions (e.g., settings button).
- **Props:**
  - `children`: ReactNode (typically the settings button)
- **Notes:** Stays fixed at the top for easy access.

## SettingsModal

- **Purpose:** Modal for configuring GitHub connection (organization, PAT).
- **Key Features:**
  - Uses React Hook Form for validation.
  - Validates credentials by testing GitHub connection.
  - Updates global settings state via Zustand.
- **Props:**
  - `onClose`: Closes the modal.

## IssueCreator

- **Purpose:** Main interface for batch issue creation and management.
- **Key Features:**
  - Search/select GitHub projects and repositories.
  - Add, edit, remove, import, and export issues.
  - Handles batch submission to GitHub.
  - Renders `IssueForm` and `IssueTable`.
- **State:**
  - Tracks issues, selected project/repo, form/modal state, etc.

## IssueForm

- **Purpose:** Modal form for creating or editing a single issue.
- **Key Features:**
  - Supports GitHub issue templates (Markdown/YAML).
  - Maps custom project fields.
  - Uses React Hook Form for validation.
- **Props:**
  - `initialData`: For editing existing issues.
  - `onSubmit`, `onCancel`, `selectedRepo`.

## IssueTable

- **Purpose:** Displays the current batch of issues in a table.
- **Key Features:**
  - Edit or delete issues inline.
  - Shows key fields (title, type, status, assignee, estimate).
  - Uses `IssueForm` for editing.
- **Props:**
  - `issues`: Array of issues.
  - `onUpdate`, `onDelete`: Handlers for editing/removing issues.
