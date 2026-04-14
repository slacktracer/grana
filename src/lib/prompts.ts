import * as p from "@clack/prompts";

import type { Account } from "./api.ts";

export const exitIfCancelled = <T>(value: T): Exclude<T, symbol> => {
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    Deno.exit(0);
  }

  return value as Exclude<T, symbol>;
};

export const runWithSpinner = async <T>({
  action,
  failure,
  start,
  success,
}: {
  action: () => Promise<T>;
  failure?: string;
  start: string;
  success: (result: T) => string;
}): Promise<T> => {
  const spinner = p.spinner();
  spinner.start(start);

  try {
    const result = await action();
    spinner.stop(success(result));

    return result;
  } catch (err) {
    spinner.stop(failure ?? "Failed.");
    p.outro((err as Error).message);
    Deno.exit(1);
  }
};

export const selectAccount = async ({
  accounts,
  exclude,
  message,
}: {
  accounts: Account[];
  exclude?: string;
  message: string;
}): Promise<string> => {
  const options = accounts
    .filter((a) => a.accountID !== exclude)
    .map((a) => ({ label: a.name, value: a.accountID }));

  const value = await p.select({ message, options });

  return exitIfCancelled(value);
};
