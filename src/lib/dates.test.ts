import { assertEquals, assertFalse } from "@std/assert";

import {
  dateTimeISO,
  dateTimeSecondsISO,
  endOfDayISO,
  isValidDateParts,
  sanitizeDateParts,
  startOfDayISO,
  validateDay,
  validateHour,
  validateMinute,
  validateMonth,
  validateYear,
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

Deno.test("dateTimeSecondsISO converts local date/time parts including seconds", () => {
  const parts = {
    day: 17,
    hour: 21,
    minute: 53,
    month: 7,
    second: 42,
    year: 2026,
  };
  const date = new Date(dateTimeSecondsISO(parts));

  assertEquals(date.getFullYear(), 2026);
  assertEquals(date.getMonth() + 1, 7);
  assertEquals(date.getDate(), 17);
  assertEquals(date.getHours(), 21);
  assertEquals(date.getMinutes(), 53);
  assertEquals(date.getSeconds(), 42);
});

Deno.test("dateTimeSecondsISO matches a directly constructed local Date", () => {
  const parts = {
    day: 17,
    hour: 21,
    minute: 53,
    month: 7,
    second: 42,
    year: 2026,
  };

  assertEquals(
    dateTimeSecondsISO(parts),
    new Date(2026, 6, 17, 21, 53, 42, 0).toISOString(),
  );
});

Deno.test("validateYear accepts in-range and rejects out-of-range", () => {
  assertEquals(validateYear("2026"), undefined);
  assertEquals(validateYear("1970"), undefined);
  assertEquals(validateYear("2100"), undefined);
  assertEquals(typeof validateYear("1969"), "string");
  assertEquals(typeof validateYear("2101"), "string");
  assertEquals(typeof validateYear("abc"), "string");
  assertEquals(typeof validateYear(undefined), "string");
});

Deno.test("validateMonth enforces 1 through 12", () => {
  assertEquals(validateMonth("1"), undefined);
  assertEquals(validateMonth("12"), undefined);
  assertEquals(typeof validateMonth("0"), "string");
  assertEquals(typeof validateMonth("13"), "string");
});

Deno.test("validateDay enforces 1 through 31", () => {
  assertEquals(validateDay("1"), undefined);
  assertEquals(validateDay("31"), undefined);
  assertEquals(typeof validateDay("0"), "string");
  assertEquals(typeof validateDay("32"), "string");
});

Deno.test("validateHour enforces 0 through 23", () => {
  assertEquals(validateHour("0"), undefined);
  assertEquals(validateHour("23"), undefined);
  assertEquals(typeof validateHour("-1"), "string");
  assertEquals(typeof validateHour("24"), "string");
});

Deno.test("validateMinute enforces 0 through 59", () => {
  assertEquals(validateMinute("0"), undefined);
  assertEquals(validateMinute("59"), undefined);
  assertEquals(typeof validateMinute("-1"), "string");
  assertEquals(typeof validateMinute("60"), "string");
});
