// Builds public/index.html and functions/_links.js from links.json + template.html.
// Run: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const site = JSON.parse(readFileSync("links.json", "utf8"));
const icons = JSON.parse(readFileSync("icons.json", "utf8"));
const gus = readFileSync("assets/gus.svg", "utf8").trim();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]}"/></svg>`;
const arrow = `<svg class="arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const social = site.social.map((l) => `
      <li><a class="link" href="/go/${l.slug}" data-slug="${l.slug}">
        <span class="ic">${svg(l.icon)}</span><b>${esc(l.label)}</b><span class="h">${esc(l.sub)}</span>${arrow}
      </a></li>`).join("");

const mark = {
  gusset: `<span class="slot gusslot" aria-hidden="true">${gus}</span>`,
  switchboard: `<span class="slot" aria-hidden="true"><svg class="swmark" viewBox="0 0 32 32"><rect width="32" height="32" rx="9"/><circle class="j1" cx="9" cy="9" r="3"/><circle class="j2" cx="23" cy="23" r="3"/><path d="M9 9 C9 18 23 14 23 23"/></svg></span>`,
};
mark.fly = `<span class="slot" aria-hidden="true"><svg class="flymark" viewBox="0 0 32 32"><rect width="32" height="32" rx="9"/><path class="ax" d="M9 21 16 12 23 20M16 12v-3"/><circle class="n1" cx="9" cy="21" r="2.6"/><circle class="n2" cx="16" cy="12" r="2.6"/><circle class="n3" cx="23" cy="20" r="2.6"/><circle class="n4" cx="16" cy="8" r="1.8"/></svg></span>`;
mark.radar = `<span class="slot" aria-hidden="true"><svg class="rdmark" viewBox="0 0 32 32"><rect width="32" height="32" rx="9"/><circle class="rg" cx="16" cy="16" r="10"/><circle class="rg" cx="16" cy="16" r="5"/><path class="sw" d="M16 16 L24.7 11"/><circle class="me" cx="16" cy="16" r="1.8"/><circle class="bl" cx="21" cy="10" r="2"/><circle class="bl b2" cx="10" cy="20" r="1.7"/></svg></span>`;
mark.evantage = `<span class="slot" aria-hidden="true"><svg class="evmark" viewBox="0 0 32 32"><rect width="32" height="32" rx="9"/><path class="bolt" d="M17.6 6 10 17h5.4l-1 9L22 15h-5.6l1.2-9Z"/></svg></span>`;
const board = `<span class="demo" aria-hidden="true"><span><span class="board">
          <svg viewBox="0 0 268 76"><path class="ln" d="M14 38 C 100 38, 130 12, 200 12"/><path class="ln" d="M14 38 H 200"/><path class="ln" d="M14 38 C 100 38, 130 64, 200 64"/>
          <circle class="src" cx="14" cy="38" r="5"/><circle class="dst" cx="200" cy="12" r="5"/><circle class="dst" cx="200" cy="38" r="5"/><circle class="dst" cx="200" cy="64" r="5"/>
          <text class="lb" x="212" y="16">Haiku</text><text class="lb" x="212" y="42">Sonnet</text><text class="lb" x="212" y="68">Opus</text><circle class="pk" cx="14" cy="38" r="0"/></svg>
          <span class="cap"><span>1 · Read the ticket</span><b>→ Haiku</b></span>
        </span></span></span>`;
const flyDemo = `<span class="demo" aria-hidden="true"><span><span class="board flyboard">
          <svg viewBox="0 0 268 76"><circle class="glow" cx="196" cy="36" r="22"/><circle class="sugar" cx="196" cy="36" r="6"/>
          <path class="trail" id="flytrail" d="M14 62 C 50 66, 58 18, 100 26 S 150 52, 186 38"/>
          <g class="fly"><ellipse cx="0" cy="0" rx="5.5" ry="3.4"/><circle cx="5" cy="0" r="2.2"/><animateMotion dur="3.4s" repeatCount="indefinite" rotate="auto" keyPoints="0;1;1" keyTimes="0;.8;1" calcMode="linear"><mpath href="#flytrail"/></animateMotion></g>
          <g class="nr">${[0,1,2,3,4,5,6,7,8].map(i=>`<circle cx="${232+(i%3)*12}" cy="${24+Math.floor(i/3)*12}" r="3" style="animation-delay:${(i*0.37%1.4).toFixed(2)}s"/>`).join("")}</g></svg>
          <span class="cap"><span>sugar → 867 neurons → MN9</span><b>eats</b></span>
        </span></span></span>`;
const radarDemo = `<span class="demo" aria-hidden="true"><span><span class="board rdboard">
          <svg viewBox="0 0 268 76"><g transform="translate(60 38)"><circle class="rg" r="34"/><circle class="rg" r="20"/><circle class="rg" r="8"/>
          <g class="sweep"><path d="M0 0 L34 0 A34 34 0 0 0 29.4 -17 Z"/></g><circle class="me" r="2.4"/>
          ${[[14,-6],[-12,10],[24,18],[-27,-10],[5,27],[-6,-22]].map(([x,y],i)=>`<circle class="bl" cx="${x}" cy="${y}" r="3" style="animation-delay:${(i*0.55).toFixed(2)}s"/>`).join("")}</g>
          <text class="lb" x="116" y="34">6 devices saying hello</text><text class="lb sm" x="116" y="52">no names · no IDs</text></svg>
        </span></span></span>`;
const projects = site.building.map((p) => `
      <li><a class="proj" href="/go/${p.slug}" data-slug="${p.slug}">
        ${mark[p.slug] || "<span></span>"}
        <span><b>${esc(p.label)}</b><span class="pill">${esc(p.tag)}</span><p>${esc(p.desc)}</p>${p.slug === "gusset" ? `<span class="bubble" aria-hidden="true">What did you work on today?</span>` : ""}${p.slug === "switchboard" ? board : ""}${p.slug === "fly" ? flyDemo : ""}${p.slug === "radar" ? radarDemo : ""}</span><span class="yr">${esc(p.year)}</span>${arrow}
      </a></li>`).join("");

const html = readFileSync("template.html", "utf8")
  .replaceAll("{{url}}", site.url)
  .replaceAll("{{tagline}}", esc(site.tagline))
  .replaceAll("{{bio}}", esc(site.bio))
  .replaceAll("{{signoff}}", esc(site.signoff))
  .replaceAll("{{year}}", String(new Date().getFullYear()))
  .replace("{{social}}", social)
  .replace("{{projects}}", projects);
if (/\{\{\w+\}\}/.test(html)) throw new Error("unfilled placeholder: " + html.match(/\{\{\w+\}\}/)[0]);
writeFileSync("public/index.html", html);
writeFileSync("public/evantage.html", readFileSync("evantage.html", "utf8").replaceAll("{{url}}", site.url).replaceAll("{{year}}", String(new Date().getFullYear())));

const map = Object.fromEntries([...site.social, ...site.building].filter((l) => l.slug && l.url).map((l) => [l.slug, l.url]));
mkdirSync("functions", { recursive: true });
writeFileSync("functions/_links.js", `// Generated by build.mjs from links.json. Do not edit by hand.\nexport const LINKS = ${JSON.stringify(map, null, 2)};\n`);
console.log("built", Object.keys(map).join(", "), (html.length / 1024).toFixed(1) + "KB");
