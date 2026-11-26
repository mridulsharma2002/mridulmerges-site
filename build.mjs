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
mark.scan = `<span class="slot" aria-hidden="true"><svg class="scanmark" viewBox="0 0 32 32"><rect width="32" height="32" rx="9"/><rect class="c c1" x="7" y="17" width="5.5" height="5.5" rx="1"/><rect class="c c2" x="13.25" y="17" width="5.5" height="5.5" rx="1"/><rect class="c c3" x="13.25" y="10.75" width="5.5" height="5.5" rx="1"/><rect class="c c4" x="19.5" y="17" width="5.5" height="5.5" rx="1"/></svg></span>`;
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
// Vision Scan: a camera sweeps across a little room and blocks fill in behind it.
const scanCells = [[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[0,3],[0,2],[0,1],[9,3],[9,2],[3,3],[4,3],[4,2],[6,3],[7,3]];
const scanDemo = `<span class="demo" aria-hidden="true"><span><span class="board scanboard">
          <svg viewBox="0 0 268 76"><g transform="translate(14 4)">${scanCells.map(([x,y],i)=>`<rect class="blk" x="${x*13}" y="${y*13}" width="11" height="11" rx="2" style="animation-delay:${(x*0.16).toFixed(2)}s"/>`).join("")}</g>
          <g class="cam"><path class="fov" d="M0 0 L-26 -40 L26 -40Z"/><circle r="4.5"/><animateTransform attributeName="transform" type="translate" values="40 70;120 70;40 70" dur="3.2s" repeatCount="indefinite"/></g>
          <g class="pip"><rect x="178" y="10" width="34" height="44" rx="5" class="pc"/><rect x="216" y="10" width="34" height="44" rx="5" class="pd"/></g></svg>
          <span class="cap"><span>camera → AI depth → 10 cm blocks</span><b>filled</b></span>
        </span></span></span>`;
// Sun Clock: the sun crosses the sky and the "screen" follows its color.
mark.sun = `<span class="slot" aria-hidden="true"><svg class="sunmark" viewBox="0 0 32 32"><rect width="32" height="32" rx="9"/><path class="hz" d="M7 21h18"/><circle class="sn" cx="16" cy="19" r="5"/></svg></span>`;
const sunDemo = `<span class="demo" aria-hidden="true"><span><span class="board sunboard">
          <svg viewBox="0 0 268 76"><path class="arc" id="sunarc" d="M14 64 Q 98 -20 182 64"/><path class="hz" d="M8 64H188"/>
          <circle class="sd" r="6"><animateMotion dur="4.8s" repeatCount="indefinite"><mpath href="#sunarc"/></animateMotion><animate attributeName="fill" dur="4.8s" repeatCount="indefinite" values="#ff8a3d;#fff4e6;#ff8a3d;#a10000" keyTimes="0;.5;.85;1"/></circle>
          <rect class="ph" x="206" y="8" width="42" height="60" rx="7"><animate attributeName="fill" dur="4.8s" repeatCount="indefinite" values="#ff9b4a;#f3f6ff;#ffb15c;#8a0000" keyTimes="0;.5;.85;1"/></rect></svg>
          <span class="cap"><span>time → warmth → screen</span><b>follows</b></span>
        </span></span></span>`;
const projects = site.building.map((p) => `
      <li><a class="proj" href="/go/${p.slug}" data-slug="${p.slug}">
        ${mark[p.slug] || "<span></span>"}
        <span><b>${esc(p.label)}</b><span class="pill">${esc(p.tag)}</span><p>${esc(p.desc)}</p>${p.slug === "gusset" ? `<span class="bubble" aria-hidden="true">What did you work on today?</span>` : ""}${p.slug === "switchboard" ? board : ""}${p.slug === "fly" ? flyDemo : ""}${p.slug === "scan" ? scanDemo : ""}${p.slug === "sun" ? sunDemo : ""}</span><span class="yr">${esc(p.year)}</span>${arrow}
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
