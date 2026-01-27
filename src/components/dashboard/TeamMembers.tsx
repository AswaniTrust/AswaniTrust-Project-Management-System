import { User, userRoleConfig } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TeamMembersProps {
  members: User[];
  onViewAll?: () => void;
}

export function TeamMembers({ members, onViewAll }: TeamMembersProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-card-foreground">Team Members</h3>
        <span className="text-xs text-muted-foreground">{members.length} total</span>
      </div>
      <ScrollArea className="h-[280px] pr-3">
        <div className="space-y-3">
          {members.map(member => {
            const roleConfig = userRoleConfig[member.role];
            return (
              <div key={member.id} className="flex items-center gap-3 group">
                <Avatar className="w-9 h-9">
                  <AvatarFallback 
                    style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                    className="text-xs font-medium"
                  >
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <Badge 
                  variant="secondary"
                  className="text-xs shrink-0"
                  style={{ 
                    backgroundColor: `hsl(var(--${roleConfig.color}) / 0.1)`,
                    color: `hsl(var(--${roleConfig.color}))`
                  }}
                >
                  {roleConfig.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      {onViewAll && (
        <button 
          className="mt-4 text-sm text-primary hover:underline w-full text-center"
          onClick={onViewAll}
        >
          View all members →
        </button>
      )}
    </div>
  );
}
