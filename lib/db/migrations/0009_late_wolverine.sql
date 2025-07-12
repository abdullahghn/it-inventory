ALTER TYPE "asset_category" ADD VALUE 'toner';--> statement-breakpoint
DROP INDEX IF EXISTS "maintenance_records_work_order_number_idx";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN IF EXISTS "vendor";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN IF EXISTS "technician";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN IF EXISTS "cost";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN IF EXISTS "labor_cost";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN IF EXISTS "parts_cost";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN IF EXISTS "work_order_number";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN IF EXISTS "warranty_work";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN IF EXISTS "parts_replaced";