CREATE TABLE public.monthly_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month text NOT NULL,
  closed_at timestamp with time zone NOT NULL DEFAULT now(),
  records jsonb NOT NULL DEFAULT '[]'::jsonb,
  bills jsonb NOT NULL DEFAULT '[]'::jsonb,
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, month)
);

ALTER TABLE public.monthly_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own closures"
  ON public.monthly_closures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own closures"
  ON public.monthly_closures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own closures"
  ON public.monthly_closures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_monthly_closures_user_month ON public.monthly_closures(user_id, month DESC);