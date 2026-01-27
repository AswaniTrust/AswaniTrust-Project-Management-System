import { useState, useRef } from 'react';
import { Comment, User, Document, userRoleConfig } from '@/types';
import { MessageSquare, Send, Edit2, Trash2, X, Check, Paperclip, File, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface CommentSectionProps {
  comments: Comment[];
  currentUser: User;
  onAddComment: (content: string, attachments?: File[]) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function CommentSection({ 
  comments, 
  currentUser, 
  onAddComment, 
  onEditComment, 
  onDeleteComment 
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (newComment.trim() || attachments.length > 0) {
      onAddComment(newComment.trim(), attachments.length > 0 ? attachments : undefined);
      setNewComment('');
      setAttachments([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = (commentId: string) => {
    if (editContent.trim()) {
      onEditComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    }
  };

  const currentUserRoleConfig = userRoleConfig[currentUser.role];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <MessageSquare className="w-4 h-4" />
        <h3 className="font-semibold text-card-foreground">Comments</h3>
        <Badge variant="secondary" className="ml-auto">
          {comments.length}
        </Badge>
      </div>

      {/* Comment Input */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback 
              className="text-xs"
              style={{ backgroundColor: `hsl(var(--${currentUserRoleConfig.color}))`, color: 'white' }}
            >
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment... (QA can attach screenshots or documents for bug reports)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="resize-none"
            />
            
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-xs"
                    >
                      <FileIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="max-w-[100px] truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1 text-muted-foreground"
                >
                  <Paperclip className="w-4 h-4" />
                  Attach Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
              </div>
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={!newComment.trim() && attachments.length === 0}
                className="gap-2"
              >
                <Send className="w-3 h-3" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const authorRoleConfig = userRoleConfig[comment.author.role];
            const isOwner = comment.author.id === currentUser.id;
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback 
                      className="text-xs"
                      style={{ backgroundColor: `hsl(var(--${authorRoleConfig.color}))`, color: 'white' }}
                    >
                      {comment.author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-card-foreground">
                        {comment.author.name}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0"
                        style={{ 
                          backgroundColor: `hsl(var(--${authorRoleConfig.color}) / 0.1)`,
                          color: `hsl(var(--${authorRoleConfig.color}))`
                        }}
                      >
                        {authorRoleConfig.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(comment.createdAt, 'MMM d, yyyy h:mm a')}
                      </span>
                      {comment.updatedAt && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={cancelEdit}
                            className="gap-1"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => saveEdit(comment.id)}
                            disabled={!editContent.trim()}
                            className="gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-card-foreground mt-1 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        {/* Comment Attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {comment.attachments.map((doc) => {
                              const FileIcon = getFileIcon(doc.type);
                              return (
                                <a
                                  key={doc.id}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg text-sm transition-colors"
                                >
                                  <FileIcon className="w-4 h-4 text-primary" />
                                  <span className="max-w-[150px] truncate">{doc.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.size)}
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {isOwner && !isEditing && (
                    <div className="flex gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => startEdit(comment)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No comments yet. Start the conversation!
          </div>
        )}
      </div>
    </div>
  );
}
