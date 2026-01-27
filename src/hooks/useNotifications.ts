import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'task_comment' | 'bug_comment' | 'bug_assigned' | 'task_assigned' | 'ready_for_review';
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  taskTitle?: string;
  bugTitle?: string;
  projectName?: string;
  createdAt: Date;
  isRead: boolean;
  taskId?: string;
  bugId?: string;
  projectId?: string;
}

export function useNotifications(limit: number = 10) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch recent tasks to build notifications
      const tasks = await api.tasks.getAll({});
      
      const allNotifications: Notification[] = [];

      // Process tasks with comments
      tasks?.forEach((task: any) => {
        task.comments?.forEach((comment: any) => {
          if (comment.author_id !== profile.id) {
            allNotifications.push({
              id: `tc-${comment.id}`,
              type: 'task_comment',
              title: 'New comment on task',
              content: comment.content?.substring(0, 100) + (comment.content?.length > 100 ? '...' : ''),
              authorName: comment.author_name || 'Unknown',
              taskTitle: task.title,
              projectName: task.project_name,
              createdAt: new Date(comment.created_at),
              isRead: false,
              taskId: task.id,
              projectId: task.project_id,
            });
          }
        });

        // Check for ready for review tasks
        if (task.status === 'uat_approved') {
          allNotifications.push({
            id: `rfr-${task.id}`,
            type: 'ready_for_review',
            title: 'Task ready for review',
            content: `"${task.title}" has passed UAT and is ready for final review`,
            authorName: 'System',
            taskTitle: task.title,
            projectName: task.project_name,
            createdAt: new Date(task.updated_at),
            isRead: false,
            taskId: task.id,
            projectId: task.project_id,
          });
        }
      });

      // Sort by date
      allNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setNotifications(allNotifications.slice(0, limit));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, limit]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll for updates every 30 seconds (since MSSQL doesn't have real-time)
  useEffect(() => {
    if (!profile?.id) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [profile?.id, fetchNotifications]);

  return { notifications, loading, refetch: fetchNotifications };
}
