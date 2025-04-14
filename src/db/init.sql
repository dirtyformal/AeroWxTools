CREATE TABLE IF NOT EXISTS metar_history (
    id SERIAL PRIMARY KEY,
    icao VARCHAR(4) NOT NULL,
    time VARCHAR(7) NOT NULL,
    observation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    raw_metar TEXT NOT NULL,
    decoded JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT metar_history_icao_observation_key UNIQUE (icao, observation_time)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_metar_history_icao ON metar_history(icao);
CREATE INDEX IF NOT EXISTS idx_metar_history_time ON metar_history(time);
CREATE INDEX IF NOT EXISTS idx_metar_history_observation ON metar_history(observation_time);
CREATE INDEX IF NOT EXISTS idx_metar_history_jsonb ON metar_history USING gin (decoded);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE metar_history TO metar_user;
GRANT USAGE, SELECT ON SEQUENCE metar_history_id_seq TO metar_user;