import { assertEquals, assertThrows } from "@std/assert";

import type { Account, Category } from "./api.ts";
import {
  makeOperationData,
  parseAt,
  parseOperations,
  readOperationsFile,
  resolveAccountID,
  resolveCategoryID,
} from "./operationsFile.ts";

const accounts: Account[] = [
  { accountID: "account-inter", initialAmount: 0, name: "Inter" },
  { accountID: "account-master", initialAmount: 0, name: "MasterCard Inter" },
];

const makeCategory = (
  { categoryID, groupName, name }: {
    categoryID: string;
    groupName: string;
    name: string;
  },
): Category => ({
  categoryID,
  createdAt: "2026-01-01T00:00:00.000Z",
  createdAtTimezone: "UTC",
  deleted: false,
  group: { groupID: `group-${groupName}`, name: groupName },
  groupID: `group-${groupName}`,
  name,
  updatedAt: null,
  updatedAtTimezone: "UTC",
  userID: "user-01",
});

const categories: Category[] = [
  makeCategory({
    categoryID: "category-market",
    groupName: "Miscelânea",
    name: "Supermercado",
  }),
  makeCategory({
    categoryID: "category-food-snack",
    groupName: "Comida",
    name: "Lanche",
  }),
  makeCategory({
    categoryID: "category-sweets-snack",
    groupName: "Guloseimas",
    name: "Lanche",
  }),
];

Deno.test("readOperationsFile accepts a bare array", () => {
  const file = readOperationsFile({ text: '[{"amount": -100}]' });

  assertEquals(file.operations.length, 1);
  assertEquals(file.defaults, undefined);
});

Deno.test("readOperationsFile accepts defaults plus operations", () => {
  const file = readOperationsFile({
    text: '{"defaults": {"type": "Income"}, "operations": []}',
  });

  assertEquals(file.defaults, { type: "Income" });
  assertEquals(file.operations, []);
});

Deno.test("readOperationsFile rejects other shapes", () => {
  assertThrows(() => readOperationsFile({ text: '{"nope": true}' }));
});

Deno.test("parseAt keeps an explicit zone", () => {
  assertEquals(
    parseAt({ value: "2026-09-17T08:12:00-03:00" }),
    "2026-09-17T11:12:00.000Z",
  );
  assertEquals(
    parseAt({ value: "2026-09-17T11:12:00.000Z" }),
    "2026-09-17T11:12:00.000Z",
  );
});

Deno.test("parseAt treats a zoneless value as local time", () => {
  const expected = new Date(2026, 8, 17, 8, 12, 0, 0).toISOString();

  assertEquals(parseAt({ value: "2026-09-17T08:12" }), expected);
});

Deno.test("parseAt treats a date-only value as local midnight", () => {
  const expected = new Date(2026, 8, 17, 0, 0, 0, 0).toISOString();

  assertEquals(parseAt({ value: "2026-09-17" }), expected);
});

Deno.test("parseAt rejects garbage", () => {
  assertThrows(() => parseAt({ value: "not a date" }));
});

Deno.test("resolveAccountID matches by name, case-insensitively", () => {
  assertEquals(
    resolveAccountID({ accounts, input: { account: "mastercard inter" } }),
    "account-master",
  );
});

Deno.test("resolveAccountID prefers an explicit accountID", () => {
  assertEquals(
    resolveAccountID({
      accounts,
      input: { account: "Inter", accountID: "account-master" },
    }),
    "account-master",
  );
});

Deno.test("resolveAccountID throws on an unknown name", () => {
  assertThrows(() =>
    resolveAccountID({ accounts, input: { account: "Nope" } })
  );
});

Deno.test("resolveCategoryID matches by name and by Group/Name", () => {
  assertEquals(
    resolveCategoryID({ categories, input: { category: "Supermercado" } }),
    "category-market",
  );
  assertEquals(
    resolveCategoryID({ categories, input: { category: "Comida/Lanche" } }),
    "category-food-snack",
  );
});

Deno.test("resolveCategoryID throws on an ambiguous name", () => {
  assertThrows(() =>
    resolveCategoryID({ categories, input: { category: "Lanche" } })
  );
});

Deno.test("makeOperationData forces the sign from the type", () => {
  const expense = makeOperationData({
    accounts,
    categories,
    input: {
      account: "Inter",
      amount: 6400,
      at: "2026-09-17T08:12:00-03:00",
      category: "Supermercado",
    },
  });

  assertEquals(expense.amount, -6400);
  assertEquals(expense.amountPerUnit, -6400);
  assertEquals(expense.type, "Expense");

  const income = makeOperationData({
    accounts,
    categories,
    input: {
      account: "Inter",
      amount: -2700,
      at: "2026-09-11T13:02:00-03:00",
      category: "Supermercado",
      type: "Income",
    },
  });

  assertEquals(income.amount, 2700);
  assertEquals(income.amountPerUnit, 2700);
});

Deno.test("makeOperationData derives amountPerUnit from unitCount", () => {
  const operation = makeOperationData({
    accounts,
    categories,
    input: {
      account: "Inter",
      amount: 900,
      at: "2026-09-17T08:12:00-03:00",
      category: "Supermercado",
      unitCount: 3,
    },
  });

  assertEquals(operation.amount, -900);
  assertEquals(operation.amountPerUnit, -300);
  assertEquals(operation.unitCount, 3);
});

Deno.test("makeOperationData derives amount from amountPerUnit", () => {
  const operation = makeOperationData({
    accounts,
    categories,
    input: {
      account: "Inter",
      amountPerUnit: 250,
      at: "2026-09-17T08:12:00-03:00",
      category: "Supermercado",
      unitCount: 4,
    },
  });

  assertEquals(operation.amount, -1000);
  assertEquals(operation.amountPerUnit, -250);
});

Deno.test("makeOperationData rejects an indivisible amount", () => {
  assertThrows(() =>
    makeOperationData({
      accounts,
      categories,
      input: {
        account: "Inter",
        amount: 100,
        at: "2026-09-17T08:12:00-03:00",
        category: "Supermercado",
        unitCount: 3,
      },
    })
  );
});

Deno.test("makeOperationData rejects a zero amount", () => {
  assertThrows(() =>
    makeOperationData({
      accounts,
      categories,
      input: {
        account: "Inter",
        amount: 0,
        at: "2026-09-17T08:12:00-03:00",
        category: "Supermercado",
      },
    })
  );
});

Deno.test("makeOperationData fills the defaults", () => {
  const operation = makeOperationData({
    accounts,
    categories,
    input: {
      account: "Inter",
      amount: 6400,
      at: "2026-09-17T08:12:00-03:00",
      category: "Supermercado",
    },
  });

  assertEquals(operation.comments, "");
  assertEquals(operation.confirmed, true);
  assertEquals(operation.createdAtTimezone, "UTC");
  assertEquals(operation.unitCount, 1);
  assertEquals(operation.operationID.length, 36);
});

Deno.test("parseOperations merges defaults and reports per-entry errors", () => {
  const { errors, operations } = parseOperations({
    accounts,
    categories,
    file: {
      defaults: {
        atTimezone: "America/Sao_Paulo",
        category: "Supermercado",
        type: "Expense",
      },
      operations: [
        { account: "Inter", amount: 6400, at: "2026-09-17T08:12:00-03:00" },
        { account: "Nope", amount: 100, at: "2026-09-17T08:12:00-03:00" },
        { account: "Inter", amount: 0, at: "2026-09-17T08:12:00-03:00" },
      ],
    },
  });

  assertEquals(operations.length, 1);
  assertEquals(operations[0].atTimezone, "America/Sao_Paulo");
  assertEquals(operations[0].categoryID, "category-market");
  assertEquals(errors.length, 2);
  assertEquals(errors[0].startsWith("#2: "), true);
  assertEquals(errors[1].startsWith("#3: "), true);
});
