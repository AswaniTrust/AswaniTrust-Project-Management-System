import { LayoutDashboard, Building2, FolderKanban, ListTodo, Users, Settings, Clock, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'dashboard' },
  { id: 'companies', label: 'Companies', icon: Building2, permissionKey: 'companies' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, permissionKey: 'projects' },
  { id: 'tasks', label: 'Tasks', icon: ListTodo, permissionKey: 'tasks' },
  { id: 'timesheets', label: 'Timesheets', icon: Clock, permissionKey: 'timesheets' },
  { id: 'team', label: 'Team Members', icon: Users, permissionKey: 'team' },
  { id: 'settings', label: 'Settings', icon: Settings, permissionKey: 'settings' },
];

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  team_lead: 'Team Lead',
  backend_developer: 'Backend Dev',
  frontend_developer: 'Frontend Dev',
  mobile_developer: 'Mobile Dev',
  testing_team: 'QA Tester',
};

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const { profile, role, hasPermission, signOut, isAdmin } = useAuth();

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (isAdmin) return true;
    return hasPermission(item.permissionKey, 'view');
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="hidden md:flex w-64 h-screen bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">ProjectHub</h1>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <div className="space-y-1">
          {visibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            const canEdit = isAdmin || hasPermission(item.permissionKey, 'edit');
            
            return (
              <button
                key={item.id}
                onClick={() => onMenuChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {!canEdit && !isActive && (
                  <span className="text-[10px] text-sidebar-foreground/40">view</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
              {profile?.name ? getInitials(profile.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.name || 'Loading...'}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {role ? roleLabels[role] || role : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
