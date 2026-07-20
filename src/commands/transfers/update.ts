import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import {
  getAccounts,
  getTransfer,
  getTransfers,
  updateTransfer,
} from "../../lib/api.ts";
import type { Transfer } from "../../lib/api.ts";
import type { DateTimeParts } from "../../lib/dates.ts";
import { dateTimeISO, promptDateTimeParts } from "../../lib/dates.ts";
import { formatCents } from "../../lib/format.ts";
import {
  exitIfCancelled,
  runWithSpinner,
  selectAccount,
} from "../../lib/prompts.ts";
import {
  buildTransferOptions,
  loadAll,
  manualId,
} from "../../lib/transferOptions.ts";
import { validateAmount } from "../../lib/validators.ts";

const resolveTransferID = async (initial: Transfer[]): Promise<string> => {
  const firstChoice = exitIfCancelled(
    await p.select({
      message: "Select transfer to update",
      options: buildTransferOptions({
        includeLoadAll: true,
        limit: 20,
        transfers: initial,
      }),
    }),
  );

  if (firstChoice !== loadAll && firstChoice !== manualId) {
    return firstChoice;
  }

  if (firstChoice === loadAll) {
    const all = await runWithSpinner({
      action: () => getTransfers(),
      failure: "Failed to fetch transfers.",
      start: "Fetching all transfers...",
      success: (list) => `${list.length} transfer(s) loaded.`,
    });

    const secondChoice = exitIfCancelled(
      await p.select({
        message: "Select transfer to update",
        options: buildTransferOptions({
          includeLoadAll: false,
          limit: 40,
          transfers: all,
        }),
      }),
    );

    if (secondChoice !== manualId) {
      return secondChoice;
    }
  }

  const manual = exitIfCancelled(await p.text({ message: "Transfer ID" }));

  return manual;
};

const collectUpdate = async (
  current: Transfer,
): Promise<Record<string, string | number | boolean>> => {
  const fields = exitIfCancelled(
    await p.multiselect({
      message: "Which fields do you want to update?",
      options: [
        {
          label: `From account (current: ${current.fromAccount.name})`,
          value: "fromAccountID",
        },
        {
          label: `To account (current: ${current.toAccount.name})`,
          value: "toAccountID",
        },
        {
          label: `Amount (current: $${formatCents(current.amount)})`,
          value: "amount",
        },
        { label: `Date (current: ${current.at.slice(0, 16)})`, value: "at" },
        {
          label: `Comments (current: ${current.comments ?? "none"})`,
          value: "comments",
        },
        {
          label: `Confirmed (current: ${current.confirmed})`,
          value: "confirmed",
        },
      ],
      required: true,
    }),
  );

  const update: Record<string, string | number | boolean> = {};

  if (fields.includes("fromAccountID") || fields.includes("toAccountID")) {
    const accounts = await runWithSpinner({
      action: getAccounts,
      failure: "Failed to fetch accounts.",
      start: "Fetching accounts...",
      success: (list) => `${list.length} account(s) loaded.`,
    });

    if (fields.includes("fromAccountID")) {
      update.fromAccountID = await selectAccount({
        accounts,
        message: "From account",
      });
    }

    if (fields.includes("toAccountID")) {
      update.toAccountID = await selectAccount({
        accounts,
        message: "To account",
      });
    }
  }

  if (fields.includes("amount")) {
    const value = exitIfCancelled(
      await p.text({
        message: `Amount (in cents, current: ${current.amount})`,
        placeholder: String(current.amount),
        validate: validateAmount,
      }),
    );

    update.amount = parseInt(value, 10);
  }

  if (fields.includes("at")) {
    const atDate = new Date(current.at);
    const dateDefaults: DateTimeParts = {
      day: atDate.getDate(),
      hour: atDate.getHours(),
      minute: atDate.getMinutes(),
      month: atDate.getMonth() + 1,
      year: atDate.getFullYear(),
    };

    const dateParts = await promptDateTimeParts({
      defaults: dateDefaults,
      label: "Date",
    });

    update.at = dateTimeISO(dateParts);
  }

  if (fields.includes("comments")) {
    const value = exitIfCancelled(
      await p.text({
        defaultValue: current.comments ?? "",
        message: "Comments",
        placeholder: current.comments ?? "",
      }),
    );

    update.comments = value;
  }

  if (fields.includes("confirmed")) {
    update.confirmed = exitIfCancelled(
      await p.confirm({
        initialValue: current.confirmed,
        message: "Confirmed?",
      }),
    );
  }

  return update;
};

export const updateTransferCommand = new Command()
  .description("Interactively update a transfer.")
  .action(async () => {
    p.intro("Update transfer");

    const now = new Date();
    const threeMonthsAgo = new Date(now);

    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recent = await runWithSpinner({
      action: () =>
        getTransfers({
          from: threeMonthsAgo.toISOString(),
          to: now.toISOString(),
        }),
      failure: "Failed to fetch data.",
      start: "Fetching recent transfers...",
      success: (list) => `${list.length} transfer(s) loaded (last 3 months).`,
    });

    const transferID = await resolveTransferID(recent);

    const current = await runWithSpinner({
      action: () => getTransfer(transferID),
      failure: "Failed to fetch transfer.",
      start: "Fetching transfer...",
      success: () => "Transfer loaded.",
    });

    const update = await collectUpdate(current);

    const updated = await runWithSpinner({
      action: () => updateTransfer(transferID, update),
      start: "Updating transfer...",
      success: () => "Transfer updated.",
    });

    console.log(JSON.stringify(updated, null, 2));
    p.outro("Done.");
  });
