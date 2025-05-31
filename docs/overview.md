# Otis Documentation Overview

Welcome to the technical documentation for Otis.

## What is Otis?

Otis is a web application for bulk-creating GitHub issues and adding them to GitHub Projects. It provides a spreadsheet-like interface for managing large batches of issues, supports importing/exporting issues as JSON, and integrates directly with GitHub's API for seamless project management.

## High-Level Architecture

- **Frontend:** Built with React (TypeScript), Vite, and Tailwind CSS.
- **State Management:** Zustand for global state (settings, configuration).
- **API Integration:** Axios for REST and GraphQL calls to GitHub.
- **UI Components:** Modular React components for forms, tables, and modals.

## Documentation Structure

- [`components.md`](./components.md): Details on each main UI component and their responsibilities.
- [`state-management.md`](./state-management.md): How global state and settings are managed.
- [`github-integration.md`](./github-integration.md): How Otis interacts with the GitHub API, including authentication, project/issue management, and error handling.
- [`bulk-issue-flow.md`](./bulk-issue-flow.md): Step-by-step explanation of the bulk issue creation workflow.

Use this folder to dive deeper into how Otis works and how to extend or maintain it.
