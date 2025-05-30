export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
}

export interface GitHubIssueTemplate {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
}

export interface GitHubProjectField {
  id: number;
  name: string;
  url: string;
  cards_url: string;
}

export interface GitHubIssue {
  id: number;
  node_id: string;
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  number: number;
  state: string;
  title: string;
  body: string;
  user: {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
    html_url: string;
  };
  labels: Array<{
    id: number;
    url: string;
    name: string;
    color: string;
    description: string;
  }>;
  assignee: {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
    html_url: string;
  } | null;
  assignees: Array<{
    login: string;
    id: number;
    avatar_url: string;
    url: string;
    html_url: string;
  }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}