import { Company, User, userRoleConfig } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, MoreHorizontal, Plus, Edit, Trash2, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateTeamRankings, getRankBadge } from '@/lib/teamRanking';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TeamViewProps {
  companies: Company[];
  allUsers: User[];
  onSelectMember: (member: User) => void;
  onAddMember: () => void;
  onEditMember: (member: User) => void;
  onDeleteMember: (member: User) => void;
}

export function TeamView({ companies, allUsers, onSelectMember, onAddMember, onEditMember, onDeleteMember }: TeamViewProps) {
  const { role } = useAuth();
  
  // Only admins and managers can add/edit/delete team members
  const canManageTeam = role === 'admin' || role === 'manager';
  // Calculate rankings for all users
  const rankings = calculateTeamRankings(companies, allUsers);
  const rankingsMap = new Map(rankings.map(r => [r.user.id, r]));
  
  // Use allUsers as the primary source, enriched with project/task stats
  const allMembers = allUsers.map(user => {
    let projectCount = 0;
    let taskCount = 0;
    
    companies.forEach(company => {
      company.projects.forEach(project => {
        const isMember = project.members.some(m => m.id === user.id || m.email === user.email);
        if (isMember) {
          projectCount += 1;
          taskCount += project.tasks.filter(t => 
            t.assignees.some(a => a.id === user.id || a.email === user.email)
          ).length;
        }
      });
    });
    
    return {
      ...user,
      projectCount,
      taskCount,
    };
  });
  
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
          <p className="text-muted-foreground mt-1">{allMembers.length} members across all projects</p>
        </div>
        {canManageTeam && (
          <Button className="gap-2" onClick={onAddMember}>
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Rank</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Member</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Designation</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Role</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Score</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Projects</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Tasks</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allMembers.map(member => {
              const roleConfig = userRoleConfig[member.role];
              const ranking = rankingsMap.get(member.id);
              const rankBadge = ranking ? getRankBadge(ranking.rank) : null;
              
              return (
                <tr 
                  key={member.id} 
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSelectMember(member)}
                >
                  <td className="px-6 py-4">
                    {ranking && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{rankBadge?.emoji}</span>
                            {getTrendIcon(ranking.trend)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-medium">Rank #{ranking.rank}</p>
                            {ranking.badges.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {ranking.badges.join(' ')}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback 
                          className="text-sm font-medium"
                          style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                        >
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-card-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-card-foreground">
                      {member.designation || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `hsl(var(--${roleConfig.color}) / 0.1)`,
                        color: `hsl(var(--${roleConfig.color}))`
                      }}
                    >
                      {roleConfig.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {ranking && (
                      <Badge variant="secondary" className="font-semibold">
                        {ranking.score} pts
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-card-foreground">{member.projectCount}</td>
                  <td className="px-6 py-4 text-sm text-card-foreground">{member.taskCount}</td>
                  <td className="px-6 py-4">
                    {canManageTeam && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditMember(member); }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); onDeleteMember(member); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {allMembers.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No team members yet. Click "Add Member" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
