CREATE TABLE IF NOT EXISTS "asset_counters" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "asset_category" NOT NULL,
	"next_number" integer DEFAULT 1 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_counters_category_unique" UNIQUE("category")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_counters_category_idx" ON "asset_counters" USING btree ("category");