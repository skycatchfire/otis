import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import yaml from 'js-yaml';
import { GitHubIssueTemplate, ParsedTemplate } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseIssueTemplates(templates: GitHubIssueTemplate[]): ParsedTemplate[] {
  return templates
    .filter((template) => template.path !== '.github/ISSUE_TEMPLATE/config.yml')
    .map((template) => {
      if (template && (template.path.endsWith('.yaml') || template.path.endsWith('.yml'))) {
        try {
          const parsed = yaml.load(template.content) as { body?: Array<{ attributes?: { value?: string } }>; name?: string };
          return { ...template, parsed };
        } catch (e) {
          console.error(`Failed to parse YAML for template ${template.name}:`, e);
          return { ...template, parsed: null };
        }
      }

      console.log('template', template);
      return { ...template, parsed: null };
    });
}
