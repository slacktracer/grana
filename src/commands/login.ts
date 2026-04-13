import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";
import { apiLogin } from "../lib/api.ts";
import { loadConfig, saveConfig, saveSession } from "../lib/session.ts";

export const loginCommand = new Command()
  .description("Log in to a Denarii server and save the session.")
  .action(async () => {
    p.intro("grana login");

    const savedConfig = await loadConfig();

    const baseUrl = await p.text({
      message: "Server URL",
      placeholder: "http://localhost:2099",
      defaultValue: savedConfig?.baseUrl ?? "http://localhost:2099",
    });

    if (p.isCancel(baseUrl)) {
      p.cancel("Cancelled.");
      Deno.exit(0);
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

    try {
      const { cookie } = await apiLogin(baseUrl, username, password);
      await Promise.all([saveConfig({ baseUrl }), saveSession({ cookie })]);
      spinner.stop("Logged in successfully.");
      p.outro("Session saved. You're ready to go.");
    } catch (err) {
      spinner.stop("Login failed.");
      p.outro((err as Error).message);
      Deno.exit(1);
    }
  });
