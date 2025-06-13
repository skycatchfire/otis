import React, { useState, useEffect } from 'react';
import { PlusCircle, Download, Upload, Send, ChevronsUpDown, Check } from 'lucide-react';
import { useQuery } from 'react-query';
import { toast } from 'sonner';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchProjects, createBatchRepoIssuesAndAddToProject, createBatchRepoIssues, fetchProjectFields, fetchIssueTemplates, fetchOrganizationRepositories } from '../services/githubService';
import IssueTable from './IssueTable';
import IssueForm from './IssueForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { GitHubProjectField, ParsedTemplate } from '../types';
import { parseIssueTemplates } from '../lib/utils';

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
  template?: string;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  issueCount: number;
  projectName: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onConfirm, onCancel, issueCount, projectName }) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Bulk Issue Creation</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <p>
          You&apos;re about to create <strong className="font-semibold">{issueCount}</strong> issues in <strong className="font-semibold">{projectName}</strong>. Are you sure you want to proceed?
        </p>

        <div className="flex justify-end gap-3">
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="default">
            Create Issues
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const IssueCreator: React.FC = () => {
  const { settings, updateSettings, draftIssues, setDraftIssues } = useSettingsStore();
  const [selectedRepo, setSelectedRepo] = useState<string>(settings.selectedRepo || '');
  const [issues, setIssues] = useState<IssueRow[]>(draftIssues || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);

  const { data: projects = [] } = useQuery(['projects', settings.organization, settings.token], () => fetchProjects(settings), {
    enabled: !!settings.organization && !!settings.token,
    keepPreviousData: true,
  });

  const { data: orgRepositories = [] } = useQuery(['orgRepositories', settings.organization, settings.token], () => fetchOrganizationRepositories(settings), {
    enabled: !!settings.organization && !!settings.token,
    keepPreviousData: true,
  });

  const { data: fields = [] } = useQuery<GitHubProjectField[]>(['projectFields', settings.projectId], () => fetchProjectFields(settings, settings.projectId), {
    enabled: !!settings.projectId && !!settings.token && !!settings.organization,
  });

  const { data: templates = [] } = useQuery(['issueTemplates', settings.organization, selectedRepo], () => (selectedRepo ? fetchIssueTemplates(settings, selectedRepo) : Promise.resolve([])), {
    enabled: !!selectedRepo,
  });

  const parsedTemplates: ParsedTemplate[] = React.useMemo(() => parseIssueTemplates(templates as ParsedTemplate[]), [templates]);

  const selectedProject = projects.find((p: { id: string }) => p.id === settings.projectId);

  // Keep settings.selectedRepo in sync with local selectedRepo
  useEffect(() => {
    if (settings.selectedRepo !== selectedRepo) {
      updateSettings({ selectedRepo });
    }
  }, [selectedRepo]);

  // Keep issues in sync with draftIssues in the store
  useEffect(() => {
    setIssues(draftIssues || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setDraftIssues(issues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues]);

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
    setIssues((prev) => {
      const idx = prev.findIndex((issue) => issue.id === id);
      if (idx === -1) {
        // Add new issue
        return [...prev, { ...updates, id } as IssueRow];
      }
      // Update existing issue
      return prev.map((issue) => (issue.id === id ? { ...issue, ...updates, template: updates.template ?? issue.template } : issue));
    });
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

      if (settings.projectId) {
        // Create issues and add to project
        await createBatchRepoIssuesAndAddToProject(settings, selectedRepo, formattedIssues, (completed, total) => {
          toast(`Created ${completed} of ${total} issues`);
        });
      } else {
        // Create issues directly in repository
        await createBatchRepoIssues(settings, selectedRepo, formattedIssues, (completed, total) => {
          toast(`Created ${completed} of ${total} issues`);
        });
      }

      setIssues([]);
      setDraftIssues([]); // Clear drafts after submit
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
      <Card className="border-none shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-6">
            <h2 className="sr-only">Bulk Issue Creator</h2>

            <div className="flex gap-2 min-w-[18.75rem]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={false} className="w-[250px] justify-between">
                    {settings.projectId
                      ? projects.find((p: { id: string }) => p.id === settings.projectId)?.name +
                        (projects.find((p: { id: string }) => p.id === settings.projectId) ? ` (#${projects.find((p: { id: string }) => p.id === settings.projectId)?.number})` : '')
                      : 'Select project (optional)'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder="Search project..." />
                    <CommandList>
                      <CommandEmpty>No project found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            updateSettings({ ...settings, projectId: '' });
                            setSelectedRepo('');
                          }}
                        >
                          No project (create issues directly)
                          <Check className={'ml-auto h-4 w-4' + (!settings.projectId ? ' opacity-100' : ' opacity-0')} />
                        </CommandItem>
                        {projects.map((project: { id: string; name: string; number: number }) => (
                          <CommandItem
                            key={project.id}
                            value={project.name}
                            onSelect={() => {
                              updateSettings({ ...settings, projectId: project.id });
                            }}
                          >
                            {project.name} (#{project.number})
                            <Check className={'ml-auto h-4 w-4' + (settings.projectId === project.id ? ' opacity-100' : ' opacity-0')} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={false} className="min-w-[200px] justify-between">
                    {selectedRepo || 'Select repository'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="min-w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search repository..." />
                    <CommandList>
                      <CommandEmpty>No repository found.</CommandEmpty>
                      <CommandGroup>
                        {selectedProject
                          ? selectedProject.repositories.map((repo: { id: string; name: string }) => (
                              <CommandItem
                                key={repo.id}
                                value={repo.name}
                                onSelect={() => {
                                  setSelectedRepo(repo.name);
                                }}
                              >
                                {repo.name}
                                <Check className={'ml-auto h-4 w-4' + (selectedRepo === repo.name ? ' opacity-100' : ' opacity-0')} />
                              </CommandItem>
                            ))
                          : orgRepositories.map((repo: { id: string; name: string }) => (
                              <CommandItem
                                key={repo.id}
                                value={repo.name}
                                onSelect={() => {
                                  setSelectedRepo(repo.name);
                                }}
                              >
                                {repo.name}
                                <Check className={'ml-auto h-4 w-4' + (selectedRepo === repo.name ? ' opacity-100' : ' opacity-0')} />
                              </CommandItem>
                            ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={() => setIsFormOpen(true)} variant="default" className="flex items-center gap-1">
              <PlusCircle className="w-4 h-4" /> Add Issue
            </Button>

            <Button onClick={exportToJson} variant="secondary" className="flex items-center gap-1" disabled={issues.length === 0}>
              <Download className="w-4 h-4" /> Export
            </Button>

            <label className="btn btn-secondary flex items-center gap-1 cursor-pointer">
              <Upload className="w-4 h-4" /> Import
              <input type="file" accept=".json" className="hidden" onChange={importFromJson} />
            </label>

            <Button onClick={handleSubmitConfirm} variant="default" className="flex items-center gap-1 ml-auto" disabled={issues.length === 0 || !selectedRepo || isSubmitting}>
              <Send className="w-4 h-4" /> Submit All Issues
            </Button>
          </div>

          <IssueTable
            issues={issues}
            onUpdate={updateIssue}
            onDelete={removeIssue}
            fields={fields}
            templates={parsedTemplates}
            editingIssueId={editingIssueId}
            setEditingIssueId={setEditingIssueId}
            onCloseEdit={() => setEditingIssueId(null)}
          />
        </CardContent>
      </Card>

      {isFormOpen && <IssueForm onSubmit={addNewIssue} onCancel={() => setIsFormOpen(false)} />}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onConfirm={handleSubmitIssues}
        onCancel={() => setIsConfirmOpen(false)}
        issueCount={issues.length}
        projectName={selectedProject ? `${selectedProject.name} (#${selectedProject.number})` : selectedRepo}
      />
    </div>
  );
};

export default IssueCreator;
