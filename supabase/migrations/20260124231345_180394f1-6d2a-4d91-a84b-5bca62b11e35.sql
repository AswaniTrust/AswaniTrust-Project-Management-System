-- Create role enum for job roles
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'manager',
  'team_lead',
  'backend_developer',
  'frontend_developer',
  'mobile_developer',
  'testing_team'
);

-- Create user_roles table (following security best practices - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'backend_developer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  designation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions table for configurable permissions per role
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_key TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (role, permission_key)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'manager' THEN 2 
      WHEN 'team_lead' THEN 3 
      ELSE 4 
    END
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for role_permissions
CREATE POLICY "Anyone authenticated can view permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage permissions"
  ON public.role_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  
  -- Assign default role (first user is admin, others are developers)
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'backend_developer');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for all roles
INSERT INTO public.role_permissions (role, permission_key, can_view, can_edit) VALUES
  -- Admin has full access
  ('admin', 'dashboard', true, true),
  ('admin', 'companies', true, true),
  ('admin', 'projects', true, true),
  ('admin', 'tasks', true, true),
  ('admin', 'timesheets', true, true),
  ('admin', 'team', true, true),
  ('admin', 'settings', true, true),
  ('admin', 'bug_reports', true, true),
  ('admin', 'role_management', true, true),
  
  -- Manager permissions
  ('manager', 'dashboard', true, true),
  ('manager', 'companies', true, true),
  ('manager', 'projects', true, true),
  ('manager', 'tasks', true, true),
  ('manager', 'timesheets', true, true),
  ('manager', 'team', true, true),
  ('manager', 'settings', true, false),
  ('manager', 'bug_reports', true, true),
  ('manager', 'role_management', false, false),
  
  -- Team Lead permissions
  ('team_lead', 'dashboard', true, false),
  ('team_lead', 'companies', true, false),
  ('team_lead', 'projects', true, true),
  ('team_lead', 'tasks', true, true),
  ('team_lead', 'timesheets', true, true),
  ('team_lead', 'team', true, true),
  ('team_lead', 'settings', true, false),
  ('team_lead', 'bug_reports', true, true),
  ('team_lead', 'role_management', false, false),
  
  -- Backend Developer
  ('backend_developer', 'dashboard', true, false),
  ('backend_developer', 'companies', false, false),
  ('backend_developer', 'projects', true, false),
  ('backend_developer', 'tasks', true, true),
  ('backend_developer', 'timesheets', true, true),
  ('backend_developer', 'team', true, false),
  ('backend_developer', 'settings', true, false),
  ('backend_developer', 'bug_reports', true, true),
  ('backend_developer', 'role_management', false, false),
  
  -- Frontend Developer
  ('frontend_developer', 'dashboard', true, false),
  ('frontend_developer', 'companies', false, false),
  ('frontend_developer', 'projects', true, false),
  ('frontend_developer', 'tasks', true, true),
  ('frontend_developer', 'timesheets', true, true),
  ('frontend_developer', 'team', true, false),
  ('frontend_developer', 'settings', true, false),
  ('frontend_developer', 'bug_reports', true, true),
  ('frontend_developer', 'role_management', false, false),
  
  -- Mobile Developer
  ('mobile_developer', 'dashboard', true, false),
  ('mobile_developer', 'companies', false, false),
  ('mobile_developer', 'projects', true, false),
  ('mobile_developer', 'tasks', true, true),
  ('mobile_developer', 'timesheets', true, true),
  ('mobile_developer', 'team', true, false),
  ('mobile_developer', 'settings', true, false),
  ('mobile_developer', 'bug_reports', true, true),
  ('mobile_developer', 'role_management', false, false),
  
  -- Testing Team
  ('testing_team', 'dashboard', true, false),
  ('testing_team', 'companies', false, false),
  ('testing_team', 'projects', true, false),
  ('testing_team', 'tasks', true, false),
  ('testing_team', 'timesheets', true, true),
  ('testing_team', 'team', true, false),
  ('testing_team', 'settings', true, false),
  ('testing_team', 'bug_reports', true, true),
  ('testing_team', 'role_management', false, false);