import { Command } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";

import { loginCommand } from "./src/commands/login.ts";
import { createCategoryCommand } from "./src/commands/categories/create.ts";
import { updateCategoryCommand } from "./src/commands/categories/update.ts";
import { createGroupCommand } from "./src/commands/groups/create.ts";
import { updateGroupCommand } from "./src/commands/groups/update.ts";
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
    "categories",
    new Command()
      .description("Manage categories.")
      .command("create", createCategoryCommand)
      .command("update", updateCategoryCommand),
  )
  .command(
    "groups",
    new Command()
      .description("Manage groups.")
      .command("create", createGroupCommand)
      .command("update", updateGroupCommand),
  )
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
