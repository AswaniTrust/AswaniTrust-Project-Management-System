import { BugReport, bugStatusConfig, bugSeverityConfig, userRoleConfig } from '@/types';
import { Bug, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BugListProps {
  bugs: BugReport[];
  onSelectBug: (bug: BugReport) => void;
  onAddBug: () => void;
}

const severityStyles = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

export function BugList({ bugs, onSelectBug, onAddBug }: BugListProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-destructive" />
          <h3 className="font-semibold text-card-foreground">Bug Reports</h3>
          <Badge variant="secondary" className="ml-2">{bugs.length}</Badge>
        </div>
        <Button onClick={onAddBug} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Report Bug
        </Button>
      </div>

      {bugs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No bugs reported for this task</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bug ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bugs.map(bug => {
              const statusConfig = bugStatusConfig[bug.status];
              const severityConfig = bugSeverityConfig[bug.severity];
              return (
                <TableRow 
                  key={bug.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectBug(bug)}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {bug.bugId}
                  </TableCell>
                  <TableCell className="font-medium">{bug.title}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={cn("capitalize", severityStyles[bug.severity])}
                    >
                      {severityConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `hsl(var(--${statusConfig.color}) / 0.1)`,
                        color: `hsl(var(--${statusConfig.color}))`
                      }}
                    >
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {bug.reportedBy.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{bug.reportedBy.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {bug.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {bug.assignedTo.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{bug.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(bug.createdAt, 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
