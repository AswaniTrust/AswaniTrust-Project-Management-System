import { useState } from 'react';
import { Company, Project, User, projectTypeConfig, userRoleConfig } from '@/types';
import { ArrowLeft, Building2, Edit, Trash2, Plus, Globe, Smartphone, Server, Users, FolderKanban } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CompanyDetailProps {
  company: Company;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelectProject: (project: Project) => void;
  onAddProject: () => void;
}

const getProjectIcon = (type: Project['type']) => {
  const icons = { crm: Users, website: Globe, mobile_app: Smartphone, internal_software: Server };
  return icons[type];
};

export function CompanyDetail({ company, onBack, onEdit, onDelete, onSelectProject, onAddProject }: CompanyDetailProps) {
  const totalTasks = company.projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = company.projects.reduce(
    (acc, p) => acc + p.tasks.filter(t => t.status === 'live').length, 0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
              <p className="text-muted-foreground">
                {company.projects.length} projects • {totalTasks} total tasks
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} className="gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={onDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Projects</p>
          <p className="text-2xl font-bold text-card-foreground">{company.projects.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Tasks</p>
          <p className="text-2xl font-bold text-card-foreground">{totalTasks}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-success">{completedTasks}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Progress</p>
          <p className="text-2xl font-bold text-card-foreground">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-card-foreground">Projects</h3>
          <Button size="sm" onClick={onAddProject} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Project</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Team</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Tasks</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {company.projects.map(project => {
              const Icon = getProjectIcon(project.type);
              const completed = project.tasks.filter(t => t.status === 'live').length;
              const progress = project.tasks.length > 0 ? Math.round((completed / project.tasks.length) * 100) : 0;
              
              return (
                <tr 
                  key={project.id} 
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSelectProject(project)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{project.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">{projectTypeConfig[project.type].label}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map(member => {
                        const roleConfig = userRoleConfig[member.role];
                        return (
                          <Avatar key={member.id} className="w-7 h-7 border-2 border-card">
                            <AvatarFallback 
                              className="text-[10px]"
                              style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                            >
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                      {project.members.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-card">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{project.tasks.length}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {company.projects.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No projects yet. Click "Add Project" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
