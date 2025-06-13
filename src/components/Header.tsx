import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';
import React, { ReactNode } from 'react';
import logo from '@/assets/logo.png';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  return (
    <header className='bg-background border-b border-border sticky top-0 z-10'>
      <NavigationMenu className='w-full container mx-auto [&>div]:w-full'>
        <NavigationMenuList className='w-full flex items-center justify-between px-4 py-3'>
          <NavigationMenuItem className='flex items-center gap-2'>
            <img src={logo} alt='Otis' className='size-8' />
            <h1 className='text-xl font-medium'>Otis</h1>
          </NavigationMenuItem>
          <NavigationMenuItem className='ml-auto flex items-center gap-2'>{children}</NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};

export default Header;
