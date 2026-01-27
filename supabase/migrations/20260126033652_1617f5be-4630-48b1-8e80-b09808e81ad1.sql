-- Create enum types for task status, priority, and project type
CREATE TYPE public.project_type AS ENUM ('crm', 'website', 'mobile_app', 'internal_software');
CREATE TYPE public.task_status AS ENUM ('draft', 'backlog', 'in_progress', 'development_in_progress', 'review_pending', 'testing_in_progress', 'testing_failed', 'ui_completed', 'uat_approved', 'live');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.bug_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'reopened');
CREATE TYPE public.bug_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.test_case_status AS ENUM ('pending', 'approved', 'rejected');

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type public.project_type NOT NULL DEFAULT 'website',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project members junction table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, member_id)
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'draft',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Task assignees junction table
CREATE TABLE public.task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, assignee_id)
);

-- Documents table (for projects and tasks)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (project_id IS NOT NULL OR task_id IS NOT NULL)
);

-- Task comments table
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comment attachments
CREATE TABLE public.comment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test case documents table
CREATE TABLE public.test_case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_type TEXT,
  document_size BIGINT,
  status public.test_case_status NOT NULL DEFAULT 'pending',
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT
);

-- Bug reports table
CREATE TABLE public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  bug_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  status public.bug_status NOT NULL DEFAULT 'open',
  severity public.bug_severity NOT NULL DEFAULT 'medium',
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bug attachments
CREATE TABLE public.bug_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID REFERENCES public.bug_reports(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bug comments
CREATE TABLE public.bug_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID REFERENCES public.bug_reports(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies (all authenticated users can view, admins/managers can modify)
CREATE POLICY "All users can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins and managers can update companies" ON public.companies FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins and managers can delete companies" ON public.companies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for projects
CREATE POLICY "All users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins and managers can update projects" ON public.projects FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins and managers can delete projects" ON public.projects FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for project_members
CREATE POLICY "All users can view project members" ON public.project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can manage project members" ON public.project_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for tasks
CREATE POLICY "All users can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins and managers can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for task_assignees
CREATE POLICY "All users can view task assignees" ON public.task_assignees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage task assignees" ON public.task_assignees FOR ALL TO authenticated USING (true);

-- RLS Policies for documents
CREATE POLICY "All users can view documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete documents" ON public.documents FOR DELETE TO authenticated USING (true);

-- RLS Policies for task_comments
CREATE POLICY "All users can view comments" ON public.task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authors can update their comments" ON public.task_comments FOR UPDATE TO authenticated USING (author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authors and admins can delete comments" ON public.task_comments FOR DELETE TO authenticated USING (author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- RLS Policies for comment_attachments
CREATE POLICY "All users can view comment attachments" ON public.comment_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage comment attachments" ON public.comment_attachments FOR ALL TO authenticated USING (true);

-- RLS Policies for test_case_documents
CREATE POLICY "All users can view test cases" ON public.test_case_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert test cases" ON public.test_case_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update test cases" ON public.test_case_documents FOR UPDATE TO authenticated USING (true);

-- RLS Policies for bug_reports
CREATE POLICY "All users can view bugs" ON public.bug_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bugs" ON public.bug_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bugs" ON public.bug_reports FOR UPDATE TO authenticated USING (true);

-- RLS Policies for bug_attachments
CREATE POLICY "All users can view bug attachments" ON public.bug_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage bug attachments" ON public.bug_attachments FOR ALL TO authenticated USING (true);

-- RLS Policies for bug_comments
CREATE POLICY "All users can view bug comments" ON public.bug_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bug comments" ON public.bug_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authors can update their bug comments" ON public.bug_comments FOR UPDATE TO authenticated USING (author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bug_reports_updated_at BEFORE UPDATE ON public.bug_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bug_comments_updated_at BEFORE UPDATE ON public.bug_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();