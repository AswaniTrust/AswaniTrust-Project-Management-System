-- Drop existing restrictive policies for companies
DROP POLICY IF EXISTS "Admins and managers can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Admins and managers can update companies" ON public.companies;
DROP POLICY IF EXISTS "Admins and managers can delete companies" ON public.companies;

-- Create new policies that include developers and team leads
CREATE POLICY "Authenticated users can insert companies"
ON public.companies
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
ON public.companies
FOR UPDATE
USING (true);

CREATE POLICY "Admins and managers can delete companies"
ON public.companies
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Drop existing restrictive policies for profiles insert/update
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create new policies that allow all authenticated users to add team members
CREATE POLICY "Authenticated users can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update profiles"
ON public.profiles
FOR UPDATE
USING (true);

CREATE POLICY "Admins and managers can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));