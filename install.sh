#!/usr/bin/env bash
set -e

GRANA_DIR="$(cd "$(dirname "$0")" && pwd)"
ZSHRC="$HOME/.zshrc"
PATH_LINE="export PATH=\"\$PATH:$GRANA_DIR\""

chmod +x "$GRANA_DIR/grana"

# Add to PATH if not already there
if ! grep -qF "$GRANA_DIR" "$ZSHRC"; then
  echo "$PATH_LINE" >> "$ZSHRC"
  echo "Added $GRANA_DIR to PATH in $ZSHRC"
else
  echo "PATH already contains $GRANA_DIR, skipping."
fi

# Add completions if not already there
if ! grep -qF "grana completions zsh" "$ZSHRC"; then
  "$GRANA_DIR/grana" completions zsh >> "$ZSHRC"
  echo "Shell completions added."
else
  echo "Completions already present, skipping."
fi

echo "Done. Run: source ~/.zshrc"
