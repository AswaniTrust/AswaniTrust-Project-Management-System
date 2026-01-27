import { Company, Project, projectTypeConfig, userRoleConfig } from '@/types';
import { Globe, Smartphone, Server, Users, MoreHorizontal, FolderKanban, Plus, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectsViewProps {
  companies: Company[];
  onSelectProject: (project: Project, companyName: string) => void;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

const getProjectIcon = (type: Project['type']) => {
  const icons = { crm: Users, website: Globe, mobile_app: Smartphone, internal_software: Server };
  return icons[type];
};

export function ProjectsView({ companies, onSelectProject, onAddProject, onEditProject, onDeleteProject }: ProjectsViewProps) {
  const allProjects = companies.flatMap(c => 
    c.projects.map(p => ({ ...p, companyName: c.name }))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">All projects across companies</p>
        </div>
        <Button className="gap-2" onClick={onAddProject}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Project</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Company</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Team</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Tasks</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Progress</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allProjects.map(project => {
              const Icon = getProjectIcon(project.type);
              const completed = project.tasks.filter(t => t.status === 'live').length;
              const progress = project.tasks.length > 0 
                ? Math.round((completed / project.tasks.length) * 100) 
                : 0;
              
              return (
                <tr 
                  key={project.id} 
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSelectProject(project, project.companyName)}
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
                  <td className="px-6 py-4 text-sm text-card-foreground">{project.companyName}</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">{projectTypeConfig[project.type].label}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map(member => {
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
                      {project.members.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-card">
                          +{project.members.length - 4}
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
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditProject(project); }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDeleteProject(project); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {allProjects.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No projects yet. Click "New Project" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
