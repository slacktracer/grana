import type { Operation } from "./api.ts";

export const computeTotals = (
  operations: Operation[],
): { expense: number; income: number; net: number } => {
  const income = operations
    .filter((op) => op.type === "Income")
    .reduce((sum, op) => sum + op.amount, 0);

  const expense = operations
    .filter((op) => op.type === "Expense")
    .reduce((sum, op) => sum + op.amount, 0);

  return { expense, income, net: income - expense };
};
