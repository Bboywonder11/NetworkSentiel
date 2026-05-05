
CREATE TABLE public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_select" ON public.blocked_ips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.blocked_ips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.blocked_ips FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX ON public.blocked_ips (user_id, created_at DESC);
