# Otis Documentation Overview

Welcome to the technical documentation for Otis.

## What is Otis?

Otis is a web application for bulk-creating GitHub issues and adding them to GitHub Projects. It provides a spreadsheet-like interface for managing large batches of issues, supports importing/exporting issues as JSON, and integrates directly with GitHub's API for seamless project management.

## Features

- Spreadsheet-like UI for batch issue creation and management
- Connect to a GitHub organization using a Personal Access Token (PAT)
- Search and select GitHub Projects (v2) and repositories
- Add, edit, and remove issues in a batch before submitting
- Import/export issues as JSON
- Use GitHub issue templates (Markdown/YAML)
- Map custom project fields to issues
- Bulk create issues and add them to GitHub Projects
- File/image attachment support for issues
- Responsive, modern UI with dark mode/theme support
- Notifications for errors and progress (toast/sonner)
- Confirmation dialogs for critical actions
- Persistent settings, drafts, and preferences (local storage)

## High-Level Architecture

- **Frontend:** React (TypeScript), Vite, Tailwind CSS
- **Component Library:** [shadcn/ui](https://ui.shadcn.com/) for modern, accessible UI components
- **State Management:** Zustand for global state (settings, configuration, drafts)
- **API Integration:** Axios for REST and GraphQL calls to GitHub
- **UI Components:** Modular React components for forms, tables, modals, dialogs, and notifications
- **Other Libraries:** react-query (data fetching), react-hook-form (forms), @tanstack/react-table (tables), react-hot-toast/sonner (notifications), js-yaml, uuid, lucide-react (icons)

## Deployment & Environments

- Local development, dev, staging, and production environments supported
- Static site: deployable to Vercel, Netlify, GitHub Pages, or any static hosting
- Configuration via UI (no .env required for users)

## Documentation Structure

- [`components.md`](./components.md): Main UI components and their responsibilities
- [`state-management.md`](./state-management.md): Global state, settings, and persistence
- [`github-integration.md`](./github-integration.md): GitHub API integration, authentication, and error handling
- [`bulk-issue-flow.md`](./bulk-issue-flow.md): Step-by-step bulk issue creation workflow

Use this folder to dive deeper into how Otis works and how to extend or maintain it.
