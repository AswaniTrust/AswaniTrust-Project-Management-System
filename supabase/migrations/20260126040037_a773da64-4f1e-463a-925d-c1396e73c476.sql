-- Create table to persist team member rankings and scores
CREATE TABLE public.team_member_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  bugs_reported INTEGER NOT NULL DEFAULT 0,
  bugs_resolved INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  tasks_assigned INTEGER NOT NULL DEFAULT 0,
  avg_resolution_time NUMERIC(10,2) NOT NULL DEFAULT 0,
  critical_bugs_fixed INTEGER NOT NULL DEFAULT 0,
  test_cases_approved INTEGER NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  badges TEXT[] NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.team_member_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view team stats
CREATE POLICY "All users can view team stats"
ON public.team_member_stats
FOR SELECT
USING (true);

-- Only admins and managers can update stats
CREATE POLICY "Admins and managers can manage team stats"
ON public.team_member_stats
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_team_member_stats_updated_at
BEFORE UPDATE ON public.team_member_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();