import { User, Company, Task, BugReport } from '@/types';

export interface TeamMemberStats {
  user: User;
  bugsReported: number;          // For QA
  bugsResolved: number;          // For developers
  tasksCompleted: number;        // Tasks moved to live
  tasksAssigned: number;         // Total assigned tasks
  avgResolutionTime: number;     // Average days to resolve bugs
  criticalBugsFixed: number;     // Critical bugs resolved
  testCasesApproved: number;     // Test cases that got approved
  score: number;                 // Overall performance score
  rank: number;                  // Position in leaderboard
  trend: 'up' | 'down' | 'stable'; // Performance trend
  badges: string[];              // Achievement badges
}

export function calculateTeamRankings(companies: Company[], users: User[]): TeamMemberStats[] {
  const allTasks = companies.flatMap(c => c.projects.flatMap(p => p.tasks));
  const allBugs = allTasks.flatMap(t => t.bugReports || []);
  
  const stats: TeamMemberStats[] = users.map(user => {
    const isQA = user.role === 'testing_team';
    const isDeveloper = ['backend_developer', 'frontend_developer', 'mobile_developer'].includes(user.role);
    const isLead = user.role === 'team_lead' || user.role === 'manager';
    
    // Bugs reported by this user (QA metric)
    const bugsReported = allBugs.filter(b => b.reportedBy.id === user.id).length;
    
    // Bugs resolved by this user (Developer metric)
    const resolvedBugs = allBugs.filter(b => 
      b.resolvedBy?.id === user.id || 
      (b.assignedTo?.id === user.id && (b.status === 'resolved' || b.status === 'closed'))
    );
    const bugsResolved = resolvedBugs.length;
    
    // Critical bugs fixed
    const criticalBugsFixed = resolvedBugs.filter(b => b.severity === 'critical').length;
    
    // Tasks assigned and completed
    const assignedTasks = allTasks.filter(t => t.assignees.some(a => a.id === user.id));
    const tasksAssigned = assignedTasks.length;
    const tasksCompleted = assignedTasks.filter(t => t.status === 'live' || t.status === 'uat_approved').length;
    
    // Average resolution time (simplified - based on created to resolved)
    let avgResolutionTime = 0;
    if (resolvedBugs.length > 0) {
      const resolutionTimes = resolvedBugs
        .filter(b => b.resolvedAt)
        .map(b => {
          const created = new Date(b.createdAt).getTime();
          const resolved = new Date(b.resolvedAt!).getTime();
          return (resolved - created) / (1000 * 60 * 60 * 24); // Days
        });
      if (resolutionTimes.length > 0) {
        avgResolutionTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
      }
    }
    
    // Test cases approved (for QA)
    const testCasesApproved = allTasks
      .flatMap(t => t.testCaseDocuments || [])
      .filter(tc => tc.submittedBy.id === user.id && tc.status === 'approved')
      .length;
    
    // Calculate score based on role
    let score = 0;
    const badges: string[] = [];
    
    if (isQA) {
      score += bugsReported * 10;
      score += testCasesApproved * 15;
      // Bonus for finding critical bugs
      const criticalBugsFound = allBugs.filter(b => b.reportedBy.id === user.id && b.severity === 'critical').length;
      score += criticalBugsFound * 20;
      
      if (bugsReported >= 10) badges.push('🔍 Bug Hunter');
      if (criticalBugsFound >= 3) badges.push('🎯 Critical Eye');
      if (testCasesApproved >= 5) badges.push('📋 Test Master');
    } else if (isDeveloper) {
      score += bugsResolved * 15;
      score += criticalBugsFixed * 25;
      score += tasksCompleted * 20;
      // Bonus for fast resolution
      if (avgResolutionTime > 0 && avgResolutionTime < 2) {
        score += 30;
        badges.push('⚡ Speed Demon');
      }
      
      if (bugsResolved >= 10) badges.push('🔧 Bug Crusher');
      if (criticalBugsFixed >= 3) badges.push('🛡️ Crisis Handler');
      if (tasksCompleted >= 5) badges.push('🚀 Ship It!');
    } else if (isLead) {
      // Leads get credit for team performance
      score += tasksCompleted * 25;
      score += bugsResolved * 10;
      
      if (tasksCompleted >= 10) badges.push('👑 Team Leader');
    }
    
    // Everyone gets credit for task completion ratio
    if (tasksAssigned > 0) {
      const completionRatio = tasksCompleted / tasksAssigned;
      score += Math.round(completionRatio * 50);
      if (completionRatio >= 0.8) badges.push('✅ Reliable');
    }
    
    return {
      user,
      bugsReported,
      bugsResolved,
      tasksCompleted,
      tasksAssigned,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      criticalBugsFixed,
      testCasesApproved,
      score,
      rank: 0,
      trend: 'stable' as const,
      badges,
    };
  });
  
  // Sort by score and assign ranks
  stats.sort((a, b) => b.score - a.score);
  stats.forEach((stat, index) => {
    stat.rank = index + 1;
    // Simulate trend (in real app this would be historical comparison)
    if (stat.score > 100) stat.trend = 'up';
    else if (stat.score < 30) stat.trend = 'down';
  });
  
  return stats;
}

export function getRankBadge(rank: number): { emoji: string; label: string; color: string } {
  switch (rank) {
    case 1:
      return { emoji: '🥇', label: '1st', color: 'hsl(45, 100%, 50%)' };
    case 2:
      return { emoji: '🥈', label: '2nd', color: 'hsl(0, 0%, 75%)' };
    case 3:
      return { emoji: '🥉', label: '3rd', color: 'hsl(30, 60%, 50%)' };
    default:
      return { emoji: `#${rank}`, label: `${rank}th`, color: 'hsl(var(--muted-foreground))' };
  }
}
