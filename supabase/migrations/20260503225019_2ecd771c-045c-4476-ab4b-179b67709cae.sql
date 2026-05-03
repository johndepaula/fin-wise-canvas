
-- Fix logos bucket policies: scope to authenticated users + own folder
DROP POLICY IF EXISTS "Allow upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow read logos" ON storage.objects;

CREATE POLICY "Users can read own logos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add DELETE policy for avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Restrict avatars listing: keep public read but only listing won't apply to private use
-- (avatars bucket is public for read of individual files; that's intended)

-- Add policies for private 'files' bucket scoped to user folder
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add policies for private 'public' bucket scoped to user folder
CREATE POLICY "Users can read own public-bucket files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'public' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own public-bucket files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'public' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own public-bucket files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'public' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own public-bucket files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'public' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Revoke EXECUTE on SECURITY DEFINER functions from anon and authenticated.
-- These functions are only used as triggers and should not be callable via API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, public;

-- Enable leaked password protection
