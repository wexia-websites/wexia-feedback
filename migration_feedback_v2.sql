-- Migration: feedback table v2
-- Run this in Supabase SQL editor:
-- https://supabase.com/dashboard/project/apernyqmipsxkrmmcuvy/sql/new

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS screenshot_url text default null,
  ADD COLUMN IF NOT EXISTS status text default 'new';
