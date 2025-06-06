import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from 'react-query';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchProjectFields, fetchIssueTemplates } from '../services/githubService';
import { IssueRow as BaseIssueRow } from './IssueCreator';
import { GitHubIssueTemplate, GitHubProjectField } from '../types';
import yaml from 'js-yaml';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface IssueFormProps {
  initialData?: Partial<BaseIssueRow>;
  onSubmit: (issue: BaseIssueRow) => void;
  onCancel: () => void;
  selectedRepo?: string;
}

// Define a type for parsed templates
interface ParsedTemplate extends GitHubIssueTemplate {
  parsed: {
    body: Array<{ attributes?: { value?: string } }>;
    name: string;
  } | null;
}

// Helper type guard for parsed template
function hasName(obj: unknown): obj is { name: string } {
  return (
    typeof obj === 'object' && obj !== null && 'name' in (obj as Record<string, unknown>) && typeof (obj as Record<string, unknown>).name === 'string'
  );
}

// Extend IssueRow to allow a 'fields' property for form submission
interface IssueRowWithFields extends BaseIssueRow {
  fields?: Record<string, unknown>;
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

  // Parse YAML templates into JSON objects, ignoring config.yaml
  const parsedTemplates: ParsedTemplate[] = useMemo(() => {
    return (templates as GitHubIssueTemplate[])
      .filter((template) => template.path !== '.github/ISSUE_TEMPLATE/config.yml')
      .map((template) => {
        // Ignore config.yaml (case-insensitive)
        if (template && (template.path.endsWith('.yaml') || template.path.endsWith('.yml'))) {
          try {
            const parsed: unknown = yaml.load(template.content);
            return { ...template, parsed: parsed as { body: Array<{ attributes?: { value?: string } }>; name: string } };
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
  } = useForm<BaseIssueRow>({
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

  const onFormSubmit = (data: BaseIssueRow) => {
    // Collect project field values into a 'fields' object
    const fieldsObj: Record<string, unknown> = {};
    fields.forEach((field: GitHubProjectField) => {
      if (data[field.id as keyof BaseIssueRow] !== undefined && data[field.id as keyof BaseIssueRow] !== '') {
        fieldsObj[field.id] = data[field.id as keyof BaseIssueRow];
      }
    });
    // Remove project field keys from the top-level data
    const cleanedData: Record<string, unknown> = { ...data };
    fields.forEach((field: GitHubProjectField) => {
      delete cleanedData[field.id];
    });
    onSubmit({
      ...(cleanedData as unknown as BaseIssueRow),
      labels: data.labels || [],
      fields: Object.keys(fieldsObj).length > 0 ? fieldsObj : undefined,
    } as IssueRowWithFields);
  };

  const renderField = (field: GitHubProjectField) => {
    const fieldProps = register(field.id as keyof BaseIssueRow);
    switch (field.type) {
      case 'SINGLE_SELECT':
        return (
          <Select {...fieldProps} onValueChange={(val) => setValue(field.id as keyof BaseIssueRow, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'NUMBER':
        return <Input type='number' id={field.id} {...fieldProps} />;
      case 'TEXT':
        return <Input type='text' id={field.id} {...fieldProps} />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Issue' : 'Add New Issue'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Edit the details of this issue.' : 'Fill out the form to add a new issue to your batch.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className='space-y-4'>
            {selectedRepo && (
              <div>
                <Label htmlFor='template'>Issue Template</Label>
                <Select value={selectedTemplate} onValueChange={(val) => setSelectedTemplate(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a template' />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedTemplates.map((template: ParsedTemplate) => (
                      <SelectItem key={template.name} value={template.name}>
                        {hasName(template.parsed) ? template.parsed.name : template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor='title'>Title</Label>
              <Input id='title' {...register('title', { required: 'Title is required' })} />
              {errors.title && (
                <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                  <AlertCircle className='w-4 h-4' />
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='description'>Description</Label>
              <Textarea id='description' rows={5} {...register('description', { required: 'Description is required' })} />
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
                    <Label htmlFor={field.id}>{field.name}</Label>
                    {rendered}
                  </div>
                );
              })}
            </div>
          </div>
          <div className='flex justify-end gap-2 mt-6'>
            <Button type='button' onClick={onCancel} variant='secondary'>
              Cancel
            </Button>
            <Button type='submit' variant='default'>
              {initialData ? 'Save' : 'Add Issue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IssueForm;
