-- Create automations table
create table if not exists public.automations (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    name text not null,
    trigger_type text not null, -- e.g., 'lead_created', 'status_changed'
    trigger_config jsonb default '{}'::jsonb, -- e.g., { "from_status": "new", "to_status": "contacted" }
    action_type text not null, -- e.g., 'send_email', 'webhook', 'whatsapp_message'
    action_config jsonb default '{}'::jsonb, -- e.g., { "template_id": "welcome_email", "webhook_url": "..." }
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    constraint automations_pkey primary key (id)
);

-- Create automation_logs table to track execution
create table if not exists public.automation_logs (
    id uuid not null default gen_random_uuid(),
    automation_id uuid not null references public.automations(id) on delete cascade,
    status text not null, -- 'success', 'failed', 'pending'
    logs text,
    created_at timestamp with time zone default now(),
    constraint automation_logs_pkey primary key (id)
);

-- Enable RLS
alter table public.automations enable row level security;
alter table public.automation_logs enable row level security;

-- Policies for automations
create policy "Users can view their own automations"
    on public.automations for select
    using (auth.uid() = user_id);

create policy "Users can insert their own automations"
    on public.automations for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own automations"
    on public.automations for update
    using (auth.uid() = user_id);

create policy "Users can delete their own automations"
    on public.automations for delete
    using (auth.uid() = user_id);

-- Policies for automation_logs
-- Users should be able to see logs for their automations
create policy "Users can view logs for their own automations"
    on public.automation_logs for select
    using (
        exists (
            select 1 from public.automations
            where public.automations.id = public.automation_logs.automation_id
            and public.automations.user_id = auth.uid()
        )
    );
