import { track } from "./_track.js";

// Home page: count the visit, then serve the static page.
export async function onRequestGet({ request, env }) {
  track(env, request, "view", "");
  return env.ASSETS.fetch(request);
}
