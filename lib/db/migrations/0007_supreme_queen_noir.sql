CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"employee_id" varchar(50),
	"department" varchar(100),
	"role" varchar(50) DEFAULT 'user',
	"phone" varchar(20),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profiles_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_profiles_user_id_idx" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_profiles_role_idx" ON "user_profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_profiles_department_idx" ON "user_profiles" USING btree ("department");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_profiles_is_active_idx" ON "user_profiles" USING btree ("is_active");