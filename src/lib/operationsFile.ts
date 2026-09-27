import type { Account, Category, CreateOperationData } from "./api.ts";

export type OperationInput = {
  account?: unknown;
  accountID?: unknown;
  amount?: unknown;
  amountPerUnit?: unknown;
  at?: unknown;
  atTimezone?: unknown;
  category?: unknown;
  categoryID?: unknown;
  comments?: unknown;
  confirmed?: unknown;
  createdAtTimezone?: unknown;
  operationID?: unknown;
  type?: unknown;
  unitCount?: unknown;
};

export type OperationsFile = {
  defaults?: OperationInput;
  operations: OperationInput[];
};

export type ParseOperationsResult = {
  errors: string[];
  operations: CreateOperationData[];
};

const getLocalTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

export const readOperationsFile = (
  { text }: { text: string },
): OperationsFile => {
  const parsed = JSON.parse(text);

  if (Array.isArray(parsed)) {
    return { operations: parsed };
  }

  if (
    typeof parsed === "object" && parsed !== null &&
    Array.isArray(parsed.operations)
  ) {
    return { defaults: parsed.defaults ?? {}, operations: parsed.operations };
  }

  throw new Error(
    'Expected an array of operations or an object with an "operations" array.',
  );
};

export const parseAt = ({ value }: { value: string }): string => {
  const trimmed = value.trim();

  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(trimmed);

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);

  const normalized = isDateOnly ? `${trimmed}T00:00:00` : trimmed;

  const date = new Date(hasZone ? trimmed : normalized);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: "${value}"`);
  }

  return date.toISOString();
};

export const resolveAccountID = (
  { accounts, input }: { accounts: Account[]; input: OperationInput },
): string => {
  if (typeof input.accountID === "string" && input.accountID.trim()) {
    return input.accountID.trim();
  }

  if (typeof input.account !== "string" || !input.account.trim()) {
    return "";
  }

  const wanted = input.account.trim().toLocaleLowerCase();

  const matches = accounts.filter((account) =>
    account.name.toLocaleLowerCase() === wanted
  );

  if (matches.length === 0) {
    throw new Error(`No such account: "${input.account}"`);
  }

  if (matches.length > 1) {
    throw new Error(
      `Ambiguous account "${input.account}": ${
        matches.map((account) => account.accountID).join(", ")
      }`,
    );
  }

  return matches[0].accountID;
};

export const resolveCategoryID = (
  { categories, input }: { categories: Category[]; input: OperationInput },
): string => {
  if (typeof input.categoryID === "string" && input.categoryID.trim()) {
    return input.categoryID.trim();
  }

  if (typeof input.category !== "string" || !input.category.trim()) {
    return "";
  }

  const wanted = input.category.trim().toLocaleLowerCase();

  const matches = categories.filter((category) =>
    category.name.toLocaleLowerCase() === wanted ||
    `${category.group.name}/${category.name}`.toLocaleLowerCase() === wanted
  );

  if (matches.length === 0) {
    throw new Error(`No such category: "${input.category}"`);
  }

  if (matches.length > 1) {
    throw new Error(
      `Ambiguous category "${input.category}": ${
        matches.map((category) => `${category.group.name}/${category.name}`)
          .join(", ")
      }. Use "Group/Name" or categoryID.`,
    );
  }

  return matches[0].categoryID;
};

const parseAmounts = (
  { input }: { input: OperationInput },
): { amount: number; amountPerUnit: number; unitCount: number } => {
  const unitCount = input.unitCount === undefined ? 1 : input.unitCount;

  if (!Number.isInteger(unitCount) || (unitCount as number) < 1) {
    throw new Error("unitCount must be an integer greater than 0");
  }

  const units = unitCount as number;

  const typeIsExpense = input.type !== "Income";

  const sign = typeIsExpense ? -1 : 1;

  if (input.amountPerUnit !== undefined) {
    if (!Number.isInteger(input.amountPerUnit)) {
      throw new Error("amountPerUnit must be an integer in cents");
    }

    const perUnit = sign * Math.abs(input.amountPerUnit as number);

    if (perUnit === 0) {
      throw new Error("amountPerUnit must not be 0");
    }

    return {
      amount: perUnit * units,
      amountPerUnit: perUnit,
      unitCount: units,
    };
  }

  if (!Number.isInteger(input.amount)) {
    throw new Error("amount must be an integer in cents");
  }

  const amount = sign * Math.abs(input.amount as number);

  if (amount === 0) {
    throw new Error("amount must not be 0");
  }

  if (amount % units !== 0) {
    throw new Error(
      `amount ${amount} is not divisible by unitCount ${units}; set amountPerUnit explicitly`,
    );
  }

  return { amount, amountPerUnit: amount / units, unitCount: units };
};

export const makeOperationData = (
  {
    accounts,
    categories,
    input,
  }: {
    accounts: Account[];
    categories: Category[];
    input: OperationInput;
  },
): CreateOperationData => {
  const accountID = resolveAccountID({ accounts, input });

  if (!accountID) {
    throw new Error("account or accountID is required");
  }

  const categoryID = resolveCategoryID({ categories, input });

  if (!categoryID) {
    throw new Error("category or categoryID is required");
  }

  if (typeof input.at !== "string" || !input.at.trim()) {
    throw new Error("at is required");
  }

  if (
    input.type !== undefined && input.type !== "Expense" &&
    input.type !== "Income"
  ) {
    throw new Error('type must be "Expense" or "Income"');
  }

  if (input.confirmed !== undefined && typeof input.confirmed !== "boolean") {
    throw new Error("confirmed must be a boolean");
  }

  if (input.comments !== undefined && typeof input.comments !== "string") {
    throw new Error("comments must be a string");
  }

  const { amount, amountPerUnit, unitCount } = parseAmounts({ input });

  return {
    accountID,
    amount,
    amountPerUnit,
    at: parseAt({ value: input.at }),
    atTimezone: typeof input.atTimezone === "string" && input.atTimezone
      ? input.atTimezone
      : getLocalTimeZone(),
    categoryID,
    comments: typeof input.comments === "string" ? input.comments : "",
    confirmed: input.confirmed === undefined ? true : input.confirmed,
    createdAtTimezone: typeof input.createdAtTimezone === "string" &&
        input.createdAtTimezone
      ? input.createdAtTimezone
      : "UTC",
    operationID: typeof input.operationID === "string" && input.operationID
      ? input.operationID
      : crypto.randomUUID(),
    type: input.type === "Income" ? "Income" : "Expense",
    unitCount,
  };
};

export const parseOperations = (
  {
    accounts,
    categories,
    file,
  }: {
    accounts: Account[];
    categories: Category[];
    file: OperationsFile;
  },
): ParseOperationsResult => {
  const defaults = file.defaults ?? {};

  const errors: string[] = [];

  const operations: CreateOperationData[] = [];

  file.operations.forEach((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      errors.push(`#${index + 1}: entry must be an object`);

      return;
    }

    const input: OperationInput = { ...defaults, ...entry };

    try {
      operations.push(makeOperationData({ accounts, categories, input }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      errors.push(`#${index + 1}: ${message}`);
    }
  });

  return { errors, operations };
};
