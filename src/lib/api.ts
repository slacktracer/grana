import { loadConfig, loadSession } from "./session.ts";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
  }
}

async function getCredentials(): Promise<{ baseUrl: string; cookie: string }> {
  const [config, session] = await Promise.all([loadConfig(), loadSession()]);

  if (!config) throw new Error("No server URL saved. Run: grana login");
  if (!session) throw new Error("Not logged in. Run: grana login");

  return { baseUrl: config.baseUrl, cookie: session.cookie };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { baseUrl, cookie } = await getCredentials();

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    throw new ApiError(response.status, `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiLogin(
  baseUrl: string,
  username: string,
  password: string,
): Promise<{ cookie: string }> {
  const response = await fetch(`${baseUrl}/authentication/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, username }),
  });

  if (!response.ok) {
    throw new ApiError(response.status, "Login request failed");
  }

  const user = await response.json();

  if (!user) throw new Error("Invalid credentials");

  const cookies = response.headers.getSetCookie().map((c) => c.split(";")[0]);

  if (cookies.length === 0) throw new Error("No session cookies received");

  return { cookie: cookies.join("; ") };
}

export interface Account {
  accountID: string;
  initialAmount: number;
  name: string;
}

export interface GroupRef {
  groupID: string;
  name: string;
}

export interface Group {
  createdAt: string;
  createdAtTimezone: string;
  deleted: boolean;
  groupID: string;
  name: string;
  updatedAt: string | null;
  updatedAtTimezone: string;
  userID: string;
}

export interface Category {
  categoryID: string;
  createdAt: string;
  createdAtTimezone: string;
  deleted: boolean;
  group: GroupRef;
  groupID: string;
  name: string;
  updatedAt: string | null;
  updatedAtTimezone: string;
  userID: string;
}

export interface OperationAccount {
  accountID: string;
  name: string;
}

export interface Operation {
  account: OperationAccount;
  accountID: string;
  amount: number;
  at: string;
  comments: string;
  operationID: string;
  type: "Expense" | "Income";
}

export interface TransferAccount {
  accountID: string;
  name: string;
}

export interface Transfer {
  amount: number;
  at: string;
  atTimezone: string;
  comments: string | null;
  confirmed: boolean;
  fromAccount: TransferAccount;
  fromAccountID: string;
  toAccount: TransferAccount;
  toAccountID: string;
  transferID: string;
}

export const getGroups = (): Promise<Group[]> => apiFetch("/groups");

export const createGroup = ({ name }: { name: string }): Promise<Group> =>
  apiFetch("/groups", {
    body: JSON.stringify({ name }),
    method: "POST",
  });

export const updateGroup = ({
  groupID,
  name,
}: {
  groupID: string;
  name: string;
}): Promise<Group> =>
  apiFetch(`/groups/${groupID}`, {
    body: JSON.stringify({ name }),
    method: "PATCH",
  });

export const getCategories = (): Promise<Category[]> => apiFetch("/categories");

export const createCategory = ({
  groupID,
  name,
}: {
  groupID: string;
  name: string;
}): Promise<Category> =>
  apiFetch("/categories", {
    body: JSON.stringify({ groupID, name }),
    method: "POST",
  });

export const updateCategory = ({
  categoryID,
  groupID,
  name,
}: {
  categoryID: string;
  groupID?: string;
  name?: string;
}): Promise<Category> =>
  apiFetch(`/categories/${categoryID}`, {
    body: JSON.stringify({ groupID, name }),
    method: "PATCH",
  });

export function getAccounts(): Promise<Account[]> {
  return apiFetch("/accounts");
}

export const getOperations = ({
  from,
  to,
}: {
  from: string;
  to: string;
}): Promise<Operation[]> => {
  const params = new URLSearchParams({ from, to });

  return apiFetch(`/operations?${params.toString()}`);
};

export const patchOperation = ({
  accountID,
  operationID,
}: {
  accountID: string;
  operationID: string;
}): Promise<Operation> =>
  apiFetch(`/operations/${operationID}`, {
    body: JSON.stringify({ accountID }),
    method: "PATCH",
  });

export function getTransfers(
  options?: { from?: string; to?: string },
): Promise<Transfer[]> {
  const params = new URLSearchParams();

  if (options?.from) params.set("from", options.from);
  if (options?.to) params.set("to", options.to);

  const query = params.toString();

  return apiFetch(`/transfers${query ? `?${query}` : ""}`);
}

export function getTransfer(transferID: string): Promise<Transfer> {
  return apiFetch(`/transfers/${transferID}`);
}

export function createTransfer(data: {
  amount: number;
  at: string;
  comments?: string;
  confirmed?: boolean;
  fromAccountID: string;
  toAccountID: string;
}): Promise<Transfer> {
  return apiFetch("/transfers", {
    body: JSON.stringify(data),
    method: "POST",
  });
}

export function updateTransfer(
  transferID: string,
  data: Partial<{
    amount: number;
    at: string;
    comments: string;
    confirmed: boolean;
    fromAccountID: string;
    toAccountID: string;
  }>,
): Promise<Transfer> {
  return apiFetch(`/transfers/${transferID}`, {
    body: JSON.stringify(data),
    method: "PATCH",
  });
}
