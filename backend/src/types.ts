import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

const currencyValues = ["USD", "ILS"] as const;
export const currencySchema = z.enum(currencyValues);
export const currencyEnum = pgEnum("currency", currencyValues);
export type Currency = z.infer<typeof currencySchema>;
