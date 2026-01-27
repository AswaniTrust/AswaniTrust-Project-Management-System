-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Allow authenticated users to view all documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow users to update their own documents (owner check via folder structure: user_id/filename)
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'manager')
  )
);

-- Allow users to delete their own documents or admins/managers can delete any
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'manager')
  )
);