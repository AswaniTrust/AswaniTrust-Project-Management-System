import { useState, useEffect } from 'react';
import { Task, TaskStatus, User, taskStatusConfig, userRoleConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task;
  projectId: string;
  availableMembers: User[];
}

export function TaskForm({ isOpen, onClose, onSave, task, projectId, availableMembers }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'draft');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task?.assignees.map(a => a.id) || []);
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.toISOString().split('T')[0] : '');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeIds(task.assignees.map(a => a.id));
      setDueDate(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('draft');
      setPriority('medium');
      setAssigneeIds([]);
      setDueDate('');
    }
  }, [task, isOpen]);

  const toggleAssignee = (userId: string) => {
    setAssigneeIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignees = availableMembers.filter(m => assigneeIds.includes(m.id));
    onSave({ 
      id: task?.id, 
      title, 
      description, 
      status, 
      priority, 
      projectId,
      assignees,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={task ? 'Edit Task' : 'Create Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Status *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(taskStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority *</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Assign Team Members</Label>
          <div className="border border-border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
            {availableMembers.map(member => {
              const roleConfig = userRoleConfig[member.role];
              return (
                <label
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={assigneeIds.includes(member.id)}
                    onCheckedChange={() => toggleAssignee(member.id)}
                  />
                  <Avatar className="w-7 h-7">
                    <AvatarFallback 
                      className="text-[10px]"
                      style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                    >
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{roleConfig.label}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
