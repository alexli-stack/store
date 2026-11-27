import { useEffect, useState } from "react";
import catalog from "./data/catalog.json";

export const products = catalog.products;
export const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
export const machines = products.filter((p) => p.kind === "machine");
export const accessories = products.filter((p) => p.kind === "accessory");
export const materials = products.filter((p) => p.kind === "material");

export const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`;
/** Shopify CDN image at a given width. */
export const img = (src, width = 800) => (src ? `${src}${src.includes("?") ? "&" : "?"}width=${width}` : "");
/* Straight front views of each series, from the 1laser.com home page product row (transparent PNGs).
   One photo per series: the Cobra shot shows a Cobra 8, the Hydra shot a Hydra 7 Gen2. */
const FRONT = {
  xrf: "https://www.1laser.com/cdn/shop/files/home-product-xrf.png",
  cobra: "https://www.1laser.com/cdn/shop/files/home-product-cobra.png",
  hydra: "https://www.1laser.com/cdn/shop/files/home-product-hydra-gen2_d4d95d1f-482d-48b9-bbe2-82d96bd9ac39.png",
  vertigo: "https://www.1laser.com/cdn/shop/files/home-product-vertigo.png",
};
/* One straight front render per model for Cobra and Hydra Gen2, from the team's image library
   (yonge6.github.io/onelaser-product-images, "… 正面渲染"), cropped to the machine with 3% margin and saved as WebP. */
const MODEL_FRONT = {
  "cobra-8-90w-co2-laser-engraver-cutter": "cobra-8-front",
  "cobra-10-100w-co2-laser-engraver-cutter": "cobra-10-front",
  "cobra-14-130w-co2-laser-engraver-cutter": "cobra-14-front",
  "hydra-7-gen-2-70w-rf-co2-dual-laser-machine": "hydra-7-gen2-front",
  "hydra-9-gen-2-70w-rf-co2-dual-laser-machine": "hydra-9-gen2-front",
  "hydra-13-gen-2-70w-rf-co2-dual-laser-machine": "hydra-13-gen2-front",
  "hydra-16-gen-2-70w-rf-co2-dual-laser-machine": "hydra-16-gen2-front",
};
/** Front view of exactly this model when we have one, then the series front view, otherwise its first product photo. */
export const frontImg = (p) => (MODEL_FRONT[p?.handle] && asset(`front/${MODEL_FRONT[p.handle]}.webp`)) || (p?.kind === "machine" && FRONT[p.series]) || p?.images?.[0];
export const money = (n) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const saving = (p) => (p.compareAt ? p.compareAt - p.price : 0);

/* ---------- tiny hash router: #/path?query ---------- */
const parse = () => {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path, query: new URLSearchParams(query) };
};
/* Scroll memory for the hash router.
   - A link click or go() is a new page: jump to the top at once (no smooth animation).
   - Back / forward and a page reload: return to where that page was left.
   - A link with data-keep-scroll (e.g. the model switcher on a product page) keeps the current position. */
const SCROLL_KEY = "onelaser-scroll-v1";
const readPos = () => { try { return JSON.parse(sessionStorage.getItem(SCROLL_KEY)) || {}; } catch { return {}; } };
const positions = readPos();
const savePos = () => { try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions)); } catch { /* private mode */ } };
let intent = null; // "new" | "keep" | null (null = back/forward)
let current = typeof window !== "undefined" ? window.location.hash : "";
const jump = (y) => window.scrollTo({ top: y, left: 0, behavior: "instant" });
/** Content (products, images) renders after the route changes and keeps growing while images load,
    so hold the target for up to 4 s (slow phone connections), and stop as soon as the visitor scrolls by hand. */
const restore = (y) => {
  const until = performance.now() + 4000;
  let user = false;
  let last = null; // where our own last jump left the page; any other movement is the visitor scrolling (scrollbar, keys, trackpad)
  const stop = () => { user = true; };
  const evs = ["wheel", "touchstart", "keydown", "mousedown", "pointerdown"];
  evs.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
  const step = () => {
    if (!user && last != null && Math.abs(window.scrollY - last) > 2 && Math.abs(window.scrollY - y) > 2) user = true;
    if (user) { evs.forEach((e) => window.removeEventListener(e, stop)); return; }
    if (Math.abs(window.scrollY - y) > 2) jump(y);
    last = window.scrollY;
    if (performance.now() < until) requestAnimationFrame(step);
    else evs.forEach((e) => window.removeEventListener(e, stop));
  };
  requestAnimationFrame(step);
};
if (typeof window !== "undefined") {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  let t = 0;
  window.addEventListener("scroll", () => {
    positions[window.location.hash] = window.scrollY;
    clearTimeout(t);
    t = setTimeout(savePos, 150);
  }, { passive: true });
  window.addEventListener("pagehide", savePos);
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a[href^='#']");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    intent = a.hasAttribute("data-keep-scroll") ? "keep" : "new";
    // a link to the page we are already on changes nothing: drop the flag so a later back / forward is not mistaken for a new page
    const was = window.location.hash;
    setTimeout(() => { if (window.location.hash === was) intent = null; }, 0);
  }, true);
}
export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    if (positions[window.location.hash]) restore(positions[window.location.hash]); // after a reload
    const on = () => {
      positions[current] = positions[current] ?? window.scrollY;
      current = window.location.hash;
      const how = intent;
      intent = null;
      setRoute(parse());
      if (how === "keep") { positions[current] = window.scrollY; savePos(); return; }
      if (how === "new" || !positions[current]) { delete positions[current]; jump(0); }
      else restore(positions[current]);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
export const go = (path) => {
  const same = window.location.hash.replace(/^#/, "") === path;
  intent = same ? null : "new"; // same page: no hashchange will consume the flag
  window.location.hash = path;
};

/** Freeze the page behind a dialog. overflow:hidden alone still lets iOS Safari scroll the page under a sheet, so the body is
    pinned with position:fixed at the current offset and put back exactly where it was on release. Nested dialogs share one lock. */
let locks = 0, lockedAt = 0;
export function lockScroll() {
  if (typeof document === "undefined") return () => {};
  if (locks++ === 0) {
    lockedAt = window.scrollY;
    const b = document.body.style;
    Object.assign(b, { position: "fixed", top: `-${lockedAt}px`, left: "0", right: "0", width: "100%", overflow: "hidden" });
  }
  let done = false;
  return () => {
    if (done) return; done = true;
    if (--locks === 0) {
      const b = document.body.style;
      Object.assign(b, { position: "", top: "", left: "", right: "", width: "", overflow: "" });
      window.scrollTo({ top: lockedAt, left: 0, behavior: "instant" });
    }
  };
}

export function openMachineFinder() {
  const finder = document.getElementById("machine-finder");
  if (finder) {
    finder.querySelector("h2")?.focus({ preventScroll: true });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    finder.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
  }
  else go("/?finder=1");
}

export function useCampaignActive(endsAt) {
  const end = Date.parse(endsAt);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const check = () => setNow(Date.now());
    const remaining = end - now;
    const timer = remaining > 0 ? window.setTimeout(check, Math.min(remaining, 2_147_483_647)) : null;
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [end, now]);
  return now < end;
}
