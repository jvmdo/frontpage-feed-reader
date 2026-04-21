CREATE TABLE "user_item_states" (
	"user_id" text NOT NULL,
	"item_id" bigint NOT NULL,
	"read_at" timestamp,
	"bookmarked_at" timestamp,
	CONSTRAINT "user_item_states_user_id_item_id_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"layout" text DEFAULT 'list',
	"refresh_interval" integer DEFAULT 300,
	"ordering" text DEFAULT 'newest',
	"extra_settings" jsonb,
	"marked_all_read_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_item_states" ADD CONSTRAINT "user_item_states_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_item_states" ADD CONSTRAINT "user_item_states_item_id_feed_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."feed_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_item_states_bookmarks" ON "user_item_states" USING btree ("user_id") WHERE "user_item_states"."bookmarked_at" IS NOT NULL;