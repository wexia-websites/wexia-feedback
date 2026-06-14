ALTER TABLE feedback ADD COLUMN IF NOT EXISTS source_app text DEFAULT 'AI Laboratoř';
UPDATE feedback SET source_app = 'AI Laboratoř' WHERE source_app IS NULL;
