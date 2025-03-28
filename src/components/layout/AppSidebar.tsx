
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Monitor, 
  Database, 
  Users, 
  Settings, 
  Bell, 
  LogOut, 
  Search,
  Shield
} from 'lucide-react';

import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userService } from '@/services/userService';

const AppSidebar: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = userService.getCurrentUser();
  const isAdmin = userService.isAdmin();

  const handleLogout = () => {
    userService.logout();
    navigate('/login');
  };

  const mainNavItems = [
    { title: "Dashboard", icon: Monitor, path: "/" },
    { title: "Virtual Machines", icon: Database, path: "/virtual-machines" },
  ];

  // Add admin-only navigation items
  if (isAdmin) {
    mainNavItems.push(
      { title: "Users", icon: Users, path: "/users" },
      { title: "Settings", icon: Settings, path: "/settings" }
    );
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 text-white p-1 rounded">
            <Database size={20} />
          </div>
          <h1 className="text-xl font-bold">VM Captain</h1>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-background pl-8"
            />
          </div>
        </div>
        
        {currentUser && (
          <div className="px-4 py-2 mb-2">
            <div className="flex items-center p-2 rounded-md bg-secondary/50">
              {isAdmin ? (
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
              ) : (
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {currentUser.username} ({isAdmin ? 'Admin' : 'User'})
              </span>
            </div>
          </div>
        )}
        
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.path}
                      className={({ isActive }) => 
                        isActive ? "text-sidebar-primary-foreground bg-sidebar-primary" : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
