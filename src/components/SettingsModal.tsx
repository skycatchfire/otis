import React from 'react';
import { useForm } from 'react-hook-form';
import { X, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import toast from 'react-hot-toast';
import { testGitHubConnection } from '../services/githubService';

interface SettingsFormData {
  organization: string;
  token: string;
}

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings } = useSettingsStore();
  
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

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const isValid = await testGitHubConnection({
        organization: data.organization,
        projectNumber: '',
        token: data.token,
      });
      
      if (isValid) {
        updateSettings({
          organization: data.organization,
          token: data.token,
        }, true); // Pass true to indicate valid connection
        toast.success('Settings saved successfully');
        onClose();
      } else {
        updateSettings({
          organization: data.organization,
          token: data.token,
        }, false); // Pass false to indicate invalid connection
        setError('token', { 
          type: 'manual', 
          message: 'Unable to connect to GitHub with these credentials' 
        });
      }
    } catch (error) {
      updateSettings({
        organization: data.organization,
        token: data.token,
      }, false); // Pass false on error
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium">GitHub Settings</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="organization" className="label">
                GitHub Organization
              </label>
              <input
                id="organization"
                placeholder="e.g., my-organization"
                className="input"
                {...register('organization', { required: 'Organization is required' })}
              />
              {errors.organization && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.organization.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter the organization name as it appears in the GitHub URL
              </p>
            </div>
            
            <div>
              <label htmlFor="token" className="label">
                GitHub Personal Access Token (PAT)
              </label>
              <input
                id="token"
                type="password"
                placeholder="••••••••••••••••••••••••"
                className="input"
                {...register('token', { required: 'Personal access token is required' })}
              />
              {errors.token && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.token.message}
                </p>
              )}
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p>Create a personal access token with these permissions:</p>
                <ul className="list-disc pl-5">
                  <li>repo</li>
                  <li>admin:org</li>
                  <li>projects</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;