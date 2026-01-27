import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface UseFileUploadOptions {
  bucket?: string;
  folder?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, projectId?: string, taskId?: string): Promise<UploadedFile | null> => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const result = await api.uploads.upload(file, projectId, taskId);
      
      setProgress(100);

      return {
        name: result.name,
        url: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${result.url}`,
        size: result.size,
        type: result.type,
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${file.name}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadFiles = async (files: File[], projectId?: string, taskId?: string): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100));
      const result = await uploadFile(files[i], projectId, taskId);
      if (result) {
        results.push(result);
      }
    }

    setProgress(100);
    return results;
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      await api.uploads.delete(fileId);
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
      return false;
    }
  };

  return {
    uploadFile,
    uploadFiles,
    deleteFile,
    uploading,
    progress,
  };
}
