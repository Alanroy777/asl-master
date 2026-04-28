-- ═══════════════════════════════════════════════════════════════════════════
-- ASL V3 — Learner Progress Migration
-- Creates learner_progress table, RLS policies, and initialize_lesson_progress RPC
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create the learner_progress table
-- NOTE: learner_id is TEXT (Prisma cuid) — the app uses NextAuth+Prisma, not Supabase Auth.
CREATE TABLE IF NOT EXISTS public.learner_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id   text NOT NULL,
  lesson_id    text NOT NULL,
  sign_id      text NOT NULL,
  status       text NOT NULL DEFAULT 'locked'
                 CHECK (status IN ('locked','learned','practicing','completed')),
  score        integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  attempts     integer NOT NULL DEFAULT 0,
  learned_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT learner_progress_unique UNIQUE (learner_id, lesson_id, sign_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_learner_progress_learner_id ON public.learner_progress (learner_id);
CREATE INDEX IF NOT EXISTS idx_learner_progress_lesson_id  ON public.learner_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_learner_progress_sign_id    ON public.learner_progress (sign_id);
CREATE INDEX IF NOT EXISTS idx_learner_progress_status     ON public.learner_progress (status);

-- ─── 2. Enable Row Level Security ──────────────────────────────────────────
ALTER TABLE public.learner_progress ENABLE ROW LEVEL SECURITY;

-- NOTE: This app uses Prisma/NextAuth (not Supabase Auth), so auth.uid() is not applicable.
-- Server actions use the anon key with Row-Level Security disabled (all access controlled by
-- application logic). Enable RLS + policies below once you migrate to Supabase Auth.

-- For now: disable RLS so the anon key used in server actions can read/write.
-- IMPORTANT: tighten this once on Supabase Auth.
ALTER TABLE public.learner_progress DISABLE ROW LEVEL SECURITY;

-- Policies below are scaffolded for future Supabase Auth migration.
-- Uncomment and enable RLS when ready.

/*
DROP POLICY IF EXISTS "learner_own_rows"       ON public.learner_progress;
DROP POLICY IF EXISTS "learner_own_rows_write" ON public.learner_progress;
DROP POLICY IF EXISTS "instructor_read"        ON public.learner_progress;
DROP POLICY IF EXISTS "admin_read_all"         ON public.learner_progress;

CREATE POLICY "learner_own_rows"
  ON public.learner_progress FOR SELECT
  USING (auth.uid()::text = learner_id);

CREATE POLICY "learner_own_rows_write"
  ON public.learner_progress FOR ALL
  USING (auth.uid()::text = learner_id)
  WITH CHECK (auth.uid()::text = learner_id);

CREATE POLICY "instructor_read"
  ON public.learner_progress FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u.id = auth.uid()::text AND u.role = 'INSTRUCTOR'
  ));

CREATE POLICY "admin_read_all"
  ON public.learner_progress FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u.id = auth.uid()::text AND u.role = 'ADMIN'
  ));
*/

-- ─── 3. updated_at trigger ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_learner_progress_updated_at ON public.learner_progress;
CREATE TRIGGER trg_learner_progress_updated_at
  BEFORE UPDATE ON public.learner_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 4. RPC: initialize_lesson_progress ────────────────────────────────────
--
-- Fetches all lesson_signs for a lesson ordered by order_index,
-- creates a learner_progress row for each sign (status='locked'),
-- sets the FIRST sign's status to 'learned',
-- and skips rows that already exist (idempotent).
--
CREATE OR REPLACE FUNCTION public.initialize_lesson_progress(
  p_learner_id text,
  p_lesson_id  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec            RECORD;
  first_sign     boolean := true;
  desired_status text;
BEGIN
  -- Iterate over lesson_signs ordered by orderIndex
  FOR rec IN
    SELECT ls.id AS sign_id
    FROM public.lesson_signs ls
    WHERE ls."lessonId" = p_lesson_id
    ORDER BY ls."orderIndex" ASC
  LOOP
    desired_status := CASE WHEN first_sign THEN 'learned' ELSE 'locked' END;
    first_sign := false;

    -- Insert only if row doesn't already exist (idempotent)
    INSERT INTO public.learner_progress (
      learner_id, lesson_id, sign_id, status
    )
    VALUES (
      p_learner_id, p_lesson_id, rec.sign_id, desired_status
    )
    ON CONFLICT (learner_id, lesson_id, sign_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Grant execute to all roles (access controlled at application level)
GRANT EXECUTE ON FUNCTION public.initialize_lesson_progress(text, text)
  TO anon, authenticated, service_role;
