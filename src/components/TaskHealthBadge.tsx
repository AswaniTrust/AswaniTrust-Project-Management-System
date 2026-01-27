import { Task } from '@/types';
import { calculateTaskHealth, TaskHealthInfo } from '@/lib/taskHealth';
import { Bug, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TaskHealthBadgeProps {
  task: Task;
  showDetails?: boolean;
}

export function TaskHealthBadge({ task, showDetails = false }: TaskHealthBadgeProps) {
  const health = calculateTaskHealth(task);
  
  const getIcon = () => {
    switch (health.level) {
      case 'excellent':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'good':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'critical':
        return <XCircle className="w-3.5 h-3.5" />;
    }
  };

  const badge = (
    <Badge
      variant="secondary"
      className="gap-1 cursor-help"
      style={{ 
        backgroundColor: health.bgColor,
        color: health.color,
        borderColor: health.color,
      }}
    >
      {getIcon()}
      {showDetails ? (
        <span>{health.label} ({health.score}%)</span>
      ) : (
        <span>{health.score}%</span>
      )}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2">
          <div className="font-semibold flex items-center gap-2">
            <span style={{ color: health.color }}>{health.label}</span>
            <span className="text-muted-foreground">({health.score}% health)</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="text-muted-foreground">Testing Cycles:</div>
            <div className="font-medium">{health.testingCycles}</div>
            <div className="text-muted-foreground">Total Bugs:</div>
            <div className="font-medium">{health.totalBugs}</div>
            <div className="text-muted-foreground">Open Bugs:</div>
            <div className="font-medium text-destructive">{health.openBugs}</div>
            <div className="text-muted-foreground">Closed Bugs:</div>
            <div className="font-medium text-success">{health.closedBugs}</div>
            {health.criticalBugs > 0 && (
              <>
                <div className="text-muted-foreground">Critical Bugs:</div>
                <div className="font-medium text-destructive">{health.criticalBugs}</div>
              </>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
