import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { toast } from 'sonner';
import { testGitHubConnection } from '../services/githubService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

interface SettingsFormData {
  organization: string;
  token: string;
}

interface SettingsModalProps {
  onClose: () => void;
}

const themeOptions = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const setBodyClassForTheme = (theme: string) => {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else if (theme === 'light') {
    document.body.classList.remove('dark');
  } else {
    // System: match prefers-color-scheme
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, setTheme } = useSettingsStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SettingsFormData>({
    defaultValues: {
      organization: settings.organization,
      token: settings.token,
    },
  });

  useEffect(() => {
    const theme = settings.theme || 'system';
    setBodyClassForTheme(theme);
    // Listen for system changes if theme is system
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => setBodyClassForTheme('system');
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const isValid = await testGitHubConnection({
        organization: data.organization,
        projectId: '',
        token: data.token,
      });

      if (isValid) {
        updateSettings(
          {
            organization: data.organization,
            token: data.token,
            projectId: '',
          },
          true
        ); // Pass true to indicate valid connection
        toast('Settings saved successfully');
        onClose();
      } else {
        updateSettings(
          {
            organization: data.organization,
            token: data.token,
            projectId: '',
          },
          false
        ); // Pass false to indicate invalid connection
        setError('token', {
          type: 'manual',
          message: 'Unable to connect to GitHub with these credentials',
        });
      }
    } catch {
      updateSettings(
        {
          organization: data.organization,
          token: data.token,
          projectId: '',
        },
        false
      ); // Pass false on error
      toast('Failed to save settings');
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>GitHub Settings</DialogTitle>
          <DialogDescription>Enter your GitHub organization and personal access token to connect Otis to your GitHub account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='theme'>Theme</Label>
              <Select value={settings.theme || 'system'} onValueChange={setTheme}>
                <SelectTrigger id='theme' className='mt-1 w-full'>
                  <SelectValue placeholder='Select theme' />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='mt-1 text-xs text-muted-foreground'>Choose your preferred appearance for Otis.</p>
            </div>
            <div>
              <Label htmlFor='organization'>GitHub Organization</Label>
              <Input id='organization' placeholder='e.g., my-organization' {...register('organization', { required: 'Organization is required' })} />
              {errors.organization && (
                <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                  <AlertCircle className='w-4 h-4' />
                  {errors.organization.message}
                </p>
              )}
              <p className='mt-1 text-xs text-muted-foreground'>Enter the organization name as it appears in the GitHub URL</p>
            </div>
            <div>
              <Label htmlFor='token'>GitHub Personal Access Token (PAT)</Label>
              <Input
                id='token'
                type='password'
                placeholder='••••••••••••••••••••••••'
                {...register('token', { required: 'Personal access token is required' })}
              />
              {errors.token && (
                <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
                  <AlertCircle className='w-4 h-4' />
                  {errors.token.message}
                </p>
              )}
              <div className='mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1'>
                <p>Create a personal access token with these permissions:</p>
                <ul className='list-disc pl-5'>
                  <li>repo</li>
                  <li>admin:org</li>
                  <li>projects</li>
                </ul>
              </div>
            </div>
          </div>
          <div className='flex justify-end gap-2 mt-6'>
            <Button type='button' onClick={onClose} variant='secondary' disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' variant='default' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
