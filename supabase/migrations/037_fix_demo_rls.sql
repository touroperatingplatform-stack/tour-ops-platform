-- Migration: Fix RLS policies for demo compatibility
-- Created: 2026-04-02
-- Issue: demo V3 runs as super_admin but inserts records with guide_id
-- Fix: Allow super_admin to INSERT checklist_completions and cash_confirmations

-- Drop existing restrictive INSERT policies
DROP POLICY IF EXISTS "guide_insert_checklist_completions" ON checklist_completions;
DROP POLICY IF EXISTS "guide_insert_cash_confirmations" ON cash_confirmations;

-- Create new INSERT policy: guide OR super_admin can insert
CREATE POLICY "guide_or_admin_insert_checklist_completions"
  ON checklist_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('guide', 'super_admin')
    )
  );

CREATE POLICY "guide_or_admin_insert_cash_confirmations"
  ON cash_confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('guide', 'super_admin')
    )
  );
