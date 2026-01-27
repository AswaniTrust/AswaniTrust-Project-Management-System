import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Users, Code, TestTube, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'manager' | 'team_lead' | 'backend_developer' | 'frontend_developer' | 'mobile_developer' | 'testing_team';

interface UserWithRole {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  designation: string | null;
  role: AppRole;
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'destructive' },
  manager: { label: 'Manager', icon: Users, color: 'default' },
  team_lead: { label: 'Team Lead', icon: Users, color: 'secondary' },
  backend_developer: { label: 'Backend Dev', icon: Code, color: 'outline' },
  frontend_developer: { label: 'Frontend Dev', icon: Code, color: 'outline' },
  mobile_developer: { label: 'Mobile Dev', icon: Code, color: 'outline' },
  testing_team: { label: 'QA Tester', icon: TestTube, color: 'outline' },
};

export function UserRoleManagement() {
  const { isAdmin, hasPermission, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const canEdit = hasPermission('role_management', 'edit');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.team.getMembers();
      
      const usersWithRoles: UserWithRole[] = (data || []).map((profile: any) => ({
        id: profile.id,
        user_id: profile.user_id || profile.id,
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        designation: profile.designation,
        role: profile.user_role || profile.role || 'backend_developer',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (!canEdit) return;

    try {
      await api.team.updateRole(userId, newRole);
      
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
      toast({
        title: 'Role updated',
        description: 'User role has been changed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !hasPermission('role_management', 'view')) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        You don't have permission to view user roles.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">User Roles</h3>
          <p className="text-sm text-muted-foreground">
            Assign roles to team members
          </p>
        </div>
        {!canEdit && (
          <Badge variant="secondary">View Only</Badge>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Current Role</TableHead>
              {canEdit && <TableHead className="w-[200px]">Change Role</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => {
              const config = roleConfig[user.role];
              const isCurrentUser = user.id === currentUser?.id;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {user.designation || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.color as any}>
                      {config.label}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value as AppRole)
                        }
                        disabled={isCurrentUser && user.role === 'admin'}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleConfig).map(([role, config]) => (
                            <SelectItem key={role} value={role}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {users.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No users found. Users will appear here after they sign up.
        </p>
      )}
    </div>
  );
}
