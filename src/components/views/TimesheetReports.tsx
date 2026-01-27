import { useState, useMemo } from 'react';
import { Company, TimesheetEntry, User, userRoleConfig } from '@/types';
import { 
  BarChart3, Download, Calendar, ChevronLeft, ChevronRight,
  Clock, Users, FolderKanban, TrendingUp
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths,
  isWithinInterval
} from 'date-fns';
import { toast } from 'sonner';

interface TimesheetReportsProps {
  entries: TimesheetEntry[];
  companies: Company[];
  currentUser: User;
}

type ViewMode = 'weekly' | 'monthly';

const formatDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const formatHoursDecimal = (totalMinutes: number) => {
  return (totalMinutes / 60).toFixed(2);
};

export function TimesheetReports({ entries, companies, currentUser }: TimesheetReportsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateRange = useMemo(() => {
    if (viewMode === 'weekly') {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate),
      };
    }
  }, [viewMode, selectedDate]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => 
      isWithinInterval(entry.date, { start: dateRange.start, end: dateRange.end })
    );
  }, [entries, dateRange]);

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

  // Summary Statistics
  const stats = useMemo(() => {
    const totalMinutes = filteredEntries.reduce((sum, e) => sum + e.totalMinutes, 0);
    const totalDays = new Set(filteredEntries.map(e => format(e.date, 'yyyy-MM-dd'))).size;
    const uniqueProjects = new Set(filteredEntries.map(e => e.projectId || 'general')).size;
    const avgPerDay = totalDays > 0 ? totalMinutes / totalDays : 0;

    return {
      totalMinutes,
      totalDays,
      uniqueProjects,
      avgPerDay,
    };
  }, [filteredEntries]);

  // Daily breakdown for chart
  const dailyBreakdown = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map(day => ({
      date: day,
      total: filteredEntries
        .filter(e => isSameDay(e.date, day))
        .reduce((sum, e) => sum + e.totalMinutes, 0),
    }));
  }, [filteredEntries, dateRange]);

  // Project breakdown
  const projectBreakdown = useMemo(() => {
    const projectMap = new Map<string, { name: string; minutes: number; entries: number }>();
    
    filteredEntries.forEach(entry => {
      const projectId = entry.projectId || 'general';
      const projectName = getProjectName(entry.projectId);
      
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, { name: projectName, minutes: 0, entries: 0 });
      }
      
      const project = projectMap.get(projectId)!;
      project.minutes += entry.totalMinutes;
      project.entries += 1;
    });

    return Array.from(projectMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [filteredEntries]);

  // User breakdown (for admins/managers)
  const userBreakdown = useMemo(() => {
    const userMap = new Map<string, { user: User; minutes: number; entries: number }>();
    
    filteredEntries.forEach(entry => {
      if (!userMap.has(entry.user.id)) {
        userMap.set(entry.user.id, { user: entry.user, minutes: 0, entries: 0 });
      }
      
      const userData = userMap.get(entry.user.id)!;
      userData.minutes += entry.totalMinutes;
      userData.entries += 1;
    });

    return Array.from(userMap.values()).sort((a, b) => b.minutes - a.minutes);
  }, [filteredEntries]);

  const handlePrevious = () => {
    if (viewMode === 'weekly') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'weekly') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Employee', 'Project', 'Task', 'Description', 'Entry Type', 'Start Time', 'End Time', 'Duration (Hours)'];
    
    const rows = filteredEntries.map(entry => [
      format(entry.date, 'yyyy-MM-dd'),
      entry.user.name,
      getProjectName(entry.projectId),
      getTaskTitle(entry.projectId, entry.taskId) || '',
      entry.description.replace(/"/g, '""'),
      entry.entryType,
      entry.startTime || '',
      entry.endTime || '',
      formatHoursDecimal(entry.totalMinutes),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet-report-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully');
  };

  const maxDailyMinutes = Math.max(...dailyBreakdown.map(d => d.total), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Timesheet Reports
          </h1>
          <p className="text-muted-foreground mt-1">View and export your time tracking data</p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* View Mode & Navigation */}
      <div className="flex items-center justify-between bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-[200px] text-center">
            <p className="font-semibold text-foreground">
              {viewMode === 'weekly' 
                ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
                : format(selectedDate, 'MMMM yyyy')
              }
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold text-foreground">{formatDuration(stats.totalMinutes)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days Logged</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projects</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg/Day</p>
              <p className="text-2xl font-bold text-foreground">{formatDuration(Math.round(stats.avgPerDay))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-card-foreground mb-4">Daily Hours</h3>
        <div className="flex items-end gap-1 h-40">
          {dailyBreakdown.map(({ date, total }) => {
            const heightPercent = maxDailyMinutes > 0 ? (total / maxDailyMinutes) * 100 : 0;
            const isToday = isSameDay(date, new Date());
            
            return (
              <div
                key={date.toISOString()}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div 
                  className="w-full relative group"
                  style={{ height: '120px' }}
                >
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all ${
                      isToday ? 'bg-primary' : 'bg-primary/60'
                    } hover:bg-primary`}
                    style={{ height: `${Math.max(heightPercent, total > 0 ? 4 : 0)}%` }}
                  />
                  {total > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                      {formatDuration(total)}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {viewMode === 'weekly' ? format(date, 'EEE') : format(date, 'd')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Project Breakdown */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-card-foreground flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              Time by Project
            </h3>
          </div>
          {projectBreakdown.length > 0 ? (
            <div className="divide-y divide-border">
              {projectBreakdown.map(project => {
                const percentage = stats.totalMinutes > 0 
                  ? Math.round((project.minutes / stats.totalMinutes) * 100) 
                  : 0;
                  
                return (
                  <div key={project.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-card-foreground">{project.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{formatDuration(project.minutes)}</Badge>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {project.entries} {project.entries === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No time entries in this period
            </div>
          )}
        </div>

        {/* User Breakdown */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-card-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Time by Team Member
            </h3>
          </div>
          {userBreakdown.length > 0 ? (
            <div className="divide-y divide-border">
              {userBreakdown.map(({ user, minutes, entries }) => {
                const roleConfig = userRoleConfig[user.role];
                const percentage = stats.totalMinutes > 0 
                  ? Math.round((minutes / stats.totalMinutes) * 100) 
                  : 0;
                  
                return (
                  <div key={user.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback 
                            className="text-xs"
                            style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                          >
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-card-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{roleConfig.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{formatDuration(minutes)}</Badge>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entries} {entries === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No time entries in this period
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-card-foreground">Detailed Entries</h3>
          <Badge variant="secondary">{filteredEntries.length} entries</Badge>
        </div>
        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Employee</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Project</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Task</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Description</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .slice(0, 50)
                  .map(entry => {
                    const roleConfig = userRoleConfig[entry.user.role];
                    const taskTitle = getTaskTitle(entry.projectId, entry.taskId);
                    
                    return (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3">
                          <span className="text-sm text-card-foreground">
                            {format(entry.date, 'MMM d, yyyy')}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback 
                                className="text-[10px]"
                                style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                              >
                                {entry.user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{entry.user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm text-card-foreground">
                            {getProjectName(entry.projectId)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm text-muted-foreground">
                            {taskTitle || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm text-card-foreground line-clamp-1 max-w-[200px]">
                            {entry.description}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="secondary" className="font-mono">
                            {formatDuration(entry.totalMinutes)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No time entries in this period
          </div>
        )}
        {filteredEntries.length > 50 && (
          <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
            Showing first 50 entries. Export CSV to see all {filteredEntries.length} entries.
          </div>
        )}
      </div>
    </div>
  );
}
