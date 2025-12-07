-- Create weekly_plans table
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create completed_sets table
CREATE TABLE IF NOT EXISTS public.completed_sets (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_sets ENABLE ROW LEVEL SECURITY;

-- Create policies to allow users to access only their own data
CREATE POLICY "Users can view their own weekly plans"
  ON public.weekly_plans
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own weekly plans"
  ON public.weekly_plans
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own weekly plans"
  ON public.weekly_plans
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can view their own completed sets"
  ON public.completed_sets
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own completed sets"
  ON public.completed_sets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own completed sets"
  ON public.completed_sets
  FOR UPDATE
  USING (true);
