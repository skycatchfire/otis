# Components

## App

- **Purpose:** The root component. Handles layout, theme, and conditional rendering based on configuration state.
- **Key Features:**
  - Renders the `Header`, `SettingsModal`, `Toaster` (notifications), and main content area.
  - Shows a welcome/configuration prompt if not connected to GitHub.
  - Displays the `IssueCreator` when configured.
  - Applies theme (light/dark/system) using settings.

## Header

- **Purpose:** Displays the app title and a slot for actions (e.g., settings button).
- **Props:**
  - `children`: ReactNode (typically the settings button)
- **Notes:** Stays fixed at the top for easy access.

## SettingsModal

- **Purpose:** Modal for configuring GitHub connection (organization, PAT, theme).
- **Key Features:**
  - Uses React Hook Form for validation.
  - Validates credentials by testing GitHub connection.
  - Updates global settings state via Zustand.
  - Allows theme selection (light/dark/system).
- **Props:**
  - `onClose`: Closes the modal.

## IssueCreator

- **Purpose:** Main interface for batch issue creation and management.
- **Key Features:**
  - Search/select GitHub projects and repositories.
  - Add, edit, remove, import, and export issues (JSON).
  - Handles batch submission to GitHub with confirmation dialog.
  - Renders `IssueForm` and `IssueTable`.
  - Tracks issues, selected project/repo, form/modal state, etc.
  - Supports file/image attachments for issues.
  - Uses notifications (toast/sonner) for feedback.

## IssueForm

- **Purpose:** Modal form for creating or editing a single issue.
- **Key Features:**
  - Supports GitHub issue templates (Markdown/YAML).
  - Maps custom project fields.
  - Uses React Hook Form for validation.
  - Allows file/image attachments.
- **Props:**
  - `initialData`: For editing existing issues.
  - `onSubmit`, `onCancel`, `selectedRepo`.

## IssueTable

- **Purpose:** Displays the current batch of issues in a table.
- **Key Features:**
  - Edit or delete issues inline.
  - Shows key fields (title, type, status, assignee, estimate, labels, custom fields, attachments).
  - Uses `IssueForm` for editing.
- **Props:**
  - `issues`: Array of issues.
  - `onUpdate`, `onDelete`: Handlers for editing/removing issues.
  - `fields`, `templates`, `editingIssueId`, `setEditingIssueId`, `onCloseEdit`.

## ConfirmDialog

- **Purpose:** Confirmation dialog for submitting all issues in a batch.
- **Key Features:**
  - Shows issue count and project name.
  - Confirms or cancels submission.
- **Props:**
  - `isOpen`, `onConfirm`, `onCancel`, `issueCount`, `projectName`.

## Toaster/Notifications

- **Purpose:** Shows toast notifications for errors, progress, and success.
- **Key Features:**
  - Used throughout the app for user feedback (via react-hot-toast or sonner).

## UI Library

- All UI components are built with [shadcn/ui](https://ui.shadcn.com/) for consistency, accessibility, and modern design.
