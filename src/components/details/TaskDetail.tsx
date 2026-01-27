import { useState } from 'react';
import { Task, User, Document, TestCaseDocument, BugReport, taskStatusConfig, userRoleConfig } from '@/types';
import { ArrowLeft, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal';
import { TestCaseDocuments } from '@/components/documents/TestCaseDocuments';
import { CommentSection } from '@/components/comments/CommentSection';
import { BugList } from '@/components/bugs/BugList';
import { BugDetail } from '@/components/bugs/BugDetail';
import { BugForm } from '@/components/bugs/BugForm';
import { toast } from 'sonner';
import { useFileUpload } from '@/hooks/useFileUpload';

import { Comment } from '@/types';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface TaskDetailProps {
  task: Task;
  projectName: string;
  currentUser: User;
  projectMembers: User[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateTask: (task: Task) => void;
  onAddBugReport?: (taskId: string, data: Partial<BugReport>, currentUser: User, attachments?: UploadedFile[]) => Promise<BugReport | null>;
  onUpdateBugReport?: (bugId: string, data: Partial<BugReport>) => Promise<BugReport | null>;
  onAddBugAttachment?: (bugId: string, file: UploadedFile) => Promise<Document | null>;
  onDeleteBugAttachment?: (attachmentId: string, fileUrl: string) => Promise<boolean>;
  onAddBugComment?: (bugId: string, content: string, currentUser: User) => Promise<Comment | null>;
  onUpdateBugComment?: (commentId: string, content: string) => Promise<boolean>;
  onDeleteBugComment?: (commentId: string) => Promise<boolean>;
}

const priorityStyles = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

export function TaskDetail({ task, projectName, currentUser, projectMembers, onBack, onEdit, onDelete, onUpdateTask, onAddBugReport, onUpdateBugReport, onAddBugAttachment, onDeleteBugAttachment, onAddBugComment, onUpdateBugComment, onDeleteBugComment }: TaskDetailProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTestCaseUploadModal, setShowTestCaseUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'document' | 'testcase'>('document');
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [showBugForm, setShowBugForm] = useState(false);
  const [editingBug, setEditingBug] = useState<BugReport | undefined>();
  const statusConfig = taskStatusConfig[task.status];
  
  // File upload hook for bug attachments
  const { uploadFiles, uploading } = useFileUpload({ folder: `bugs/${task.id}` });

  interface UploadedFile {
    name: string;
    url: string;
    size: number;
    type: string;
  }

  const handleUploadDocuments = (files: UploadedFile[]) => {
    const newDocs: Document[] = files.map((file, index) => ({
      id: `d${Date.now()}-${index}`,
      name: file.name,
      url: file.url,
      type: file.type,
      size: file.size,
      uploadedBy: currentUser,
      uploadedAt: new Date(),
    }));
    
    onUpdateTask({
      ...task,
      documents: [...task.documents, ...newDocs],
      updatedAt: new Date(),
    });
    toast.success(`${files.length} document(s) uploaded`);
  };

  const handleDeleteDocument = (doc: Document) => {
    onUpdateTask({
      ...task,
      documents: task.documents.filter(d => d.id !== doc.id),
      updatedAt: new Date(),
    });
    toast.success('Document deleted');
  };

  const handleAddComment = (content: string, attachments?: File[]) => {
    const commentAttachments: Document[] | undefined = attachments?.map((file, index) => ({
      id: `ca${Date.now()}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      uploadedBy: currentUser,
      uploadedAt: new Date(),
    }));

    const newComment = {
      id: `c${Date.now()}`,
      content,
      author: currentUser,
      createdAt: new Date(),
      attachments: commentAttachments,
    };
    
    onUpdateTask({
      ...task,
      comments: [...task.comments, newComment],
      updatedAt: new Date(),
    });
  };

  const handleEditComment = (commentId: string, content: string) => {
    onUpdateTask({
      ...task,
      comments: task.comments.map(c => 
        c.id === commentId ? { ...c, content, updatedAt: new Date() } : c
      ),
      updatedAt: new Date(),
    });
    toast.success('Comment updated');
  };

  const handleDeleteComment = (commentId: string) => {
    onUpdateTask({
      ...task,
      comments: task.comments.filter(c => c.id !== commentId),
      updatedAt: new Date(),
    });
    toast.success('Comment deleted');
  };

  // Test Case Document handlers
  const handleUploadTestCase = (files: UploadedFile[]) => {
    const newTestCases: TestCaseDocument[] = files.map((file, index) => ({
      id: `tc${Date.now()}-${index}`,
      document: {
        id: `tcd${Date.now()}-${index}`,
        name: file.name,
        url: file.url,
        type: file.type,
        size: file.size,
        uploadedBy: currentUser,
        uploadedAt: new Date(),
      },
      status: 'pending' as const,
      submittedBy: currentUser,
      submittedAt: new Date(),
    }));
    
    onUpdateTask({
      ...task,
      testCaseDocuments: [...task.testCaseDocuments, ...newTestCases],
      updatedAt: new Date(),
    });
    toast.success(`${files.length} test case document(s) submitted for approval`);
  };

  const handleApproveTestCase = (testCaseId: string, notes?: string) => {
    onUpdateTask({
      ...task,
      testCaseDocuments: task.testCaseDocuments.map(tc =>
        tc.id === testCaseId
          ? { ...tc, status: 'approved' as const, reviewedBy: currentUser, reviewedAt: new Date(), reviewNotes: notes }
          : tc
      ),
      updatedAt: new Date(),
    });
    toast.success('Test case approved');
  };

  const handleRejectTestCase = (testCaseId: string, notes: string) => {
    onUpdateTask({
      ...task,
      testCaseDocuments: task.testCaseDocuments.map(tc =>
        tc.id === testCaseId
          ? { ...tc, status: 'rejected' as const, reviewedBy: currentUser, reviewedAt: new Date(), reviewNotes: notes }
          : tc
      ),
      updatedAt: new Date(),
    });
    toast.success('Test case rejected');
  };

  // Bug Report handlers
  const generateBugId = () => {
    const bugCount = task.bugReports.length + 1;
    return `BUG-${bugCount.toString().padStart(3, '0')}`;
  };

  const handleSaveBug = async (bugData: Partial<BugReport>, files?: File[]) => {
    // Upload files to storage first if provided
    let uploadedFiles: UploadedFile[] = [];
    if (files && files.length > 0) {
      uploadedFiles = await uploadFiles(files);
    }

    if (bugData.id) {
      // Update existing bug
      if (onUpdateBugReport) {
        await onUpdateBugReport(bugData.id, bugData);
        
        // Add new attachments if any
        if (uploadedFiles.length > 0 && onAddBugAttachment) {
          for (const file of uploadedFiles) {
            await onAddBugAttachment(bugData.id, file);
          }
        }
      } else {
        // Fallback to local update
        const fileDocuments: Document[] = uploadedFiles.map((file, index) => ({
          id: `bf${Date.now()}-${index}`,
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
          uploadedBy: currentUser,
          uploadedAt: new Date(),
        }));
        
        const existingBug = task.bugReports.find(b => b.id === bugData.id);
        const updatedAttachments = existingBug 
          ? [...existingBug.attachments, ...fileDocuments]
          : fileDocuments;
        
        onUpdateTask({
          ...task,
          bugReports: task.bugReports.map(b =>
            b.id === bugData.id 
              ? { ...b, ...bugData, attachments: updatedAttachments, updatedAt: new Date() } 
              : b
          ),
          updatedAt: new Date(),
        });
        toast.success('Bug report updated');
      }
    } else {
      // Create new bug with attachments
      if (onAddBugReport) {
        await onAddBugReport(task.id, bugData, currentUser, uploadedFiles);
      } else {
        // Fallback to local creation (won't persist)
        const fileDocuments: Document[] = uploadedFiles.map((file, index) => ({
          id: `bf${Date.now()}-${index}`,
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
          uploadedBy: currentUser,
          uploadedAt: new Date(),
        }));
        
        const newBug: BugReport = {
          id: `bug${Date.now()}`,
          bugId: generateBugId(),
          title: bugData.title || '',
          description: bugData.description || '',
          stepsToReproduce: bugData.stepsToReproduce,
          expectedBehavior: bugData.expectedBehavior,
          actualBehavior: bugData.actualBehavior,
          status: 'open',
          severity: bugData.severity || 'medium',
          taskId: task.id,
          reportedBy: currentUser,
          assignedTo: bugData.assignedTo,
          attachments: fileDocuments,
          comments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        onUpdateTask({
          ...task,
          bugReports: [...task.bugReports, newBug],
          updatedAt: new Date(),
        });
        toast.success('Bug reported successfully');
      }
    }
    setEditingBug(undefined);
  };

  const handleUpdateBug = async (updatedBug: BugReport) => {
    // Use database function if available
    if (onUpdateBugReport) {
      await onUpdateBugReport(updatedBug.id, updatedBug);
      setSelectedBug(updatedBug);
    } else {
      // Fallback to local update
      onUpdateTask({
        ...task,
        bugReports: task.bugReports.map(b =>
          b.id === updatedBug.id ? updatedBug : b
        ),
        updatedAt: new Date(),
      });
      setSelectedBug(updatedBug);
    }
  };

  // If viewing a bug detail, show the bug detail view
  if (selectedBug) {
    return (
      <>
        <BugDetail
          bug={selectedBug}
          taskTitle={task.title}
          currentUser={currentUser}
          availableAssignees={projectMembers}
          onBack={() => setSelectedBug(null)}
          onEdit={() => { setEditingBug(selectedBug); setShowBugForm(true); }}
          onUpdateBug={handleUpdateBug}
          onAddBugAttachment={onAddBugAttachment}
          onDeleteBugAttachment={onDeleteBugAttachment}
          onAddBugComment={onAddBugComment}
          onUpdateBugComment={onUpdateBugComment}
          onDeleteBugComment={onDeleteBugComment}
        />
        <BugForm
          isOpen={showBugForm}
          onClose={() => { setShowBugForm(false); setEditingBug(undefined); }}
          onSave={handleSaveBug}
          bug={editingBug}
          taskId={task.id}
          availableAssignees={projectMembers}
          currentUser={currentUser}
        />
      </>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">{projectName}</p>
            <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} className="gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={onDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status & Priority */}
      <div className="flex items-center gap-4">
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
        <Badge variant="secondary" className={cn("text-sm px-3 py-1 capitalize", priorityStyles[task.priority])}>
          {task.priority} Priority
        </Badge>
      </div>

      {/* Description */}
      {task.description && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-card-foreground mb-2">Description</h3>
          <p className="text-muted-foreground">{task.description}</p>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-card-foreground mb-3">Dates</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm text-card-foreground">{format(task.createdAt, 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm text-card-foreground">{format(task.updatedAt, 'MMM d, yyyy')}</p>
              </div>
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm text-card-foreground">{format(task.dueDate, 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-card-foreground mb-3">Assignees</h3>
          {task.assignees.length > 0 ? (
            <div className="space-y-2">
              {task.assignees.map(member => {
                const roleConfig = userRoleConfig[member.role];
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback 
                        className="text-xs"
                        style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{roleConfig.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No assignees</p>
          )}
        </div>
      </div>

      {/* Documents */}
      <DocumentList
        documents={task.documents}
        onUpload={() => setShowUploadModal(true)}
        onDelete={handleDeleteDocument}
        title="Task Documents"
      />

      {/* Bug Reports */}
      <BugList
        bugs={task.bugReports}
        onSelectBug={setSelectedBug}
        onAddBug={() => { setEditingBug(undefined); setShowBugForm(true); }}
      />

      {/* Test Case Documents - for QA and Management */}
      <TestCaseDocuments
        testCases={task.testCaseDocuments}
        currentUser={currentUser}
        onUpload={() => setShowTestCaseUploadModal(true)}
        onApprove={handleApproveTestCase}
        onReject={handleRejectTestCase}
      />

      {/* Comments */}
      <CommentSection
        comments={task.comments}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
      />

      {/* Upload Modal for Task Documents */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadDocuments}
        title="Upload Task Documents"
        folder={`tasks/${task.id}`}
      />

      {/* Upload Modal for Test Case Documents */}
      <DocumentUploadModal
        isOpen={showTestCaseUploadModal}
        onClose={() => setShowTestCaseUploadModal(false)}
        onUpload={handleUploadTestCase}
        title="Submit Test Case Documents"
        folder={`tasks/${task.id}/testcases`}
      />

      {/* Bug Form Modal */}
      <BugForm
        isOpen={showBugForm}
        onClose={() => { setShowBugForm(false); setEditingBug(undefined); }}
        onSave={handleSaveBug}
        bug={editingBug}
        taskId={task.id}
        availableAssignees={projectMembers}
        currentUser={currentUser}
      />
    </div>
  );
}
