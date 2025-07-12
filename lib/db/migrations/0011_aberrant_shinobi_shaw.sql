ALTER TYPE "asset_status" ADD VALUE 'in_stock';--> statement-breakpoint
ALTER TYPE "asset_status" ADD VALUE 'deployed';--> statement-breakpoint
ALTER TYPE "asset_status" ADD VALUE 'in_repair';--> statement-breakpoint
ALTER TYPE "asset_status" ADD VALUE 'delivered';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE 'it_staff';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE 'end_user';--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "status" SET DEFAULT 'in_stock';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'end_user';