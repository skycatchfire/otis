import React, { useState } from 'react';
import { PlusCircle, Download, Upload, Send, Search, X } from 'lucide-react';
import { useQuery } from 'react-query';
import { toast } from 'sonner';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchProjects, createBatchRepoIssuesAndAddToProject } from '../services/githubService';
import IssueTable from './IssueTable';
import IssueForm from './IssueForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select as ShadSelect, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
  images?: File[];
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  issueCount: number;
  projectId: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onConfirm, onCancel, issueCount, projectId }) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Issue Creation</DialogTitle>
          <DialogDescription>
            This will create {issueCount} issues in project #{projectId}. This action cannot be undone.
          </DialogDescription>
          <DialogClose asChild>
            <Button onClick={onCancel} variant='ghost' size='icon' aria-label='Close'>
              <X className='w-5 h-5' />
            </Button>
          </DialogClose>
        </DialogHeader>
        <p className='text-muted-foreground mb-6'>
          Are you sure you want to create {issueCount} issues in project #{projectId}? This action cannot be undone.
        </p>
        <div className='flex justify-end gap-3'>
          <Button onClick={onCancel} variant='secondary'>
            Cancel
          </Button>
          <Button onClick={onConfirm} variant='default'>
            Create Issues
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

  const { data: projects = [] } = useQuery(
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
    toast('Issue added to batch');
  };

  const removeIssue = (id: string) => {
    setIssues((prev) => prev.filter((issue) => issue.id !== id));
    toast('Issue removed from batch');
  };

  const updateIssue = (id: string, updates: Partial<IssueRow>) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, ...updates } : issue)));
  };

  const exportToJson = () => {
    if (issues.length === 0) {
      toast('No issues to export');
      return;
    }

    const dataStr = JSON.stringify(issues, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `github-issues-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast('Issues exported successfully');
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
            toast('Imported issues');
          } catch {
            toast('Failed to parse the imported file');
          }
        }
      };
    }
  };

  const handleSubmitConfirm = () => {
    if (issues.length === 0) {
      toast('No issues to submit');
      return;
    }

    if (!settings.projectId) {
      toast('Please select a project');
      return;
    }

    if (!selectedRepo) {
      toast('Please select a repository');
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
        images: issue.images,
      }));

      await createBatchRepoIssuesAndAddToProject(settings, selectedRepo, formattedIssues, (completed, total) => {
        toast(`Created ${completed} of ${total} issues`);
      });

      setIssues([]);
      toast('All issues created successfully');
    } catch {
      toast('Failed to create some issues. Please check the console for details.');
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div>
      <Card>
        <CardContent className='p-6'>
          <div className='flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-6'>
            <h2 className='text-xl font-bold'>Bulk Issue Creator</h2>

            <div className='flex flex-wrap gap-2'>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-4 w-4 text-gray-400' />
                </div>
                <Input
                  type='text'
                  placeholder='Search projects...'
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className='min-w-[250px] pl-10 py-1 text-sm'
                />
              </div>

              <ShadSelect value={settings.projectId} onValueChange={(val) => updateSettings({ ...settings, projectId: val })}>
                <SelectTrigger className='min-w-[200px]'>
                  <SelectValue placeholder='Select project' />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: { id: string; name: string; number: number }) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} (#{project.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>

              {selectedProject && (
                <ShadSelect value={selectedRepo} onValueChange={setSelectedRepo}>
                  <SelectTrigger className='min-w-[200px]'>
                    <SelectValue placeholder='Select repository for templates' />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProject.repositories.map((repo: { id: string; name: string }) => (
                      <SelectItem key={repo.id} value={repo.name}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </ShadSelect>
              )}
            </div>
          </div>

          <div className='flex flex-wrap gap-2 mb-4'>
            <Button onClick={() => setIsFormOpen(true)} variant='default' className='flex items-center gap-1'>
              <PlusCircle className='w-4 h-4' /> Add Issue
            </Button>

            <Button onClick={exportToJson} variant='secondary' className='flex items-center gap-1' disabled={issues.length === 0}>
              <Download className='w-4 h-4' /> Export JSON
            </Button>

            <label className='btn btn-secondary flex items-center gap-1 cursor-pointer'>
              <Upload className='w-4 h-4' /> Import
              <input type='file' accept='.json' className='hidden' onChange={importFromJson} />
            </label>

            <Button
              onClick={handleSubmitConfirm}
              variant='default'
              className='flex items-center gap-1 ml-auto'
              disabled={issues.length === 0 || !settings.projectId || !selectedRepo || isSubmitting}
            >
              <Send className='w-4 h-4' /> Submit All Issues
            </Button>
          </div>

          {issues.length > 0 ? (
            <IssueTable issues={issues} onUpdate={updateIssue} onDelete={removeIssue} />
          ) : (
            <div className='text-center py-12 border-2 border-dashed border-border rounded-lg'>
              <p className='text-muted-foreground'>No issues added yet. Add your first issue to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
