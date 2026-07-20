import { assertEquals, assertStringIncludes } from "@std/assert";

import type { Category, Operation, Transfer } from "./api.ts";
import {
  formatCategoryLabel,
  formatCents,
  formatOperationRow,
  formatTransferLabel,
} from "./format.ts";

const baseCategory: Category = {
  categoryID: "cat-1",
  createdAt: "2026-01-01T00:00:00Z",
  createdAtTimezone: "UTC",
  deleted: false,
  group: { groupID: "grp-1", name: "Food" },
  groupID: "grp-1",
  name: "Groceries",
  updatedAt: null,
  updatedAtTimezone: "UTC",
  userID: "user-1",
};

Deno.test("formatCategoryLabel returns name and group name", () => {
  assertEquals(formatCategoryLabel(baseCategory), "Groceries (Food)");
});

Deno.test("formatCategoryLabel reflects different group names", () => {
  const cat = {
    ...baseCategory,
    group: { groupID: "grp-2", name: "Transport" },
    name: "Fuel",
  };

  assertEquals(formatCategoryLabel(cat), "Fuel (Transport)");
});

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

const baseTransfer: Transfer = {
  amount: 149407100,
  at: "2026-07-17T21:53:00.000Z",
  atTimezone: "UTC",
  comments: null,
  confirmed: true,
  fromAccount: { accountID: "acc-1", name: "Unilos PJ" },
  fromAccountID: "acc-1",
  toAccount: { accountID: "acc-2", name: "Unilos PF" },
  toAccountID: "acc-2",
  transferID: "t-1",
};

Deno.test("formatTransferLabel renders accounts, amount, and date", () => {
  assertEquals(
    formatTransferLabel(baseTransfer),
    "Unilos PJ → Unilos PF | $1494071.00 | 2026-07-17",
  );
});

Deno.test("formatTransferLabel appends (unconfirmed) when not confirmed", () => {
  const transfer = { ...baseTransfer, confirmed: false };

  assertStringIncludes(formatTransferLabel(transfer), " (unconfirmed)");
});

Deno.test("formatTransferLabel omits the suffix when confirmed", () => {
  assertEquals(
    formatTransferLabel(baseTransfer).includes("unconfirmed"),
    false,
  );
});
