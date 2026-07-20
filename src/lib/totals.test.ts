import { assertEquals } from "@std/assert";

import type { Operation } from "./api.ts";
import { computeTotals } from "./totals.ts";

const baseOperation: Operation = {
  account: { accountID: "acc-1", name: "Checking" },
  accountID: "acc-1",
  amount: 0,
  at: "2026-06-15T14:30:00.000Z",
  comments: "",
  operationID: "op-1",
  type: "Expense",
};

const income = (amount: number): Operation => ({
  ...baseOperation,
  amount,
  type: "Income",
});

const expense = (amount: number): Operation => ({
  ...baseOperation,
  amount,
  type: "Expense",
});

Deno.test("computeTotals sums mixed income and expense", () => {
  assertEquals(computeTotals([income(1000), expense(400), income(500)]), {
    expense: 400,
    income: 1500,
    net: 1100,
  });
});

Deno.test("computeTotals returns zeros for an empty list", () => {
  assertEquals(computeTotals([]), { expense: 0, income: 0, net: 0 });
});

Deno.test("computeTotals handles income-only", () => {
  assertEquals(computeTotals([income(700), income(300)]), {
    expense: 0,
    income: 1000,
    net: 1000,
  });
});

Deno.test("computeTotals handles expense-only with negative net", () => {
  assertEquals(computeTotals([expense(250), expense(750)]), {
    expense: 1000,
    income: 0,
    net: -1000,
  });
});
