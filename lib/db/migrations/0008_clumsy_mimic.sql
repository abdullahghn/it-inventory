DO $$ BEGIN
 CREATE TYPE "public"."asset_category" AS ENUM('laptop', 'desktop', 'monitor', 'printer', 'phone', 'tablet', 'server', 'network_device', 'software_license', 'furniture', 'accessory', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."asset_condition" AS ENUM('excellent', 'good', 'fair', 'poor', 'damaged');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."asset_status" AS ENUM('available', 'assigned', 'maintenance', 'repair', 'retired', 'lost', 'stolen');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."assignment_status" AS ENUM('active', 'returned', 'overdue', 'lost');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'assign', 'return', 'maintenance', 'login', 'logout');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."maintenance_type" AS ENUM('preventive', 'corrective', 'upgrade', 'repair', 'inspection', 'emergency');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'manager', 'user', 'viewer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"user_id" text,
	"user_email" varchar(255),
	"session_id" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" jsonb,
	"description" text,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"building" varchar(100) NOT NULL,
	"floor" varchar(20),
	"room" varchar(50),
	"description" text,
	"capacity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "user_profiles";--> statement-breakpoint
ALTER TABLE "asset_assignments" DROP CONSTRAINT "asset_assignments_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "asset_assignments" DROP CONSTRAINT "asset_assignments_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP CONSTRAINT "maintenance_records_asset_id_assets_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "assets_type_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "assets_location_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "maintenance_records_performed_at_idx";--> statement-breakpoint
ALTER TABLE "asset_assignments" ALTER COLUMN "asset_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ALTER COLUMN "assigned_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "purchase_price" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "status" SET DATA TYPE asset_status;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "condition" SET DATA TYPE asset_condition;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "condition" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "asset_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "type" SET DATA TYPE maintenance_type;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "cost" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "status" "assignment_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "expected_return_at" timestamp;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "actual_return_condition" "asset_condition";--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "purpose" varchar(255);--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "assigned_by" text;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "returned_by" text;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "return_notes" text;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_assignments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "asset_tag" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "category" "asset_category" NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "subcategory" varchar(100);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "specifications" jsonb;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "current_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "depreciation_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "building" varchar(100);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "floor" varchar(20);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "room" varchar(50);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "desk" varchar(50);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "location_notes" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "priority" varchar(20) DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "vendor" varchar(255);--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "technician" varchar(255);--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "labor_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "parts_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "condition_before" "asset_condition";--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "condition_after" "asset_condition";--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "work_order_number" varchar(100);--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "warranty_work" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "parts_replaced" text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "department" varchar(100);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "job_title" varchar(100);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "employee_id" varchar(50);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_idx" ON "audit_logs" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_id_idx" ON "audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_ip_address_idx" ON "audit_logs" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_composite_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_building_idx" ON "locations" USING btree ("building");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_room_idx" ON "locations" USING btree ("room");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_is_active_idx" ON "locations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_composite_idx" ON "locations" USING btree ("building","floor","room");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_returned_by_user_id_fk" FOREIGN KEY ("returned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_assignments_status_idx" ON "asset_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_assignments_expected_return_at_idx" ON "asset_assignments" USING btree ("expected_return_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_assignments_assigned_by_idx" ON "asset_assignments" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_asset_tag_idx" ON "assets" USING btree ("asset_tag");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_category_idx" ON "assets" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_building_idx" ON "assets" USING btree ("building");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_is_deleted_idx" ON "assets" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_created_by_idx" ON "assets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_warranty_expiry_idx" ON "assets" USING btree ("warranty_expiry");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_records_priority_idx" ON "maintenance_records" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_records_scheduled_at_idx" ON "maintenance_records" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_records_completed_at_idx" ON "maintenance_records" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_records_next_scheduled_at_idx" ON "maintenance_records" USING btree ("next_scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_records_is_completed_idx" ON "maintenance_records" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_records_created_by_idx" ON "maintenance_records" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_records_work_order_number_idx" ON "maintenance_records" USING btree ("work_order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_employee_id_idx" ON "user" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_department_idx" ON "user" USING btree ("department");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_is_active_idx" ON "user" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
ALTER TABLE "assets" DROP COLUMN IF EXISTS "location";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN IF EXISTS "performed_at";--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_asset_tag_unique" UNIQUE("asset_tag");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_employee_id_unique" UNIQUE("employee_id");