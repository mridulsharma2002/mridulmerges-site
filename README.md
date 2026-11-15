# mridulmerges-site

Personal links hub for @mridulmerges. Static page on Cloudflare Pages, plus two tiny Pages Functions for privacy-friendly analytics (no cookies).

## Edit content
1. Change `links.json` (links, Gusset, side projects). Layout and styles live in `template.html`.
2. `node build.mjs` regenerates `public/index.html` and `functions/_links.js`.
3. Commit and push. Pages deploys `main`.

## How tracking works
- Every outbound link is `/go/<slug>`. `functions/go/[slug].js` logs a `click` to Workers Analytics Engine (dataset `mridulmerges_clicks`) and 302-redirects.
- Visiting `/` logs a `view` (with `?src=` / referrer host / country / device).
- Use `?src=tiktok`, `?src=ig`, `?src=yt` on bio links to see which app sends visitors.
- `scripts/stats.sh 7` prints clicks per link, visits by source and clicks per day (needs `CF_ACCOUNT_ID` and `CF_API_TOKEN`).

## Side projects
Each project lives at its own subdomain (e.g. `switchboard.mridulmerges.com`) as a separate Pages project. Add a card in `links.json` under `projects` with a `slug` and `url` to make it clickable and tracked.
