ALTER TABLE "feed_items" ADD COLUMN "text_content" text;--> statement-breakpoint
CREATE INDEX "idx_feed_items_search" ON "feed_items" USING gin ((
        setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("description", '')), 'B') ||
        setweight(to_tsvector('english', coalesce("text_content", '')), 'C')
      ));