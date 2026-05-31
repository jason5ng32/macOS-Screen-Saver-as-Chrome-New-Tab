#!/bin/bash
# Macify aerial downloader — one-shot bootstrap.
#
# Fetches the aerial_downloader Python package from GitHub, drops it into
# a temp directory, and runs it. No clone, no install — the whole package
# is ~30KB across 9 small .py files.
#
# Requires: macOS, python3 (preinstalled with Xcode Command Line Tools).
# Does NOT require: clone of this repo, npm, or any extra installs.
#
# Run via:
#   bash <(curl -fsSL https://raw.githubusercontent.com/jason5ng32/Macify/main/scripts/aerial_downloader/install.sh)
#
# Pass flags through directly:
#   bash <(curl -fsSL .../install.sh) --limit 5 --dry-run
#
# Override the source (for development/testing) with:
#   MACIFY_SOURCE=https://raw.githubusercontent.com/.../scripts/aerial_downloader \
#     bash <(curl -fsSL ...)

set -euo pipefail

SOURCE_BASE="${MACIFY_SOURCE:-https://raw.githubusercontent.com/jason5ng32/Macify/main/scripts/aerial_downloader}"

# Files in the aerial_downloader package. If you add or remove a .py file
# from scripts/aerial_downloader/, update this list in the same commit.
FILES=(
    __init__.py
    cli.py
    downloader.py
    main.py
    manifest.py
    models.py
    network.py
    planner.py
    terminal.py
)

# --- Output helpers -----------------------------------------------------------

if [ -t 1 ]; then TTY=1; else TTY=0; fi
c_red()    { [ "$TTY" = "1" ] && printf '\033[31m%s\033[0m' "$*" || printf '%s' "$*"; }
c_green()  { [ "$TTY" = "1" ] && printf '\033[32m%s\033[0m' "$*" || printf '%s' "$*"; }
c_cyan()   { [ "$TTY" = "1" ] && printf '\033[36m%s\033[0m' "$*" || printf '%s' "$*"; }

info() { printf '%s %s\n' "$(c_cyan 'ℹ')" "$*"; }
ok()   { printf '%s %s\n' "$(c_green '✓')" "$*"; }
fail() { printf '%s %s\n' "$(c_red '✗')" "$*" >&2; exit 1; }

# --- Pre-flight ---------------------------------------------------------------

if [ "$(uname -s)" != "Darwin" ]; then
    fail "macOS only."
fi

if ! command -v python3 >/dev/null 2>&1; then
    fail "python3 not found. Install Xcode Command Line Tools first:
  xcode-select --install"
fi

if ! python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)' \
        >/dev/null 2>&1; then
    fail "python3 didn't run, or is older than 3.7.
Install/update Xcode Command Line Tools:  xcode-select --install"
fi

# --- Fetch package ------------------------------------------------------------

TMPDIR="$(mktemp -d -t macify-aerials.XXXXXX)"
trap 'rm -rf "$TMPDIR"' EXIT

PKG_DIR="$TMPDIR/aerial_downloader"
mkdir -p "$PKG_DIR"

info "fetching aerial_downloader package (${#FILES[@]} files, ~30 KB)"

# Fire all curls in parallel, fail fast on any error.
pids=()
for f in "${FILES[@]}"; do
    curl -fsSL "$SOURCE_BASE/$f" -o "$PKG_DIR/$f" &
    pids+=("$!")
done

failed=0
for pid in "${pids[@]}"; do
    wait "$pid" || failed=1
done

if [ "$failed" = "1" ]; then
    fail "Failed to fetch one or more package files from $SOURCE_BASE"
fi

ok "package ready"

# --- Run ----------------------------------------------------------------------

# Some users habitually pass `--` like with `pnpm run X -- --flag`. Eat a
# leading `--` so both forms work; argparse otherwise mistakes it for a
# positional and errors out.
if [ "${1:-}" = "--" ]; then
    shift
fi

cd "$TMPDIR"
exec python3 -m aerial_downloader.main "$@"
