#!/bin/bash
# Send animation status to ESP32 over serial.
# Usage: set_status.sh <idle|running|typing>
# Called by Claude Code hooks via stdin JSON or direct argument.

STATUS="$1"

# If no argument, consume stdin without blocking (hook mode passes JSON)
if [ -z "$STATUS" ]; then
  cat > /dev/null &
  exit 0
fi

# Find the ESP32 serial port (ESP32-S3 USB CDC)
PORT=$(ls /dev/cu.usbmodem* 2>/dev/null | head -1)
if [ -z "$PORT" ]; then
  exit 0
fi

# Send in background with a kill timer (macOS-friendly, no timeout needed)
(
  printf '%s\n' "$STATUS" > "$PORT"
) &
BGPID=$!

# Kill it after 2 seconds if still running
(
  sleep 2
  kill "$BGPID" 2>/dev/null
) &

exit 0