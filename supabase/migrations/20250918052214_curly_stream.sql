/*
  # Add text content support to notes table

  1. Changes
    - Add `text_content` column to notes table for text alongside images
    - Allow teachers to include both text and images in their notes

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add text_content column to notes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'text_content'
  ) THEN
    ALTER TABLE public.notes ADD COLUMN text_content TEXT;
  END IF;
END $$;