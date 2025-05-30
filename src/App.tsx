import React, { useState } from 'react';
import { SettingsIcon } from 'lucide-react';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import IssueCreator from './components/IssueCreator';
import { useSettingsStore } from './stores/settingsStore';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isConfigured } = useSettingsStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="ml-auto flex items-center justify-center p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </Header>

      <main className="container mx-auto px-4 py-8">
        {isConfigured ? (
          <IssueCreator />
        ) : (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to GitHub Issue Creator</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg">
              Connect to your GitHub project to start creating issues in bulk. Click the settings icon to configure your GitHub connection.
            </p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Configure Settings
            </button>
          </div>
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;