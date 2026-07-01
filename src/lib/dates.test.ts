import { assertEquals, assertFalse } from "@std/assert";

import {
  dateTimeISO,
  endOfDayISO,
  isValidDateParts,
  sanitizeDateParts,
  startOfDayISO,
} from "./dates.ts";

Deno.test("isValidDateParts accepts standard dates", () => {
  assertEquals(isValidDateParts({ day: 1, month: 1, year: 2026 }), true);
  assertEquals(isValidDateParts({ day: 28, month: 2, year: 2026 }), true);
  assertEquals(isValidDateParts({ day: 31, month: 12, year: 2026 }), true);
  assertEquals(isValidDateParts({ day: 30, month: 4, year: 2026 }), true);
});

Deno.test("isValidDateParts accepts leap day on leap year", () => {
  assertEquals(isValidDateParts({ day: 29, month: 2, year: 2024 }), true);
});

Deno.test("isValidDateParts rejects leap day on non-leap year", () => {
  assertFalse(isValidDateParts({ day: 29, month: 2, year: 2026 }));
});

Deno.test("isValidDateParts rejects day 31 in 30-day month", () => {
  assertFalse(isValidDateParts({ day: 31, month: 4, year: 2026 }));
  assertFalse(isValidDateParts({ day: 31, month: 6, year: 2026 }));
});

Deno.test("isValidDateParts rejects out-of-range day", () => {
  assertFalse(isValidDateParts({ day: 0, month: 1, year: 2026 }));
  assertFalse(isValidDateParts({ day: 32, month: 1, year: 2026 }));
});

Deno.test("sanitizeDateParts parses valid object", () => {
  assertEquals(sanitizeDateParts({ day: 15, month: 6, year: 2026 }), {
    day: 15,
    month: 6,
    year: 2026,
  });
});

Deno.test("sanitizeDateParts returns null for non-objects", () => {
  assertEquals(sanitizeDateParts(null), null);
  assertEquals(sanitizeDateParts(undefined), null);
  assertEquals(sanitizeDateParts("2026-06-15"), null);
  assertEquals(sanitizeDateParts(42), null);
});

Deno.test("sanitizeDateParts returns null when fields are wrong type", () => {
  assertEquals(sanitizeDateParts({ day: "15", month: 6, year: 2026 }), null);
  assertEquals(sanitizeDateParts({ day: 15, month: null, year: 2026 }), null);
  assertEquals(sanitizeDateParts({}), null);
});

Deno.test("startOfDayISO returns midnight local time as ISO string", () => {
  const parts = { day: 15, month: 6, year: 2026 };
  const iso = startOfDayISO(parts);
  const date = new Date(iso);

  assertEquals(date.getFullYear(), 2026);
  assertEquals(date.getMonth() + 1, 6);
  assertEquals(date.getDate(), 15);
  assertEquals(date.getHours(), 0);
  assertEquals(date.getMinutes(), 0);
  assertEquals(date.getSeconds(), 0);
  assertEquals(date.getMilliseconds(), 0);
});

Deno.test("endOfDayISO returns 23:59:59.999 local time as ISO string", () => {
  const parts = { day: 15, month: 6, year: 2026 };
  const iso = endOfDayISO(parts);
  const date = new Date(iso);

  assertEquals(date.getFullYear(), 2026);
  assertEquals(date.getMonth() + 1, 6);
  assertEquals(date.getDate(), 15);
  assertEquals(date.getHours(), 23);
  assertEquals(date.getMinutes(), 59);
  assertEquals(date.getSeconds(), 59);
  assertEquals(date.getMilliseconds(), 999);
});

Deno.test("dateTimeISO converts local date/time parts to ISO string", () => {
  const parts = { day: 15, hour: 14, minute: 30, month: 6, year: 2026 };
  const iso = dateTimeISO(parts);
  const date = new Date(iso);

  assertEquals(date.getFullYear(), 2026);
  assertEquals(date.getMonth() + 1, 6);
  assertEquals(date.getDate(), 15);
  assertEquals(date.getHours(), 14);
  assertEquals(date.getMinutes(), 30);
  assertEquals(date.getSeconds(), 0);
});

Deno.test("startOfDayISO and endOfDayISO produce the same calendar day", () => {
  const parts = { day: 1, month: 1, year: 2026 };
  const start = new Date(startOfDayISO(parts));
  const end = new Date(endOfDayISO(parts));

  assertEquals(start.getDate(), end.getDate());
  assertEquals(start.getMonth(), end.getMonth());
  assertEquals(start.getFullYear(), end.getFullYear());
});
