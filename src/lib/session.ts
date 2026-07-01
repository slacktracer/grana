import { join } from "@std/path";

import type { DateParts } from "./dates.ts";

const GRANA_DIR = join(Deno.env.get("HOME") ?? ".", ".grana");
const CONFIG_FILE = join(GRANA_DIR, "config.json");
const SESSION_FILE = join(GRANA_DIR, "session.json");

export interface Config {
  baseUrl: string;
  operations?: {
    fromAccount: string;
    fromDate: DateParts;
    toAccount: string;
    toDate: DateParts;
  };
}

export interface Session {
  cookie: string;
}

const ensureDir = async (): Promise<void> => {
  await Deno.mkdir(GRANA_DIR, { recursive: true });
};

export const saveConfig = async (config: Config): Promise<void> => {
  await ensureDir();
  await Deno.writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2));
};

export const loadConfig = async (): Promise<Config | null> => {
  try {
    const text = await Deno.readTextFile(CONFIG_FILE);
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const saveSession = async (session: Session): Promise<void> => {
  await ensureDir();
  await Deno.writeTextFile(SESSION_FILE, JSON.stringify(session, null, 2));
};

export const loadSession = async (): Promise<Session | null> => {
  try {
    const text = await Deno.readTextFile(SESSION_FILE);
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    await Deno.remove(SESSION_FILE);
  } catch {
    // ignore
  }
};
