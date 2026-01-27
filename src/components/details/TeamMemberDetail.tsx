import { User, userRoleConfig, Company } from '@/types';
import { ArrowLeft, Edit, Trash2, Mail, Briefcase } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TeamMemberDetailProps {
  member: User;
  companies: Company[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TeamMemberDetail({ member, companies, onBack, onEdit, onDelete }: TeamMemberDetailProps) {
  const roleConfig = userRoleConfig[member.role];
  
  // Find all projects this member is assigned to
  const assignedProjects = companies.flatMap(c => 
    c.projects.filter(p => p.members.some(m => m.id === member.id))
      .map(p => ({ ...p, companyName: c.name }))
  );
  
  // Find all tasks assigned to this member
  const assignedTasks = companies.flatMap(c =>
    c.projects.flatMap(p =>
      p.tasks.filter(t => t.assignees.some(a => a.id === member.id))
        .map(t => ({ ...t, projectName: p.name }))
    )
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback 
                className="text-xl font-medium"
                style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
              >
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{member.name}</h1>
              <Badge 
                variant="secondary"
                className="mt-1"
                style={{ 
                  backgroundColor: `hsl(var(--${roleConfig.color}) / 0.1)`,
                  color: `hsl(var(--${roleConfig.color}))`
                }}
              >
                {roleConfig.label}
              </Badge>
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

      {/* Contact & Details */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-card-foreground mb-3">Details</h3>
        <div className="space-y-3">
          {member.designation && (
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
              <span className="text-card-foreground">{member.designation}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-card-foreground">{member.email}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Assigned Projects</p>
          <p className="text-2xl font-bold text-card-foreground">{assignedProjects.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Active Tasks</p>
          <p className="text-2xl font-bold text-card-foreground">{assignedTasks.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Completed Tasks</p>
          <p className="text-2xl font-bold text-success">
            {assignedTasks.filter(t => t.status === 'live').length}
          </p>
        </div>
      </div>

      {/* Assigned Projects */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-card-foreground">Assigned Projects</h3>
        </div>
        {assignedProjects.length > 0 ? (
          <div className="divide-y divide-border">
            {assignedProjects.map(project => (
              <div key={project.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-card-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.companyName}</p>
                  </div>
                </div>
                <Badge variant="secondary">{project.tasks.length} tasks</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No projects assigned
          </div>
        )}
      </div>
    </div>
  );
}
