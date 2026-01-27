import { User, userRoleConfig } from '@/types';
import { TeamMemberStats, useTeamStats } from '@/hooks/useTeamStats';
import { getRankBadge } from '@/lib/teamRanking';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, TrendingDown, Minus, Bug, CheckCircle, Target, RefreshCw, Loader2 } from 'lucide-react';

interface TeamLeaderboardProps {
  limit?: number;
}

export function TeamLeaderboard({ limit = 10 }: TeamLeaderboardProps) {
  const { stats, loading, calculating, calculateStats } = useTeamStats();
  const rankings = stats.slice(0, limit);
  
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

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Team Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Team Leaderboard
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={calculateStats}
            disabled={calculating}
          >
            {calculating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            {calculating ? 'Calculating...' : 'Recalculate'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rankings.map((stat) => {
          const rankBadge = getRankBadge(stat.rank);
          const roleConfig = userRoleConfig[stat.user.role];
          const isQA = stat.user.role === 'testing_team';
          
          return (
            <div 
              key={stat.user.id} 
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                stat.rank <= 3 ? 'bg-accent/50 border-accent' : 'bg-muted/30 border-border'
              }`}
            >
              {/* Rank */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ 
                  backgroundColor: stat.rank <= 3 ? `${rankBadge.color}20` : 'transparent',
                }}
              >
                {stat.rank <= 3 ? rankBadge.emoji : <span className="text-muted-foreground text-sm">#{stat.rank}</span>}
              </div>
              
              {/* Avatar & Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-9 h-9">
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: `hsl(var(--${roleConfig.color}))`, color: 'white' }}
                  >
                    {stat.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{stat.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.user.designation || roleConfig.label}
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm shrink-0">
                {isQA ? (
                  <div className="flex items-center gap-1 text-muted-foreground" title="Bugs Reported">
                    <Bug className="w-4 h-4" />
                    <span>{stat.bugsReported}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground" title="Bugs Resolved">
                    <CheckCircle className="w-4 h-4" />
                    <span>{stat.bugsResolved}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground" title="Tasks Completed">
                  <Target className="w-4 h-4" />
                  <span>{stat.tasksCompleted}/{stat.tasksAssigned}</span>
                </div>
              </div>
              
              {/* Score & Trend */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="font-semibold">
                  {stat.score} pts
                </Badge>
                {getTrendIcon(stat.trend)}
              </div>
            </div>
          );
        })}
        
        {rankings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No team rankings yet</p>
            <Button 
              variant="outline" 
              onClick={calculateStats}
              disabled={calculating}
            >
              {calculating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Calculate Rankings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TeamMemberRankCardProps {
  stat: TeamMemberStats;
}

export function TeamMemberRankCard({ stat }: TeamMemberRankCardProps) {
  const rankBadge = getRankBadge(stat.rank);
  const roleConfig = userRoleConfig[stat.user.role];
  const isQA = stat.user.role === 'testing_team';
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: `${rankBadge.color}20` }}
            >
              {rankBadge.emoji}
            </div>
            <div>
              <p className="font-semibold">{stat.user.name}</p>
              <p className="text-sm text-muted-foreground">{stat.user.designation || roleConfig.label}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
            {stat.score} pts
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {isQA ? (
            <>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{stat.bugsReported}</p>
                <p className="text-xs text-muted-foreground">Bugs Reported</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{stat.testCasesApproved}</p>
                <p className="text-xs text-muted-foreground">Tests Approved</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{stat.bugsResolved}</p>
                <p className="text-xs text-muted-foreground">Bugs Resolved</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{stat.criticalBugsFixed}</p>
                <p className="text-xs text-muted-foreground">Critical Fixed</p>
              </div>
            </>
          )}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{stat.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground">Tasks Completed</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{stat.avgResolutionTime}d</p>
            <p className="text-xs text-muted-foreground">Avg Resolution</p>
          </div>
        </div>
        
        {stat.badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stat.badges.map((badge, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
