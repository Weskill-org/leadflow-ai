-- Add RLS policies for platform admin access to discount_codes
DROP POLICY IF EXISTS "Platform admins can manage discount codes" ON public.discount_codes;
CREATE POLICY "Platform admins can manage discount codes"
ON public.discount_codes FOR ALL
USING (is_platform_admin(auth.uid()));

-- Add RLS policies for platform admin access to gift_cards
DROP POLICY IF EXISTS "Platform admins can manage gift cards" ON public.gift_cards;
CREATE POLICY "Platform admins can manage gift cards"
ON public.gift_cards FOR ALL
USING (is_platform_admin(auth.uid()));

-- Add platform admin update access to wallets
DROP POLICY IF EXISTS "Platform admins can update wallets" ON public.wallets;
CREATE POLICY "Platform admins can update wallets"
ON public.wallets FOR UPDATE
USING (is_platform_admin(auth.uid()));

-- Add platform admin insert access to wallet_transactions
DROP POLICY IF EXISTS "Platform admins can insert transactions" ON public.wallet_transactions;
CREATE POLICY "Platform admins can insert transactions"
ON public.wallet_transactions FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()));

-- Add platform admin view access to all wallets
DROP POLICY IF EXISTS "Platform admins can view all wallets" ON public.wallets;
CREATE POLICY "Platform admins can view all wallets"
ON public.wallets FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Add platform admin view access to all wallet_transactions
DROP POLICY IF EXISTS "Platform admins can view all transactions" ON public.wallet_transactions;
CREATE POLICY "Platform admins can view all transactions"
ON public.wallet_transactions FOR SELECT
USING (is_platform_admin(auth.uid()));