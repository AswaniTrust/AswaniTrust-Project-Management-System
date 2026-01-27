import { Company, Project, Task, taskStatusConfig, TaskStatus, User } from '@/types';
import { StatsCard } from './StatsCard';
import { TeamMembers } from './TeamMembers';
import { NotificationsWidget } from './NotificationsWidget';
import { ReadyForTestingWidget } from './ReadyForTestingWidget';
import { ReadyForReviewWidget } from './ReadyForReviewWidget';
import { MyTestingQueueWidget } from './MyTestingQueueWidget';
import { MyTasksQueueWidget } from './MyTasksQueueWidget';
import { TeamLeaderboard } from '@/components/TeamLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Folder, ListTodo, Users } from 'lucide-react';
import { Notification } from '@/hooks/useNotifications';

interface DashboardProps {
  companies: Company[];
  allUsers: User[];
  currentUser?: User;
  onNavigate: (menu: string) => void;
  onSelectProject?: (project: Project, companyName: string) => void;
  onSelectTask?: (task: Task, project: Project, companyName: string) => void;
  onTakeForTesting?: (task: Task, currentUser: User) => Promise<void>;
  onPushToLive?: (task: Task) => Promise<void>;
}

export function Dashboard({ 
  companies, 
  allUsers, 
  currentUser,
  onNavigate, 
  onSelectProject, 
  onSelectTask,
  onTakeForTesting,
  onPushToLive
}: DashboardProps) {
  const { role, isAdmin, isManager, isTeamLead } = useAuth();
  const isQATeam = role === 'testing_team';
  const totalProjects = companies.reduce((acc, c) => acc + c.projects.length, 0);
  const totalTasks = companies.reduce(
    (acc, c) => acc + c.projects.reduce((pacc, p) => pacc + p.tasks.length, 0),
    0
  );
  const uniqueMembers = new Set(
    companies.flatMap(c => c.projects.flatMap(p => p.members.map(m => m.id)))
  ).size;
  const completedTasks = companies.reduce(
    (acc, c) => acc + c.projects.reduce(
      (pacc, p) => pacc + p.tasks.filter(t => t.status === 'live').length,
      0
    ),
    0
  );

  const handleProjectClick = (project: Project) => {
    if (onSelectProject) {
      const company = companies.find(c => c.projects.some(p => p.id === project.id));
      onSelectProject(project, company?.name || '');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.taskId && onSelectTask) {
      // Find the task, project, and company
      for (const company of companies) {
        for (const project of company.projects) {
          const task = project.tasks.find(t => t.id === notification.taskId);
          if (task) {
            onSelectTask(task, project, company.name);
            return;
          }
        }
      }
    }
    // Fallback to tasks view
    onNavigate('tasks');
  };

  // Handler for task selection from widgets
  const handleTaskSelect = (task: Task, project: Project, companyName: string) => {
    if (onSelectTask) {
      onSelectTask(task, project, companyName);
    }
  };

  // Show Ready for Testing widget to QA team, admins, managers, and team leads
  const showTestingWidget = isQATeam || isAdmin || isManager || isTeamLead;
  
  // Determine if user is a developer
  const isDeveloper = role === 'backend_developer' || role === 'frontend_developer' || role === 'mobile_developer';

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className="animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Welcome back! 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Here's what's happening across your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="Companies"
          value={companies.length}
          icon={Building2}
          subtitle="Active organizations"
          onClick={() => onNavigate('companies')}
        />
        <StatsCard
          title="Projects"
          value={totalProjects}
          icon={Folder}
          trend={{ value: 15, isPositive: true }}
          onClick={() => onNavigate('projects')}
        />
        <StatsCard
          title="Total Tasks"
          value={totalTasks}
          icon={ListTodo}
          trend={{ value: 23, isPositive: true }}
          onClick={() => onNavigate('tasks')}
        />
        <StatsCard
          title="Team Members"
          value={uniqueMembers}
          icon={Users}
          subtitle="Across all projects"
          onClick={() => onNavigate('team')}
        />
      </div>

      {/* QA Team View: Ready for Testing + My Testing Queue */}
      {isQATeam && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <ReadyForTestingWidget 
            companies={companies}
            currentUser={currentUser}
            onSelectTask={handleTaskSelect}
            onTakeForTesting={onTakeForTesting}
          />
          <MyTestingQueueWidget
            companies={companies}
            currentUser={currentUser}
            onSelectTask={handleTaskSelect}
          />
          <div className="md:col-span-2 lg:col-span-1">
            <TeamLeaderboard limit={5} />
          </div>
        </div>
      )}

      {/* Developer View: My Tasks Queue + Leaderboard */}
      {isDeveloper && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <MyTasksQueueWidget
            companies={companies}
            currentUser={currentUser}
            onSelectTask={handleTaskSelect}
          />
          <div className="lg:col-span-2">
            <TeamLeaderboard limit={5} />
          </div>
        </div>
      )}

      {/* Manager View: Ready for Testing + Ready for Review */}
      {isManager && !isQATeam && !isDeveloper && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <ReadyForTestingWidget 
            companies={companies}
            currentUser={currentUser}
            onSelectTask={handleTaskSelect}
            onTakeForTesting={onTakeForTesting}
          />
          <ReadyForReviewWidget
            companies={companies}
            onSelectTask={handleTaskSelect}
            onPushToLive={onPushToLive}
          />
          <div className="md:col-span-2 lg:col-span-1">
            <TeamLeaderboard limit={5} />
          </div>
        </div>
      )}

      {/* Admin/Team Lead View: All widgets */}
      {(isAdmin || isTeamLead) && !isManager && !isQATeam && !isDeveloper && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <ReadyForTestingWidget 
              companies={companies}
              currentUser={currentUser}
              onSelectTask={handleTaskSelect}
              onTakeForTesting={onTakeForTesting}
            />
            <ReadyForReviewWidget
              companies={companies}
              onSelectTask={handleTaskSelect}
              onPushToLive={onPushToLive}
            />
            <MyTasksQueueWidget
              companies={companies}
              currentUser={currentUser}
              onSelectTask={handleTaskSelect}
            />
          </div>
          <div className="grid grid-cols-1">
            <TeamLeaderboard limit={5} />
          </div>
        </>
      )}

      {/* Fallback for other roles */}
      {!showTestingWidget && !isDeveloper && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <NotificationsWidget onNotificationClick={handleNotificationClick} />
          <div className="lg:col-span-2">
            <TeamLeaderboard limit={5} />
          </div>
        </div>
      )}

      {/* Notifications Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <NotificationsWidget onNotificationClick={handleNotificationClick} />
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 md:p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-card-foreground text-sm md:text-base">Project Summary</h3>
            <button 
              onClick={() => onNavigate('projects')}
              className="text-xs text-primary hover:underline"
            >
              View all projects →
            </button>
          </div>
          <div className="space-y-4">
            {companies.flatMap(c => c.projects).slice(0, 5).map(project => {
              const completed = project.tasks.filter(t => t.status === 'live').length;
              const total = project.tasks.length;
              const progress = total > 0 ? (completed / total) * 100 : 0;
              
              return (
                <div 
                  key={project.id} 
                  className="group cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {completed} of {total} tasks completed
                      </p>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground ml-2">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Members and Task Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <TeamMembers 
          members={allUsers} 
          onViewAll={() => onNavigate('team')} 
        />
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 md:p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-card-foreground text-sm md:text-base">Task Overview</h3>
            <button 
              onClick={() => onNavigate('tasks')}
              className="text-xs text-primary hover:underline"
            >
              View all tasks →
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(taskStatusConfig).slice(0, 6).map(([status, config]) => {
              const count = companies.reduce(
                (acc, c) => acc + c.projects.reduce(
                  (pacc, p) => pacc + p.tasks.filter(t => t.status === status).length,
                  0
                ),
                0
              );
              return (
                <div 
                  key={status} 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-1.5 -mx-1.5 transition-colors"
                  onClick={() => onNavigate('tasks')}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: `hsl(var(--${config.color}))` }}
                    />
                    <span className="text-sm text-muted-foreground">{config.label}</span>
                  </div>
                  <span className="text-sm font-medium text-card-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
