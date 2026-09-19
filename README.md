# grana

A Deno CLI to interact with the Denarii API. Supports login and interactive
management of transfers, operations, groups, and categories.

## Requirements

- [Deno](https://deno.com/) 2.x
- A running Denarii server

## Setup

Run once from the project directory to make `grana` available and set up shell
completions:

```bash
deno task install
source ~/.zshrc
```

This adds the project to your `PATH` and registers completions in `~/.zshrc`
automatically. After that you can run `grana` from anywhere.

## Usage

### Login

Authenticates against a Denarii server and saves the session locally.

```bash
deno task login
```

You will be prompted for:

- **Server URL** — prefilled with the last URL you used (or
  `http://localhost:2099` on first run); press Enter to keep it
- **Username**
- **Password**

The server URL is saved to `~/.grana/config.json` and the session to
`~/.grana/session.json`. You only need to log in once; subsequent commands reuse
the saved session.

---

### Create a transfer

```bash
deno task transfers create
```

Interactive flow:

1. Fetches your accounts from the server
2. Prompts you to select the **from** account
3. Prompts you to select the **to** account
4. Asks for the input mode (unless `--quick`/`--full` is passed):
   - **Quick** — enter amount and date on one line:
     `value year month day hour minute [second]` (e.g. `1494071 * 7 17 21 53`,
     amount in cents). Use `*` for any date field to use the current value, and
     omit `second` to default it to `0`.
   - **Full** — prompts for the **amount** (in cents) and then the **date**
     field by field, defaulting to now
5. Prompts for optional **comments**

Pass the mode directly to skip the picker:

```bash
deno task transfers create --quick
deno task transfers create --full
```

Prints the created transfer as JSON on success.

---

### Update a transfer

```bash
deno task transfers update
```

Interactive flow:

1. Fetches your transfers and accounts from the server
2. Shows a list of transfers to pick from (displayed as
   `From → To | $amount | date`)
3. Asks which fields you want to update (amount, date, from account, to account)
4. Prompts for new values for each selected field, showing current values as
   reference

Prints the updated transfer as JSON on success.

---

### Create operations from a JSON file

```bash
deno task operations create ./operations.json
```

Reads a JSON file, resolves accounts and categories, shows what it will create,
asks for confirmation, then POSTs each operation. Options:

- `--dry-run` — print the resolved payloads and exit without creating anything
- `-y`, `--yes` — skip the confirmation prompt

Nothing is sent if any entry is invalid; every error is listed with its entry
number so the whole file can be fixed in one pass.

#### File format

Either a bare array of operations, or an object with `defaults` (merged into
every entry, per-entry values win) and `operations`:

```json
{
  "defaults": {
    "atTimezone": "America/Sao_Paulo",
    "confirmed": true,
    "type": "Expense",
    "unitCount": 1
  },
  "operations": [
    {
      "account": "MasterCard Inter",
      "amount": -6400,
      "at": "2026-09-17T08:12",
      "category": "Miscelânea/Supermercado",
      "comments": "OPLIMA"
    }
  ]
}
```

Fields:

- `account` / `accountID` — required (one of them). `account` matches an account
  name, case-insensitively; `accountID` wins when both are present.
- `category` / `categoryID` — required (one of them). `category` matches a
  category name or `Group/Name`; an ambiguous name is an error.
- `at` — required. With a `Z` or `±HH:MM` offset it is used as given; without
  one it is read as local wall-clock time (`2026-09-17T08:12`). A date-only
  value becomes local midnight.
- `amount` — integer cents. The sign is forced from `type`, so `6400` and
  `-6400` both mean `-6400` for an `Expense`.
- `amountPerUnit` — optional integer cents. When present, `amount` is derived as
  `unitCount * amountPerUnit`; otherwise `amountPerUnit` is `amount / unitCount`
  and must divide evenly.
- `unitCount` — optional integer, defaults to `1`.
- `type` — `"Expense"` (default) or `"Income"`.
- `comments` — optional string, defaults to `""`.
- `confirmed` — optional boolean, defaults to `true`.
- `atTimezone` — optional IANA name, defaults to the machine timezone.
- `operationID` — optional UUID. One is generated when it is absent; supplying
  it makes a re-run idempotent (the server rejects a duplicate ID).

---

## Session

The session cookie is stored at `~/.grana/session.json`. If your session expires
or you want to switch servers, just run `login` again.

## Notes

- Amounts are entered in cents (e.g. `10050` for $100.50, `50` for $0.50).
- Dates accept any format parseable by `new Date()` — ISO 8601 is recommended
  (e.g. `2026-04-01T15:00:00`).
