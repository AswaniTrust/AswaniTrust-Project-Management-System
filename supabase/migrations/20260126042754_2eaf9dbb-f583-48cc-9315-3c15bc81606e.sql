-- Add DELETE policy for bug_comments
CREATE POLICY "Authors and admins can delete bug comments" 
ON public.bug_comments 
FOR DELETE 
USING (
  (author_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);