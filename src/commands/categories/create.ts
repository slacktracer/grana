import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import { createCategory, getGroups } from "../../lib/api.ts";
import {
  exitIfCancelled,
  runWithSpinner,
  selectGroup,
} from "../../lib/prompts.ts";

const validateName = (value: string | undefined): string | undefined => {
  if (!value?.trim()) {
    return "Name is required";
  }
};

export const createCategoryCommand = new Command()
  .description("Interactively create a category.")
  .action(async () => {
    p.intro("categories create");

    const groups = await runWithSpinner({
      action: getGroups,
      failure: "Failed to fetch groups.",
      start: "Fetching groups...",
      success: (list) => `${list.length} group(s) loaded.`,
    });

    if (groups.length === 0) {
      p.outro("No groups found. Create a group first.");
      return;
    }

    const groupID = await selectGroup({ groups, message: "Group" });

    const name = exitIfCancelled(
      await p.text({ message: "Name", validate: validateName }),
    );

    const category = await runWithSpinner({
      action: () => createCategory({ groupID, name }),
      start: "Creating category...",
      success: () => "Category created.",
    });

    console.log(JSON.stringify(category, null, 2));
    p.outro("Done.");
  });
