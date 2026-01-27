import { useState } from 'react';
import { Company, Project, Task, taskStatusConfig, User } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TestTube2, Clock, AlertTriangle, ChevronRight, CheckCircle, Play, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReadyForTestingWidgetProps {
  companies: Company[];
  currentUser?: User;
  onSelectTask: (task: Task, project: Project, companyName: string) => void;
  onTakeForTesting?: (task: Task, currentUser: User) => Promise<void>;
}

// Statuses that indicate development is complete and ready for testing
const READY_FOR_TESTING_STATUSES = ['review_pending', 'ui_completed'];

export function ReadyForTestingWidget({ 
  companies, 
  currentUser,
  onSelectTask, 
  onTakeForTesting 
}: ReadyForTestingWidgetProps) {
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);

  // Collect all tasks ready for testing with their project and company context
  const tasksReadyForTesting: {
    task: Task;
    project: Project;
    companyName: string;
  }[] = [];

  companies.forEach(company => {
    company.projects.forEach(project => {
      project.tasks.forEach(task => {
        if (READY_FOR_TESTING_STATUSES.includes(task.status)) {
          tasksReadyForTesting.push({
            task,
            project,
            companyName: company.name,
          });
        }
      });
    });
  });

  // Sort by priority (urgent first) then by updated date
  tasksReadyForTesting.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.task.priority] - priorityOrder[b.task.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.task.updatedAt).getTime() - new Date(a.task.updatedAt).getTime();
  });

  const handleTakeForTesting = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation(); // Prevent card click
    if (!currentUser || !onTakeForTesting) return;
    
    setClaimingTaskId(task.id);
    try {
      await onTakeForTesting(task, currentUser);
    } finally {
      setClaimingTaskId(null);
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
      default:
        return null;
    }
  };

  const getPriorityBadgeVariant = (priority: Task['priority']): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TestTube2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-card-foreground">Ready for Testing</h3>
          {tasksReadyForTesting.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {tasksReadyForTesting.length}
            </Badge>
          )}
        </div>
      </div>

      {tasksReadyForTesting.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No tasks pending testing</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tasks ready for QA review will appear here
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[280px] pr-2">
          <div className="space-y-2">
            {tasksReadyForTesting.map(({ task, project, companyName }) => {
              const isClaiming = claimingTaskId === task.id;
              
              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all"
                  onClick={() => onSelectTask(task, project, companyName)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityIcon(task.priority)}
                      <span className="text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className="text-xs px-1.5 py-0"
                        style={{ 
                          borderColor: `hsl(var(--${taskStatusConfig[task.status]?.color}))`,
                          color: `hsl(var(--${taskStatusConfig[task.status]?.color}))`
                        }}
                      >
                        {taskStatusConfig[task.status]?.label || task.status}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs px-1.5 py-0">
                        {task.priority}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="truncate max-w-[120px]">{project.name}</span>
                      <span>•</span>
                      <span className="truncate max-w-[100px]">{companyName}</span>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60">
                      <Clock className="w-3 h-3" />
                      Updated {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {currentUser && onTakeForTesting && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleTakeForTesting(e, task)}
                        disabled={isClaiming}
                      >
                        {isClaiming ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span className="text-xs">Take for Testing</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task, project, companyName);
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
