CREATE TABLE public.ai_commands_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  command text NOT NULL,
  action_type text NOT NULL,
  response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_commands_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own commands" ON public.ai_commands_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own commands" ON public.ai_commands_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);