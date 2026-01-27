-- Create timesheet entries table
CREATE TABLE public.timesheet_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('duration', 'clock')),
  hours INTEGER,
  minutes INTEGER,
  start_time TEXT,
  end_time TEXT,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage their own entries, admins/managers can view all
CREATE POLICY "Users can view their own timesheet entries"
ON public.timesheet_entries
FOR SELECT
USING (
  user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Users can insert their own timesheet entries"
ON public.timesheet_entries
FOR INSERT
WITH CHECK (
  user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own timesheet entries"
ON public.timesheet_entries
FOR UPDATE
USING (
  user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own timesheet entries"
ON public.timesheet_entries
FOR DELETE
USING (
  user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_timesheet_entries_updated_at
BEFORE UPDATE ON public.timesheet_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_timesheet_entries_user_date ON public.timesheet_entries(user_id, date);
CREATE INDEX idx_timesheet_entries_project ON public.timesheet_entries(project_id);