import React, { ReactNode } from 'react';
import { Github } from 'lucide-react';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  return (
    <header className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10'>
      <div className='container mx-auto px-4 py-3 flex items-center'>
        <div className='flex items-center gap-2'>
          <Github className='h-6 w-6 text-indigo-600 dark:text-indigo-400' />
          <h1 className='text-xl font-bold'>Otis</h1>
        </div>
        <div className='ml-auto flex items-center gap-2'>{children}</div>
      </div>
    </header>
  );
};

export default Header;
