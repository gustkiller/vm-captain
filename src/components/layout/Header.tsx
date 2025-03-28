
import React from 'react';
import { UserNav } from '@/components/user/UserNav';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/user/ThemeToggle';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold flex-grow">{title}</h1>
        <ThemeToggle />
        <UserNav />
      </div>
    </div>
  );
};

export default Header;
