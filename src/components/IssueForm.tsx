import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from 'react-query';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchProjectFields, fetchIssueTemplates } from '../services/githubService';
import { IssueRow as BaseIssueRow } from './IssueCreator';
import { GitHubProjectField, ParsedTemplate } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { parseIssueTemplates } from '../lib/utils';

interface IssueFormProps {
  initialData?: Partial<BaseIssueRow>;
  onSubmit: (issue: BaseIssueRow) => void;
  onCancel: () => void;
}

// Extend IssueRow to allow a 'fields' property for form submission
interface IssueRowWithFields extends BaseIssueRow {
  fields?: Record<string, unknown>;
}

const IssueForm: React.FC<IssueFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { settings, isConfigured, lastUsedTemplate, lastUsedFields, setLastUsedTemplate, setLastUsedFields } = useSettingsStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialData?.template || lastUsedTemplate || '');

  const { data: fields = [] } = useQuery(['projectFields', settings.projectId], () => fetchProjectFields(settings, settings.projectId), {
    enabled: isConfigured && !!settings.projectId,
  });

  const { data: templates = [] } = useQuery(
    ['issueTemplates', settings.organization, settings.selectedRepo],
    () => (settings.selectedRepo ? fetchIssueTemplates(settings, settings.selectedRepo) : Promise.resolve([])),
    {
      enabled: !!settings.selectedRepo,
    }
  );

  // Parse YAML templates into JSON objects, ignoring config.yaml
  const parsedTemplates: ParsedTemplate[] = useMemo(() => parseIssueTemplates(templates as ParsedTemplate[]), [templates]);

  // Prepare default values for useForm
  const dynamicFieldDefaults = initialData?.fields
    ? Object.fromEntries(Object.entries(initialData.fields).map(([k, v]) => [k, v]))
    : lastUsedFields && !initialData
    ? Object.fromEntries(Object.entries(lastUsedFields).map(([k, v]) => [k, v]))
    : {};

  const {
    register,
    handleSubmit,
    setValue,
    control,
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
      ...dynamicFieldDefaults,
    },
  });

  // When the form opens, if lastUsedTemplate is set and no initialData, auto-populate description
  useEffect(() => {
    if (!initialData && lastUsedTemplate) {
      const template = parsedTemplates.find((t) => t.name === lastUsedTemplate);
      if (template && template.parsed && Array.isArray(template.parsed.body)) {
        const bodyText = template.parsed.body
          .map((item) => (item.attributes && item.attributes.value ? item.attributes.value : ''))
          .filter(Boolean)
          .join('\n\n');
        if (bodyText) {
          setValue('description', bodyText);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedTemplates, lastUsedTemplate, initialData, setValue]);

  const onFormSubmit = (data: BaseIssueRow) => {
    // Collect project field values into a 'fields' object
    const fieldsObj: Record<string, string> = {};
    fields.forEach((field: GitHubProjectField) => {
      if (data[field.id as keyof BaseIssueRow] !== undefined && data[field.id as keyof BaseIssueRow] !== '') {
        fieldsObj[field.id] = data[field.id as keyof BaseIssueRow] as string;
      }
    });
    // Remove project field keys from the top-level data
    const cleanedData: Record<string, unknown> = { ...data };
    fields.forEach((field: GitHubProjectField) => {
      delete cleanedData[field.id];
    });
    setLastUsedTemplate(selectedTemplate);
    setLastUsedFields(fieldsObj);
    onSubmit({
      ...(cleanedData as unknown as BaseIssueRow),
      labels: data.labels || [],
      fields: Object.keys(fieldsObj).length > 0 ? fieldsObj : undefined,
      template: selectedTemplate,
    } as IssueRowWithFields);
  };

  const renderField = (field: GitHubProjectField) => {
    switch (field.type) {
      case 'SINGLE_SELECT':
        return (
          <Controller
            name={field.id as keyof BaseIssueRow}
            control={control}
            render={({ field: controllerField }) => (
              <Select
                value={typeof controllerField.value === 'string' ? controllerField.value : ''}
                onValueChange={(val) => controllerField.onChange(val)}
              >
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
            )}
          />
        );
      case 'NUMBER':
        return <Input type='number' id={field.id} {...register(field.id as keyof BaseIssueRow)} />;
      case 'TEXT':
        return <Input type='text' id={field.id} {...register(field.id as keyof BaseIssueRow)} />;
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
            {settings.selectedRepo && (
              <div>
                <Label htmlFor='template'>Issue Template</Label>
                <Select value={selectedTemplate} onValueChange={(val) => setSelectedTemplate(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a template' />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedTemplates.map((template: ParsedTemplate) => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.name}
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
