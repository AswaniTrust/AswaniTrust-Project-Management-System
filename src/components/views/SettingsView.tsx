import { User, Bell, Shield, Key, LogOut, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { RolePermissionsSettings } from '@/components/settings/RolePermissionsSettings';
import { UserRoleManagement } from '@/components/settings/UserRoleManagement';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';
import { Badge } from '@/components/ui/badge';

export function SettingsView() {
  const { profile, role, hasPermission, signOut, isAdmin } = useAuth();

  const canViewRoleManagement = hasPermission('role_management', 'view') || isAdmin;

  const settingsGroups = [
    {
      title: 'Profile',
      icon: User,
      description: 'Your personal information',
      settings: [
        { label: 'Display Name', value: profile?.name || 'Not set', type: 'text' },
        { label: 'Email', value: profile?.email || 'Not set', type: 'text' },
        { label: 'Designation', value: profile?.designation || 'Not set', type: 'text' },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Configure how you receive updates',
      settings: [
        { label: 'Email notifications', value: true, type: 'toggle' },
        { label: 'Push notifications', value: true, type: 'toggle' },
        { label: 'Task assignments', value: true, type: 'toggle' },
        { label: 'Project updates', value: false, type: 'toggle' },
      ],
    },
    {
      title: 'Security',
      icon: Key,
      description: 'Manage your account security',
      settings: [
        { label: 'Two-factor authentication', value: false, type: 'toggle' },
        { label: 'Session timeout', value: '30 minutes', type: 'text' },
      ],
    },
  ];

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    team_lead: 'Team Lead',
    backend_developer: 'Backend Developer',
    frontend_developer: 'Frontend Developer',
    mobile_developer: 'Mobile Developer',
    testing_team: 'QA Tester',
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Manage your account preferences</p>
            {role && (
              <Badge variant="secondary">
                {roleLabels[role] || role}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          {canViewRoleManagement && (
            <>
              <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
              <TabsTrigger value="users">User Roles</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          {settingsGroups.map(group => {
            const Icon = group.icon;
            
            return (
              <div 
                key={group.title}
                className="bg-card rounded-xl border border-border p-6 animate-fade-in"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{group.title}</h3>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                </div>

                <div className="space-y-4 ml-13">
                  {group.settings.map(setting => (
                    <div 
                      key={setting.label}
                      className="flex items-center justify-between py-2"
                    >
                      <Label className="text-sm text-card-foreground">{setting.label}</Label>
                      {setting.type === 'toggle' ? (
                        <Switch defaultChecked={setting.value as boolean} />
                      ) : (
                        <span className="text-sm text-muted-foreground">{setting.value as string}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Change Password Section */}
          <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
            <ChangePasswordForm />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        {canViewRoleManagement && (
          <>
            <TabsContent value="permissions" className="mt-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <RolePermissionsSettings />
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <UserRoleManagement />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
