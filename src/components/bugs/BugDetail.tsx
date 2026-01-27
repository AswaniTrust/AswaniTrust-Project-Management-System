import { useState } from 'react';
import { BugReport, User, Document, bugStatusConfig, bugSeverityConfig, userRoleConfig, BugStatus } from '@/types';
import { ArrowLeft, Edit, Calendar, Clock, AlertTriangle, CheckCircle2, XCircle, RotateCcw, Play } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal';
import { CommentSection } from '@/components/comments/CommentSection';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Comment } from '@/types';
import { useFileUpload } from '@/hooks/useFileUpload';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface BugDetailProps {
  bug: BugReport;
  taskTitle: string;
  currentUser: User;
  availableAssignees: User[];
  onBack: () => void;
  onEdit: () => void;
  onUpdateBug: (bug: BugReport) => void;
  onAddBugAttachment?: (bugId: string, file: UploadedFile) => Promise<Document | null>;
  onDeleteBugAttachment?: (attachmentId: string, fileUrl: string) => Promise<boolean>;
  onAddBugComment?: (bugId: string, content: string, currentUser: User) => Promise<Comment | null>;
  onUpdateBugComment?: (commentId: string, content: string) => Promise<boolean>;
  onDeleteBugComment?: (commentId: string) => Promise<boolean>;
}

const severityStyles = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

const statusActions: Record<BugStatus, { next: BugStatus[] }> = {
  open: { next: ['in_progress'] },
  in_progress: { next: ['resolved'] },
  resolved: { next: ['closed', 'reopened'] },
  closed: { next: ['reopened'] },
  reopened: { next: ['in_progress'] },
};

const statusIcons: Partial<Record<BugStatus, React.ReactNode>> = {
  in_progress: <Play className="w-4 h-4" />,
  resolved: <CheckCircle2 className="w-4 h-4" />,
  closed: <XCircle className="w-4 h-4" />,
  reopened: <RotateCcw className="w-4 h-4" />,
};

export function BugDetail({ 
  bug, 
  taskTitle, 
  currentUser, 
  availableAssignees,
  onBack, 
  onEdit, 
  onUpdateBug,
  onAddBugAttachment,
  onDeleteBugAttachment,
  onAddBugComment,
  onUpdateBugComment,
  onDeleteBugComment,
}: BugDetailProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const statusConfig = bugStatusConfig[bug.status];
  const severityConfig = bugSeverityConfig[bug.severity];
  
  // File upload hook for attachments
  const { uploadFiles } = useFileUpload({ folder: `bugs/${bug.id}` });

  const handleStatusChange = (newStatus: BugStatus) => {
    const updates: Partial<BugReport> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'resolved') {
      updates.resolvedAt = new Date();
      updates.resolvedBy = currentUser;
    }

    onUpdateBug({ ...bug, ...updates });
    toast.success(`Bug status updated to ${bugStatusConfig[newStatus].label}`);
  };

  const handleAssigneeChange = (userId: string) => {
    const assignee = userId === '_unassigned' ? undefined : availableAssignees.find(u => u.id === userId);
    onUpdateBug({
      ...bug,
      assignedTo: assignee,
      updatedAt: new Date(),
    });
    toast.success(assignee ? `Assigned to ${assignee.name}` : 'Unassigned bug');
  };

  interface UploadedFile {
    name: string;
    url: string;
    size: number;
    type: string;
  }

  const handleUploadDocuments = async (files: UploadedFile[]) => {
    if (onAddBugAttachment) {
      // Use database function to save attachments
      for (const file of files) {
        await onAddBugAttachment(bug.id, file);
      }
      toast.success(`${files.length} attachment(s) uploaded`);
    } else {
      // Fallback to local update
      const newDocs: Document[] = files.map((file, index) => ({
        id: `bd${Date.now()}-${index}`,
        name: file.name,
        url: file.url,
        type: file.type,
        size: file.size,
        uploadedBy: currentUser,
        uploadedAt: new Date(),
      }));
      
      onUpdateBug({
        ...bug,
        attachments: [...bug.attachments, ...newDocs],
        updatedAt: new Date(),
      });
      toast.success(`${files.length} attachment(s) uploaded`);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (onDeleteBugAttachment) {
      await onDeleteBugAttachment(doc.id, doc.url);
    } else {
      onUpdateBug({
        ...bug,
        attachments: bug.attachments.filter(d => d.id !== doc.id),
        updatedAt: new Date(),
      });
      toast.success('Attachment deleted');
    }
  };

  const handleAddComment = async (content: string, attachments?: File[]) => {
    // Use database function if available
    if (onAddBugComment) {
      const newComment = await onAddBugComment(bug.id, content, currentUser);
      if (newComment) {
        // Local state is updated by the hook
      }
    } else {
      // Fallback to local update
      const commentAttachments: Document[] | undefined = attachments?.map((file, index) => ({
        id: `bca${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        uploadedBy: currentUser,
        uploadedAt: new Date(),
      }));

      const newComment = {
        id: `bc${Date.now()}`,
        content,
        author: currentUser,
        createdAt: new Date(),
        attachments: commentAttachments,
      };
      
      onUpdateBug({
        ...bug,
        comments: [...bug.comments, newComment],
        updatedAt: new Date(),
      });
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    if (onUpdateBugComment) {
      await onUpdateBugComment(commentId, content);
    } else {
      onUpdateBug({
        ...bug,
        comments: bug.comments.map(c => 
          c.id === commentId ? { ...c, content, updatedAt: new Date() } : c
        ),
        updatedAt: new Date(),
      });
      toast.success('Comment updated');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (onDeleteBugComment) {
      await onDeleteBugComment(commentId);
    } else {
      onUpdateBug({
        ...bug,
        comments: bug.comments.filter(c => c.id !== commentId),
        updatedAt: new Date(),
      });
      toast.success('Comment deleted');
    }
  };

  const availableNextStatuses = statusActions[bug.status].next;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Task: {taskTitle}</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-semibold text-destructive">{bug.bugId}</span>
              <h1 className="text-2xl font-bold text-foreground">{bug.title}</h1>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={onEdit} className="gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </div>

      {/* Status & Severity with Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <Badge 
          variant="secondary"
          className="text-sm px-3 py-1"
          style={{ 
            backgroundColor: `hsl(var(--${statusConfig.color}) / 0.1)`,
            color: `hsl(var(--${statusConfig.color}))`
          }}
        >
          {statusConfig.label}
        </Badge>
        <Badge 
          variant="secondary" 
          className={cn("text-sm px-3 py-1 capitalize", severityStyles[bug.severity])}
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          {severityConfig.label}
        </Badge>

        {/* Status Actions */}
        {availableNextStatuses.length > 0 && (
          <div className="flex gap-2 ml-auto">
            {availableNextStatuses.map(nextStatus => (
              <Button 
                key={nextStatus}
                size="sm" 
                variant={nextStatus === 'resolved' || nextStatus === 'closed' ? 'default' : 'outline'}
                onClick={() => handleStatusChange(nextStatus)}
                className="gap-2"
              >
                {statusIcons[nextStatus]}
                {bugStatusConfig[nextStatus].label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-card-foreground mb-2">Description</h3>
        <p className="text-muted-foreground whitespace-pre-wrap">{bug.description}</p>
      </div>

      {/* Steps, Expected, Actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bug.stepsToReproduce && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-card-foreground mb-2">Steps to Reproduce</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{bug.stepsToReproduce}</p>
          </div>
        )}
        {bug.expectedBehavior && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-card-foreground mb-2">Expected Behavior</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{bug.expectedBehavior}</p>
          </div>
        )}
        {bug.actualBehavior && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-card-foreground mb-2">Actual Behavior</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{bug.actualBehavior}</p>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-card-foreground mb-3">Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Reported</p>
                <p className="text-sm text-card-foreground">{format(bug.createdAt, 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm text-card-foreground">{format(bug.updatedAt, 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
            {bug.resolvedAt && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                  <p className="text-sm text-card-foreground">{format(bug.resolvedAt, 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-card-foreground mb-3">People</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reported By</p>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {bug.reportedBy.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{bug.reportedBy.name}</p>
                  <p className="text-xs text-muted-foreground">{userRoleConfig[bug.reportedBy.role].label}</p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
              <Select 
                value={bug.assignedTo?.id || '_unassigned'} 
                onValueChange={handleAssigneeChange}
              >
                <SelectTrigger className="w-full">
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

            {bug.resolvedBy && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Resolved By</p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {bug.resolvedBy.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{bug.resolvedBy.name}</p>
                    <p className="text-xs text-muted-foreground">{userRoleConfig[bug.resolvedBy.role].label}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attachments */}
      <DocumentList
        documents={bug.attachments}
        onUpload={() => setShowUploadModal(true)}
        onDelete={handleDeleteDocument}
        title="Bug Attachments"
      />

      {/* Comments */}
      <CommentSection
        comments={bug.comments}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
      />

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadDocuments}
        title="Upload Bug Attachments"
        folder={`bugs/${bug.id}`}
      />
    </div>
  );
}
