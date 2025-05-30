import React, { useState } from 'react';
import { PlusCircle, Download, Upload, Send, Search } from 'lucide-react';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchProjects, createBatchRepoIssuesAndAddToProject } from '../services/githubService';
import IssueTable from './IssueTable';
import IssueForm from './IssueForm';

export interface IssueRow {
  id: string;
  title: string;
  description: string;
  status?: string;
  type?: string;
  assignee?: string;
  labels?: string[];
  estimate?: string;
  fields?: Record<string, unknown>;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  issueCount: number;
  projectId: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onConfirm, onCancel, issueCount, projectId }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4'>
        <h3 className='text-lg font-semibold mb-4'>Confirm Issue Creation</h3>
        <p className='text-gray-600 dark:text-gray-400 mb-6'>
          Are you sure you want to create {issueCount} issues in project #{projectId}? This action cannot be undone.
        </p>
        <div className='flex justify-end gap-3'>
          <button onClick={onCancel} className='btn btn-secondary'>
            Cancel
          </button>
          <button onClick={onConfirm} className='btn btn-primary'>
            Create Issues
          </button>
        </div>
      </div>
    </div>
  );
};

const IssueCreator: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery(
    ['projects', settings.organization, settings.token, projectSearch],
    () => fetchProjects(settings, projectSearch),
    {
      enabled: !!settings.organization && !!settings.token,
      keepPreviousData: true,
    }
  );

  const selectedProject = projects.find((p: { id: string }) => p.id === settings.projectId);

  const addNewIssue = (issue: IssueRow) => {
    setIssues((prev) => [...prev, issue]);
    setIsFormOpen(false);
    toast.success('Issue added to batch');
  };

  const removeIssue = (id: string) => {
    setIssues((prev) => prev.filter((issue) => issue.id !== id));
    toast.success('Issue removed from batch');
  };

  const updateIssue = (id: string, updates: Partial<IssueRow>) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, ...updates } : issue)));
  };

  const exportToJson = () => {
    if (issues.length === 0) {
      toast.error('No issues to export');
      return;
    }

    const dataStr = JSON.stringify(issues, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `github-issues-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success('Issues exported successfully');
  };

  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      fileReader.readAsText(event.target.files[0], 'UTF-8');
      fileReader.onload = (e) => {
        if (e.target?.result) {
          try {
            const parsedIssues = JSON.parse(e.target.result as string) as IssueRow[];
            setIssues(parsedIssues);
            toast.success(`Imported ${parsedIssues.length} issues`);
          } catch {
            toast.error('Failed to parse the imported file');
          }
        }
      };
    }
  };

  const handleSubmitConfirm = () => {
    if (issues.length === 0) {
      toast.error('No issues to submit');
      return;
    }

    if (!settings.projectId) {
      toast.error('Please select a project');
      return;
    }

    if (!selectedRepo) {
      toast.error('Please select a repository');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleSubmitIssues = async () => {
    setIsSubmitting(true);
    try {
      const formattedIssues = issues.map((issue: IssueRow) => ({
        title: issue.title,
        body: issue.description,
        fields: issue.fields,
      }));

      await createBatchRepoIssuesAndAddToProject(settings, selectedRepo, formattedIssues, (completed, total) => {
        toast.success(`Created ${completed} of ${total} issues`);
      });

      setIssues([]);
      toast.success('All issues created successfully');
    } catch {
      toast.error('Failed to create some issues. Please check the console for details.');
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='card'>
        <div className='flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-6'>
          <h2 className='text-xl font-bold'>Bulk Issue Creator</h2>

          <div className='flex flex-wrap gap-2'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Search className='h-4 w-4 text-gray-400' />
              </div>
              <input
                type='text'
                placeholder='Search projects...'
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className='input pl-10 py-1 text-sm w-full min-w-[250px]'
              />
            </div>

            <select
              value={settings.projectId}
              onChange={(e) => updateSettings({ ...settings, projectId: e.target.value })}
              className='input py-1 px-3 min-w-[200px]'
              disabled={isLoadingProjects}
            >
              <option value=''>Select project</option>
              {projects.map((project: { id: string; name: string; number: number }) => (
                <option key={project.id} value={project.id}>
                  {project.name} (#{project.number})
                </option>
              ))}
            </select>

            {selectedProject && (
              <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)} className='input py-1 px-3 min-w-[200px]'>
                <option value=''>Select repository for templates</option>
                {selectedProject.repositories.map((repo: { id: string; name: string }) => (
                  <option key={repo.id} value={repo.name}>
                    {repo.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className='flex flex-wrap gap-2 mb-4'>
          <button onClick={() => setIsFormOpen(true)} className='btn btn-primary flex items-center gap-1'>
            <PlusCircle className='w-4 h-4' /> Add Issue
          </button>

          <button onClick={exportToJson} className='btn btn-secondary flex items-center gap-1' disabled={issues.length === 0}>
            <Download className='w-4 h-4' /> Export
          </button>

          <label className='btn btn-secondary flex items-center gap-1 cursor-pointer'>
            <Upload className='w-4 h-4' /> Import
            <input type='file' accept='.json' className='hidden' onChange={importFromJson} />
          </label>

          <button
            onClick={handleSubmitConfirm}
            className='btn btn-primary flex items-center gap-1 ml-auto'
            disabled={issues.length === 0 || !settings.projectId || !selectedRepo || isSubmitting}
          >
            <Send className='w-4 h-4' /> Submit All Issues
          </button>
        </div>

        {issues.length > 0 ? (
          <IssueTable issues={issues} onUpdate={updateIssue} onDelete={removeIssue} />
        ) : (
          <div className='text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg'>
            <p className='text-gray-500 dark:text-gray-400'>No issues added yet. Add your first issue to get started.</p>
          </div>
        )}
      </div>

      {isFormOpen && <IssueForm onSubmit={addNewIssue} onCancel={() => setIsFormOpen(false)} selectedRepo={selectedRepo} />}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onConfirm={handleSubmitIssues}
        onCancel={() => setIsConfirmOpen(false)}
        issueCount={issues.length}
        projectId={settings.projectId}
      />
    </div>
  );
};

export default IssueCreator;
