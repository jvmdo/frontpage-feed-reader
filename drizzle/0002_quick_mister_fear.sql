CREATE TABLE "feed_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"feed_id" bigint NOT NULL,
	"guid" text NOT NULL,
	"url" text,
	"title" text,
	"description" text,
	"content" text,
	"author" text,
	"published_at" timestamp,
	"updated_at" timestamp,
	"raw_payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feed_items_feed_id_guid_unique" UNIQUE("feed_id","guid")
);
--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feed_items_feed_published" ON "feed_items" USING btree ("feed_id","published_at" DESC NULLS LAST);