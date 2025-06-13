import axios from 'axios';
import { GitHubIssueTemplate } from '../types';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

interface GitHubCredentials {
  organization: string;
  projectId: string;
  token: string;
}

export const createGraphQLClient = (credentials: GitHubCredentials) => {
  return axios.create({
    baseURL: GITHUB_GRAPHQL_URL,
    headers: {
      Authorization: `bearer ${credentials.token}`,
      'Content-Type': 'application/json',
    },
  });
};

export const createApiClient = (credentials: GitHubCredentials) => {
  return axios.create({
    baseURL: GITHUB_API_URL,
    headers: {
      Authorization: `token ${credentials.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
};

const handleGitHubError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with an error status
      switch (error.response.status) {
        case 401:
          throw new Error('Invalid GitHub token. Please check your Personal Access Token.');
        case 403:
          throw new Error('Access forbidden. Please check your token permissions (needs: repo, admin:org, projects).');
        case 404:
          throw new Error('Organization or resource not found. Please check the organization name.');
        default:
          throw new Error(`GitHub API error: ${error.response.data?.message || error.message}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Unable to reach GitHub API. Please check your internet connection.');
    }
  }
  throw error;
};

export const testGitHubConnection = async (credentials: GitHubCredentials) => {
  try {
    const client = createGraphQLClient(credentials);
    const query = `
      query($org: String!) {
        organization(login: $org) {
          id
        }
      }
    `;

    await client.post('', {
      query,
      variables: { org: credentials.organization },
    });
    return true;
  } catch (error) {
    console.error('GitHub connection test failed:', error);
    handleGitHubError(error);
    return false;
  }
};

export const fetchProjects = async (credentials: GitHubCredentials, searchQuery: string = '') => {
  try {
    if (!credentials.organization || !credentials.token) {
      throw new Error('GitHub credentials not configured. Please check your settings.');
    }

    const client = createGraphQLClient(credentials);
    const query = `
      query($org: String!, $searchQuery: String) {
        organization(login: $org) {
          projectsV2(first: 100, query: $searchQuery, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              id
              number
              title
              closed
              updatedAt
              repositories(first: 100) {
                nodes {
                  name
                  id
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.post('', {
      query,
      variables: {
        org: credentials.organization,
        searchQuery: searchQuery || null,
      },
    });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    type ProjectNode = {
      id: string;
      number: number;
      title: string;
      closed: boolean;
      repositories: { nodes: Array<{ id: string; name: string }> };
    };

    const projects = (response.data.data.organization?.projectsV2?.nodes || [])
      .filter((project: ProjectNode) => project && !project.closed)
      .map((project: ProjectNode) => ({
        id: project.id,
        number: project.number,
        name: project.title,
        repositories: (project.repositories?.nodes || [])
          .filter((repo: { id: string; name: string }) => repo && repo.id && repo.name)
          .map((repo: { id: string; name: string }) => ({
            id: repo.id,
            name: repo.name,
          })),
      }))
      .filter((project: { id: string; number: number; name: string }) => project.id && project.number && project.name);

    return projects;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    handleGitHubError(error);
    throw error;
  }
};

export const fetchIssueTemplates = async (credentials: GitHubCredentials, repoName: string) => {
  try {
    const client = createApiClient(credentials);
    const response = await client.get<GitHubIssueTemplate[]>(`/repos/${credentials.organization}/${repoName}/contents/.github/ISSUE_TEMPLATE`);

    const templates = await Promise.all(
      response.data.map(async (file: GitHubIssueTemplate) => {
        if (file && file.type === 'file' && (file.name.endsWith('.md') || file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
          // Fetch file content using the API (not raw URL)
          const fileResponse = await client.get<GitHubIssueTemplate>(
            `/repos/${credentials.organization}/${repoName}/contents/.github/ISSUE_TEMPLATE/${file.name}`
          );
          const { content, encoding } = fileResponse.data;
          let decodedContent = content;
          if (encoding === 'base64') {
            decodedContent = base64ToUtf8(content);
          }
          return {
            name: file.name.replace(/\.(md|yaml|yml)$/, ''),
            content: decodedContent,
            path: file.path,
          };
        }
        return null;
      })
    );

    return templates.filter(Boolean);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return []; // Repository doesn't have issue templates
    }
    console.error('Failed to fetch issue templates:', error);
    handleGitHubError(error);
    throw error;
  }
};

export const fetchProjectFields = async (credentials: GitHubCredentials, projectId: string) => {
  try {
    const client = createGraphQLClient(credentials);
    const query = `
      query {
        node(id: "${projectId}") {
          ... on ProjectV2 {
            fields(first: 100) {
              nodes {
                ... on ProjectV2FieldCommon {
                  id
                  name
                  dataType
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  dataType
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.post('', { query });

    if (!response.data.data.node) {
      throw new Error('No project found with ID: ' + projectId);
    }

    type ProjectFieldNode = {
      id: string;
      name: string;
      dataType: string;
      options?: Array<{ id: string; name: string }>;
    };

    console.log(response.data.data.node.fields?.nodes);

    return (response.data.data.node.fields?.nodes || [])
      .filter((field: ProjectFieldNode) => field && field.dataType !== 'TITLE')
      .map((field: ProjectFieldNode) => ({
        id: field.id,
        name: field.name,
        type: field.dataType,
        options: field.options || [],
      }));
  } catch (error) {
    console.error('Failed to fetch project fields:', error);
    handleGitHubError(error);
    throw error;
  }
};

export const createProjectItem = async (credentials: GitHubCredentials, issue: { title: string; body: string; fields?: Record<string, unknown> }) => {
  try {
    const client = createGraphQLClient(credentials);
    const query = `
      mutation($projectId: ID!, $title: String!, $body: String!) {
        addProjectV2DraftIssue(input: {
          projectId: $projectId
          title: $title
          body: $body
        }) {
          projectItem {
            id
          }
        }
      }
    `;

    const response = await client.post('', {
      query,
      variables: {
        projectId: credentials.projectId,
        title: issue.title,
        body: issue.body,
      },
    });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    const itemId = response.data.data.addProjectV2DraftIssue?.projectItem?.id;
    if (!itemId) {
      throw new Error('Failed to create project item: No item ID returned');
    }

    // Do not update fields here; handled in batch function where field types are known

    return response.data.data.addProjectV2DraftIssue.projectItem;
  } catch (error) {
    console.error('Failed to create project item:', error);
    handleGitHubError(error);
    throw error;
  }
};

export const updateProjectItemField = async (credentials: GitHubCredentials, itemId: string, fieldId: string, value: unknown, fieldType: string) => {
  try {
    const client = createGraphQLClient(credentials);
    let formattedValue: Record<string, unknown>;
    // Format value based on field type
    switch (fieldType) {
      case 'SINGLE_SELECT':
        formattedValue = { singleSelectOptionId: value };
        break;
      case 'NUMBER':
        formattedValue = { number: Number(value) };
        break;
      case 'DATE':
        formattedValue = { date: value };
        break;
      case 'TEXT':
      default:
        formattedValue = { text: value };
        break;
    }
    const query = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: $value
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;
    const response = await client.post('', {
      query,
      variables: {
        projectId: credentials.projectId,
        itemId,
        fieldId,
        value: formattedValue,
      },
    });
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
  } catch (error) {
    console.error('Failed to update project item field:', error);
    handleGitHubError(error);
    throw error;
  }
};

export const createBatchProjectItems = async (
  credentials: GitHubCredentials,
  issues: Array<{ title: string; body: string; fields?: Record<string, unknown> }>,
  onProgress?: (completed: number, total: number) => void
) => {
  const results = [];
  const total = issues.length;

  for (let i = 0; i < issues.length; i++) {
    try {
      const issue = issues[i];
      const result = await createProjectItem(credentials, issue);
      results.push({ success: true, data: result });

      if (onProgress) {
        onProgress(i + 1, total);
      }
    } catch (error) {
      results.push({ success: false, error, issue: issues[i] });

      if (onProgress) {
        onProgress(i + 1, total);
      }
    }
  }

  return results;
};

/**
 * Batch create issues in a repository and add them to a project (as real issues, not draft issues).
 * @param credentials GitHub credentials (must include organization, projectId, token)
 * @param repoName The repository name to create issues in
 * @param issues Array of issues: { title, body, fields? }
 * @param onProgress Optional progress callback
 * @returns Array of results: { success, data } or { success, error, issue }
 */
export const createBatchRepoIssuesAndAddToProject = async (
  credentials: GitHubCredentials,
  repoName: string,
  issues: Array<{ title: string; body: string; fields?: Record<string, unknown> }>,
  onProgress?: (completed: number, total: number) => void
) => {
  const results = [];
  const total = issues.length;
  const restClient = createApiClient(credentials);
  const gqlClient = createGraphQLClient(credentials);

  // Fetch project fields to get types/options
  const projectFields: Array<{ id: string; type: string; options?: Array<{ id: string; name: string }> }> = await fetchProjectFields(
    credentials,
    credentials.projectId
  );
  const fieldTypeMap: Record<string, { type: string; options?: Array<{ id: string; name: string }> }> = {};
  projectFields.forEach((f: { id: string; type: string; options?: Array<{ id: string; name: string }> }) => {
    fieldTypeMap[f.id] = { type: f.type, options: f.options };
  });

  for (let i = 0; i < issues.length; i++) {
    try {
      const issue = issues[i];
      // 1. Create the issue in the repo
      const createIssueResp = await restClient.post(`/repos/${credentials.organization}/${repoName}/issues`, {
        title: issue.title,
        body: issue.body,
      });
      const createdIssue = createIssueResp.data;
      if (!createdIssue || !createdIssue.node_id) {
        throw new Error('Failed to create issue in repo or missing node_id');
      }
      // 2. Add the issue to the project
      const addToProjectMutation = `
        mutation($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
            item { id }
          }
        }
      `;
      const addToProjectResp = await gqlClient.post('', {
        query: addToProjectMutation,
        variables: {
          projectId: credentials.projectId,
          contentId: createdIssue.node_id,
        },
      });
      if (addToProjectResp.data.errors) {
        throw new Error(addToProjectResp.data.errors[0].message);
      }
      const itemId = addToProjectResp.data.data.addProjectV2ItemById?.item?.id;
      if (!itemId) {
        throw new Error('Failed to add issue to project: No item ID returned');
      }
      // 4. Update fields if provided
      if (issue.fields) {
        for (const [fieldId, value] of Object.entries(issue.fields)) {
          if (fieldId && value !== undefined) {
            const fieldMeta = fieldTypeMap[fieldId];
            if (fieldMeta) {
              await updateProjectItemField(credentials, itemId, fieldId, value, fieldMeta.type);
            }
          }
        }
      }
      results.push({ success: true, data: { issue: createdIssue, projectItemId: itemId } });
      if (onProgress) {
        onProgress(i + 1, total);
      }
    } catch (error) {
      results.push({ success: false, error, issue: issues[i] });
      if (onProgress) {
        onProgress(i + 1, total);
      }
    }
  }
  return results;
};

function base64ToUtf8(base64: string): string {
  const binaryString = atob(base64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}
