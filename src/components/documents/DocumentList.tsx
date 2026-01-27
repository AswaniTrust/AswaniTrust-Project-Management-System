import { Document, userRoleConfig } from '@/types';
import { FileText, Download, Trash2, Upload, File, Image, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface DocumentListProps {
  documents: Document[];
  onUpload: () => void;
  onDelete: (doc: Document) => void;
  title?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentList({ documents, onUpload, onDelete, title = 'Documents' }: DocumentListProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-card-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {title}
        </h3>
        <Button size="sm" variant="outline" onClick={onUpload} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>
      
      {documents.length > 0 ? (
        <div className="divide-y divide-border">
          {documents.map((doc) => {
            const FileIcon = getFileIcon(doc.type);
            const roleConfig = userRoleConfig[doc.uploadedBy.role];
            
            return (
              <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{doc.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <Avatar className="w-4 h-4">
                        <AvatarFallback 
                          className="text-[8px]"
                          style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                        >
                          {doc.uploadedBy.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{doc.uploadedBy.name}</span>
                      <span>•</span>
                      <span>{format(doc.uploadedAt, 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(doc)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No documents uploaded yet.
        </div>
      )}
    </div>
  );
}
