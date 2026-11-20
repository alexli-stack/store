// Rebuilds src/data/catalog.json from the raw 1laser.com exports in data-source/.
// Run: npm run catalog
import { readFileSync, writeFileSync } from "node:fs";
const read = (f) => JSON.parse(readFileSync(new URL(`../data-source/${f}`, import.meta.url)));
const shop = read("products-slim.json");
const specs = read("machine-specs.json");
const compat = read("accessory-compat.json").products;

const SERIES = {
  xrf: { name: "XRF Series", group: "desktop" },
  cobra: { name: "Cobra Series", group: "workshop" },
  hydra: { name: "Hydra Gen2", group: "industrial" },
  vertigo: { name: "VertiGo", group: "drinkware" },
  legacy: { name: "Previous Generation", group: "legacy" },
};
const CATEGORY_BY_TYPE = {
  PiBurn: "rotary", "Water chiller": "cooling", "Laser Beam": "optics", "Laser Tube": "optics",
  "Focal lens": "optics", "Filtration System": "fume", "Air Assist": "air", Conveyor: "expansion",
  "Base Booster": "expansion", Consultation: "software", Acrylic: "acrylic", Leatherette: "leatherette",
};
const CATEGORY_BY_HANDLE = {
  "mirror-mounting-bracket-replacement-kit": "optics",
  "lightburn-software-pro-license-key": "software",
};
const TAGLINE = { "piburn-grip-lite-for-onelaser": "Chuck rotary attachment for OneLaser machines." };
const SKIP = (p) => /gift-card$/.test(p.handle) || p.handle === "sales-consultation-call";
const num = (v) => (v == null ? null : Number(v));
const clean = (t) => t.replace(/\s+/g, " ").trim();

const out = [];
for (const p of shop) {
  if (SKIP(p)) continue;
  const variants = p.variants.map((v) => ({
    id: String(v.id), title: v.title === "Default Title" ? "" : v.title,
    price: num(v.price), compareAt: num(v.compare) > num(v.price) ? num(v.compare) : null,
    available: v.available, image: v.img || null,
  }));
  const cheapest = variants.reduce((a, b) => (b.price < a.price ? b : a));
  const base = {
    handle: p.handle, title: clean(p.title), images: p.images, variants,
    optionName: p.options[0]?.name === "Title" ? "" : p.options[0]?.name || "",
    price: cheapest.price, compareAt: cheapest.compareAt, priceVaries: new Set(variants.map((v) => v.price)).size > 1,
    available: variants.some((v) => v.available), description: p.desc,
    sourceUrl: `https://www.1laser.com/products/${p.handle}`,
  };
  const spec = specs.find((s) => s.handle === p.handle);
  if (spec) {
    const legacy = spec.generation !== "Current lineup";
    const series = legacy ? "legacy" : spec.family;
    out.push({
      ...base, kind: "machine", series, seriesName: SERIES[series].name, group: SERIES[series].group,
      name: spec.name, tagline: spec.summary, bestFor: spec.bestFor, badge: legacy ? "LAST UNITS" : spec.label,
      family: spec.family, chips: spec.specs,
      specs: {
        "Laser source": spec.laser, "Work area": spec.workArea, "Max engraving speed": spec.maxSpeed,
        Acceleration: spec.acceleration, "Positioning accuracy": spec.positioningAccuracy,
        "Max resolution": spec.maxResolution, "Key capability": spec.keyCapability, "Product line": spec.productLine,
      },
    });
    continue;
  }
  const category = CATEGORY_BY_HANDLE[p.handle] || CATEGORY_BY_TYPE[p.type] || (/leatherette/.test(p.handle) ? "leatherette" : "other");
  const c = compat.find((x) => x.id === p.handle);
  const material = category === "acrylic" || category === "leatherette";
  out.push({
    ...base, kind: material ? "material" : "accessory", category,
    name: clean(p.title.replace(/\s*[-–|]\s*for Laser Engraving.*$/i, "").replace(/ for Laser Engraving (&|and) Cutting/i, "")),
    tagline: TAGLINE[p.handle] || c?.description || p.desc.split(/(?<=[.!?])\s/)[0].slice(0, 120),
    fit: c?.fit || "", machines: c?.machines || [],
  });
}
const order = specs.map((s) => s.handle);
out.sort((a, b) => (a.kind === "machine" ? order.indexOf(a.handle) : 99) - (b.kind === "machine" ? order.indexOf(b.handle) : 99));
writeFileSync(new URL("../src/data/catalog.json", import.meta.url), JSON.stringify({ source: "https://www.1laser.com/products.json", fetchedAt: "2026-11-16", products: out }, null, 1));
const count = (k) => out.filter((p) => p.kind === k).length;
console.log(`machines ${count("machine")}, accessories ${count("accessory")}, materials ${count("material")}`);
for (const p of out.filter((p) => p.kind !== "machine")) console.log(p.category.padEnd(12), p.price, "|", p.name, "|", p.tagline.slice(0, 60));
