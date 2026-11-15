import { LINKS } from "../_links.js";
import { track } from "../_track.js";

// /go/<slug> → count the click, then redirect to the real link.
export async function onRequest({ request, env, params }) {
  const slug = String(params.slug || "").toLowerCase();
  const target = LINKS[slug];
  if (!target) return Response.redirect(new URL("/", request.url).toString(), 302);
  track(env, request, "click", slug);
  return new Response(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "no-store", "Referrer-Policy": "strict-origin-when-cross-origin" },
  });
}
