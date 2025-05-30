import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { X, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from 'react-query';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchProjectFields, fetchIssueTemplates } from '../services/githubService';
import { IssueRow } from './IssueCreator';
import { GitHubIssueTemplate, GitHubProjectField } from '../types';
import yaml from 'js-yaml';

interface IssueFormProps {
  initialData?: Partial<IssueRow>;
  onSubmit: (issue: IssueRow) => void;
  onCancel: () => void;
  selectedRepo?: string;
}

// Define a type for parsed templates
interface ParsedTemplate extends GitHubIssueTemplate {
  parsed: {
    body: Array<{ attributes?: { value?: string } }>;
    name: string;
  };
}

// Helper type guard for parsed template
function hasBody(obj: unknown): obj is { body: Array<{ attributes?: { value?: string } }> } {
  return (
    typeof obj === 'object' && obj !== null && 'body' in (obj as Record<string, unknown>) && Array.isArray((obj as Record<string, unknown>).body)
  );
}
function hasName(obj: unknown): obj is { name: string } {
  return (
    typeof obj === 'object' && obj !== null && 'name' in (obj as Record<string, unknown>) && typeof (obj as Record<string, unknown>).name === 'string'
  );
}

const IssueForm: React.FC<IssueFormProps> = ({ initialData, onSubmit, onCancel, selectedRepo }) => {
  const { settings, isConfigured } = useSettingsStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const { data: fields = [] } = useQuery(['projectFields', settings.projectId], () => fetchProjectFields(settings, settings.projectId), {
    enabled: isConfigured && !!settings.projectId,
  });

  const { data: templates = [] } = useQuery(
    ['issueTemplates', settings.organization, selectedRepo],
    () => (selectedRepo ? fetchIssueTemplates(settings, selectedRepo) : Promise.resolve([])),
    {
      enabled: !!selectedRepo,
    }
  );

  // Parse YAML templates into JSON objects
  const parsedTemplates: ParsedTemplate[] = useMemo(() => {
    return (templates as GitHubIssueTemplate[]).map((template) => {
      if (template && (template.path.endsWith('.yaml') || template.path.endsWith('.yml'))) {
        try {
          const parsed: unknown = yaml.load(template.content);
          return { ...template, parsed };
        } catch (e) {
          console.error(`Failed to parse YAML for template ${template.name}:`, e);
          return { ...template, parsed: null };
        }
      }
      return { ...template, parsed: null };
    });
  }, [templates]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<IssueRow>({
    defaultValues: {
      id: initialData?.id || uuidv4(),
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || '',
      type: initialData?.type || '',
      assignee: initialData?.assignee || '',
      estimate: initialData?.estimate || '',
    },
  });

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    if (templateName) {
      const template = parsedTemplates.find((t) => t?.name === templateName);
      if (template && hasBody(template.parsed)) {
        const body = template.parsed.body;
        if (body[0]?.attributes?.value) {
          setValue('description', body[0].attributes.value);
        }
      }
    }
  };

  const onFormSubmit = (data: IssueRow) => {
    onSubmit({
      ...data,
      labels: data.labels || [],
    });
  };

  const renderField = (field: GitHubProjectField) => {
    // Use field.id as the key for registration to avoid TS error
    const fieldProps = register(field.id as keyof IssueRow);

    switch (field.type) {
      case 'SINGLE_SELECT':
        return (
          <select id={field.id} className='input' {...fieldProps}>
            <option value=''>Select {field.name}</option>
            {field.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden animate-fade-in'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
          <h3 className='text-lg font-medium'>{initialData ? 'Edit Issue' : 'Add New Issue'}</h3>
          <button onClick={onCancel} className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'>
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className='px-6 py-4'>
          <div className='space-y-4'>
            {selectedRepo && (
              <div>
                <label htmlFor='template' className='label'>
                  Issue Template
                </label>
                <select id='template' className='input' value={selectedTemplate} onChange={handleTemplateChange}>
                  <option value=''>Select a template</option>
                  {parsedTemplates.map((template: ParsedTemplate) => (
                    <option key={template.name} value={template.name}>
                      {hasName(template.parsed) ? template.parsed.name : template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor='title' className='label'>
                Title
              </label>
              <input id='title' className='input' {...register('title', { required: 'Title is required' })} />
              {errors.title && (
                <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                  <AlertCircle className='w-4 h-4' />
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor='description' className='label'>
                Description
              </label>
              <textarea id='description' rows={5} className='input' {...register('description', { required: 'Description is required' })} />
              {errors.description && (
                <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                  <AlertCircle className='w-4 h-4' />
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className='grid grid-cols-1 gap-4'>
              {fields.map((field: GitHubProjectField) => {
                const rendered = renderField(field);
                if (!rendered) return null;
                return (
                  <div key={field.id}>
                    <label htmlFor={field.id} className='label'>
                      {field.name}
                    </label>
                    {rendered}
                  </div>
                );
              })}
            </div>
          </div>

          <div className='flex justify-end gap-2 mt-6'>
            <button type='button' onClick={onCancel} className='btn btn-secondary'>
              Cancel
            </button>
            <button type='submit' className='btn btn-primary'>
              {initialData ? 'Update Issue' : 'Add Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueForm;
