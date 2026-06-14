-- Přidej sloupec notes do tabulky feedback
-- Každá poznámka: { author: string, at: ISO timestamp, text: string }
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS notes jsonb DEFAULT '[]';
