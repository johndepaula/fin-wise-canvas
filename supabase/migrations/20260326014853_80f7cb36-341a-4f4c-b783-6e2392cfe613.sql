CREATE TABLE public.user_location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_location ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own location" ON public.user_location FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own location" ON public.user_location FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own location" ON public.user_location FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own location" ON public.user_location FOR DELETE TO authenticated USING (auth.uid() = user_id);