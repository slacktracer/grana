import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import { createGroup } from "../../lib/api.ts";
import { exitIfCancelled, runWithSpinner } from "../../lib/prompts.ts";

const validateName = (value: string | undefined): string | undefined => {
  if (!value?.trim()) {
    return "Name is required";
  }
};

export const createGroupCommand = new Command()
  .description("Interactively create a group.")
  .action(async () => {
    p.intro("groups create");

    const name = exitIfCancelled(
      await p.text({ message: "Name", validate: validateName }),
    );

    const group = await runWithSpinner({
      action: () => createGroup({ name }),
      start: "Creating group...",
      success: () => "Group created.",
    });

    console.log(JSON.stringify(group, null, 2));
    p.outro("Done.");
  });
