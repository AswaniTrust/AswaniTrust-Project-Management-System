import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bug, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsWidgetProps {
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationsWidget({ onNotificationClick }: NotificationsWidgetProps) {
  const { notifications, loading } = useNotifications(10);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_comment':
        return <MessageSquare className="w-4 h-4 text-primary" />;
      case 'bug_comment':
        return <Bug className="w-4 h-4 text-destructive" />;
      default:
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'task_comment':
        return 'Task';
      case 'bug_comment':
        return 'Bug';
      case 'bug_assigned':
        return 'Assignment';
      case 'task_assigned':
        return 'Assignment';
      default:
        return 'Activity';
    }
  };

  const getTypeBadgeVariant = (type: Notification['type']): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'bug_comment':
        return 'destructive';
      case 'task_comment':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-card-foreground">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-card-foreground">Recent Activity</h3>
          {notifications.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notifications.length}
            </Badge>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
          <p className="text-xs text-muted-foreground mt-1">
            Comments on tasks and bugs will appear here
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[280px] pr-2">
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="group flex gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onNotificationClick?.(notification)}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={notification.authorAvatar} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(notification.authorName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getIcon(notification.type)}
                      <span className="text-sm font-medium text-card-foreground truncate">
                        {notification.authorName}
                      </span>
                      <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs px-1.5 py-0">
                        {getTypeLabel(notification.type)}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.content}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {notification.taskTitle && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[150px]">
                        {notification.taskTitle}
                      </span>
                    )}
                    {notification.projectName && (
                      <span className="text-xs text-muted-foreground/70">
                        in {notification.projectName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground/60">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
