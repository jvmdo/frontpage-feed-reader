# Database design

## Overview

This schema is designed to work alongside Better Auth. It uses a "Cascading Watermark Pattern" to achieve O(1) performance for "Mark all as read" operations, and a "Sparse State" pattern for individual item states to prevent junction table bloat.

## Tables

```sql
feeds (
    id                  BIGSERIAL PRIMARY KEY,
    url                 TEXT NOT NULL UNIQUE,
    title               TEXT,
    description         TEXT,
    language            TEXT,
    icon_url            TEXT, 

    last_fetched_at     TIMESTAMP,
    last_success_at     TIMESTAMP,
    last_failure_at     TIMESTAMP,

    health_status       TEXT NOT NULL DEFAULT 'unknown', -- ('healthy', 'failing', 'unreachable', 'unknown')

    http_etag           TEXT,
    http_last_modified  TEXT,

    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);
```

```sql
categories (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    
    -- Watermark for "Mark category as read"
    marked_all_read_at  TIMESTAMP,  
    
    created_at          TIMESTAMP DEFAULT now(),

    UNIQUE(user_id, name)
);
```

```sql
subscriptions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    feed_id             BIGINT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
    category_id         BIGINT REFERENCES categories(id) ON DELETE SET NULL,

    custom_title        TEXT, -- user override
    ordering            INTEGER,

    -- Watermark for "Mark feed as read"
    marked_all_read_at  TIMESTAMP, 

    created_at          TIMESTAMP DEFAULT now(),

    UNIQUE(user_id, feed_id)
);
```

```sql
feed_items (
    id                  BIGSERIAL PRIMARY KEY,
    feed_id             BIGINT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,

    guid                TEXT NOT NULL,
    url                 TEXT,
    title               TEXT,
    description         TEXT,
    content             TEXT,
    author              TEXT,

    published_at        TIMESTAMP,
    updated_at          TIMESTAMP,

    raw_payload         JSONB,

    created_at          TIMESTAMP DEFAULT now(),

    UNIQUE(feed_id, guid)
);
```

```sql
-- Note: Only insert a row when a user triggers one of these two actions.
-- If a user un-bookmarks an item and read_at is null, you should delete the row entirely.
CREATE TABLE user_item_states (
    user_id             TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    item_id             BIGINT NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,

    read_at             TIMESTAMP,      -- If not null, it's explicitly read
    bookmarked_at       TIMESTAMP,      -- If not null, it's saved for later

    PRIMARY KEY (user_id, item_id)
);
```

```sql
CREATE TABLE user_preferences (
    user_id             TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,

    layout              TEXT DEFAULT 'list',
    refresh_interval    INTEGER DEFAULT 300,
    ordering            TEXT DEFAULT 'newest',
    extra_settings      JSONB,
    
    -- Watermark for global "Mark all as read"
    marked_all_read_at  TIMESTAMP,  

    updated_at          TIMESTAMP DEFAULT now()
);
```

## Indexes

**Main Feed Query Optimization.**

This is the most critical index in the app. It allows efficient retrieval of items sorted by date for a specific feed, which is required when building the chronological dashboard across multiple subscriptions.

```sql
CREATE INDEX idx_feed_items_feed_published 
ON feed_items(feed_id, published_at DESC);
```

**Foreign Key Lookups.**

Speeds up queries fetching all subscriptions or categories for a specific user.

```sql
CREATE INDEX idx_subscriptions_user 
ON subscriptions(user_id);

CREATE INDEX idx_categories_user 
ON categories(user_id);
```

**Bookmarks / Saved View.**

The primary key on user_item_states covers (user_id, item_id), but this partial index allows lightning-fast retrieval specifically for the "Saved" reading list.

```sql
CREATE INDEX idx_user_item_states_bookmarks 
ON user_item_states(user_id) 
WHERE bookmarked_at IS NOT NULL;
```
