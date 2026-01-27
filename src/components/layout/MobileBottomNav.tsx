import { LayoutDashboard, Building2, FolderKanban, ListTodo, Users, Settings, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface MobileBottomNavProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, permissionKey: 'dashboard' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, permissionKey: 'projects' },
  { id: 'tasks', label: 'Tasks', icon: ListTodo, permissionKey: 'tasks' },
  { id: 'timesheets', label: 'Time', icon: Clock, permissionKey: 'timesheets' },
  { id: 'settings', label: 'More', icon: Settings, permissionKey: 'settings' },
];

export function MobileBottomNav({ activeMenu, onMenuChange }: MobileBottomNavProps) {
  const { hasPermission, isAdmin } = useAuth();

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (isAdmin) return true;
    return hasPermission(item.permissionKey, 'view');
  }).slice(0, 5); // Max 5 items for bottom nav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-2 px-3 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
