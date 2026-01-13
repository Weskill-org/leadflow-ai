
-- Create a new private bucket for company assets if it doesn't exist
insert into storage.buckets (id, name, public)
values ('company_assets', 'company_assets', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket
create policy "Public Access to Company Assets"
  on storage.objects for select
  using ( bucket_id = 'company_assets' );

create policy "Company Members can upload assets"
  on storage.objects for insert
  with check (
    bucket_id = 'company_assets' and
    auth.role() = 'authenticated'
  );

create policy "Company Members can update own assets"
  on storage.objects for update
  using (
    bucket_id = 'company_assets' and
    auth.role() = 'authenticated'
  );

create policy "Company Members can delete own assets"
  on storage.objects for delete
  using (
    bucket_id = 'company_assets' and
    auth.role() = 'authenticated'
  );
