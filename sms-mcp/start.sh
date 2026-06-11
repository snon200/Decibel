#!/usr/bin/env bash
# Start the MCP server and an ngrok tunnel together. Ctrl-C stops both.
# The public https URL ngrok prints is your Context MCP url (append /mcp).
set -euo pipefail

PORT="${PORT:-8787}"

npm run start &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT INT TERM

# Give the server a moment to bind before ngrok connects.
sleep 1

echo "Starting ngrok tunnel for http://localhost:${PORT} ..."
ngrok http "${PORT}" --log=stdout
