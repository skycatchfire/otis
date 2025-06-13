import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import IssueCreator from './components/IssueCreator';
import SettingsModal from './components/SettingsModal';
import { useSettingsStore } from './stores/settingsStore';

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

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isConfigured, settings } = useSettingsStore();

  useEffect(() => {
    const theme = settings.theme || 'system';
    setBodyClassForTheme(theme);
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => setBodyClassForTheme('system');
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <Header>
        <Button
          variant='ghost'
          onClick={() => setIsSettingsOpen(true)}
          className='ml-auto flex items-center justify-center rounded-full'
          aria-label='Settings'
          size='icon'
        >
          <SettingsIcon className='w-5 h-5' />
        </Button>
      </Header>

      <main className='container mx-auto px-4 py-8'>
        {isConfigured ? (
          <IssueCreator />
        ) : (
          <div className='flex flex-col items-center justify-center h-[70vh] text-center'>
            <h2 className='text-2xl font-bold mb-4'>Welcome to Otis</h2>
            <p className='text-gray-600 dark:text-gray-400 mb-6 max-w-lg'>
              Connect to your GitHub project to start creating issues in bulk. Click the settings icon to configure your GitHub connection.
            </p>
            <Button onClick={() => setIsSettingsOpen(true)} variant='default'>
              Configure Settings
            </Button>
          </div>
        )}
      </main>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      <Toaster />
    </div>
  );
}

export default App;
