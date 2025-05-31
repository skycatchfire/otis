# Otis

Bulk create GitHub issues with a spreadsheet-like interface.

## Overview

Otis is a web application that allows users to connect to a GitHub organization and bulk-create issues in repositories and projects using a streamlined, spreadsheet-like interface. It is designed to save time for teams managing large numbers of issues, supporting templates, custom fields, and direct integration with GitHub Projects.

## Tech Stack

- **Frontend Framework:** React 18 (with TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **API/HTTP:** Axios
- **Forms:** React Hook Form
- **Table UI:** @tanstack/react-table
- **Notifications:** react-hot-toast
- **Other:** js-yaml, uuid, lucide-react (icons)

## Features

- Connect to a GitHub organization using a Personal Access Token (PAT)
- Search and select GitHub Projects and repositories
- Add, edit, and remove issues in a batch before submitting
- Import/export issues as JSON
- Use GitHub issue templates (Markdown/YAML)
- Map custom project fields to issues
- Bulk create issues and add them to GitHub Projects
- Responsive, modern UI with dark mode support

## Setup & Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd otis
   ```
2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```
3. **Start the development server:**
   ```sh
   npm run dev
   # or
   yarn dev
   ```
4. **Open the app:**
   Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Configuration

- On first launch, click the settings icon in the top right.
- Enter your GitHub Organization name and a Personal Access Token (PAT) with the following permissions:
  - `repo`
  - `admin:org`
  - `projects`
- Save settings. The app will validate your connection.

## Usage

1. **Configure GitHub connection** via the settings modal.
2. **Search and select a GitHub Project** and repository.
3. **Add issues** using the form or import from JSON.
4. **Edit or remove issues** in the batch table.
5. **Export issues** as JSON for reuse.
6. **Submit** to create all issues in GitHub and add them to the selected project.

## Build & Deployment

- **Build for production:**
  ```sh
  npm run build
  # or
  yarn build
  ```
- **Preview production build:**
  ```sh
  npm run preview
  # or
  yarn preview
  ```
- The app is a static site and can be deployed to any static hosting (Vercel, Netlify, GitHub Pages, etc).

## Further Documentation

See the `/docs` folder for detailed technical documentation on components, state management, and GitHub integration.
