import { assertEquals } from "@std/assert";

import { validateAmount } from "./validators.ts";

Deno.test("validateAmount accepts a positive integer string", () => {
  assertEquals(validateAmount("10050"), undefined);
});

Deno.test("validateAmount accepts surrounding whitespace", () => {
  assertEquals(validateAmount("  10050  "), undefined);
});

Deno.test("validateAmount rejects undefined and empty", () => {
  assertEquals(typeof validateAmount(undefined), "string");
  assertEquals(typeof validateAmount(""), "string");
});

Deno.test("validateAmount rejects zero and negative", () => {
  assertEquals(typeof validateAmount("0"), "string");
  assertEquals(typeof validateAmount("-5"), "string");
});

Deno.test("validateAmount rejects decimals", () => {
  assertEquals(typeof validateAmount("10.5"), "string");
});

Deno.test("validateAmount rejects leading zeros", () => {
  assertEquals(typeof validateAmount("007"), "string");
});

Deno.test("validateAmount rejects trailing junk", () => {
  assertEquals(typeof validateAmount("100abc"), "string");
});
