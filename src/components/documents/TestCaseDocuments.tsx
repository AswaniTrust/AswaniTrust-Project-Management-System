import { TestCaseDocument, User, userRoleConfig } from '@/types';
import { FileText, Upload, Check, X, Clock, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface TestCaseDocumentsProps {
  testCases: TestCaseDocument[];
  currentUser: User;
  onUpload: () => void;
  onApprove: (testCaseId: string, notes?: string) => void;
  onReject: (testCaseId: string, notes: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending Approval', color: 'warning', icon: Clock },
  approved: { label: 'Approved', color: 'success', icon: Check },
  rejected: { label: 'Rejected', color: 'destructive', icon: X },
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function TestCaseDocuments({ 
  testCases, 
  currentUser, 
  onUpload, 
  onApprove, 
  onReject 
}: TestCaseDocumentsProps) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const isManagerOrLead = currentUser.role === 'manager' || currentUser.role === 'team_lead';
  const isQA = currentUser.role === 'testing_team';

  const handleApprove = (testCaseId: string) => {
    onApprove(testCaseId, reviewNotes || undefined);
    setReviewingId(null);
    setReviewNotes('');
  };

  const handleReject = (testCaseId: string) => {
    if (!reviewNotes.trim()) {
      return; // Require notes for rejection
    }
    onReject(testCaseId, reviewNotes);
    setReviewingId(null);
    setReviewNotes('');
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-card-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Test Case Documents
          <Badge variant="secondary" className="ml-2">
            {testCases.length}
          </Badge>
        </h3>
        {isQA && (
          <Button size="sm" variant="outline" onClick={onUpload} className="gap-2">
            <Upload className="w-4 h-4" />
            Submit Test Case
          </Button>
        )}
      </div>

      {testCases.length > 0 ? (
        <div className="divide-y divide-border">
          {testCases.map((testCase) => {
            const status = statusConfig[testCase.status];
            const StatusIcon = status.icon;
            const submitterRole = userRoleConfig[testCase.submittedBy.role];
            const isReviewing = reviewingId === testCase.id;

            return (
              <div key={testCase.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-card-foreground">{testCase.document.name}</p>
                        <Badge 
                          variant="secondary"
                          className="text-xs"
                          style={{ 
                            backgroundColor: `hsl(var(--${status.color}) / 0.1)`,
                            color: `hsl(var(--${status.color}))`
                          }}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(testCase.document.size)}</span>
                        <span>•</span>
                        <Avatar className="w-4 h-4">
                          <AvatarFallback 
                            className="text-[8px]"
                            style={{ backgroundColor: `hsl(var(--${submitterRole.color}))`, color: 'white' }}
                          >
                            {testCase.submittedBy.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>Submitted by {testCase.submittedBy.name}</span>
                        <span>•</span>
                        <span>{format(testCase.submittedAt, 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      
                      {testCase.reviewedBy && (
                        <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Reviewed by {testCase.reviewedBy.name}</span>
                            <span>•</span>
                            <span>{format(testCase.reviewedAt!, 'MMM d, yyyy')}</span>
                          </div>
                          {testCase.reviewNotes && (
                            <p className="text-sm text-card-foreground mt-1">{testCase.reviewNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => window.open(testCase.document.url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {isManagerOrLead && testCase.status === 'pending' && !isReviewing && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setReviewingId(testCase.id)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isReviewing && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-3">
                    <Textarea
                      placeholder="Add review notes (required for rejection)..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleReject(testCase.id)}
                        disabled={!reviewNotes.trim()}
                        className="gap-1"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleApprove(testCase.id)}
                        className="gap-1 bg-success hover:bg-success/90"
                      >
                        <Check className="w-3 h-3" />
                        Approve
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          {isQA 
            ? 'No test case documents submitted yet. Click "Submit Test Case" to upload.' 
            : 'No test case documents submitted for review.'}
        </div>
      )}
    </div>
  );
}