import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Code, TestTube, Eye, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'manager' | 'team_lead' | 'backend_developer' | 'frontend_developer' | 'mobile_developer' | 'testing_team';

interface Permission {
  id: string;
  role: AppRole;
  permission_key: string;
  can_view: boolean;
  can_edit: boolean;
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-red-500' },
  manager: { label: 'Manager', icon: Users, color: 'bg-purple-500' },
  team_lead: { label: 'Team Lead', icon: Users, color: 'bg-blue-500' },
  backend_developer: { label: 'Backend Dev', icon: Code, color: 'bg-green-500' },
  frontend_developer: { label: 'Frontend Dev', icon: Code, color: 'bg-yellow-500' },
  mobile_developer: { label: 'Mobile Dev', icon: Code, color: 'bg-orange-500' },
  testing_team: { label: 'QA Tester', icon: TestTube, color: 'bg-cyan-500' },
};

const permissionLabels: Record<string, { label: string; description: string }> = {
  dashboard: { label: 'Dashboard', description: 'View project statistics and overview' },
  companies: { label: 'Companies', description: 'Manage company information' },
  projects: { label: 'Projects', description: 'Access and manage projects' },
  tasks: { label: 'Tasks', description: 'Create and manage tasks' },
  timesheets: { label: 'Timesheets', description: 'Log and view time entries' },
  team: { label: 'Team Members', description: 'View and manage team' },
  settings: { label: 'Settings', description: 'Access application settings' },
  bug_reports: { label: 'Bug Reports', description: 'Report and manage bugs' },
  role_management: { label: 'Role Management', description: 'Manage user roles and permissions' },
};

export function RolePermissionsSettings() {
  const { isAdmin, hasPermission } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRole, setActiveRole] = useState<AppRole>('manager');
  const { toast } = useToast();

  const canEdit = hasPermission('role_management', 'edit');

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const data = await api.team.getPermissions();
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (
    permissionId: string,
    field: 'can_view' | 'can_edit',
    currentValue: boolean
  ) => {
    if (!canEdit) return;

    const perm = permissions.find(p => p.id === permissionId);
    if (!perm) return;

    // Optimistic update
    setPermissions(prev =>
      prev.map(p =>
        p.id === permissionId ? { ...p, [field]: !currentValue } : p
      )
    );

    try {
      await api.team.updatePermission({
        role: perm.role,
        permission_key: perm.permission_key,
        can_view: field === 'can_view' ? !currentValue : perm.can_view,
        can_edit: field === 'can_edit' ? !currentValue : perm.can_edit,
      });
    } catch (error) {
      // Revert on error
      setPermissions(prev =>
        prev.map(p =>
          p.id === permissionId ? { ...p, [field]: currentValue } : p
        )
      );
      toast({
        title: 'Error',
        description: 'Failed to update permission',
        variant: 'destructive',
      });
    }
  };

  const rolePermissions = permissions.filter(p => p.role === activeRole);
  const editableRoles = Object.keys(roleConfig).filter(r => r !== 'admin') as AppRole[];

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
        You don't have permission to view role settings.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Role Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Configure what each role can view and edit
          </p>
        </div>
        {!canEdit && (
          <Badge variant="secondary">View Only</Badge>
        )}
      </div>

      <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as AppRole)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {editableRoles.map(role => {
            const config = roleConfig[role];
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={role}
                value={role}
                className="flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                {config.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {editableRoles.map(role => (
          <TabsContent key={role} value={role} className="mt-6">
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr,auto,auto] gap-4 p-4 bg-muted/50 font-medium text-sm">
                <div>Permission</div>
                <div className="flex items-center gap-1 justify-center min-w-[80px]">
                  <Eye className="w-4 h-4" />
                  View
                </div>
                <div className="flex items-center gap-1 justify-center min-w-[80px]">
                  <Edit className="w-4 h-4" />
                  Edit
                </div>
              </div>

              {Object.entries(permissionLabels).map(([key, config]) => {
                const perm = rolePermissions.find(p => p.permission_key === key);
                if (!perm) return null;

                return (
                  <div
                    key={key}
                    className="grid grid-cols-[1fr,auto,auto] gap-4 p-4 border-t border-border items-center"
                  >
                    <div>
                      <p className="font-medium text-foreground">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                    <div className="flex justify-center min-w-[80px]">
                      <Switch
                        checked={perm.can_view}
                        onCheckedChange={() => handleToggle(perm.id, 'can_view', perm.can_view)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="flex justify-center min-w-[80px]">
                      <Switch
                        checked={perm.can_edit}
                        onCheckedChange={() => handleToggle(perm.id, 'can_edit', perm.can_edit)}
                        disabled={!canEdit || !perm.can_view}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Note: Admin role has full access and cannot be modified. Edit permission requires View permission.
            </p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
