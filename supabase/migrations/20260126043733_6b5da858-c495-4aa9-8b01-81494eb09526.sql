-- Enable realtime for task_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;

-- Enable realtime for bug_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bug_comments;