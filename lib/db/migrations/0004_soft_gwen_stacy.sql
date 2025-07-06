ALTER TABLE "account" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "emailVerified" timestamp;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "department";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "role";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "is_active";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "updated_at";