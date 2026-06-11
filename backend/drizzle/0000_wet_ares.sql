CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone_number" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"external_agent_id" text NOT NULL,
	"phone_number" text NOT NULL,
	"simulation_prompt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"target_kind" text NOT NULL,
	"target_label" text NOT NULL,
	"target_phone_number" text NOT NULL,
	"provider" text DEFAULT 'dial' NOT NULL,
	"external_call_id" text,
	"status" text NOT NULL,
	"transcript" text,
	"audio_url" text,
	"duration_seconds" integer,
	"overall_score" integer,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"criterion_id" text NOT NULL,
	"passed" boolean NOT NULL,
	"score" integer NOT NULL,
	"justification" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scores_run_criterion_unique" UNIQUE("run_id","criterion_id")
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"name" text NOT NULL,
	"scenario_summary" text NOT NULL,
	"tester_instruction" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competitors_agent_id_idx" ON "competitors" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "runs_test_id_idx" ON "runs" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "runs_external_call_id_idx" ON "runs" USING btree ("external_call_id");--> statement-breakpoint
CREATE INDEX "runs_status_idx" ON "runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scores_run_id_idx" ON "scores" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "tests_agent_id_idx" ON "tests" USING btree ("agent_id");