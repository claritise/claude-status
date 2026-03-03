#!/bin/bash
# Send animation status to ESP32 over serial.
# Usage: set_status.sh <idle|running|typing>
# Called by Claude Code hooks via stdin JSON or direct argument.

STATUS="$1"

# If no argument, try to read from stdin (hook mode passes JSON on stdin)
if [ -z "$STATUS" ]; then
  INPUT=$(cat)
  # Hooks pass JSON on stdin; we don't need to parse it since the hook
  # config determines which status to send (see settings.json).
  exit 0
fi

# Find the ESP32 serial port (ESP32-S3 USB CDC)
PORT=$(ls /dev/cu.usbmodem* 2>/dev/null | head -1)
if [ -z "$PORT" ]; then
  exit 0  # ESP32 not connected, fail silently
fi

# Send the command. Use a subshell to avoid blocking.
printf '%s\n' "$STATUS" > "$PORT"
