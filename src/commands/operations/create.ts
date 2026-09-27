import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import { reLogin } from "../../lib/auth.ts";
import type { CreateOperationData } from "../../lib/api.ts";
import {
  createOperation,
  getAccounts,
  getCategories,
  SessionExpiredError,
} from "../../lib/api.ts";
import { formatCents } from "../../lib/format.ts";
import {
  parseOperations,
  readOperationsFile,
} from "../../lib/operationsFile.ts";
import { runWithSpinner } from "../../lib/prompts.ts";

const formatRow = (
  {
    accountNames,
    categoryNames,
    operation,
  }: {
    accountNames: Map<string, string>;
    categoryNames: Map<string, string>;
    operation: CreateOperationData;
  },
): string => {
  const account = accountNames.get(operation.accountID) ?? operation.accountID;
  const amount = formatCents(operation.amount).padStart(10);
  const category = categoryNames.get(operation.categoryID) ??
    operation.categoryID;
  const comments = operation.comments || "(no comments)";
  const date = operation.at.slice(0, 16);
  const type = operation.type.padEnd(7);

  return `${date} | ${type} | ${amount} | ${account} | ${category} | ${comments}`;
};

export const createOperationsCommand = new Command()
  .description("Create operations from a JSON file.")
  .arguments("<file:string>")
  .option("--dry-run", "Print the payloads without sending them.")
  .option("-y, --yes", "Skip the confirmation prompt.")
  .action(async ({ dryRun, yes }, file: string) => {
    p.intro("operations create");

    let text = "";

    try {
      text = await Deno.readTextFile(file);
    } catch (error) {
      p.outro(`Could not read ${file}: ${(error as Error).message}`);
      Deno.exit(1);
    }

    let parsedFile;

    try {
      parsedFile = readOperationsFile({ text });
    } catch (error) {
      p.outro(`Invalid file: ${(error as Error).message}`);
      Deno.exit(1);
    }

    if (parsedFile.operations.length === 0) {
      p.outro("No operations in the file. Nothing to do.");
      return;
    }

    const accounts = await runWithSpinner({
      action: getAccounts,
      failure: "Failed to fetch accounts.",
      start: "Fetching accounts...",
      success: (list) => `${list.length} account(s) loaded.`,
    });

    const categories = await runWithSpinner({
      action: getCategories,
      failure: "Failed to fetch categories.",
      start: "Fetching categories...",
      success: (list) => `${list.length} category(ies) loaded.`,
    });

    const { errors, operations } = parseOperations({
      accounts,
      categories,
      file: parsedFile,
    });

    if (errors.length > 0) {
      p.log.error(`${errors.length} invalid entry(ies):\n`);

      for (const error of errors) {
        p.log.message(error);
      }

      p.outro("Fix the file and run again. Nothing was created.");
      Deno.exit(1);
    }

    const accountNames = new Map(
      accounts.map((account) => [account.accountID, account.name]),
    );

    const categoryNames = new Map(
      categories.map((category) => [
        category.categoryID,
        `${category.group.name}/${category.name}`,
      ]),
    );

    p.log.message(`\n${operations.length} operation(s) to create:\n`);

    for (const operation of operations) {
      p.log.message(formatRow({ accountNames, categoryNames, operation }));
    }

    if (dryRun) {
      console.log(JSON.stringify(operations, null, 2));
      p.outro("Dry run. Nothing was created.");
      return;
    }

    if (!yes) {
      const confirmed = await p.confirm({
        message: `Create these ${operations.length} operation(s)?`,
      });

      if (p.isCancel(confirmed) || !confirmed) {
        p.outro("Aborted.");
        return;
      }
    }

    let failures = 0;
    let reloggedIn = false;
    let successes = 0;

    for (const operation of operations) {
      try {
        await createOperation({ data: operation });

        p.log.success(`OK   ${operation.operationID}`);

        successes++;
      } catch (error) {
        if (error instanceof SessionExpiredError && !reloggedIn) {
          p.log.warn("Session expired. Logging in again...");

          await reLogin();

          reloggedIn = true;

          try {
            await createOperation({ data: operation });

            p.log.success(`OK   ${operation.operationID}`);

            successes++;
          } catch (retryError) {
            const message = retryError instanceof Error
              ? retryError.message
              : String(retryError);

            p.log.error(`FAIL ${operation.operationID}: ${message}`);

            failures++;
          }

          continue;
        }

        const message = error instanceof Error ? error.message : String(error);

        p.log.error(`FAIL ${operation.operationID}: ${message}`);

        failures++;
      }
    }

    p.outro(`Done. ${successes} succeeded, ${failures} failed.`);
  });
