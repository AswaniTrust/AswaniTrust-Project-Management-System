import { useState } from 'react';
import { Company, TimesheetEntry, User, userRoleConfig } from '@/types';
import { Clock, Plus, Calendar, Edit, Trash2, MoreHorizontal, Play, Square, BarChart3 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TimesheetReports } from './TimesheetReports';

interface TimesheetsViewProps {
  entries: TimesheetEntry[];
  companies: Company[];
  currentUser: User;
  onAddEntry: () => void;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (entry: TimesheetEntry) => void;
  onClockIn: () => void;
  onClockOut: (entry: TimesheetEntry) => void;
  activeClockEntry?: TimesheetEntry;
}

type ViewTab = 'entries' | 'reports';

const formatDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export function TimesheetsView({ 
  entries, 
  companies, 
  currentUser,
  onAddEntry, 
  onEditEntry, 
  onDeleteEntry,
  onClockIn,
  onClockOut,
  activeClockEntry 
}: TimesheetsViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewTab, setViewTab] = useState<ViewTab>('entries');
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'General';
    for (const company of companies) {
      const project = company.projects.find(p => p.id === projectId);
      if (project) return project.name;
    }
    return 'Unknown Project';
  };

  const getTaskTitle = (projectId?: string, taskId?: string) => {
    if (!taskId || !projectId) return null;
    for (const company of companies) {
      const project = company.projects.find(p => p.id === projectId);
      if (project) {
        const task = project.tasks.find(t => t.id === taskId);
        if (task) return task.title;
      }
    }
    return null;
  };

  const weeklyTotal = entries
    .filter(e => e.date >= weekStart && e.date <= weekEnd)
    .reduce((sum, e) => sum + e.totalMinutes, 0);

  const dailyTotals = weekDays.map(day => ({
    date: day,
    total: entries
      .filter(e => isSameDay(e.date, day))
      .reduce((sum, e) => sum + e.totalMinutes, 0),
  }));

  const todayEntries = entries.filter(e => isSameDay(e.date, selectedDate));

  // If viewing reports, render the reports component
  if (viewTab === 'reports') {
    return (
      <div className="space-y-6">
        <div className="p-6 pb-0">
          <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)}>
            <TabsList>
              <TabsTrigger value="entries" className="gap-2">
                <Clock className="w-4 h-4" />
                Time Entries
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <TimesheetReports entries={entries} companies={companies} currentUser={currentUser} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Timesheets</h1>
            <p className="text-muted-foreground mt-1">Track your work hours</p>
          </div>
          <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)}>
            <TabsList>
              <TabsTrigger value="entries" className="gap-2">
                <Clock className="w-4 h-4" />
                Time Entries
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-2">
          {activeClockEntry ? (
            <Button 
              variant="destructive" 
              onClick={() => onClockOut(activeClockEntry)}
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              Clock Out
            </Button>
          ) : (
            <Button variant="outline" onClick={onClockIn} className="gap-2">
              <Play className="w-4 h-4" />
              Clock In
            </Button>
          )}
          <Button onClick={onAddEntry} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Active Clock */}
      {activeClockEntry && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <div>
              <p className="font-medium text-success">Currently clocked in</p>
              <p className="text-sm text-muted-foreground">
                Started at {activeClockEntry.startTime} • {getProjectName(activeClockEntry.projectId)}
                {activeClockEntry.taskId && ` • ${getTaskTitle(activeClockEntry.projectId, activeClockEntry.taskId)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Week Overview */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-card-foreground">
            Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Total: {formatDuration(weeklyTotal)}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {dailyTotals.map(({ date, total }) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`p-3 rounded-lg text-center transition-all ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : isToday 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <p className="text-xs font-medium">{format(date, 'EEE')}</p>
                <p className="text-lg font-bold">{format(date, 'd')}</p>
                <p className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {total > 0 ? formatDuration(total) : '—'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Entries */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-card-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <Badge variant="secondary">
            {formatDuration(dailyTotals.find(d => isSameDay(d.date, selectedDate))?.total || 0)}
          </Badge>
        </div>
        
        {todayEntries.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Project / Task</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Description</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Time</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Duration</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {todayEntries.map(entry => {
                const roleConfig = userRoleConfig[entry.user.role];
                const taskTitle = getTaskTitle(entry.projectId, entry.taskId);
                
                return (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback 
                            className="text-xs"
                            style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                          >
                            {entry.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-card-foreground">{entry.user.name}</p>
                          <p className="text-xs text-muted-foreground">{roleConfig.label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-card-foreground">{getProjectName(entry.projectId)}</p>
                        {taskTitle && (
                          <p className="text-xs text-muted-foreground">{taskTitle}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-card-foreground line-clamp-2">{entry.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      {entry.entryType === 'clock' ? (
                        <div className="text-sm">
                          <span className="text-card-foreground">{entry.startTime}</span>
                          <span className="text-muted-foreground"> — </span>
                          <span className="text-card-foreground">{entry.endTime || 'ongoing'}</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-muted">
                          Duration
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="font-mono">
                        {formatDuration(entry.totalMinutes)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditEntry(entry)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => onDeleteEntry(entry)}
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
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No time entries for this day. Click "Add Entry" to log your hours.
          </div>
        )}
      </div>
    </div>
  );
}
