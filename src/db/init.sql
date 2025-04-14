-- Create METAR history table
CREATE TABLE IF NOT EXISTS metar_history (
    id SERIAL PRIMARY KEY,
    icao VARCHAR(4) NOT NULL,
    raw_metar TEXT NOT NULL,
    time VARCHAR(7) NOT NULL,
    wind_direction INTEGER,
    wind_speed INTEGER,
    visibility INTEGER,
    temperature DECIMAL(4,1),
    dewpoint DECIMAL(4,1),
    qnh DECIMAL(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT metar_history_icao_time_key UNIQUE (icao, time)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_metar_history_icao ON metar_history(icao);
CREATE INDEX IF NOT EXISTS idx_metar_history_time ON metar_history(time);
CREATE INDEX IF NOT EXISTS idx_metar_history_created_at ON metar_history(created_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE metar_history TO metar_user;
GRANT USAGE, SELECT ON SEQUENCE metar_history_id_seq TO metar_user;