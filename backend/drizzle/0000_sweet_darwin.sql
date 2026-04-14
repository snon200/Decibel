CREATE TYPE "public"."currency" AS ENUM('USD', 'ILS');--> statement-breakpoint
CREATE TABLE "accounts" (
	"account_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"balance_amount" numeric NOT NULL,
	"balance_currency" "currency" NOT NULL,
	"daily_withdrawal_limit_amount" numeric NOT NULL,
	"daily_withdrawal_limit_currency" "currency" NOT NULL,
	"active_flag" boolean DEFAULT true NOT NULL,
	"create_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"person_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"document" varchar NOT NULL,
	"birth_date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"value_amount" numeric NOT NULL,
	"value_currency" "currency" NOT NULL,
	"transaction_date" timestamp DEFAULT now() NOT NULL
);
