import { assertEquals } from "@std/assert";

import {
  parseQuickTransfer,
  parseQuickTransferAt,
  validateQuickTransfer,
} from "./transferQuick.ts";

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
  assertEquals(parseQuickTransfer("1494071 2026 7 17 21"), null);
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

const getFixedNow = () => new Date(2026, 6, 17, 21, 53, 42);

Deno.test("parseQuickTransferAt substitutes * with the current value", () => {
  const now = getFixedNow();

  assertEquals(
    parseQuickTransferAt({ now, value: "100 * 7 17 21 53 0" })?.year,
    2026,
  );
  assertEquals(
    parseQuickTransferAt({ now, value: "100 2026 * 17 21 53 0" })?.month,
    7,
  );
  assertEquals(
    parseQuickTransferAt({ now, value: "100 2026 7 * 21 53 0" })?.day,
    17,
  );
  assertEquals(
    parseQuickTransferAt({ now, value: "100 2026 7 17 * 53 0" })?.hour,
    21,
  );
  assertEquals(
    parseQuickTransferAt({ now, value: "100 2026 7 17 21 * 0" })?.minute,
    53,
  );
  assertEquals(
    parseQuickTransferAt({ now, value: "100 2026 7 17 21 53 *" })?.second,
    42,
  );
});

Deno.test("parseQuickTransferAt defaults omitted seconds to 0", () => {
  assertEquals(
    parseQuickTransferAt({ now: getFixedNow(), value: "100 2026 7 17 21 53" })
      ?.second,
    0,
  );
});

Deno.test("parseQuickTransferAt allows * for every date field at once", () => {
  assertEquals(
    parseQuickTransferAt({ now: getFixedNow(), value: "100 * * * * * *" }),
    {
      amount: 100,
      day: 17,
      hour: 21,
      minute: 53,
      month: 7,
      second: 42,
      year: 2026,
    },
  );
});

Deno.test("parseQuickTransferAt rejects * for the amount", () => {
  assertEquals(
    parseQuickTransferAt({ now: getFixedNow(), value: "* 2026 7 17 21 53 0" }),
    null,
  );
});

Deno.test("parseQuickTransferAt rejects an invalid calendar date after substitution", () => {
  const now = new Date(2026, 0, 31); // Jan 31

  assertEquals(
    parseQuickTransferAt({ now, value: "100 2026 2 * 21 53 0" }),
    null,
  );
});
