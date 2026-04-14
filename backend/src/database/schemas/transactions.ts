import type { InferSelectModel } from "drizzle-orm";
import { numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { currencyEnum } from "../../types.ts";

export const transactions = pgTable("transactions", {
	transactionId: uuid("transaction_id").defaultRandom().primaryKey(),
	accountId: uuid("account_id").notNull(),
	valueAmount: numeric("value_amount").notNull(),
	valueCurrency: currencyEnum("value_currency").notNull(),
	transactionDate: timestamp("transaction_date").notNull().defaultNow(),
});

export type Transaction = InferSelectModel<typeof transactions>;
