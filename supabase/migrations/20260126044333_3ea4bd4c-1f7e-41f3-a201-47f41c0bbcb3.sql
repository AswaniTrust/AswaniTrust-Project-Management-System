-- Enable realtime for tasks table to support live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;