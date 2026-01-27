export type UserRole = 
  | 'admin'
  | 'backend_developer'
  | 'frontend_developer'
  | 'mobile_developer'
  | 'testing_team'
  | 'team_lead'
  | 'manager';

export type ProjectType = 'crm' | 'website' | 'mobile_app' | 'internal_software';

export type TaskStatus = 
  | 'draft'
  | 'in_progress'
  | 'ui_completed'
  | 'development_completed'
  | 'testing_in_progress'
  | 'testing_failed'
  | 'development_in_progress'
  | 'review_pending'
  | 'uat_approved'
  | 'live';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  designation?: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: User;
  uploadedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  updatedAt?: Date;
  attachments?: Document[];
}

export type TestCaseStatus = 'pending' | 'approved' | 'rejected';

export interface TestCaseDocument {
  id: string;
  document: Document;
  status: TestCaseStatus;
  submittedBy: User;
  submittedAt: Date;
  reviewedBy?: User;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BugReport {
  id: string;
  bugId: string; // e.g., BUG-001
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  status: BugStatus;
  severity: BugSeverity;
  taskId: string;
  reportedBy: User;
  assignedTo?: User;
  attachments: Document[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: User;
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  user: User;
  date: Date;
  projectId?: string;
  taskId?: string;
  description: string;
  entryType: 'duration' | 'clock';
  // For duration type
  hours?: number;
  minutes?: number;
  // For clock type
  startTime?: string;
  endTime?: string;
  // Computed or entered
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  companyId: string;
  description?: string;
  tasks: Task[];
  members: User[];
  documents: Document[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  assignees: User[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  documents: Document[];
  comments: Comment[];
  testCaseDocuments: TestCaseDocument[];
  bugReports: BugReport[];
}

export const taskStatusConfig: Record<TaskStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'status-draft' },
  in_progress: { label: 'In Progress', color: 'status-in-progress' },
  ui_completed: { label: 'UI Completed', color: 'status-ui-completed' },
  development_completed: { label: 'Dev Completed', color: 'status-dev-completed' },
  testing_in_progress: { label: 'Testing', color: 'status-testing' },
  testing_failed: { label: 'Testing Failed', color: 'status-testing-failed' },
  development_in_progress: { label: 'Dev in Progress', color: 'status-in-progress' },
  review_pending: { label: 'Review Pending', color: 'status-review' },
  uat_approved: { label: 'UAT Approved', color: 'status-uat' },
  live: { label: 'Live', color: 'status-live' },
};

export const userRoleConfig: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'role-admin' },
  backend_developer: { label: 'Backend Dev', color: 'role-backend' },
  frontend_developer: { label: 'Frontend Dev', color: 'role-frontend' },
  mobile_developer: { label: 'Mobile Dev', color: 'role-mobile' },
  testing_team: { label: 'Tester', color: 'role-testing' },
  team_lead: { label: 'Team Lead', color: 'role-lead' },
  manager: { label: 'Manager', color: 'role-manager' },
};

export const projectTypeConfig: Record<ProjectType, { label: string; icon: string }> = {
  crm: { label: 'CRM', icon: 'Users' },
  website: { label: 'Website', icon: 'Globe' },
  mobile_app: { label: 'Mobile App', icon: 'Smartphone' },
  internal_software: { label: 'Internal Software', icon: 'Server' },
};

export const bugStatusConfig: Record<BugStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'destructive' },
  in_progress: { label: 'In Progress', color: 'status-in-progress' },
  resolved: { label: 'Resolved', color: 'success' },
  closed: { label: 'Closed', color: 'muted' },
  reopened: { label: 'Reopened', color: 'warning' },
};

export const bugSeverityConfig: Record<BugSeverity, { label: string; color: string }> = {
  low: { label: 'Low', color: 'muted' },
  medium: { label: 'Medium', color: 'info' },
  high: { label: 'High', color: 'warning' },
  critical: { label: 'Critical', color: 'destructive' },
};
