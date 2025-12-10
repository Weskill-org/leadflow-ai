-- Update handle_new_user to accept manager_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _manager_id UUID;
BEGIN
  -- Extract manager_id from metadata if present
  _manager_id := (NEW.raw_user_meta_data ->> 'manager_id')::UUID;

  INSERT INTO public.profiles (id, email, full_name, manager_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    _manager_id
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'bde');
  
  RETURN NEW;
END;
$$;

-- Drop existing policies to recreate them with better logic
DROP POLICY IF EXISTS "Users can view profiles in their hierarchy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Simplified Profile Access Policies

-- 1. View: Users can view themselves
-- (Already exists: "Users can view own profile")

-- 2. View: Company Admins and SubAdmins can view everyone
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'company') OR
    public.has_role(auth.uid(), 'company_subadmin')
  );

-- 3. View: Managers can view their hierarchy (downwards)
CREATE POLICY "Managers can view subordinates"
  ON public.profiles FOR SELECT
  USING (
    public.is_in_hierarchy(auth.uid(), id)
  );

-- 4. Update: Managers can update their subordinates
-- (Excludes updating themselves via this policy, covered by "Users can update own profile")
CREATE POLICY "Managers can update subordinates"
  ON public.profiles FOR UPDATE
  USING (
    public.is_in_hierarchy(auth.uid(), id)
  );

-- User Roles Policies

-- 1. View: Everyone can view their own role
-- (Already exists: "Users can view own role")

-- 2. View: Admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'company') OR
    public.has_role(auth.uid(), 'company_subadmin')
  );

-- 3. View: Managers can view roles of their hierarchy
CREATE POLICY "Managers can view subordinate roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = public.user_roles.user_id
      AND public.is_in_hierarchy(auth.uid(), id)
    )
  );

-- 4. Manage: Admins can manage all roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (
    public.has_role(auth.uid(), 'company') OR
    public.has_role(auth.uid(), 'company_subadmin')
  );

-- 5. Manage: Managers can assign/update roles for subordinates
-- They can only assign roles if they are in the hierarchy of the target user
-- AND the target user is NOT themselves (prevent self-promotion if not guarded elsewhere)
-- Note: The specific role level check (can't promote above self) is handled in application logic 
-- but could be enforced here if we had a stored function for role levels. 
-- For now, we rely on is_in_hierarchy which ensures they are a descendant.
CREATE POLICY "Managers can manage subordinate roles"
  ON public.user_roles FOR ALL
  USING (
     EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = public.user_roles.user_id
      AND public.is_in_hierarchy(auth.uid(), id)
      AND id != auth.uid() -- Cannot manage own role via this policy
    )
  );
