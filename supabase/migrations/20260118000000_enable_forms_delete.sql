-- Enable deletion of forms for their creators and hierarchy managers (Admins, SubAdmins)
CREATE POLICY "Users can delete forms from hierarchy"
ON public.forms FOR DELETE
USING (created_by_id = auth.uid() OR is_in_hierarchy(auth.uid(), created_by_id));
