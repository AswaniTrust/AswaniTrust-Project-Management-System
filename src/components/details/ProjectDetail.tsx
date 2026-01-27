import { useState } from 'react';
import { Project, Task, User, Document, taskStatusConfig, userRoleConfig, projectTypeConfig } from '@/types';
import { ArrowLeft, Edit, Trash2, Plus, Calendar, Globe, Smartphone, Server, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal';
import { toast } from 'sonner';

interface ProjectDetailProps {
  project: Project;
  companyName: string;
  currentUser: User;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelectTask: (task: Task) => void;
  onAddTask: () => void;
  onManageTeam: () => void;
  onUpdateProject: (project: Project) => void;
}

const priorityStyles = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

const getProjectIcon = (type: Project['type']) => {
  const icons = { crm: Users, website: Globe, mobile_app: Smartphone, internal_software: Server };
  return icons[type];
};

export function ProjectDetail({ 
  project, 
  companyName, 
  currentUser,
  onBack, 
  onEdit, 
  onDelete, 
  onSelectTask, 
  onAddTask, 
  onManageTeam,
  onUpdateProject 
}: ProjectDetailProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const Icon = getProjectIcon(project.type);
  const completedTasks = project.tasks.filter(t => t.status === 'live').length;

  interface UploadedFile {
    name: string;
    url: string;
    size: number;
    type: string;
  }

  const handleUploadDocuments = (files: UploadedFile[]) => {
    const newDocs: Document[] = files.map((file, index) => ({
      id: `d${Date.now()}-${index}`,
      name: file.name,
      url: file.url,
      type: file.type,
      size: file.size,
      uploadedBy: currentUser,
      uploadedAt: new Date(),
    }));
    
    onUpdateProject({
      ...project,
      documents: [...project.documents, ...newDocs],
    });
    toast.success(`${files.length} document(s) uploaded`);
  };

  const handleDeleteDocument = (doc: Document) => {
    onUpdateProject({
      ...project,
      documents: project.documents.filter(d => d.id !== doc.id),
    });
    toast.success('Document deleted');
  };

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
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              <p className="text-muted-foreground">
                {companyName} • {projectTypeConfig[project.type].label}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onManageTeam} className="gap-2">
            <Users className="w-4 h-4" />
            Manage Team
          </Button>
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

      {project.description && (
        <p className="text-muted-foreground bg-card rounded-lg p-4 border border-border">
          {project.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Tasks</p>
          <p className="text-2xl font-bold text-card-foreground">{project.tasks.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-success">{completedTasks}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-info">
            {project.tasks.filter(t => ['in_progress', 'development_in_progress'].includes(t.status)).length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Testing</p>
          <p className="text-2xl font-bold text-warning">
            {project.tasks.filter(t => t.status === 'testing_in_progress').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Team Size</p>
          <p className="text-2xl font-bold text-card-foreground">{project.members.length}</p>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-card-foreground mb-3">Team Members</h3>
        <div className="flex flex-wrap gap-2">
          {project.members.map(member => {
            const roleConfig = userRoleConfig[member.role];
            return (
              <div key={member.id} className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1">
                <Avatar className="w-6 h-6">
                  <AvatarFallback 
                    className="text-[10px]"
                    style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documents */}
      <DocumentList
        documents={project.documents}
        onUpload={() => setShowUploadModal(true)}
        onDelete={handleDeleteDocument}
        title="Project Documents"
      />

      {/* Tasks Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-card-foreground">Tasks</h3>
          <Button size="sm" onClick={onAddTask} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Task</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Priority</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Assignees</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {project.tasks.map(task => {
              const statusConfig = taskStatusConfig[task.status];
              return (
                <tr 
                  key={task.id} 
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSelectTask(task)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-card-foreground">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `hsl(var(--${statusConfig.color}) / 0.1)`,
                        color: `hsl(var(--${statusConfig.color}))`
                      }}
                    >
                      {statusConfig.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className={cn("capitalize", priorityStyles[task.priority])}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {task.assignees.slice(0, 3).map(member => {
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
                      {task.assignees.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-card">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {task.dueDate ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(task.dueDate, 'MMM d, yyyy')}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {project.tasks.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No tasks yet. Click "Add Task" to create one.
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadDocuments}
        title="Upload Project Documents"
        folder={`projects/${project.id}`}
      />
    </div>
  );
}
