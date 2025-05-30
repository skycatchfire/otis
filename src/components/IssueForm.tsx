import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from 'react-query';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchProjectFields, fetchIssueTemplates } from '../services/githubService';
import { IssueRow } from './IssueCreator';

interface IssueFormProps {
  initialData?: Partial<IssueRow>;
  onSubmit: (issue: IssueRow) => void;
  onCancel: () => void;
  selectedRepo?: string;
}

const IssueForm: React.FC<IssueFormProps> = ({ initialData, onSubmit, onCancel, selectedRepo }) => {
  const { settings } = useSettingsStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const { data: fields = [] } = useQuery(
    ['projectFields', settings.projectNumber],
    () => fetchProjectFields(settings, settings.projectNumber),
    {
      enabled: !!settings.projectNumber,
    }
  );

  const { data: templates = [] } = useQuery(
    ['issueTemplates', settings.organization, selectedRepo],
    () => selectedRepo ? fetchIssueTemplates(settings, selectedRepo) : Promise.resolve([]),
    {
      enabled: !!selectedRepo,
    }
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<IssueRow>({
    defaultValues: {
      id: initialData?.id || uuidv4(),
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || '',
      type: initialData?.type || '',
      assignee: initialData?.assignee || '',
      estimate: initialData?.estimate || '',
    }
  });

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    
    if (templateName) {
      const template = templates.find((t: any) => t.name === templateName);
      if (template) {
        setValue('description', template.content);
      }
    }
  };

  const onFormSubmit = (data: IssueRow) => {
    onSubmit({
      ...data,
      labels: data.labels || [],
    });
  };

  const renderField = (field: any) => {
    const fieldProps = register(field.name.toLowerCase());

    switch (field.type) {
      case 'SINGLE_SELECT':
        return (
          <select
            id={field.id}
            className="input"
            {...fieldProps}
          >
            <option value="">Select {field.name}</option>
            {field.options.map((option: any) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        );
      
      case 'TEXT':
      case 'NUMBER':
        return (
          <input
            id={field.id}
            type={field.type === 'NUMBER' ? 'number' : 'text'}
            className="input"
            {...fieldProps}
          />
        );
      
      case 'DATE':
        return (
          <input
            id={field.id}
            type="date"
            className="input"
            {...fieldProps}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium">
            {initialData ? 'Edit Issue' : 'Add New Issue'}
          </h3>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="px-6 py-4">
          <div className="space-y-4">
            {selectedRepo && (
              <div>
                <label htmlFor="template" className="label">
                  Issue Template
                </label>
                <select
                  id="template"
                  className="input"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                >
                  <option value="">Select a template</option>
                  {templates.map((template: any) => (
                    <option key={template.name} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="title" className="label">
                Title
              </label>
              <input
                id="title"
                className="input"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                rows={5}
                className="input"
                {...register('description', { required: 'Description is required' })}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description.message}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field: any) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="label">
                    {field.name}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {initialData ? 'Update Issue' : 'Add Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueForm;