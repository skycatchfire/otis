# GitHub Integration

Otis integrates directly with the GitHub API to manage projects and issues. This is handled in `src/services/githubService.ts`.

## Authentication

- **Personal Access Token (PAT):**
  - Users must provide a GitHub PAT with the following permissions:
    - `repo`
    - `admin:org`
    - `projects`
  - The token is stored locally (never sent to a backend).

## API Usage

- **REST API:** Used for endpoints like fetching issue templates.
- **GraphQL API:** Used for most project and issue management (faster, more flexible for project fields, etc).
- **Clients:** Axios is used to create REST and GraphQL clients with the appropriate headers.

## Main Service Functions

- `testGitHubConnection`: Validates credentials by querying the organization.
- `fetchProjects`: Lists projects in the organization (GraphQL).
- `fetchIssueTemplates`: Loads available issue templates from a repo (REST).
- `fetchProjectFields`: Gets custom fields for a project (GraphQL).
- `createBatchRepoIssuesAndAddToProject`: Bulk-creates issues in a repo and adds them to a project (REST + GraphQL).
- `createBatchProjectItems`: Bulk-creates project items directly (GraphQL).

## Error Handling

- All API calls use a shared error handler to provide user-friendly messages (invalid token, permissions, not found, etc).
- Errors are surfaced to the user via toast notifications.

## Security Considerations

- The PAT is only stored in the browser (local storage via Zustand persist).
- No sensitive data is sent to any backend or third party.
- Users are advised to use a token with the minimum required permissions.
