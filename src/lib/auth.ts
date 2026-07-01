import * as p from "@clack/prompts";

import { apiLogin } from "./api.ts";
import { loadConfig, saveSession } from "./session.ts";

export const reLogin = async (): Promise<void> => {
  const config = await loadConfig();

  if (!config) {
    throw new Error("No server URL saved. Run: grana login");
  }

  const username = await p.text({ message: "Username" });

  if (p.isCancel(username)) {
    p.cancel("Cancelled.");
    Deno.exit(0);
  }

  const password = await p.password({ message: "Password" });

  if (p.isCancel(password)) {
    p.cancel("Cancelled.");
    Deno.exit(0);
  }

  const spinner = p.spinner();

  spinner.start("Logging in...");

  const { cookie } = await apiLogin(config.baseUrl, username, password);

  await saveSession({ cookie });

  spinner.stop("Logged in successfully.");
};
