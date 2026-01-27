import { useState, useEffect } from 'react';
import { TimesheetEntry, Company, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimesheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<TimesheetEntry>) => void;
  entry?: TimesheetEntry;
  companies: Company[];
  currentUser: User;
  mode?: 'add' | 'clockin';
}

export function TimesheetForm({ 
  isOpen, 
  onClose, 
  onSave, 
  entry, 
  companies, 
  currentUser,
  mode = 'add'
}: TimesheetFormProps) {
  const [date, setDate] = useState<Date>(entry?.date || new Date());
  const [projectId, setProjectId] = useState(entry?.projectId || '_none');
  const [taskId, setTaskId] = useState(entry?.taskId || '_none');
  const [description, setDescription] = useState(entry?.description || '');
  const [entryType, setEntryType] = useState<'duration' | 'clock'>(entry?.entryType || (mode === 'clockin' ? 'clock' : 'duration'));
  const [hours, setHours] = useState(entry?.hours?.toString() || '');
  const [minutes, setMinutes] = useState(entry?.minutes?.toString() || '');
  const [startTime, setStartTime] = useState(entry?.startTime || format(new Date(), 'HH:mm'));
  const [endTime, setEndTime] = useState(entry?.endTime || '');

  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setProjectId(entry.projectId || '_none');
      setTaskId(entry.taskId || '_none');
      setDescription(entry.description);
      setEntryType(entry.entryType);
      setHours(entry.hours?.toString() || '');
      setMinutes(entry.minutes?.toString() || '');
      setStartTime(entry.startTime || '');
      setEndTime(entry.endTime || '');
    } else {
      setDate(new Date());
      setProjectId('_none');
      setTaskId('_none');
      setDescription('');
      setEntryType(mode === 'clockin' ? 'clock' : 'duration');
      setHours('');
      setMinutes('');
      setStartTime(format(new Date(), 'HH:mm'));
      setEndTime('');
    }
  }, [entry, isOpen, mode]);

  const selectedProject = projectId !== '_none' 
    ? companies.flatMap(c => c.projects).find(p => p.id === projectId)
    : undefined;

  const availableTasks = selectedProject?.tasks || [];

  const calculateTotalMinutes = () => {
    if (entryType === 'duration') {
      return (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    } else {
      if (!startTime || !endTime) return 0;
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      return (endH * 60 + endM) - (startH * 60 + startM);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalMinutes = calculateTotalMinutes();
    const actualProjectId = projectId === '_none' ? undefined : projectId;
    const actualTaskId = taskId === '_none' ? undefined : taskId;
    
    onSave({
      id: entry?.id,
      userId: currentUser.id,
      user: currentUser,
      date,
      projectId: actualProjectId,
      taskId: actualTaskId,
      description,
      entryType,
      hours: entryType === 'duration' ? parseInt(hours) || 0 : undefined,
      minutes: entryType === 'duration' ? parseInt(minutes) || 0 : undefined,
      startTime: entryType === 'clock' ? startTime : undefined,
      endTime: entryType === 'clock' ? endTime : undefined,
      totalMinutes,
    });
    onClose();
  };

  const isClockInMode = mode === 'clockin';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isClockInMode ? 'Clock In' : entry ? 'Edit Time Entry' : 'Add Time Entry'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isClockInMode && (
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); setTaskId('_none'); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">General (No project)</SelectItem>
                {companies.flatMap(company => 
                  company.projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({company.name})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Task</Label>
            <Select 
              value={taskId} 
              onValueChange={setTaskId}
              disabled={projectId === '_none' || availableTasks.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={projectId !== '_none' ? "Select task (optional)" : "Select project first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No specific task</SelectItem>
                {availableTasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            rows={2}
            required
          />
        </div>

        {!isClockInMode && (
          <Tabs value={entryType} onValueChange={(v) => setEntryType(v as 'duration' | 'clock')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="duration">Duration</TabsTrigger>
              <TabsTrigger value="clock">Start/End Time</TabsTrigger>
            </TabsList>
            <TabsContent value="duration" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minutes">Minutes</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="clock" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required={entryType === 'clock'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required={entryType === 'clock'}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {isClockInMode ? 'Start Timer' : entry ? 'Save Changes' : 'Add Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
