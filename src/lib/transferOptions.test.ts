import { assertEquals } from "@std/assert";

import type { Transfer } from "./api.ts";
import { formatTransferLabel } from "./format.ts";
import { buildTransferOptions, loadAll, manualId } from "./transferOptions.ts";

const baseTransfer: Transfer = {
  amount: 10000,
  at: "2026-06-15T14:30:00.000Z",
  atTimezone: "UTC",
  comments: null,
  confirmed: true,
  fromAccount: { accountID: "acc-1", name: "PJ" },
  fromAccountID: "acc-1",
  toAccount: { accountID: "acc-2", name: "PF" },
  toAccountID: "acc-2",
  transferID: "t-1",
};

const makeTransfer = (id: string): Transfer => ({
  ...baseTransfer,
  transferID: id,
});

Deno.test("buildTransferOptions respects the limit", () => {
  const options = buildTransferOptions({
    includeLoadAll: false,
    limit: 2,
    transfers: [makeTransfer("t-1"), makeTransfer("t-2"), makeTransfer("t-3")],
  });

  // 2 transfers + manual row.
  assertEquals(options.length, 3);
  assertEquals(options.slice(0, 2).map((o) => o.value), ["t-1", "t-2"]);
});

Deno.test("buildTransferOptions uses formatTransferLabel for transfer rows", () => {
  const transfer = makeTransfer("t-1");
  const options = buildTransferOptions({
    includeLoadAll: false,
    limit: 20,
    transfers: [transfer],
  });

  assertEquals(options[0].label, formatTransferLabel(transfer));
});

Deno.test("buildTransferOptions inserts load-all before manual when requested", () => {
  const options = buildTransferOptions({
    includeLoadAll: true,
    limit: 20,
    transfers: [makeTransfer("t-1")],
  });

  assertEquals(options.map((o) => o.value), ["t-1", loadAll, manualId]);
});

Deno.test("buildTransferOptions omits load-all when not requested", () => {
  const options = buildTransferOptions({
    includeLoadAll: false,
    limit: 20,
    transfers: [makeTransfer("t-1")],
  });

  assertEquals(options.map((o) => o.value), ["t-1", manualId]);
});

Deno.test("buildTransferOptions always ends with the manual row", () => {
  const options = buildTransferOptions({
    includeLoadAll: true,
    limit: 20,
    transfers: [],
  });

  assertEquals(options[options.length - 1].value, manualId);
});
