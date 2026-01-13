-- Update app_role Enum to include level_3 to level_20
-- We use a DO block to safely add values
DO $$
BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_3';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_4';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_5';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_6';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_7';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_8';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_9';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_10';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_11';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_12';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_13';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_14';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_15';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_16';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_17';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_18';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_19';
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'level_20';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
