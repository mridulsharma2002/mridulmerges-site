#!/usr/bin/env bash
# Pull click + visit stats from Workers Analytics Engine.
# Needs CF_ACCOUNT_ID and CF_API_TOKEN (Account Analytics: Read). Usage: scripts/stats.sh [days=7]
set -euo pipefail
DAYS="${1:-7}"
q() {
  curl -sS "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" --data "$1"
}
echo "== Clicks per link, last ${DAYS} days (humans) =="
q "SELECT blob2 AS link, SUM(_sample_interval) AS clicks FROM mridulmerges_clicks
   WHERE blob1 = 'click' AND blob7 = 'human' AND timestamp > NOW() - INTERVAL '${DAYS}' DAY
   GROUP BY link ORDER BY clicks DESC FORMAT PrettyCompact"
echo "== Page visits by source (?src= or referrer) =="
q "SELECT if(blob6 != '', blob6, if(blob4 != '', blob4, 'direct')) AS source, SUM(_sample_interval) AS visits FROM mridulmerges_clicks
   WHERE blob1 = 'view' AND blob7 = 'human' AND timestamp > NOW() - INTERVAL '${DAYS}' DAY
   GROUP BY source ORDER BY visits DESC FORMAT PrettyCompact"
echo "== Clicks by day =="
q "SELECT toDate(timestamp) AS day, SUM(_sample_interval) AS clicks FROM mridulmerges_clicks
   WHERE blob1 = 'click' AND blob7 = 'human' AND timestamp > NOW() - INTERVAL '${DAYS}' DAY
   GROUP BY day ORDER BY day FORMAT PrettyCompact"
