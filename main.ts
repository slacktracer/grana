import { Command } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";

import { loginCommand } from "./src/commands/login.ts";
import { moveOperationCommand } from "./src/commands/operations/move.ts";
import { createTransferCommand } from "./src/commands/transfers/create.ts";
import { updateTransferCommand } from "./src/commands/transfers/update.ts";

await new Command()
  .name("grana")
  .version("0.1.0")
  .description("CLI to interact with the Denarii API.")
  .command("completions", new CompletionsCommand())
  .command("login", loginCommand)
  .command(
    "operations",
    new Command()
      .description("Manage operations.")
      .command("move", moveOperationCommand),
  )
  .command(
    "transfers",
    new Command()
      .description("Manage transfers.")
      .command("create", createTransferCommand)
      .command("update", updateTransferCommand),
  )
  .parse(Deno.args);
