# GitHub Project Card Creator

Used to build GitHub Project cards

How it works
https://www.loom.com/share/301981b339de4bed914649bf139f7db0

## Overview

The GitHub Project Card Creator is a web application designed to simplify the process of creating project cards for GitHub Projects. This tool allows users to fill out a form with the necessary details, select a template, and automatically generate project cards in a specified GitHub organization and project.

## Features

- **Template Selection:** Choose from predefined templates to quickly fill out card content.
- **Dynamic Form Fields:** Automatically populates form fields based on the selected template and project-specific fields.
- **Image Upload:** Attach multiple images to the card by uploading files.
- **GitHub Integration:** Utilizes GitHub's GraphQL API to fetch project fields and create cards directly in your GitHub Project.

## Prerequisites

- A GitHub Personal Access Token with appropriate permissions to access the organization and project.
- Access to the GitHub project where the cards will be created.

## How to Use

1. Clone the Repository
2. Open `index.html` file in your preferred web browser.
3. Fill out the form
    - **Template:** Select a template from the dropdown list.
    - **Title:** Enter the title for your project card.
    - **Content:** Fill in the content details for the card.
    - **Image URL:** Upload images that should be attached to the card.
    - **GitHub Personal Access Token:** Enter your GitHub token.
    - **Create Card:** Click the "Create Card" button to submit the form and create the project card in GitHub.

## Project Configuration

The application fetches project-specific fields from GitHub to dynamically generate form fields. These fields include single-select, number, and iteration types. Make sure to update the projectNumber and organization variables in the script to match your project's details.

## Sample Templates

The application includes sample templates for different types of project cards:
- Component - COPY ME
- Page - COPY ME
- Taxonomy Type - COPY ME
- Post Type - COPY ME

Each template comes with preset content and custom fields, which are automatically populated in the form when a template is selected.
