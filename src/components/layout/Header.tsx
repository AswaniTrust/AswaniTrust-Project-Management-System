import { Bell, Search, Plus, Settings, LogOut, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNavigate?: (menu: string) => void;
  onAddNew?: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  team_lead: 'Team Lead',
  backend_developer: 'Backend Developer',
  frontend_developer: 'Frontend Developer',
  mobile_developer: 'Mobile Developer',
  testing_team: 'QA Tester',
};

export function Header({ title, subtitle, onNavigate, onAddNew }: HeaderProps) {
  const { profile, role, signOut } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-14 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground text-sm md:text-base truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 w-64 h-9 bg-secondary border-0"
          />
        </div>
        
        {onAddNew && (
          <Button size="sm" className="gap-2 hidden sm:flex" onClick={onAddNew}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
        )}
        {onAddNew && (
          <Button size="icon" className="sm:hidden" onClick={onAddNew}>
            <Plus className="w-4 h-4" />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {profile?.name ? getInitials(profile.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.email}
                </p>
                {role && (
                  <Badge variant="secondary" className="w-fit mt-1 text-xs">
                    {roleLabels[role] || role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate?.('settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate?.('settings')}>
              <Lock className="mr-2 h-4 w-4" />
              <span>Change Password</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate?.('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
