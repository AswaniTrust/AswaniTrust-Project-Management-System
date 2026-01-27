import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { CompaniesView } from '@/components/views/CompaniesView';
import { ProjectsView } from '@/components/views/ProjectsView';
import { TasksView } from '@/components/views/TasksView';
import { TeamView } from '@/components/views/TeamView';
import { SettingsView } from '@/components/views/SettingsView';
import { TimesheetsView } from '@/components/views/TimesheetsView';
import { CompanyDetail } from '@/components/details/CompanyDetail';
import { ProjectDetail } from '@/components/details/ProjectDetail';
import { TaskDetail } from '@/components/details/TaskDetail';
import { TeamMemberDetail } from '@/components/details/TeamMemberDetail';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { TaskForm } from '@/components/forms/TaskForm';
import { TeamMemberForm } from '@/components/forms/TeamMemberForm';
import { TeamAssignment } from '@/components/forms/TeamAssignment';
import { TimesheetForm } from '@/components/forms/TimesheetForm';
import { DeleteConfirm } from '@/components/ui/delete-confirm';
import { AuthPage } from '@/components/auth/AuthPage';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useCompanies } from '@/hooks/useCompanies';
import { useTimesheets } from '@/hooks/useTimesheets';
import { Company, Project, Task, User, TimesheetEntry } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

type View = 'dashboard' | 'companies' | 'projects' | 'tasks' | 'timesheets' | 'team' | 'settings' |
  'company-detail' | 'project-detail' | 'task-detail' | 'member-detail';

const Index = () => {
  const { user, isLoading, hasPermission, isAdmin } = useAuth();
  const { members: allUsers, loading: membersLoading, saving: membersSaving, addMember, updateMember, deleteMember } = useTeamMembers();
  const { 
    companies, 
    loading: companiesLoading, 
    addCompany, 
    updateCompany, 
    deleteCompany,
    addProject,
    updateProject,
    deleteProject,
    updateProjectMembers,
    addTask,
    updateTask,
    deleteTask,
    addBugReport,
    updateBugReport,
    addBugAttachment,
    deleteBugAttachment,
    addBugComment,
    updateBugComment,
    deleteBugComment,
    refetch: refetchCompanies,
  } = useCompanies();

  // Get current user's profile ID for timesheets
  const currentUserProfile = allUsers.find(u => u.email === user?.email);
  
  const {
    entries: timesheetEntries,
    loading: timesheetsLoading,
    activeClockEntry,
    addEntry: addTimesheetEntry,
    updateEntry: updateTimesheetEntry,
    deleteEntry: deleteTimesheetEntry,
    clockOut: clockOutEntry,
  } = useTimesheets(currentUserProfile?.id);
  
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Selection state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [currentCompanyName, setCurrentCompanyName] = useState<string>('');
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  
  // Modal state
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [showTimesheetForm, setShowTimesheetForm] = useState(false);
  const [timesheetFormMode, setTimesheetFormMode] = useState<'add' | 'clockin'>('add');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; item: any } | null>(null);
  
  // Editing state
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingMember, setEditingMember] = useState<User | undefined>();
  const [editingTimesheet, setEditingTimesheet] = useState<TimesheetEntry | undefined>();

  // Update selected entities when companies data changes
  useEffect(() => {
    if (selectedCompany) {
      const updated = companies.find(c => c.id === selectedCompany.id);
      if (updated) setSelectedCompany(updated);
    }
    if (selectedProject) {
      const updated = companies.flatMap(c => c.projects).find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
    if (selectedTask) {
      const updated = companies.flatMap(c => c.projects).flatMap(p => p.tasks).find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [companies]);

  const mainContentRef = useRef<HTMLElement>(null);

  const handleMenuChange = (menu: string) => {
    setActiveMenu(menu);
    setCurrentView(menu as View);
    setSelectedCompany(null);
    setSelectedProject(null);
    setSelectedTask(null);
    setSelectedMember(null);
    // Reset scroll position when switching menus
    mainContentRef.current?.scrollTo(0, 0);
  };

  // Navigation handlers
  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setCurrentView('company-detail');
  };

  const handleSelectProject = (project: Project, companyName: string) => {
    setSelectedProject(project);
    setCurrentCompanyName(companyName);
    setCurrentView('project-detail');
  };

  const handleSelectTask = (task: Task, projectName: string) => {
    setSelectedTask(task);
    setCurrentProjectName(projectName);
    setCurrentView('task-detail');
  };

  const handleSelectMember = (member: User) => {
    setSelectedMember(member);
    setCurrentView('member-detail');
  };

  // Company CRUD
  const handleSaveCompany = async (companyData: Partial<Company>) => {
    if (companyData.id) {
      await updateCompany(companyData.id, companyData);
    } else {
      await addCompany(companyData);
    }
    setEditingCompany(undefined);
  };

  const handleSaveProject = async (projectData: Partial<Project>) => {
    if (projectData.id) {
      await updateProject(projectData.id, projectData);
    } else {
      const companyId = projectData.companyId || selectedCompany?.id;
      if (companyId) {
        await addProject(companyId, projectData);
      }
    }
    setEditingProject(undefined);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (taskData.id) {
      await updateTask(taskData.id, taskData);
    } else {
      const projectId = taskData.projectId || selectedProject?.id;
      if (projectId) {
        await addTask(projectId, taskData);
      }
    }
    setEditingTask(undefined);
  };

  const handleSaveMember = async (memberData: Partial<User> & { password?: string }) => {
    if (memberData.id) {
      // Update existing member via hook
      const updatedMember = await updateMember(memberData.id, memberData);
      
      if (updatedMember) {
        // Refetch companies to update member references
        await refetchCompanies();
        
        // Update selectedMember if viewing member detail
        if (selectedMember?.id === memberData.id) {
          setSelectedMember(updatedMember);
        }
      }
    } else {
      // Add new member via hook (with password for auth)
      const result = await addMember(memberData);
      if (result) {
        setShowMemberForm(false);
      }
    }
    setEditingMember(undefined);
  };

  // Team Assignment
  const handleSaveTeamAssignment = async (memberIds: string[]) => {
    if (!selectedProject) return;
    await updateProjectMembers(selectedProject.id, memberIds);
  };

  // Update Project (for documents) - Note: Document persistence not yet implemented
  const handleUpdateProject = async (updatedProject: Project) => {
    // For now, just update the selection - documents are handled locally
    // TODO: Persist documents to database
    setSelectedProject(updatedProject);
  };

  // Update Task (for documents and comments) - Note: Not all features persisted yet
  const handleUpdateTask = async (updatedTask: Task) => {
    // Update the task in database
    await updateTask(updatedTask.id, updatedTask);
    setSelectedTask(updatedTask);
  };

  // Timesheet CRUD
  const handleSaveTimesheet = async (entryData: Partial<TimesheetEntry>) => {
    if (entryData.id) {
      const success = await updateTimesheetEntry(entryData.id, entryData);
      if (success) {
        toast.success('Time entry updated');
      }
    } else {
      const newEntry = await addTimesheetEntry(entryData);
      if (newEntry) {
        if (timesheetFormMode === 'clockin') {
          toast.success('Clocked in successfully');
        } else {
          toast.success('Time entry added');
        }
      }
    }
    setEditingTimesheet(undefined);
  };

  const handleClockIn = () => {
    setTimesheetFormMode('clockin');
    setEditingTimesheet(undefined);
    setShowTimesheetForm(true);
  };

  const handleClockOut = async (entry: TimesheetEntry) => {
    const now = new Date();
    const endTime = format(now, 'HH:mm');
    const [startH, startM] = (entry.startTime || '00:00').split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    
    await clockOutEntry(entry, endTime, totalMinutes);
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    switch (deleteTarget.type) {
      case 'company':
        await deleteCompany(deleteTarget.item.id);
        setCurrentView('companies');
        break;
      case 'project':
        await deleteProject(deleteTarget.item.id);
        setCurrentView('projects');
        break;
      case 'task':
        await deleteTask(deleteTarget.item.id);
        if (selectedProject) {
          setCurrentView('project-detail');
        } else {
          setCurrentView('tasks');
        }
        break;
      case 'member':
        await deleteMember(deleteTarget.item.id);
        setCurrentView('team');
        break;
      case 'timesheet':
        await deleteTimesheetEntry(deleteTarget.item.id);
        break;
    }
    
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const confirmDelete = (type: string, item: any) => {
    setDeleteTarget({ type, item });
    setShowDeleteConfirm(true);
  };

  const getHeaderInfo = () => {
    switch (currentView) {
      case 'dashboard': return { title: 'Dashboard', subtitle: 'Overview of all projects' };
      case 'companies': return { title: 'Companies', subtitle: 'Manage organizations' };
      case 'projects': return { title: 'Projects', subtitle: 'All projects' };
      case 'tasks': return { title: 'Tasks', subtitle: 'Task management' };
      case 'timesheets': return { title: 'Timesheets', subtitle: 'Track work hours' };
      case 'team': return { title: 'Team Members', subtitle: 'Manage your team' };
      case 'settings': return { title: 'Settings', subtitle: 'Account preferences' };
      case 'company-detail': return { title: selectedCompany?.name || '', subtitle: 'Company Details' };
      case 'project-detail': return { title: selectedProject?.name || '', subtitle: currentCompanyName };
      case 'task-detail': return { title: selectedTask?.title || '', subtitle: currentProjectName };
      case 'member-detail': return { title: selectedMember?.name || '', subtitle: 'Team Member' };
      default: return { title: 'Dashboard', subtitle: '' };
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            companies={companies}
            allUsers={allUsers}
            currentUser={currentUserProfile}
            onNavigate={handleMenuChange}
            onSelectProject={handleSelectProject}
            onSelectTask={(task, project, companyName) => {
              setSelectedProject(project);
              setCurrentProjectName(project.name);
              handleSelectTask(task, project.name);
            }}
            onTakeForTesting={async (task, user) => {
              // Update task status to testing_in_progress and add current user as assignee
              const existingAssignees = task.assignees || [];
              const isAlreadyAssigned = existingAssignees.some(a => a.id === user.id);
              
              await updateTask(task.id, {
                status: 'testing_in_progress',
                assignees: isAlreadyAssigned 
                  ? existingAssignees 
                  : [...existingAssignees, user],
              });
            }}
            onPushToLive={async (task) => {
              await updateTask(task.id, { status: 'live' });
            }}
          />
        );
      
      case 'companies':
        return (
          <CompaniesView 
            companies={companies}
            onSelectCompany={handleSelectCompany}
            onAddCompany={() => { setEditingCompany(undefined); setShowCompanyForm(true); }}
            onEditCompany={(c) => { setEditingCompany(c); setShowCompanyForm(true); }}
            onDeleteCompany={(c) => confirmDelete('company', c)}
          />
        );
      
      case 'projects':
        return (
          <ProjectsView 
            companies={companies}
            onSelectProject={handleSelectProject}
            onAddProject={() => { setEditingProject(undefined); setShowProjectForm(true); }}
            onEditProject={(p) => { setEditingProject(p); setShowProjectForm(true); }}
            onDeleteProject={(p) => confirmDelete('project', p)}
          />
        );
      
      case 'tasks':
        return (
          <TasksView 
            companies={companies}
            onSelectTask={handleSelectTask}
            onEditTask={(t) => { setEditingTask(t); setShowTaskForm(true); }}
            onDeleteTask={(t) => confirmDelete('task', t)}
          />
        );
      
      case 'timesheets':
        return (
          <TimesheetsView
            entries={timesheetEntries}
            companies={companies}
            currentUser={currentUserProfile || allUsers[0]}
            onAddEntry={() => { setTimesheetFormMode('add'); setEditingTimesheet(undefined); setShowTimesheetForm(true); }}
            onEditEntry={(e) => { setTimesheetFormMode('add'); setEditingTimesheet(e); setShowTimesheetForm(true); }}
            onDeleteEntry={(e) => confirmDelete('timesheet', e)}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            activeClockEntry={activeClockEntry}
          />
        );
      
      case 'team':
        return (
          <TeamView 
            companies={companies}
            allUsers={allUsers}
            onSelectMember={handleSelectMember}
            onAddMember={() => { setEditingMember(undefined); setShowMemberForm(true); }}
            onEditMember={(m) => { setEditingMember(m); setShowMemberForm(true); }}
            onDeleteMember={(m) => confirmDelete('member', m)}
          />
        );
      
      case 'settings':
        return <SettingsView />;
      
      case 'company-detail':
        if (!selectedCompany) return null;
        return (
          <CompanyDetail 
            company={selectedCompany}
            onBack={() => setCurrentView('companies')}
            onEdit={() => { setEditingCompany(selectedCompany); setShowCompanyForm(true); }}
            onDelete={() => confirmDelete('company', selectedCompany)}
            onSelectProject={(p) => handleSelectProject(p, selectedCompany.name)}
            onAddProject={() => { setEditingProject(undefined); setShowProjectForm(true); }}
          />
        );
      
      case 'project-detail':
        if (!selectedProject) return null;
        return (
          <ProjectDetail 
            project={selectedProject}
            companyName={currentCompanyName}
            currentUser={allUsers[0]}
            onBack={() => selectedCompany ? setCurrentView('company-detail') : setCurrentView('projects')}
            onEdit={() => { setEditingProject(selectedProject); setShowProjectForm(true); }}
            onDelete={() => confirmDelete('project', selectedProject)}
            onSelectTask={(t) => handleSelectTask(t, selectedProject.name)}
            onAddTask={() => { setEditingTask(undefined); setShowTaskForm(true); }}
            onManageTeam={() => setShowTeamAssignment(true)}
            onUpdateProject={handleUpdateProject}
          />
        );
      
      case 'task-detail':
        if (!selectedTask) return null;
        // Find the project to get members
        const taskProject = companies.flatMap(c => c.projects).find(p => p.id === selectedTask.projectId);
        return (
          <TaskDetail 
            task={selectedTask}
            projectName={currentProjectName}
            currentUser={currentUserProfile || allUsers[0]}
            projectMembers={taskProject?.members || []}
            onBack={() => selectedProject ? setCurrentView('project-detail') : setCurrentView('tasks')}
            onEdit={() => { setEditingTask(selectedTask); setShowTaskForm(true); }}
            onDelete={() => confirmDelete('task', selectedTask)}
            onUpdateTask={handleUpdateTask}
            onAddBugReport={addBugReport}
            onUpdateBugReport={updateBugReport}
            onAddBugAttachment={addBugAttachment}
            onDeleteBugAttachment={deleteBugAttachment}
            onAddBugComment={addBugComment}
            onUpdateBugComment={updateBugComment}
            onDeleteBugComment={deleteBugComment}
          />
        );
      
      case 'member-detail':
        if (!selectedMember) return null;
        return (
          <TeamMemberDetail 
            member={selectedMember}
            companies={companies}
            onBack={() => setCurrentView('team')}
            onEdit={() => { setEditingMember(selectedMember); setShowMemberForm(true); }}
            onDelete={() => confirmDelete('member', selectedMember)}
          />
        );
      
      default:
        return (
          <Dashboard 
            companies={companies}
            allUsers={allUsers}
            onNavigate={handleMenuChange}
            onSelectProject={handleSelectProject}
          />
        );
    }
  };

  const headerInfo = getHeaderInfo();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={headerInfo.title} 
          subtitle={headerInfo.subtitle} 
          onNavigate={handleMenuChange}
        />
        
        <main ref={mainContentRef} className="flex-1 overflow-auto pb-20 md:pb-0">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeMenu={activeMenu} onMenuChange={handleMenuChange} />

      {/* Modals */}
      <CompanyForm
        isOpen={showCompanyForm}
        onClose={() => { setShowCompanyForm(false); setEditingCompany(undefined); }}
        onSave={handleSaveCompany}
        company={editingCompany}
      />

      <ProjectForm
        isOpen={showProjectForm}
        onClose={() => { setShowProjectForm(false); setEditingProject(undefined); }}
        onSave={handleSaveProject}
        project={editingProject}
        companies={companies}
      />

      {showTaskForm && (() => {
        // Find the project for the task form - use editing task's projectId or selectedProject
        const taskFormProjectId = editingTask?.projectId || selectedProject?.id;
        const taskFormProject = taskFormProjectId 
          ? companies.flatMap(c => c.projects).find(p => p.id === taskFormProjectId)
          : selectedProject;
        
        if (!taskFormProject) return null;
        
        return (
          <TaskForm
            isOpen={showTaskForm}
            onClose={() => { setShowTaskForm(false); setEditingTask(undefined); }}
            onSave={handleSaveTask}
            task={editingTask}
            projectId={taskFormProject.id}
            availableMembers={taskFormProject.members}
          />
        );
      })()}

      <TeamMemberForm
        isOpen={showMemberForm}
        onClose={() => { setShowMemberForm(false); setEditingMember(undefined); }}
        onSave={handleSaveMember}
        member={editingMember}
        isLoading={membersSaving}
      />

      {(showTeamAssignment && selectedProject) && (
        <TeamAssignment
          isOpen={showTeamAssignment}
          onClose={() => setShowTeamAssignment(false)}
          onSave={handleSaveTeamAssignment}
          project={selectedProject}
          allMembers={allUsers}
        />
      )}

      <TimesheetForm
        isOpen={showTimesheetForm}
        onClose={() => { setShowTimesheetForm(false); setEditingTimesheet(undefined); }}
        onSave={handleSaveTimesheet}
        entry={editingTimesheet}
        companies={companies}
        currentUser={currentUserProfile || allUsers[0]}
        mode={timesheetFormMode}
      />

      <DeleteConfirm
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type || ''}`}
        description={`Are you sure you want to delete this ${deleteTarget?.type}? This action cannot be undone.`}
      />
    </div>
  );
};

export default Index;
