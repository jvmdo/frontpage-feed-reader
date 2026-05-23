ALTER TABLE "user_preferences" ALTER COLUMN "refresh_interval" SET DEFAULT 900;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "refresh_interval" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "layout";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "ordering";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "extra_settings";