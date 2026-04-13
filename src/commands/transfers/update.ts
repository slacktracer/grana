import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";
import { getAccounts, getTransfer, getTransfers, updateTransfer, type Account, type Transfer } from "../../lib/api.ts";

function fromCents(amount: number): string {
  return (amount / 100).toFixed(2);
}

function formatTransferLabel(t: Transfer): string {
  const from = t.fromAccount.name;
  const to = t.toAccount.name;
  const amount = fromCents(t.amount);
  const date = t.at.slice(0, 10);
  const status = t.confirmed ? "" : " (unconfirmed)";
  return `${from} → ${to} | $${amount} | ${date}${status}`;
}

export const updateTransferCommand = new Command()
  .description("Interactively update a transfer.")
  .action(async () => {
    p.intro("Update transfer");

    const spinner = p.spinner();
    spinner.start("Fetching recent transfers...");

    let transfers: Transfer[];

    try {
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      transfers = await getTransfers({
        from: threeMonthsAgo.toISOString(),
        to: now.toISOString(),
      });
      spinner.stop(`${transfers.length} transfer(s) loaded (last 3 months).`);
    } catch (err) {
      spinner.stop("Failed to fetch data.");
      p.outro((err as Error).message);
      Deno.exit(1);
    }

    const MANUAL_ID = "__manual__";
    const LOAD_ALL = "__load_all__";

    const options = [
      ...transfers.slice(0, 20).map((t) => ({
        value: t.transferID,
        label: formatTransferLabel(t),
      })),
      { value: LOAD_ALL, label: "Load all transfers..." },
      { value: MANUAL_ID, label: "Enter transfer ID manually" },
    ];

    let selected = await p.select({
      message: "Select transfer to update",
      options,
    });

    if (p.isCancel(selected)) { p.cancel("Cancelled."); Deno.exit(0); }

    if (selected === LOAD_ALL) {
      spinner.start("Fetching all transfers...");
      try {
        transfers = await getTransfers();
        spinner.stop(`${transfers.length} transfer(s) loaded.`);
      } catch (err) {
        spinner.stop("Failed to fetch transfers.");
        p.outro((err as Error).message);
        Deno.exit(1);
      }

      selected = await p.select({
        message: "Select transfer to update",
        options: [
          ...transfers.slice(0, 40).map((t) => ({
            value: t.transferID,
            label: formatTransferLabel(t),
          })),
          { value: MANUAL_ID, label: "Enter transfer ID manually" },
        ],
      });

      if (p.isCancel(selected)) { p.cancel("Cancelled."); Deno.exit(0); }
    }

    let transferID: string;

    if (selected === MANUAL_ID) {
      const input = await p.text({ message: "Transfer ID" });
      if (p.isCancel(input)) { p.cancel("Cancelled."); Deno.exit(0); }
      transferID = input;
    } else {
      transferID = selected;
    }

    spinner.start("Fetching transfer...");
    let current: Transfer;
    try {
      current = await getTransfer(transferID);
      spinner.stop("Transfer loaded.");
    } catch (err) {
      spinner.stop("Failed to fetch transfer.");
      p.outro((err as Error).message);
      Deno.exit(1);
    }

    const fields = await p.multiselect({
      message: "Which fields do you want to update?",
      options: [
        { value: "fromAccountID", label: `From account (current: ${current.fromAccount.name})` },
        { value: "toAccountID", label: `To account (current: ${current.toAccount.name})` },
        { value: "amount", label: `Amount (current: $${fromCents(current.amount)})` },
        { value: "at", label: `Date (current: ${current.at.slice(0, 16)})` },
        { value: "comments", label: `Comments (current: ${current.comments ?? "none"})` },
        { value: "confirmed", label: `Confirmed (current: ${current.confirmed})` },
      ],
      required: true,
    });

    if (p.isCancel(fields)) { p.cancel("Cancelled."); Deno.exit(0); }

    const update: Record<string, string | number | boolean> = {};

    if (fields.includes("fromAccountID") || fields.includes("toAccountID")) {
      spinner.start("Fetching accounts...");
      let accounts: Account[];
      try {
        accounts = await getAccounts();
        spinner.stop(`${accounts.length} account(s) loaded.`);
      } catch (err) {
        spinner.stop("Failed to fetch accounts.");
        p.outro((err as Error).message);
        Deno.exit(1);
      }

      const accountOptions = accounts.map((a) => ({ value: a.accountID, label: a.name }));

      if (fields.includes("fromAccountID")) {
        const value = await p.select({ message: "From account", options: accountOptions });
        if (p.isCancel(value)) { p.cancel("Cancelled."); Deno.exit(0); }
        update.fromAccountID = value;
      }

      if (fields.includes("toAccountID")) {
        const value = await p.select({ message: "To account", options: accountOptions });
        if (p.isCancel(value)) { p.cancel("Cancelled."); Deno.exit(0); }
        update.toAccountID = value;
      }
    }

    if (fields.includes("amount")) {
      const value = await p.text({
        message: `Amount (in cents, current: ${current.amount})`,
        placeholder: String(current.amount),
        validate: (v) => {
          const n = parseInt(v ?? "", 10);
          if (isNaN(n) || n <= 0 || String(n) !== (v ?? "").trim()) return "Enter a positive integer in cents (e.g. 10050 for $100.50)";
        },
      });
      if (p.isCancel(value)) { p.cancel("Cancelled."); Deno.exit(0); }
      update.amount = parseInt(value, 10);
    }

    if (fields.includes("at")) {
      const value = await p.text({
        message: "Date",
        placeholder: current.at.slice(0, 16),
        defaultValue: current.at.slice(0, 16),
        validate: (v) => {
          if (isNaN(new Date(v ?? "").getTime())) return "Enter a valid date (e.g. 2026-04-01T15:00:00)";
        },
      });
      if (p.isCancel(value)) { p.cancel("Cancelled."); Deno.exit(0); }
      update.at = new Date(value).toISOString();
    }

    if (fields.includes("comments")) {
      const value = await p.text({
        message: "Comments",
        placeholder: current.comments ?? "",
        defaultValue: current.comments ?? "",
      });
      if (p.isCancel(value)) { p.cancel("Cancelled."); Deno.exit(0); }
      update.comments = value;
    }

    if (fields.includes("confirmed")) {
      const value = await p.confirm({
        message: "Confirmed?",
        initialValue: current.confirmed,
      });
      if (p.isCancel(value)) { p.cancel("Cancelled."); Deno.exit(0); }
      update.confirmed = value;
    }

    spinner.start("Updating transfer...");

    try {
      const updated = await updateTransfer(transferID, update);
      spinner.stop("Transfer updated.");
      console.log(JSON.stringify(updated, null, 2));
      p.outro("Done.");
    } catch (err) {
      spinner.stop("Failed.");
      p.outro((err as Error).message);
      Deno.exit(1);
    }
  });
