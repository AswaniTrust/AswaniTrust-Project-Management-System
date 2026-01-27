import { Task, BugReport } from '@/types';

export type TaskHealthLevel = 'excellent' | 'good' | 'warning' | 'critical';

export interface TaskHealthInfo {
  level: TaskHealthLevel;
  score: number; // 0-100
  testingCycles: number;
  totalBugs: number;
  openBugs: number;
  closedBugs: number;
  criticalBugs: number;
  color: string;
  bgColor: string;
  label: string;
}

export function calculateTaskHealth(task: Task): TaskHealthInfo {
  const bugs = task.bugReports || [];
  const totalBugs = bugs.length;
  const openBugs = bugs.filter(b => b.status === 'open' || b.status === 'reopened').length;
  const closedBugs = bugs.filter(b => b.status === 'closed' || b.status === 'resolved').length;
  const criticalBugs = bugs.filter(b => b.severity === 'critical' && (b.status === 'open' || b.status === 'reopened')).length;
  
  // Calculate testing cycles based on status transitions
  // Each time a task enters testing_in_progress or testing_failed counts as a cycle
  const testingStatuses: Task['status'][] = ['testing_in_progress', 'testing_failed'];
  const isInTesting = testingStatuses.includes(task.status);
  const hasFailedBefore = task.status === 'testing_failed' || bugs.some(b => b.status === 'reopened');
  
  // Estimate testing cycles based on bugs and failed status
  let testingCycles = 1;
  if (isInTesting || task.status === 'testing_failed') testingCycles++;
  testingCycles += bugs.filter(b => b.status === 'reopened').length;
  testingCycles += Math.floor(totalBugs / 3); // More bugs = more cycles
  
  // Calculate health score (0-100, higher is better)
  let score = 100;
  
  // Deduct for open bugs
  score -= openBugs * 15;
  
  // Deduct for critical bugs
  score -= criticalBugs * 25;
  
  // Deduct for testing cycles
  score -= Math.max(0, (testingCycles - 1) * 10);
  
  // Deduct for total bugs (even resolved ones indicate complexity)
  score -= totalBugs * 5;
  
  // Bonus for closed bugs (shows progress)
  score += closedBugs * 3;
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Determine health level
  let level: TaskHealthLevel;
  let color: string;
  let bgColor: string;
  let label: string;
  
  if (score >= 80) {
    level = 'excellent';
    color = 'hsl(var(--success))';
    bgColor = 'hsl(var(--success) / 0.1)';
    label = 'Healthy';
  } else if (score >= 60) {
    level = 'good';
    color = 'hsl(var(--info))';
    bgColor = 'hsl(var(--info) / 0.1)';
    label = 'Good';
  } else if (score >= 40) {
    level = 'warning';
    color = 'hsl(var(--warning))';
    bgColor = 'hsl(var(--warning) / 0.1)';
    label = 'Needs Attention';
  } else {
    level = 'critical';
    color = 'hsl(var(--destructive))';
    bgColor = 'hsl(var(--destructive) / 0.1)';
    label = 'Critical';
  }
  
  return {
    level,
    score,
    testingCycles,
    totalBugs,
    openBugs,
    closedBugs,
    criticalBugs,
    color,
    bgColor,
    label,
  };
}

export function getHealthIndicatorClass(level: TaskHealthLevel): string {
  switch (level) {
    case 'excellent':
      return 'bg-success/20 border-success/50';
    case 'good':
      return 'bg-info/20 border-info/50';
    case 'warning':
      return 'bg-warning/20 border-warning/50';
    case 'critical':
      return 'bg-destructive/20 border-destructive/50';
  }
}
