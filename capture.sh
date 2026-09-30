#!/usr/bin/env bash
# Capture desktop + mobile screenshots of the exact $CAPTURE_URL into $CAPTURE_DIR.
# Exit 75 = temporary navigation/browser infrastructure failure.
# Exit 1  = script usage error or rendering/verification defect.
set -euo pipefail

if [[ -z "${CAPTURE_URL:-}" ]]; then
  echo "capture.sh: CAPTURE_URL is not set" >&2
  exit 1
fi
if [[ -z "${CAPTURE_DIR:-}" ]]; then
  echo "capture.sh: CAPTURE_DIR is not set" >&2
  exit 1
fi
RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"
CAPTURE_SCRIPT="$RUNTIME_DIR/scripts/default-capture.mjs"
if [[ ! -f "$CAPTURE_SCRIPT" ]]; then
  echo "capture.sh: missing $CAPTURE_SCRIPT" >&2
  exit 1
fi

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node --check "$CAPTURE_SCRIPT"
/usr/bin/time -p node "$CAPTURE_SCRIPT"
status=$?
if [[ $status -eq 75 ]]; then
  echo "capture.sh: temporary browser/navigation failure (exit 75)" >&2
  exit 75
fi
if [[ $status -ne 0 ]]; then
  echo "capture.sh: capture backend failed (exit $status)" >&2
  exit 1
fi
# Verify rendered output: both views must exist and be non-empty.
/usr/bin/time -p test -s "$CAPTURE_DIR/final-desktop.png"
/usr/bin/time -p test -s "$CAPTURE_DIR/final-mobile.png"
if ! /usr/bin/time -p node -e 'const fs=require("fs");for(const f of process.argv.slice(1)){const b=fs.readFileSync(f);if(!b.slice(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))process.exit(1);}' "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png"; then
  echo "capture.sh: screenshot is not a valid PNG (rendering defect)" >&2
  exit 1
fi
/usr/bin/time -p ls -la "$CAPTURE_DIR"
echo "capture.sh: OK -> $CAPTURE_DIR/final-desktop.png + final-mobile.png (app left running)"
