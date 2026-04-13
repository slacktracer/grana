import { join } from "@std/path";

const GRANA_DIR = join(Deno.env.get("HOME") ?? ".", ".grana");
const CONFIG_FILE = join(GRANA_DIR, "config.json");
const SESSION_FILE = join(GRANA_DIR, "session.json");

export interface Config {
  baseUrl: string;
}

export interface Session {
  cookie: string;
}

async function ensureDir(): Promise<void> {
  await Deno.mkdir(GRANA_DIR, { recursive: true });
}

export async function saveConfig(config: Config): Promise<void> {
  await ensureDir();
  await Deno.writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function loadConfig(): Promise<Config | null> {
  try {
    const text = await Deno.readTextFile(CONFIG_FILE);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await ensureDir();
  await Deno.writeTextFile(SESSION_FILE, JSON.stringify(session, null, 2));
}

export async function loadSession(): Promise<Session | null> {
  try {
    const text = await Deno.readTextFile(SESSION_FILE);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await Deno.remove(SESSION_FILE);
  } catch {
    // ignore
  }
}
