-- Set admin@weskill.org as Company (Super Admin)
UPDATE public.user_roles 
SET role = 'company' 
WHERE user_id = (
    SELECT id FROM public.profiles WHERE email = 'admin@weskill.org'
);

-- Also set their manager_id to null (they're at the top)
UPDATE public.profiles 
SET manager_id = NULL 
WHERE email = 'admin@weskill.org';