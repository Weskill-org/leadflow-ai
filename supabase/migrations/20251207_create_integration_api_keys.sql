create table if not exists public.integration_api_keys (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    service_name text not null,
    api_key text not null,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    constraint integration_api_keys_pkey primary key (id)
);

-- Enable RLS
alter table public.integration_api_keys enable row level security;

-- Create policies
create policy "Users can view their own integration keys"
    on public.integration_api_keys for select
    using (auth.uid() = user_id);

create policy "Users can insert their own integration keys"
    on public.integration_api_keys for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own integration keys"
    on public.integration_api_keys for update
    using (auth.uid() = user_id);

create policy "Users can delete their own integration keys"
    on public.integration_api_keys for delete
    using (auth.uid() = user_id);

-- Add indexes
create index if not exists integration_api_keys_user_id_idx on public.integration_api_keys(user_id);
create index if not exists integration_api_keys_service_name_idx on public.integration_api_keys(service_name);
