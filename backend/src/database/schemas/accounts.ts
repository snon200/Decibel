import type { InferSelectModel } from "drizzle-orm";
import {
	boolean,
	numeric,
	pgTable,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { currencyEnum } from "../../types.ts";

export const accounts = pgTable("accounts", {
	accountId: uuid("account_id").defaultRandom().primaryKey(),
	personId: uuid("person_id").notNull(),
	balanceAmount: numeric("balance_amount").notNull(),
	balanceCurrency: currencyEnum("balance_currency").notNull(),
	dailyWithdrawalLimitAmount: numeric(
		"daily_withdrawal_limit_amount",
	).notNull(),
	dailyWithdrawalLimitCurrency: currencyEnum(
		"daily_withdrawal_limit_currency",
	).notNull(),
	activeFlag: boolean("active_flag").notNull().default(true),
	createDate: timestamp("create_date").notNull().defaultNow(),
});

export type Account = InferSelectModel<typeof accounts>;
