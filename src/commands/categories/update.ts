import { Command } from "@cliffy/command";
import * as p from "@clack/prompts";

import { getCategories, getGroups, updateCategory } from "../../lib/api.ts";
import { formatCategoryLabel } from "../../lib/format.ts";
import {
  exitIfCancelled,
  runWithSpinner,
  selectGroup,
} from "../../lib/prompts.ts";

export const updateCategoryCommand = new Command()
  .description("Interactively update a category.")
  .action(async () => {
    p.intro("categories update");

    const categories = await runWithSpinner({
      action: getCategories,
      failure: "Failed to fetch categories.",
      start: "Fetching categories...",
      success: (list) =>
        `${list.length} categor${list.length === 1 ? "y" : "ies"} loaded.`,
    });

    if (categories.length === 0) {
      p.outro("No categories found.");
      return;
    }

    const categoryID = exitIfCancelled(
      await p.select({
        message: "Select category to update",
        options: categories.map((c) => ({
          label: formatCategoryLabel(c),
          value: c.categoryID,
        })),
      }),
    );

    const current = categories.find((c) => c.categoryID === categoryID)!;

    const fields = exitIfCancelled(
      await p.multiselect({
        message: "Which fields do you want to update?",
        options: [
          { label: `Name (current: ${current.name})`, value: "name" },
          {
            label: `Group (current: ${current.group.name})`,
            value: "groupID",
          },
        ],
        required: true,
      }),
    );

    const update: { groupID?: string; name?: string } = {};

    if (fields.includes("name")) {
      update.name = exitIfCancelled(
        await p.text({
          defaultValue: current.name,
          message: "Name",
          placeholder: current.name,
        }),
      );
    }

    if (fields.includes("groupID")) {
      const groups = await runWithSpinner({
        action: getGroups,
        failure: "Failed to fetch groups.",
        start: "Fetching groups...",
        success: (list) => `${list.length} group(s) loaded.`,
      });

      update.groupID = await selectGroup({
        groups,
        initialValue: current.groupID,
        message: "Group",
      });
    }

    const category = await runWithSpinner({
      action: () => updateCategory({ categoryID, ...update }),
      start: "Updating category...",
      success: () => "Category updated.",
    });

    console.log(JSON.stringify(category, null, 2));
    p.outro("Done.");
  });
