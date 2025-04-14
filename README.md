# METAR Processing System Architecture

## Full Data Flow

```mermaid
graph TB
    subgraph External["External Services"]
        VATSIM[VATSIM METAR API]
    end

    subgraph Processing["METAR Processing"]
        subgraph Fetch["Fetch Layer"]
            FetchRaw[Fetch Raw METAR]
            ValidateRaw[Validate Raw Data]
            CheckCache[Check Redis Cache]
        end

        subgraph Decode["Decode Layer"]
            ParseMetar[Parse METAR]
            CreateTime[Create Observation Time]
            FormatData[Format JSON Data]
        end

        subgraph Update["Update Layer"]
            CompareData[Compare with Cache]
            UpdateCache[Update Redis]
            StoreHistory[Store in PostgreSQL]
        end
    end

    subgraph Storage["Data Storage"]
        subgraph Redis["Redis Layer"]
            RC[(Redis JSON Store)]
            Keys["Key Format:
            metar:${icao}:current"]
            TTL["TTL: 180s"]
        end

        subgraph Postgres["PostgreSQL Layer"]
            PG[(PostgreSQL)]
            Tables["metar_history Table
            - id SERIAL PK
            - icao VARCHAR(4)
            - time VARCHAR(7)
            - observation_time TIMESTAMPTZ
            - raw_metar TEXT
            - decoded JSONB
            - created_at TIMESTAMPTZ"]
            Indexes["Indexes:
            - idx_metar_history_icao
            - idx_metar_history_time
            - idx_metar_history_observation
            - idx_metar_history_jsonb"]
        end
    end

    subgraph ErrorHandling["Error Handling"]
        Retry[Connection Retry]
        Logging[Winston Logger]
        Validation[Data Validation]
    end

    %% Main Flow
    VATSIM -->|HTTP GET| FetchRaw
    FetchRaw -->|Raw METAR| ValidateRaw
    ValidateRaw -->|Valid Data| CheckCache
    CheckCache -->|Cache Miss| ParseMetar
    ParseMetar -->|Parsed Data| CreateTime
    CreateTime -->|Timestamped Data| FormatData
    FormatData -->|JSON Data| CompareData
    CompareData -->|New Data| UpdateCache
    CompareData -->|New Data| StoreHistory

    %% Cache Flow
    CheckCache -->|Cache Hit| Return[Return Cached Data]
    UpdateCache -->|Set with TTL| RC

    %% Database Flow
    StoreHistory -->|Insert/Update| PG

    %% Error Flows
    FetchRaw -.->|Error| Retry
    ParseMetar -.->|Error| Logging
    UpdateCache -.->|Error| Logging
    StoreHistory -.->|Error| Logging

    %% Styling
    classDef storage fill:#f9f,stroke:#333,stroke-width:2px;
    class RC,PG storage;
    classDef process fill:#bbf,stroke:#333;
    class FetchRaw,ParseMetar,CompareData process;
    classDef error fill:#fdd,stroke:#f66;
    class Retry,Logging,Validation error;
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
