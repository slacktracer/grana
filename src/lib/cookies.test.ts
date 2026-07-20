import { assertEquals, assertThrows } from "@std/assert";

import { parseSetCookies } from "./cookies.ts";

Deno.test("parseSetCookies keeps a single cookie and strips attributes", () => {
  assertEquals(
    parseSetCookies(["session=abc123; Path=/; HttpOnly; SameSite=Lax"]),
    "session=abc123",
  );
});

Deno.test("parseSetCookies joins multiple cookies with a separator", () => {
  assertEquals(
    parseSetCookies(["a=1; Path=/", "b=2; HttpOnly"]),
    "a=1; b=2",
  );
});

Deno.test("parseSetCookies throws when given no cookies", () => {
  assertThrows(
    () => parseSetCookies([]),
    Error,
    "No session cookies received",
  );
});
