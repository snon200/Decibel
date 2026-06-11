import * as CounterDal from "../dal/counter.ts";
import type { Counter } from "../database/schemas/counter.ts";

export const getCounter = (): Promise<Counter> => CounterDal.getCounter();

export const incrementCounter = (): Promise<Counter> =>
	CounterDal.adjustCounter(1);

export const decrementCounter = (): Promise<Counter> =>
	CounterDal.adjustCounter(-1);
