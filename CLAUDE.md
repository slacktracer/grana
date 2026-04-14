# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Code Style

- Two-space indentation, LF line endings
- Type imports required: use `import type { X }` not `import { X }` for types
- Formatting via `deno fmt`, linting via `deno lint`

## Rules to follow

- When adding imports that point to actual files always add the .ts extension.
  And whenever you find an import without the extension fix it and let me know.
- Whenever you create a function make it an arrow function if possible.
  Exception: when defining methods intended to be assigned to an object and
  accessed via `this` (e.g. game object methods like `render`, `update`,
  `move`), use the `function` keyword and type `this` explicitly:
  `export const render = function (this: Zone) { ... }`. Arrow functions capture
  `this` lexically and cannot serve as `this`-based object methods.
- Do not add a prefix-like "T" in type names unless you have an EXCELLENT reason
  to do it. If you ever think you have one let me know.
- Whenever you create a function make it, as much as possible, a unary function.
  The arguments it will receive should be wrapped in a struct-like object. The
  result ios similar to named params in Python.
- Try to have one empty line between statements (not imports) as much as
  possible. Exception: type properties do not need empty lines between them.
- When writing IF statements always put the brackets and follow the example
  below: if (x) { doThis(); } else { doThat(); }
- Put CSS properties in alphabetical order.
- Put object and their sub-properties in alphabetical order.
- Put type properties and their sub-properties in alphabetical order.
- Avoid as much as possible creating one or more functions inside other
  functions. Prefer factory function if you really need something like that. And
  tell me about it when you do it or when you think you need to have a function
  created inside another function.
- Functions must have verbs. If you consider an exception let me know.
- Do not use UPPERCASE or snake_case for naming. Use camelCase for constants,
  variables, and functions; use PascalCase for types.
