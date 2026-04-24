-- Vendor audit questions live in the same `questions` table with audience discriminator.
ALTER TABLE questions ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'client'
    CHECK (audience IN ('client','vendor'));

UPDATE questions SET audience = 'client' WHERE audience IS NULL;

CREATE INDEX IF NOT EXISTS idx_questions_audience ON questions(audience);
