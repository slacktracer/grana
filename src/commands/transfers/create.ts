import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";
import { createTransfer, getAccounts } from "../../lib/api.ts";

function validateAmount(value: string | undefined): string | undefined {
  const n = parseInt(value ?? "", 10);
  if (isNaN(n) || n <= 0 || String(n) !== (value ?? "").trim()) return "Enter a positive integer in cents (e.g. 10050 for $100.50, 50 for $0.50)";
}

function validateDate(value: string | undefined): string | undefined {
  const d = new Date(value ?? "");
  if (isNaN(d.getTime())) return "Enter a valid date (e.g. 2026-04-01 or 2026-04-01T15:00:00)";
}

export const createTransferCommand = new Command()
  .description("Interactively create a transfer.")
  .action(async () => {
    p.intro("Create transfer");

    const spinner = p.spinner();
    spinner.start("Fetching accounts...");

    let accounts;
    try {
      accounts = await getAccounts();
      spinner.stop(`${accounts.length} account(s) loaded.`);
    } catch (err) {
      spinner.stop("Failed to fetch accounts.");
      p.outro((err as Error).message);
      Deno.exit(1);
    }

    if (accounts.length < 2) {
      p.outro("You need at least 2 accounts to create a transfer.");
      Deno.exit(1);
    }

    const accountOptions = accounts.map((a) => ({
      value: a.accountID,
      label: a.name,
    }));

    const fromAccountID = await p.select({
      message: "From account",
      options: accountOptions,
    });

    if (p.isCancel(fromAccountID)) { p.cancel("Cancelled."); Deno.exit(0); }

    const toAccountID = await p.select({
      message: "To account",
      options: accountOptions.filter((a) => a.value !== fromAccountID),
    });

    if (p.isCancel(toAccountID)) { p.cancel("Cancelled."); Deno.exit(0); }

    const amountInput = await p.text({
      message: "Amount (in cents)",
      placeholder: "10050",
      validate: validateAmount,
    });

    if (p.isCancel(amountInput)) { p.cancel("Cancelled."); Deno.exit(0); }

    const now = new Date().toISOString().slice(0, 16);
    const dateInput = await p.text({
      message: "Date",
      placeholder: now,
      defaultValue: now,
      validate: validateDate,
    });

    if (p.isCancel(dateInput)) { p.cancel("Cancelled."); Deno.exit(0); }

    const commentsInput = await p.text({
      message: "Comments (optional)",
      placeholder: "",
      defaultValue: "",
    });

    if (p.isCancel(commentsInput)) { p.cancel("Cancelled."); Deno.exit(0); }

    spinner.start("Creating transfer...");

    try {
      const transfer = await createTransfer({
        amount: parseInt(amountInput, 10),
        at: new Date(dateInput).toISOString(),
        fromAccountID,
        toAccountID,
        ...(commentsInput ? { comments: commentsInput } : {}),
      });

      spinner.stop("Transfer created.");
      console.log(JSON.stringify(transfer, null, 2));
      p.outro("Done.");
    } catch (err) {
      spinner.stop("Failed.");
      p.outro((err as Error).message);
      Deno.exit(1);
    }
  });
