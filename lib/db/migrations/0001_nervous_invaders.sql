ALTER TABLE "accounts" RENAME TO "account";--> statement-breakpoint
ALTER TABLE "sessions" RENAME TO "session";--> statement-breakpoint
ALTER TABLE "verification_tokens" RENAME TO "verification_token";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "sessions_session_token_unique";--> statement-breakpoint
ALTER TABLE "verification_token" DROP CONSTRAINT "verification_tokens_token_unique";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "accounts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "sessions_user_id_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_session_token_unique" UNIQUE("session_token");--> statement-breakpoint
ALTER TABLE "verification_token" ADD CONSTRAINT "verification_token_token_unique" UNIQUE("token");