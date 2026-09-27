import { assertEquals } from "@std/assert";

import { parseQuickDate, validateQuickDate } from "./moveQuick.ts";

const defaults = { day: 1, month: 9, year: 2026 };

Deno.test("parseQuickDate parses a valid line", () => {
  assertEquals(parseQuickDate({ defaults, value: "2026 8 1" }), {
    day: 1,
    month: 8,
    year: 2026,
  });
});

Deno.test("parseQuickDate tolerates surrounding and repeated whitespace", () => {
  assertEquals(parseQuickDate({ defaults, value: "  2026   8 1  " }), {
    day: 1,
    month: 8,
    year: 2026,
  });
});

Deno.test("parseQuickDate substitutes * with defaults", () => {
  assertEquals(parseQuickDate({ defaults, value: "* * *" }), defaults);
  assertEquals(parseQuickDate({ defaults, value: "* 8 1" }), {
    day: 1,
    month: 8,
    year: 2026,
  });
  assertEquals(parseQuickDate({ defaults, value: "2025 * *" }), {
    day: 1,
    month: 9,
    year: 2025,
  });
});

Deno.test("parseQuickDate rejects wrong token counts", () => {
  assertEquals(parseQuickDate({ defaults, value: "2026 8" }), null);
  assertEquals(parseQuickDate({ defaults, value: "2026 8 1 2" }), null);
  assertEquals(parseQuickDate({ defaults, value: "" }), null);
  assertEquals(parseQuickDate({ defaults, value: " " }), null);
});

Deno.test("parseQuickDate rejects non-integer tokens", () => {
  assertEquals(parseQuickDate({ defaults, value: "abc 8 1" }), null);
  assertEquals(parseQuickDate({ defaults, value: "2026 8.5 1" }), null);
});

Deno.test("parseQuickDate enforces bounds", () => {
  assertEquals(parseQuickDate({ defaults, value: "1969 8 1" }), null);
  assertEquals(parseQuickDate({ defaults, value: "2101 8 1" }), null);
  assertEquals(parseQuickDate({ defaults, value: "2026 0 1" }), null);
  assertEquals(parseQuickDate({ defaults, value: "2026 13 1" }), null);
  assertEquals(parseQuickDate({ defaults, value: "2026 8 0" }), null);
  assertEquals(parseQuickDate({ defaults, value: "2026 8 32" }), null);
});

Deno.test("parseQuickDate rejects impossible calendar dates", () => {
  assertEquals(parseQuickDate({ defaults, value: "2026 2 30" }), null);
  assertEquals(parseQuickDate({ defaults, value: "2025 2 29" }), null);
  assertEquals(parseQuickDate({ defaults, value: "2024 2 29" })?.day, 29);
});

Deno.test("validateQuickDate returns undefined for valid input", () => {
  assertEquals(validateQuickDate({ defaults })("2026 8 1"), undefined);
  assertEquals(validateQuickDate({ defaults })("* * *"), undefined);
});

Deno.test("validateQuickDate returns an error string for invalid input", () => {
  const error = validateQuickDate({ defaults })("nope");

  assertEquals(typeof error, "string");
});
