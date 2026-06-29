-- Migration: add source_app and user_name columns for wexia-widget public endpoint
-- Run in Supabase SQL editor before using /api/feedback-public

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS source_app text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS user_name  text DEFAULT NULL;

-- Allow unauthenticated inserts from the widget (auth happens via x-wexia-key on server side)
-- The existing service_role SELECT policy stays as-is.
-- If "Authenticated users can insert feedback" policy doesn't cover anon calls through the
-- server-side route (which uses service_role), this is not needed — service_role bypasses RLS.
-- Listed here for documentation purposes only.
