import { loadConfig, loadSession } from "./session.ts";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
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
    body: JSON.stringify({ username, password }),
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
  name: string;
  initialAmount: number;
}

export interface TransferAccount {
  accountID: string;
  name: string;
}

export interface Transfer {
  transferID: string;
  amount: number;
  at: string;
  atTimezone: string;
  fromAccountID: string;
  toAccountID: string;
  fromAccount: TransferAccount;
  toAccount: TransferAccount;
  comments: string | null;
  confirmed: boolean;
}

export function getAccounts(): Promise<Account[]> {
  return apiFetch("/accounts");
}

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
  fromAccountID: string;
  toAccountID: string;
  comments?: string;
  confirmed?: boolean;
}): Promise<Transfer> {
  return apiFetch("/transfers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTransfer(
  transferID: string,
  data: Partial<{
    amount: number;
    at: string;
    fromAccountID: string;
    toAccountID: string;
    comments: string;
    confirmed: boolean;
  }>,
): Promise<Transfer> {
  return apiFetch(`/transfers/${transferID}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
