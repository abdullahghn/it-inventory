ALTER TYPE "asset_status" ADD VALUE 'available';--> statement-breakpoint
ALTER TYPE "asset_status" ADD VALUE 'assigned';--> statement-breakpoint
ALTER TYPE "asset_status" ADD VALUE 'maintenance';--> statement-breakpoint
ALTER TYPE "asset_status" ADD VALUE 'repair';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE 'super_admin';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE 'user';--> statement-breakpoint
ALTER TYPE "user_role" ADD VALUE 'viewer';--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "status" SET DEFAULT 'available';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';