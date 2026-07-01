import { assertEquals, assertStringIncludes } from "@std/assert";

import type { Operation } from "./api.ts";
import { formatCents, formatOperationRow } from "./format.ts";

Deno.test("formatCents formats whole cents to two decimal places", () => {
  assertEquals(formatCents(10050), "100.50");
  assertEquals(formatCents(50), "0.50");
  assertEquals(formatCents(0), "0.00");
  assertEquals(formatCents(1), "0.01");
  assertEquals(formatCents(100000), "1000.00");
});

const baseOperation: Operation = {
  account: { accountID: "acc-1", name: "Checking" },
  accountID: "acc-1",
  amount: 5000,
  at: "2026-06-15T14:30:00.000Z",
  comments: "Groceries",
  operationID: "op-123",
  type: "Expense",
};

Deno.test("formatOperationRow includes all key fields", () => {
  const row = formatOperationRow(baseOperation);

  assertStringIncludes(row, "2026-06-15T14:30");
  assertStringIncludes(row, "Expense");
  assertStringIncludes(row, "50.00");
  assertStringIncludes(row, "Checking");
  assertStringIncludes(row, "Groceries");
  assertStringIncludes(row, "op-123");
});

Deno.test("formatOperationRow uses (no comments) for empty comments", () => {
  const op = { ...baseOperation, comments: "" };
  const row = formatOperationRow(op);

  assertStringIncludes(row, "(no comments)");
});

Deno.test("formatOperationRow pads amount to 10 chars", () => {
  const row = formatOperationRow(baseOperation);
  const parts = row.split(" | ");
  const amountPart = parts[2];

  assertEquals(amountPart.length, 10);
  assertEquals(amountPart.trimStart(), "50.00");
});

Deno.test("formatOperationRow pads Income type to 7 chars", () => {
  const op = { ...baseOperation, type: "Income" as const };
  const row = formatOperationRow(op);
  const parts = row.split(" | ");

  assertEquals(parts[1].length, 7);
});

Deno.test("formatOperationRow slices at timestamp to 16 chars", () => {
  const row = formatOperationRow(baseOperation);
  const parts = row.split(" | ");

  assertEquals(parts[0].length, 16);
});
