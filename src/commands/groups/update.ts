import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import { getGroups, updateGroup } from "../../lib/api.ts";
import {
  exitIfCancelled,
  runWithSpinner,
  selectGroup,
} from "../../lib/prompts.ts";

export const updateGroupCommand = new Command()
  .description("Interactively update a group.")
  .action(async () => {
    p.intro("groups update");

    const groups = await runWithSpinner({
      action: getGroups,
      failure: "Failed to fetch groups.",
      start: "Fetching groups...",
      success: (list) => `${list.length} group(s) loaded.`,
    });

    if (groups.length === 0) {
      p.outro("No groups found.");
      return;
    }

    const groupID = await selectGroup({
      groups,
      message: "Select group to update",
    });

    const current = groups.find((g) => g.groupID === groupID)!;

    const name = exitIfCancelled(
      await p.text({
        defaultValue: current.name,
        message: "Name",
        placeholder: current.name,
      }),
    );

    const group = await runWithSpinner({
      action: () => updateGroup({ groupID, name }),
      start: "Updating group...",
      success: () => "Group updated.",
    });

    console.log(JSON.stringify(group, null, 2));
    p.outro("Done.");
  });
