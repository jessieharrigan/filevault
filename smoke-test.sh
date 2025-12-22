#!/bin/bash

# Usage: ./smoke-test.sh <URL>
URL=$1

if [ -z "$URL" ]; then
  echo "Error: No URL provided."
  exit 1
fi

echo "🚀 Starting Smoke Test for: $URL"

# We retry up to 5 times because containers can take a few seconds to boot up
MAX_RETRIES=5
RETRY_COUNT=0
SLEEP_TIME=10

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Get the HTTP status code
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

  if [ "$STATUS" -eq 200 ]; then
    echo "✅ Success! Received HTTP 200."
    exit 0
  else
    echo "⚠️ Attempt $((RETRY_COUNT+1)): Received HTTP $STATUS. Retrying in ${SLEEP_TIME}s..."
    RETRY_COUNT=$((RETRY_COUNT+1))
    sleep $SLEEP_TIME
  fi
done

echo "❌ Smoke Test Failed after $MAX_RETRIES attempts."
exit 1