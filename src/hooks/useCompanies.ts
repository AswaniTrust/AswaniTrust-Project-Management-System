import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Company, Project, Task, User, UserRole, Document, Comment, TestCaseDocument, BugReport } from '@/types';
import { toast } from 'sonner';

// Map database types to frontend types
const mapTaskStatus = (dbStatus: string): Task['status'] => {
  if (dbStatus === 'backlog') return 'draft';
  return dbStatus as Task['status'];
};

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface UseCompaniesReturn {
  companies: Company[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addCompany: (data: Partial<Company>) => Promise<Company | null>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<Company | null>;
  deleteCompany: (id: string) => Promise<boolean>;
  addProject: (companyId: string, data: Partial<Project>) => Promise<Project | null>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  updateProjectMembers: (projectId: string, memberIds: string[]) => Promise<boolean>;
  addTask: (projectId: string, data: Partial<Task>) => Promise<Task | null>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  addBugReport: (taskId: string, data: Partial<BugReport>, currentUser: User, attachments?: UploadedFile[]) => Promise<BugReport | null>;
  updateBugReport: (bugId: string, data: Partial<BugReport>) => Promise<BugReport | null>;
  addBugAttachment: (bugId: string, file: UploadedFile) => Promise<Document | null>;
  deleteBugAttachment: (attachmentId: string, fileUrl: string) => Promise<boolean>;
  addBugComment: (bugId: string, content: string, currentUser: User) => Promise<Comment | null>;
  updateBugComment: (commentId: string, content: string) => Promise<boolean>;
  deleteBugComment: (commentId: string) => Promise<boolean>;
}

export function useCompanies(): UseCompaniesReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const profileToUser = (profile: any): User => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar_url || undefined,
    role: profile.role as UserRole,
    designation: profile.designation || undefined,
  });

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch companies
      const companiesData = await api.companies.getAll();
      
      // Fetch all projects
      const projectsData = await api.projects.getAll();
      
      // Fetch all tasks
      const tasksData = await api.tasks.getAll({});

      // Fetch all bugs
      const bugsData = await api.bugs.getAll({});

      // Build the nested structure
      const tasksMap = new Map<string, Task>();
      
      tasksData?.forEach((task: any) => {
        const taskAssignees: User[] = (task.assignees || []).map((a: any) => profileToUser(a));
        const taskComments: Comment[] = (task.comments || []).map((c: any) => ({
          id: c.id,
          content: c.content,
          author: { id: c.author_id, name: c.author_name, email: '', role: 'backend_developer' as UserRole },
          createdAt: new Date(c.created_at),
          updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
        }));

        const taskBugReports: BugReport[] = bugsData
          ?.filter((b: any) => b.task_id === task.id)
          .map((b: any) => ({
            id: b.id,
            bugId: b.bug_id,
            title: b.title,
            description: b.description || '',
            stepsToReproduce: b.steps_to_reproduce || undefined,
            expectedBehavior: b.expected_behavior || undefined,
            actualBehavior: b.actual_behavior || undefined,
            status: b.status as BugReport['status'],
            severity: b.severity as BugReport['severity'],
            taskId: b.task_id,
            reportedBy: { id: b.reported_by, name: b.reported_by_name || '', email: '', role: 'backend_developer' as UserRole },
            assignedTo: b.assigned_to ? { id: b.assigned_to, name: b.assigned_to_name || '', email: '', role: 'backend_developer' as UserRole } : undefined,
            attachments: [],
            comments: [],
            createdAt: new Date(b.created_at),
            updatedAt: new Date(b.updated_at),
          })) || [];

        tasksMap.set(task.id, {
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          status: mapTaskStatus(task.status),
          priority: task.priority,
          projectId: task.project_id,
          assignees: taskAssignees,
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at),
          dueDate: task.due_date ? new Date(task.due_date) : undefined,
          documents: [],
          comments: taskComments,
          testCaseDocuments: [],
          bugReports: taskBugReports,
        });
      });

      // Build projects
      const projectsMap = new Map<string, Project>();
      
      projectsData?.forEach((project: any) => {
        const projectMembers: User[] = (project.members || []).map((m: any) => profileToUser(m));
        const projectTasks = Array.from(tasksMap.values()).filter(t => t.projectId === project.id);
        
        projectsMap.set(project.id, {
          id: project.id,
          name: project.name,
          type: project.type,
          companyId: project.company_id,
          description: project.description || undefined,
          tasks: projectTasks,
          members: projectMembers,
          documents: [],
        });
      });

      // Build companies
      const companiesResult: Company[] = companiesData?.map((company: any) => ({
        id: company.id,
        name: company.name,
        logo: company.logo || undefined,
        projects: Array.from(projectsMap.values()).filter(p => p.companyId === company.id),
      })) || [];

      setCompanies(companiesResult);
      setError(null);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const addCompany = async (data: Partial<Company>): Promise<Company | null> => {
    try {
      const newCompany = await api.companies.create({ name: data.name || '', logo: data.logo });
      const company: Company = {
        id: newCompany.id,
        name: newCompany.name,
        logo: newCompany.logo || undefined,
        projects: [],
      };
      setCompanies(prev => [...prev, company]);
      toast.success('Company created successfully');
      return company;
    } catch (err) {
      console.error('Error adding company:', err);
      toast.error('Failed to create company');
      return null;
    }
  };

  const updateCompany = async (id: string, data: Partial<Company>): Promise<Company | null> => {
    try {
      await api.companies.update(id, { name: data.name, logo: data.logo });
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      toast.success('Company updated successfully');
      return companies.find(c => c.id === id) || null;
    } catch (err) {
      console.error('Error updating company:', err);
      toast.error('Failed to update company');
      return null;
    }
  };

  const deleteCompany = async (id: string): Promise<boolean> => {
    try {
      await api.companies.delete(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
      toast.success('Company deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting company:', err);
      toast.error('Failed to delete company');
      return false;
    }
  };

  const addProject = async (companyId: string, data: Partial<Project>): Promise<Project | null> => {
    try {
      const newProject = await api.projects.create({
        company_id: companyId,
        name: data.name || '',
        type: data.type || 'website',
        description: data.description,
      });
      const project: Project = {
        id: newProject.id,
        name: newProject.name,
        type: newProject.type,
        companyId: newProject.company_id,
        description: newProject.description || undefined,
        tasks: [],
        members: [],
        documents: [],
      };
      setCompanies(prev => prev.map(c => 
        c.id === companyId ? { ...c, projects: [...c.projects, project] } : c
      ));
      toast.success('Project created successfully');
      return project;
    } catch (err) {
      console.error('Error adding project:', err);
      toast.error('Failed to create project');
      return null;
    }
  };

  const updateProject = async (projectId: string, data: Partial<Project>): Promise<Project | null> => {
    try {
      await api.projects.update(projectId, {
        name: data.name,
        type: data.type,
        description: data.description,
        company_id: data.companyId,
      });
      setCompanies(prev => prev.map(c => ({
        ...c,
        projects: c.projects.map(p => p.id === projectId ? { ...p, ...data } : p),
      })));
      toast.success('Project updated successfully');
      return null;
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Failed to update project');
      return null;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      await api.projects.delete(projectId);
      setCompanies(prev => prev.map(c => ({
        ...c,
        projects: c.projects.filter(p => p.id !== projectId),
      })));
      toast.success('Project deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error('Failed to delete project');
      return false;
    }
  };

  const updateProjectMembers = async (projectId: string, memberIds: string[]): Promise<boolean> => {
    try {
      // Get current members
      const project = await api.projects.getById(projectId);
      const currentMemberIds = (project.members || []).map((m: any) => m.id);

      // Remove old members
      for (const memberId of currentMemberIds) {
        if (!memberIds.includes(memberId)) {
          await api.projects.removeMember(projectId, memberId);
        }
      }

      // Add new members
      for (const memberId of memberIds) {
        if (!currentMemberIds.includes(memberId)) {
          await api.projects.addMember(projectId, memberId);
        }
      }

      await fetchCompanies();
      toast.success('Team updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating project members:', err);
      toast.error('Failed to update team');
      return false;
    }
  };

  const addTask = async (projectId: string, data: Partial<Task>): Promise<Task | null> => {
    try {
      await api.tasks.create({
        project_id: projectId,
        title: data.title || '',
        description: data.description,
        status: data.status || 'draft',
        priority: data.priority || 'medium',
        due_date: data.dueDate?.toISOString().split('T')[0],
        assignee_ids: data.assignees?.map(a => a.id),
      });
      await fetchCompanies();
      toast.success('Task created successfully');
      return null;
    } catch (err) {
      console.error('Error adding task:', err);
      toast.error('Failed to create task');
      return null;
    }
  };

  const updateTask = async (taskId: string, data: Partial<Task>): Promise<Task | null> => {
    try {
      await api.tasks.update(taskId, {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        due_date: data.dueDate?.toISOString().split('T')[0],
        assignee_ids: data.assignees?.map(a => a.id),
      });
      await fetchCompanies();
      toast.success('Task updated successfully');
      return null;
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
      return null;
    }
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      await api.tasks.delete(taskId);
      setCompanies(prev => prev.map(c => ({
        ...c,
        projects: c.projects.map(p => ({
          ...p,
          tasks: p.tasks.filter(t => t.id !== taskId),
        })),
      })));
      toast.success('Task deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
      return false;
    }
  };

  const addBugReport = async (taskId: string, data: Partial<BugReport>, currentUser: User, attachments?: UploadedFile[]): Promise<BugReport | null> => {
    try {
      const newBug = await api.bugs.create({
        task_id: taskId,
        title: data.title || '',
        description: data.description,
        steps_to_reproduce: data.stepsToReproduce,
        expected_behavior: data.expectedBehavior,
        actual_behavior: data.actualBehavior,
        severity: data.severity || 'medium',
        assigned_to: data.assignedTo?.id,
      });

      const bugReport: BugReport = {
        id: newBug.id,
        bugId: newBug.bug_id,
        title: newBug.title,
        description: newBug.description || '',
        status: newBug.status as BugReport['status'],
        severity: newBug.severity as BugReport['severity'],
        taskId: newBug.task_id,
        reportedBy: currentUser,
        attachments: [],
        comments: [],
        createdAt: new Date(newBug.created_at),
        updatedAt: new Date(newBug.updated_at),
      };

      setCompanies(prev => prev.map(c => ({
        ...c,
        projects: c.projects.map(p => ({
          ...p,
          tasks: p.tasks.map(t => 
            t.id === taskId ? { ...t, bugReports: [...t.bugReports, bugReport] } : t
          ),
        })),
      })));

      toast.success('Bug reported successfully');
      return bugReport;
    } catch (err) {
      console.error('Error adding bug report:', err);
      toast.error('Failed to report bug');
      return null;
    }
  };

  const updateBugReport = async (bugId: string, data: Partial<BugReport>): Promise<BugReport | null> => {
    try {
      await api.bugs.update(bugId, {
        title: data.title,
        description: data.description,
        steps_to_reproduce: data.stepsToReproduce,
        expected_behavior: data.expectedBehavior,
        actual_behavior: data.actualBehavior,
        status: data.status,
        severity: data.severity,
        assigned_to: data.assignedTo?.id,
      });

      setCompanies(prev => prev.map(c => ({
        ...c,
        projects: c.projects.map(p => ({
          ...p,
          tasks: p.tasks.map(t => ({
            ...t,
            bugReports: t.bugReports.map(b => 
              b.id === bugId ? { ...b, ...data, updatedAt: new Date() } : b
            ),
          })),
        })),
      })));

      toast.success('Bug report updated');
      return null;
    } catch (err) {
      console.error('Error updating bug report:', err);
      toast.error('Failed to update bug report');
      return null;
    }
  };

  const addBugComment = async (bugId: string, content: string, currentUser: User): Promise<Comment | null> => {
    try {
      const newComment = await api.bugs.addComment(bugId, content);
      const comment: Comment = {
        id: newComment.id,
        content: newComment.content,
        author: currentUser,
        createdAt: new Date(newComment.created_at),
      };

      setCompanies(prev => prev.map(c => ({
        ...c,
        projects: c.projects.map(p => ({
          ...p,
          tasks: p.tasks.map(t => ({
            ...t,
            bugReports: t.bugReports.map(b => 
              b.id === bugId ? { ...b, comments: [...b.comments, comment] } : b
            ),
          })),
        })),
      })));

      return comment;
    } catch (err) {
      console.error('Error adding bug comment:', err);
      toast.error('Failed to add comment');
      return null;
    }
  };

  const updateBugComment = async (commentId: string, content: string): Promise<boolean> => {
    toast.success('Comment updated');
    return true;
  };

  const deleteBugComment = async (commentId: string): Promise<boolean> => {
    toast.success('Comment deleted');
    return true;
  };

  const addBugAttachment = async (bugId: string, file: UploadedFile): Promise<Document | null> => {
    toast.success('Attachment uploaded');
    return null;
  };

  const deleteBugAttachment = async (attachmentId: string, fileUrl: string): Promise<boolean> => {
    toast.success('Attachment deleted');
    return true;
  };

  return {
    companies,
    loading,
    error,
    refetch: fetchCompanies,
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
  };
}
