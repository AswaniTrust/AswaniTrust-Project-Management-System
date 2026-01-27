import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';

export interface TeamMemberStats {
  id: string;
  profileId: string;
  user: User;
  score: number;
  rank: number;
  bugsReported: number;
  bugsResolved: number;
  tasksCompleted: number;
  tasksAssigned: number;
  avgResolutionTime: number;
  criticalBugsFixed: number;
  testCasesApproved: number;
  trend: 'up' | 'down' | 'stable';
  badges: string[];
  calculatedAt: Date;
}

export function useTeamStats() {
  const [stats, setStats] = useState<TeamMemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      const data = await api.team.getStats();

      const mappedStats: TeamMemberStats[] = (data || []).map((stat: any) => ({
        id: stat.id,
        profileId: stat.profile_id,
        user: {
          id: stat.profile_id,
          name: stat.name || 'Unknown',
          email: stat.email || '',
          avatar: stat.avatar_url || undefined,
          role: (stat.user_role || 'backend_developer') as UserRole,
          designation: stat.designation || undefined,
        },
        score: stat.score || 0,
        rank: stat.rank || 0,
        bugsReported: stat.bugs_reported || 0,
        bugsResolved: stat.bugs_resolved || 0,
        tasksCompleted: stat.tasks_completed || 0,
        tasksAssigned: stat.tasks_assigned || 0,
        avgResolutionTime: Number(stat.avg_resolution_time) || 0,
        criticalBugsFixed: stat.critical_bugs_fixed || 0,
        testCasesApproved: stat.test_cases_approved || 0,
        trend: (stat.trend as 'up' | 'down' | 'stable') || 'stable',
        badges: stat.badges ? (typeof stat.badges === 'string' ? JSON.parse(stat.badges) : stat.badges) : [],
        calculatedAt: stat.calculated_at ? new Date(stat.calculated_at) : new Date(),
      }));

      setStats(mappedStats);
    } catch (error) {
      console.error('Error fetching team stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateAndPersistStats = useCallback(async () => {
    try {
      setCalculating(true);
      
      // For now, just refetch - stats calculation would need backend support
      toast.success('Team rankings refreshed');
      await fetchStats();
    } catch (error: any) {
      console.error('Error calculating team stats:', error);
      toast.error(error.message || 'Failed to calculate team stats');
    } finally {
      setCalculating(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    calculating,
    refetch: fetchStats,
    calculateStats: calculateAndPersistStats,
  };
}
