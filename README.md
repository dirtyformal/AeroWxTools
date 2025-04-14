# METAR Processing System Architecture

## Data Flow Diagram

```mermaid

graph LR
    subgraph "Data Flow"
        VATSIM[VATSIM API] --> Fetch[Fetch Service]
        Fetch --> Decode[METAR Decoder]
        Decode --> Valid{Validate}
        Valid --> |Yes| Cache[Redis Cache]
        Valid --> |Yes| Store[PostgreSQL Store]
        Cache --> |Hit| Return[Return Data]
        Cache --> |Miss| Fetch
        Store --> |Query| History[Historical Data]
    end

    subgraph "Services"
        MetarService --> CacheService
        MetarService --> DatabaseService
        MetarService --> MetarDecoder
    end

    subgraph "Storage"
        Redis[(Redis JSON)]
        Postgres[(PostgreSQL JSONB)]
    end

```

## Full Data Flow

```mermaid
graph TB
    subgraph External["External Services"]
        VATSIM[VATSIM METAR API]
    end

    subgraph Processing["METAR Processing"]
        Fetch[Fetch Raw METAR]
        Decode[Decode METAR]
        Validate[Validate Data]
    end

    subgraph Redis["Redis Layer"]
        RC[(Redis Cache)]
        RJ[(Redis JSON Store)]
        subgraph Redis_Keys["Key Structure"]
            CK[/"metar:${icao}:raw"/]
            JK[/"metar:${icao}:${time}:json"/]
            HK[/"metar:${icao}:history"/]
        end
    end

    subgraph Postgres["PostgreSQL Layer"]
        PG[(PostgreSQL)]
        subgraph Tables["Database Schema"]
            MT["metar_history
            - id (SERIAL)
            - icao (VARCHAR)
            - time (VARCHAR)
            - observation_time (TIMESTAMP)
            - raw_metar (TEXT)
            - decoded (JSONB)
            - created_at (TIMESTAMP)"]
        end
    end

    subgraph DataLifecycle["Data Lifecycle"]
        Current["Current METAR Data
        (Redis - 24h TTL)"]
        Historical["Historical Data
        (PostgreSQL - Permanent)"]
    end

    %% Flow Connections
    VATSIM -->|Raw METAR| Fetch
    Fetch -->|Validation| Validate
    Validate -->|Success| Decode
    Decode -->|JSON| RC
    Decode -->|Full JSON| RJ
    RC -->|Cache Hit| Current
    RJ -->|JSON Query| Current
    Current -->|Expire| Historical
    Historical -->|Archive| PG

    %% Special Notes
    classDef note fill:#f9f,stroke:#333,stroke-width:2px;
    class DataLifecycle,Redis_Keys note;
```

## System Components

### 1. Data Collection

- VATSIM METAR API polling (every 1 minute)
- Raw METAR validation
- Structured data parsing

### 2. Redis Layer (Short-term Storage)

- **Current Data Storage**
  - Raw METAR caching
  - Full JSON storage of decoded data
  - 24-hour retention policy
- **Key Structure**
  - `metar:${icao}:raw` - Raw METAR string
  - `metar:${icao}:${time}:json` - Full JSON data
  - `metar:${icao}:history` - Recent history (last 24h)

### 3. PostgreSQL Layer (Long-term Storage)

- **Table Structure**
  ```sql
  CREATE TABLE metar_history (
      id SERIAL PRIMARY KEY,
      icao VARCHAR(4) NOT NULL,
      time VARCHAR(7) NOT NULL,
      observation_time TIMESTAMP WITH TIME ZONE NOT NULL,
      raw_metar TEXT NOT NULL,
      decoded JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT metar_history_icao_observation_key UNIQUE (icao, observation_time)
  );
  ```
- Indexed for efficient querying
- JSONB for flexible schema evolution

### 4. Data Lifecycle Management

- **Current Data (Redis)**
  - High-speed access
  - Full JSON structure
  - Real-time updates
- **Historical Data (PostgreSQL)**
  - Long-term storage with accurate timestamps
  - Proper handling of day/month rollovers
  - Query capabilities by actual observation time
  - Data analysis support

### 5. Error Handling

- Connection retry logic
- Data validation
- Transaction management
- Comprehensive logging

## Benefits

1. **Performance**: Fast access to current data via Redis
2. **Flexibility**: Schema-less JSON storage for METAR variations
3. **Reliability**: Persistent storage in PostgreSQL
4. **Scalability**: Separate concerns for different data lifecycles
5. **Maintainability**: Clear separation of responsibilities
