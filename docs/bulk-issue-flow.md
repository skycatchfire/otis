# Bulk Issue Creation Flow

This document explains the end-to-end flow for creating issues in bulk with Otis.

## 1. Configuration

- User opens the app and clicks the settings icon.
- Enters GitHub Organization, Personal Access Token (PAT), and selects a theme (optional).
- App validates credentials and saves them in local storage.

## 2. Project & Repository Selection

- User searches for and selects a GitHub Project (v2) from their organization.
- User selects a repository associated with the project (for issue templates).
- The app fetches available issue templates and custom project fields.

## 3. Issue Entry & Import

- User can add issues one by one using the `IssueForm` modal.
- Alternatively, user can import a batch of issues from a JSON file.
- Each issue can include title, description, type, status, assignee, estimate, labels, custom fields, and file/image attachments.

## 4. Editing & Export

- Issues are displayed in a table (`IssueTable`).
- User can edit or remove issues before submission.
- User can export the current batch as a JSON file for reuse or backup.

## 5. Submission

- User clicks to submit the batch.
- App shows a confirmation dialog (`ConfirmDialog`).
- On confirmation, the app:
  - Creates each issue in the selected repository via the GitHub API.
  - Adds each issue to the selected project, mapping custom fields as needed.
  - Shows progress and notifies the user of success or errors (toast notifications).
- On success, the batch is cleared and the user can start a new batch.

## 6. Error Handling & Notifications

- Any errors (API, validation, etc) are shown via toast notifications.
- The user can retry or adjust settings as needed.
- Progress is shown during batch submission.
