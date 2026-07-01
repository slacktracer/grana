import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import { reLogin } from "../lib/auth.ts";
import { exitIfCancelled } from "../lib/prompts.ts";
import { loadConfig, saveConfig } from "../lib/session.ts";

export const loginCommand = new Command()
  .description("Log in to a Denarii server and save the session.")
  .action(async () => {
    p.intro("grana login");

    const savedConfig = await loadConfig();

    const baseUrl = exitIfCancelled(
      await p.text({
        defaultValue: savedConfig?.baseUrl ?? "http://localhost:2099",
        message: "Server URL",
        placeholder: "http://localhost:2099",
      }),
    );

    await saveConfig({ ...savedConfig, baseUrl });

    try {
      await reLogin();
      p.outro("Session saved. You're ready to go.");
    } catch (err) {
      p.outro((err as Error).message);
      Deno.exit(1);
    }
  });
