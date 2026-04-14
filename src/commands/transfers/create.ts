import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import { createTransfer, getAccounts } from "../../lib/api.ts";
import {
  exitIfCancelled,
  runWithSpinner,
  selectAccount,
} from "../../lib/prompts.ts";
import { validateAmount, validateDate } from "../../lib/validators.ts";

export const createTransferCommand = new Command()
  .description("Interactively create a transfer.")
  .action(async () => {
    p.intro("Create transfer");

    const accounts = await runWithSpinner({
      action: getAccounts,
      failure: "Failed to fetch accounts.",
      start: "Fetching accounts...",
      success: (list) => `${list.length} account(s) loaded.`,
    });

    if (accounts.length < 2) {
      p.outro("You need at least 2 accounts to create a transfer.");
      Deno.exit(1);
    }

    const fromAccountID = await selectAccount({
      accounts,
      message: "From account",
    });

    const toAccountID = await selectAccount({
      accounts,
      exclude: fromAccountID,
      message: "To account",
    });

    const amountInput = exitIfCancelled(
      await p.text({
        message: "Amount (in cents)",
        placeholder: "10050",
        validate: validateAmount,
      }),
    );

    const now = new Date().toISOString().slice(0, 16);

    const dateInput = exitIfCancelled(
      await p.text({
        defaultValue: now,
        message: "Date",
        placeholder: now,
        validate: validateDate,
      }),
    );

    const commentsInput = exitIfCancelled(
      await p.text({
        defaultValue: "",
        message: "Comments (optional)",
        placeholder: "",
      }),
    );

    const transfer = await runWithSpinner({
      action: () =>
        createTransfer({
          amount: parseInt(amountInput, 10),
          at: new Date(dateInput).toISOString(),
          fromAccountID,
          toAccountID,
          ...(commentsInput ? { comments: commentsInput } : {}),
        }),
      start: "Creating transfer...",
      success: () => "Transfer created.",
    });

    console.log(JSON.stringify(transfer, null, 2));
    p.outro("Done.");
  });
