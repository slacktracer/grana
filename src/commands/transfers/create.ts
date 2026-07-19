import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import { createTransfer, getAccounts } from "../../lib/api.ts";
import type { DateTimeParts, DateTimeSecondsParts } from "../../lib/dates.ts";
import {
  dateTimeISO,
  dateTimeSecondsISO,
  isValidDateParts,
  promptDateTimeParts,
} from "../../lib/dates.ts";
import {
  exitIfCancelled,
  runWithSpinner,
  selectAccount,
} from "../../lib/prompts.ts";
import { validateAmount } from "../../lib/validators.ts";

type QuickTransfer = DateTimeSecondsParts & {
  amount: number;
};

const parseQuickTransfer = (value: string): QuickTransfer | null => {
  const parts = value.trim().split(/\s+/);

  if (parts.length !== 7) {
    return null;
  }

  const nums = parts.map((x) => Number(x));

  if (nums.some((n) => !Number.isInteger(n))) {
    return null;
  }

  const [amount, year, month, day, hour, minute, second] = nums;
  const parsed: QuickTransfer = {
    amount,
    day,
    hour,
    minute,
    month,
    second,
    year,
  };

  const inRange = amount > 0 &&
    year >= 1970 && year <= 2100 &&
    month >= 1 && month <= 12 &&
    day >= 1 && day <= 31 &&
    hour >= 0 && hour <= 23 &&
    minute >= 0 && minute <= 59 &&
    second >= 0 && second <= 59;

  if (!inRange || !isValidDateParts(parsed)) {
    return null;
  }

  return parsed;
};

const validateQuickTransfer = (
  value: string | undefined,
): string | undefined => {
  if (parseQuickTransfer(value ?? "") === null) {
    return "Enter: value year month day hour minute second (e.g. 1494071 2026 7 17 21 53 0)";
  }
};

export const createTransferCommand = new Command()
  .description("Interactively create a transfer.")
  .option(
    "-f, --full",
    "Prompt for amount and date field by field.",
  )
  .option(
    "-q, --quick",
    "Enter amount and date on one line: value year month day hour minute second.",
  )
  .action(async ({ full, quick }) => {
    p.intro("Create transfer");

    const mode = quick ? "quick" : full ? "full" : exitIfCancelled(
      await p.select({
        message: "Input mode",
        options: [
          {
            label: "Quick (one line: value year month day hour minute second)",
            value: "quick",
          },
          { label: "Full (field by field)", value: "full" },
        ],
      }),
    );

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

    let amount: number;
    let at: string;

    if (mode === "quick") {
      const quickInput = exitIfCancelled(
        await p.text({
          message: "value year month day hour minute second",
          placeholder: "1494071 2026 7 17 21 53 0",
          validate: validateQuickTransfer,
        }),
      );

      const parsed = parseQuickTransfer(quickInput) as QuickTransfer;

      amount = parsed.amount;
      at = dateTimeSecondsISO(parsed);
    } else {
      const amountInput = exitIfCancelled(
        await p.text({
          message: "Amount (in cents)",
          placeholder: "10050",
          validate: validateAmount,
        }),
      );

      const now = new Date();
      const dateDefaults: DateTimeParts = {
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };

      const dateParts = await promptDateTimeParts({
        defaults: dateDefaults,
        label: "Date",
      });

      amount = parseInt(amountInput, 10);
      at = dateTimeISO(dateParts);
    }

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
          amount,
          at,
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
