import { useState, useEffect, useRef } from 'react';
import { BugReport, BugSeverity, User, Document, bugSeverityConfig, userRoleConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, FileText, Image } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BugFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bug: Partial<BugReport>, files?: File[]) => void;
  bug?: BugReport;
  taskId: string;
  availableAssignees: User[];
  currentUser: User;
}

export function BugForm({ 
  isOpen, 
  onClose, 
  onSave, 
  bug, 
  taskId, 
  availableAssignees,
  currentUser 
}: BugFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [severity, setSeverity] = useState<BugSeverity>('medium');
  const [assignedToId, setAssignedToId] = useState<string>('_unassigned');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bug) {
      setTitle(bug.title);
      setDescription(bug.description);
      setStepsToReproduce(bug.stepsToReproduce || '');
      setExpectedBehavior(bug.expectedBehavior || '');
      setActualBehavior(bug.actualBehavior || '');
      setSeverity(bug.severity);
      setAssignedToId(bug.assignedTo?.id || '_unassigned');
    } else {
      setTitle('');
      setDescription('');
      setStepsToReproduce('');
      setExpectedBehavior('');
      setActualBehavior('');
      setSeverity('medium');
      setAssignedToId('_unassigned');
    }
    setFiles([]);
  }, [bug, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignedTo = assignedToId === '_unassigned' 
      ? undefined 
      : availableAssignees.find(u => u.id === assignedToId);

    onSave({
      id: bug?.id,
      title,
      description,
      stepsToReproduce: stepsToReproduce || undefined,
      expectedBehavior: expectedBehavior || undefined,
      actualBehavior: actualBehavior || undefined,
      severity,
      assignedTo,
      taskId,
      reportedBy: bug?.reportedBy || currentUser,
    }, files.length > 0 ? files : undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bug ? 'Edit Bug Report' : 'Report New Bug'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Bug Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the bug"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as BugSeverity)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(bugSeverityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_unassigned">Unassigned</SelectItem>
                  {availableAssignees.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({userRoleConfig[user.role].label})
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
              placeholder="Detailed description of the bug"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
            <Textarea
              id="stepsToReproduce"
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedBehavior">Expected Behavior</Label>
              <Textarea
                id="expectedBehavior"
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                placeholder="What should happen"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualBehavior">Actual Behavior</Label>
              <Textarea
                id="actualBehavior"
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                placeholder="What actually happens"
                rows={2}
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>Attachments (Screenshots, Logs, etc.)</Label>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload files or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF, TXT up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.log"
              />
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2 mt-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    {getFileIcon(file)}
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {bug ? 'Update Bug' : 'Submit Bug Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
