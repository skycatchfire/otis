import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

interface GitHubCredentials {
  organization: string;
  projectNumber: string;
  token: string;
}

export const createGraphQLClient = (credentials: GitHubCredentials) => {
  return axios.create({
    baseURL: GITHUB_GRAPHQL_URL,
    headers: {
      'Authorization': `bearer ${credentials.token}`,
      'Content-Type': 'application/json',
    },
  });
};

export const createApiClient = (credentials: GitHubCredentials) => {
  return axios.create({
    baseURL: GITHUB_API_URL,
    headers: {
      'Authorization': `token ${credentials.token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });
};

const handleGitHubError = (error: any) => {
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

    const projects = (response.data.data.organization?.projectsV2?.nodes || [])
      .filter((project: any) => project && !project.closed)
      .map((project: any) => ({
        id: project?.id,
        number: project?.number,
        name: project?.title,
        repositories: (project?.repositories?.nodes || [])
          .filter((repo: any) => repo && repo.id && repo.name)
          .map((repo: any) => ({
            id: repo.id,
            name: repo.name,
          })),
      }))
      .filter((project: any) => project.id && project.number && project.name);

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
    const response = await client.get(`/repos/${credentials.organization}/${repoName}/contents/.github/ISSUE_TEMPLATE`);
    
    const templates = await Promise.all(
      response.data.map(async (file: any) => {
        if (file && file.type === 'file' && (file.name.endsWith('.md') || file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
          // Use fetch for raw content instead of axios client
          const rawResponse = await fetch(file.download_url, {
            headers: {
              'Authorization': `token ${credentials.token}`
            }
          });
          
          if (!rawResponse.ok) {
            throw new Error(`Failed to fetch template content: ${rawResponse.statusText}`);
          }
          
          const content = await rawResponse.text();
          return {
            name: file.name.replace(/\.(md|yaml|yml)$/, ''),
            content,
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

    return (response.data.data.node.fields?.nodes || [])
      .filter((field: any) => field && field.dataType !== 'TITLE')
      .map((field: any) => ({
        id: field?.id,
        name: field?.name,
        type: field?.dataType,
        options: field?.options || [],
      }))
      .filter((field: any) => field.id && field.name && field.type);
  } catch (error) {
    console.error('Failed to fetch project fields:', error);
    handleGitHubError(error);
    throw error;
  }
};

export const createProjectItem = async (credentials: GitHubCredentials, issue: { title: string; body: string; fields?: Record<string, any> }) => {
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
        projectId: credentials.projectNumber,
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

    if (issue.fields) {
      for (const [fieldId, value] of Object.entries(issue.fields)) {
        if (fieldId && value !== undefined) {
          await updateProjectItemField(credentials, itemId, fieldId, value);
        }
      }
    }

    return response.data.data.addProjectV2DraftIssue.projectItem;
  } catch (error) {
    console.error('Failed to create project item:', error);
    handleGitHubError(error);
    throw error;
  }
};

export const updateProjectItemField = async (credentials: GitHubCredentials, itemId: string, fieldId: string, value: any) => {
  try {
    const client = createGraphQLClient(credentials);
    const query = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
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
        projectId: credentials.projectNumber,
        itemId,
        fieldId,
        value: JSON.stringify(value),
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
  issues: Array<{ title: string; body: string; fields?: Record<string, any> }>,
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