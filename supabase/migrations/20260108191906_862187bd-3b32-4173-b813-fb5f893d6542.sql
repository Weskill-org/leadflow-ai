-- Create the missing referral_codes table that handle_email_verification trigger depends on
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_referrals integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral code
CREATE POLICY "Users can view own referral code"
ON public.referral_codes
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_referral_code ON public.referral_codes(referral_code);