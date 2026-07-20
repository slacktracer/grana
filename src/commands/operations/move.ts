import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import { reLogin } from "../../lib/auth.ts";
import {
  getAccounts,
  getOperations,
  patchOperation,
  SessionExpiredError,
} from "../../lib/api.ts";
import type { DateParts } from "../../lib/dates.ts";
import {
  endOfDayISO,
  promptDateParts,
  sanitizeDateParts,
  startOfDayISO,
} from "../../lib/dates.ts";
import { formatCents, formatOperationRow } from "../../lib/format.ts";
import { runWithSpinner, selectAccount } from "../../lib/prompts.ts";
import { loadConfig, saveConfig } from "../../lib/session.ts";
import { computeTotals } from "../../lib/totals.ts";

export const moveOperationCommand = new Command()
  .description("Move operations from one account to another.")
  .action(async () => {
    p.intro("operations move");

    const config = await loadConfig();

    if (!config) {
      p.outro("Not configured. Run: grana login");
      Deno.exit(1);
    }

    const accounts = await runWithSpinner({
      action: getAccounts,
      failure: "Failed to fetch accounts.",
      start: "Fetching accounts...",
      success: (list) => `${list.length} account(s) loaded.`,
    });

    const fromAccount = await selectAccount({
      accounts,
      initialValue: config.operations?.fromAccount,
      message: "FROM account",
    });

    const toAccount = await selectAccount({
      accounts,
      exclude: fromAccount,
      initialValue: config.operations?.toAccount,
      message: "TO account",
    });

    const today = new Date();
    const todayParts: DateParts = {
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    };

    const fromDefaults: DateParts = sanitizeDateParts(
      config.operations?.fromDate,
    ) ?? {
      day: 1,
      month: todayParts.month,
      year: todayParts.year,
    };

    const toDefaults: DateParts = sanitizeDateParts(
      config.operations?.toDate,
    ) ?? todayParts;

    const fromDate = await promptDateParts({
      defaults: fromDefaults,
      label: "From date",
    });

    const toDate = await promptDateParts({
      defaults: toDefaults,
      label: "To date",
    });

    await saveConfig({
      ...config,
      operations: { fromAccount, fromDate, toAccount, toDate },
    });

    const fromISO = startOfDayISO(fromDate);
    const toISO = endOfDayISO(toDate);

    const operations = await runWithSpinner({
      action: () => getOperations({ from: fromISO, to: toISO }),
      failure: "Failed to fetch operations.",
      start: "Fetching operations...",
      success: (list) => `${list.length} operation(s) in range.`,
    });

    const toMove = operations.filter((op) => op.accountID === fromAccount);
    const fromAccountName = accounts.find((a) =>
      a.accountID === fromAccount
    )?.name ?? fromAccount;
    const toAccountName =
      accounts.find((a) => a.accountID === toAccount)?.name ?? toAccount;

    p.log.message(
      `\n${toMove.length} operation(s) on ${fromAccountName}:\n`,
    );

    for (const op of toMove) {
      p.log.message(formatOperationRow(op));
    }

    if (toMove.length === 0) {
      p.outro("Nothing to do.");
      return;
    }

    const { expense, income, net } = computeTotals(toMove);

    p.log.message(
      `\nIncome ${formatCents(income)} | Expense ${
        formatCents(expense)
      } | Net ${formatCents(net)}`,
    );

    const confirmed = await p.confirm({
      message: `Move these ${toMove.length} operation(s) to ${toAccountName}?`,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.outro("Aborted.");
      return;
    }

    let successes = 0;
    let failures = 0;
    let reloggedIn = false;

    for (const op of toMove) {
      try {
        await patchOperation({
          accountID: toAccount,
          operationID: op.operationID,
        });

        p.log.success(`OK   ${op.operationID}`);

        successes++;
      } catch (err) {
        if (err instanceof SessionExpiredError && !reloggedIn) {
          p.log.warn("Session expired. Logging in again...");

          await reLogin();

          reloggedIn = true;

          try {
            await patchOperation({
              accountID: toAccount,
              operationID: op.operationID,
            });

            p.log.success(`OK   ${op.operationID}`);

            successes++;
          } catch (retryErr) {
            const message = retryErr instanceof Error
              ? retryErr.message
              : String(retryErr);

            p.log.error(`FAIL ${op.operationID}: ${message}`);

            failures++;
          }

          continue;
        }

        const message = err instanceof Error ? err.message : String(err);

        p.log.error(`FAIL ${op.operationID}: ${message}`);

        failures++;
      }
    }

    p.outro(`Done. ${successes} succeeded, ${failures} failed.`);
  });
