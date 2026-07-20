import { assertEquals } from "@std/assert";

import { parseQuickTransfer, validateQuickTransfer } from "./transferQuick.ts";

Deno.test("parseQuickTransfer parses a valid line", () => {
  assertEquals(parseQuickTransfer("1494071 2026 7 17 21 53 0"), {
    amount: 1494071,
    day: 17,
    hour: 21,
    minute: 53,
    month: 7,
    second: 0,
    year: 2026,
  });
});

Deno.test("parseQuickTransfer tolerates surrounding and repeated whitespace", () => {
  assertEquals(parseQuickTransfer("  1494071   2026 7 17 21 53 0  "), {
    amount: 1494071,
    day: 17,
    hour: 21,
    minute: 53,
    month: 7,
    second: 0,
    year: 2026,
  });
});

Deno.test("parseQuickTransfer rejects wrong token counts", () => {
  assertEquals(parseQuickTransfer("1494071 2026 7 17 21 53"), null);
  assertEquals(parseQuickTransfer("1494071 2026 7 17 21 53 0 99"), null);
  assertEquals(parseQuickTransfer(" "), null);
  assertEquals(parseQuickTransfer(""), null);
});

Deno.test("parseQuickTransfer rejects non-integer tokens", () => {
  assertEquals(parseQuickTransfer("10.5 2026 7 17 21 53 0"), null);
  assertEquals(parseQuickTransfer("abc 2026 7 17 21 53 0"), null);
  assertEquals(parseQuickTransfer("1000 2026 7 17 21 53 x"), null);
});

Deno.test("parseQuickTransfer accepts exponent notation that Number treats as integer", () => {
  const parsed = parseQuickTransfer("1e3 2026 7 17 21 53 0");

  assertEquals(parsed?.amount, 1000);
});

Deno.test("parseQuickTransfer rejects non-positive amounts", () => {
  assertEquals(parseQuickTransfer("0 2026 7 17 21 53 0"), null);
  assertEquals(parseQuickTransfer("-5 2026 7 17 21 53 0"), null);
});

Deno.test("parseQuickTransfer enforces year bounds", () => {
  assertEquals(parseQuickTransfer("100 1969 7 17 21 53 0"), null);
  assertEquals(parseQuickTransfer("100 2101 7 17 21 53 0"), null);
  assertEquals(parseQuickTransfer("100 1970 7 17 21 53 0")?.year, 1970);
  assertEquals(parseQuickTransfer("100 2100 7 17 21 53 0")?.year, 2100);
});

Deno.test("parseQuickTransfer enforces month bounds", () => {
  assertEquals(parseQuickTransfer("100 2026 0 17 21 53 0"), null);
  assertEquals(parseQuickTransfer("100 2026 13 17 21 53 0"), null);
});

Deno.test("parseQuickTransfer enforces day bounds", () => {
  assertEquals(parseQuickTransfer("100 2026 7 0 21 53 0"), null);
  assertEquals(parseQuickTransfer("100 2026 7 32 21 53 0"), null);
});

Deno.test("parseQuickTransfer enforces time bounds", () => {
  assertEquals(parseQuickTransfer("100 2026 7 17 24 53 0"), null);
  assertEquals(parseQuickTransfer("100 2026 7 17 -1 53 0"), null);
  assertEquals(parseQuickTransfer("100 2026 7 17 21 60 0"), null);
  assertEquals(parseQuickTransfer("100 2026 7 17 21 53 60"), null);
  assertEquals(parseQuickTransfer("100 2026 7 17 23 59 59")?.hour, 23);
});

Deno.test("parseQuickTransfer rejects impossible calendar dates", () => {
  assertEquals(parseQuickTransfer("100 2026 2 30 21 53 0"), null);
  assertEquals(parseQuickTransfer("100 2026 4 31 21 53 0"), null);
  assertEquals(parseQuickTransfer("100 2025 2 29 21 53 0"), null);
  assertEquals(parseQuickTransfer("100 2024 2 29 21 53 0")?.day, 29);
});

Deno.test("validateQuickTransfer returns undefined for valid input", () => {
  assertEquals(validateQuickTransfer("1494071 2026 7 17 21 53 0"), undefined);
});

Deno.test("validateQuickTransfer returns an error string for invalid input", () => {
  const error = validateQuickTransfer("nope");

  assertEquals(typeof error, "string");
});
