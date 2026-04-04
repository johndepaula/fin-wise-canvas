-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(referred_user_id)
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
-- Only the trigger should be able to insert, so we don't need to add an INSERT policy for users.

-- Generate unique codes for any existing users
UPDATE public.profiles 
SET referral_code = 'USER' || UPPER(SUBSTRING(MD5(id::text), 1, 6))
WHERE referral_code IS NULL;

-- Make referral_code required going forward (optional step, but good practice since trigger handles it)
-- ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;

-- Update the handle_new_user trigger to generate a unique code and handle the refernce
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_referral_code TEXT;
    provided_code TEXT;
    referrer_id UUID;
BEGIN
    -- Generate unique referral code for the new user (e.g. USER123456)
    new_referral_code := 'USER' || UPPER(SUBSTRING(MD5(NEW.id::text), 1, 6));

    -- Insert into profiles
    INSERT INTO public.profiles (id, display_name, avatar_url, referral_code)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'avatar_url', new_referral_code);

    -- Check if a referral code was provided during signup
    provided_code := NEW.raw_user_meta_data->>'referral_code';
    IF provided_code IS NOT NULL AND provided_code != '' THEN
        -- Find the referrer
        SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = provided_code LIMIT 1;
        
        -- If referrer exists, create referral record
        IF referrer_id IS NOT NULL THEN
            INSERT INTO public.referrals (referrer_user_id, referred_user_id, referral_code)
            VALUES (referrer_id, NEW.id, provided_code);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
