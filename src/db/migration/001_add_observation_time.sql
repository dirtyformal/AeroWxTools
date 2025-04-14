BEGIN;

-- Add new column without NOT NULL constraint first
ALTER TABLE metar_history 
ADD COLUMN IF NOT EXISTS observation_time TIMESTAMP WITH TIME ZONE;

-- Update existing records with calculated observation time
UPDATE metar_history
SET observation_time = (
    to_timestamp(
        EXTRACT(YEAR FROM created_at)::text || 
        EXTRACT(MONTH FROM created_at)::text || 
        substring(time, 1, 2) || ' ' ||
        substring(time, 3, 2) || ':' ||
        substring(time, 5, 2),
        'YYYYMMDD HH24:MI'
    )
)
WHERE observation_time IS NULL;

-- Add NOT NULL constraint after data migration
ALTER TABLE metar_history 
ALTER COLUMN observation_time SET NOT NULL;

-- Add new index
CREATE INDEX IF NOT EXISTS idx_metar_history_observation 
ON metar_history(observation_time);

-- Update unique constraint
ALTER TABLE metar_history
DROP CONSTRAINT IF EXISTS metar_history_icao_time_key;

ALTER TABLE metar_history
ADD CONSTRAINT metar_history_icao_observation_key 
UNIQUE (icao, observation_time);

COMMIT;