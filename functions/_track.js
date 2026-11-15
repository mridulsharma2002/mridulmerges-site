// Writes one event to Workers Analytics Engine (binding: CLICKS).
// blobs: [event, slug, country, referrer host, device, src, bot]
// Never throws: tracking must not break a redirect or the page.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|headless|lighthouse|curl|wget|python|node-fetch/i;

export function track(env, request, event, slug) {
  try {
    if (!env.CLICKS) return;
    const ua = request.headers.get("user-agent") || "";
    const ref = request.headers.get("referer") || "";
    const url = new URL(request.url);
    let refHost = "";
    try { refHost = ref ? new URL(ref).hostname : ""; } catch {}
    const device = /mobile|iphone|android/i.test(ua) ? "mobile" : "desktop";
    const src = (url.searchParams.get("src") || url.searchParams.get("utm_source") || "").slice(0, 32);
    env.CLICKS.writeDataPoint({
      blobs: [event, slug || "", request.cf?.country || "", refHost, device, src, BOT.test(ua) ? "bot" : "human"],
      doubles: [1],
      indexes: [slug || event],
    });
  } catch {}
}
