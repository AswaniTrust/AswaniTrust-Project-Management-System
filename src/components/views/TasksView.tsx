import { Company, Task, taskStatusConfig, userRoleConfig } from '@/types';
import { Calendar, ListTodo, Filter, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskHealthBadge } from '@/components/TaskHealthBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TasksViewProps {
  companies: Company[];
  onSelectTask: (task: Task, projectName: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

const priorityStyles = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

export function TasksView({ companies, onSelectTask, onEditTask, onDeleteTask }: TasksViewProps) {
  const allTasks = companies.flatMap(c => 
    c.projects.flatMap(p => 
      p.tasks.map(t => ({ ...t, projectName: p.name, companyName: c.name }))
    )
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">All tasks across all projects</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Task</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Project</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Health</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Priority</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Assignees</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Due Date</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allTasks.map(task => {
              const statusConfig = taskStatusConfig[task.status];
              
              return (
                <tr 
                  key={task.id} 
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSelectTask(task, task.projectName)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-card-foreground">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-card-foreground">{task.projectName}</p>
                      <p className="text-xs text-muted-foreground">{task.companyName}</p>
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
                    <TaskHealthBadge task={task} />
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
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
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
        {allTasks.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No tasks yet.
          </div>
        )}
      </div>
    </div>
  );
}
