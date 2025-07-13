ALTER TABLE "asset_assignments" ADD COLUMN "building" varchar(100);--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "floor" varchar(20);--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "room" varchar(50);--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "desk" varchar(50);--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "location_notes" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_assignments_building_idx" ON "asset_assignments" USING btree ("building");