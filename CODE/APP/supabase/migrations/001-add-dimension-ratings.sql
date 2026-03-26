-- Add dimension_ratings column to match_feedback
-- Stores per-dimension ratings (0-1) from post-meeting feedback
-- Used by the learning engine to personalize matching weights
alter table public.match_feedback
  add column if not exists dimension_ratings jsonb default null;

-- Add index for faster feedback lookups by user
create index if not exists idx_match_feedback_user_id
  on public.match_feedback(user_id);

-- Add index for faster feedback lookups by match
create index if not exists idx_match_feedback_match_id
  on public.match_feedback(match_id);
