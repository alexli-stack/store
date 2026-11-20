/* Machine finder rules, kept apart from the UI so they can be checked on their own.
   Every number comes from the catalog specs (work area, laser source, DPI, speed):
   - XRF 38W RF, 23.6 × 11.8 in, 2,000 DPI, 1,200 mm/s — desktop.
   - Cobra 8 / 10 / 14: 90 / 100 / 130W glass CO₂, 31.5 × 19.7 / 39.4 × 23.6 / 55.1 × 35.4 in, 1,000 DPI.
   - Hydra 7 Gen2: 70W RF only, 27.6 × 19.7 in. Hydra 9 / 13 / 16 Gen2: 38W RF + 100 / 130 / 150W glass, or 70W RF,
     35.4 × 23.6 / 51.2 × 35.4 / 63 × 39.4 in. All Hydra Gen2: 2,000 DPI, 2,000 mm/s, 4G.
   - VertiGo: vertical RF machine with a built-in rotary for cylinders (Ø 16–230 mm). It cannot do flat work or cut,
     so it is only offered when the work is all, or mostly, round items.
   TODO(team): sales to confirm weights and wording. */

export const M = {
  xrf: { handle: "onelaser-xrf-desktop-laser-machine", w: 23.6, h: 11.8, tube: "rf", tier: 1, dpi: 2000 },
  vertigo: { handle: "vertigo-vertical-laser-engraver", w: 0, h: 0, tube: "rf", tier: 1, dpi: 1000, vertical: true },
  cobra8: { handle: "cobra-8-90w-co2-laser-engraver-cutter", w: 31.5, h: 19.69, tube: "glass", tier: 2, dpi: 1000 },
  cobra10: { handle: "cobra-10-100w-co2-laser-engraver-cutter", w: 39.37, h: 23.62, tube: "glass", tier: 2, dpi: 1000 },
  cobra14: { handle: "cobra-14-130w-co2-laser-engraver-cutter", w: 55.12, h: 35.43, tube: "glass", tier: 2, dpi: 1000 },
  hydra7: { handle: "hydra-7-gen-2-70w-rf-co2-dual-laser-machine", w: 27.56, h: 19.69, tube: "rf70", tier: 3, dpi: 2000 },
  hydra9: { handle: "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", w: 35.43, h: 23.62, tube: "hybrid", tier: 3, dpi: 2000 },
  hydra13: { handle: "hydra-13-gen-2-70w-rf-co2-dual-laser-machine", w: 51.18, h: 35.43, tube: "hybrid", tier: 3, dpi: 2000 },
  hydra16: { handle: "hydra-16-gen-2-70w-rf-co2-dual-laser-machine", w: 62.99, h: 39.37, tube: "hybrid", tier: 3, dpi: 2000 },
};
// The usual pick inside each family when size is not answered.
const NUDGE = { xrf: 0.3, cobra10: 0.4, hydra9: 0.4 };

export const STEPS = [
  {
    id: "material", required: true, short: "Material", label: "Your material", title: "What do you work with?", hint: "Pick all that apply.", multi: true,
    options: [
      ["wood", "Wood, acrylic, MDF"],
      ["leather", "Leather, fabric, paper"],
      ["drinkware", "Tumblers and drinkware"],
      ["stone", "Glass, stone, slate, tile"],
      ["coated", "Coated or anodized metal"],
      ["photo", "Photos and fine detail"],
    ],
  },
  {
    id: "work", required: true, short: "Work", label: "Your work", title: "Mostly cutting or mostly engraving?", hint: "Most shops do both. Pick the bigger share.",
    options: [["engrave", "Mostly engraving"], ["both", "About half and half"], ["cut", "Mostly cutting"]],
  },
  {
    id: "size", required: true, short: "Size", label: "Your pieces", title: "How big is your largest piece?", hint: "Pick the closest size.",
    options: [
      ["s", "Small: up to 12 × 12 in.", "Tags, coasters, ornaments"],
      ["m", "Medium: up to 24 × 12 in.", "Signs, cutting boards"],
      ["l", "Large: up to 36 × 24 in.", "Big signs, 3 × 2 ft sheets"],
      ["xl", "Extra large: up to 51 × 35 in.", "Furniture panels, batch layouts"],
      ["xxl", "Full size: up to 63 × 39 in.", "Large-format production"],
    ],
  },
  {
    id: "round", short: "Round items", label: "Round items", title: "Any round items, like tumblers, pens or bottles?", hint: "Round items need a rotary attachment.",
    options: [["flat", "No, all flat"], ["some", "Yes, some round items"], ["most", "Mostly round items"]],
  },
  {
    id: "shop", short: "Volume", label: "Your shop", title: "How much will it run?", hint: "Pick where you are today, plus a little room to grow.",
    options: [["side", "Side business or just starting"], ["full", "Full-time shop"], ["high", "High volume, every day"]],
  },
  {
    id: "vent", short: "Venting", label: "Ventilation", title: "Can you vent fumes outside?", hint: "A window or wall vent works. If not, we will point you to an indoor filter.",
    options: [["out", "Yes, through a wall or window"], ["in", "No, it has to stay indoors"]],
  },
];
/** The answers a recommendation needs; the other steps can be skipped. */
export const ready = (a) => STEPS.filter((x) => x.required).every((x) => (Array.isArray(a[x.id]) ? a[x.id].length : a[x.id]));
export const SIZES = { s: [12, 12], m: [24, 12], l: [36, 24], xl: [51, 35], xxl: [63, 39] };
const TOL = 0.6; // "up to" sizes are rounded; allow a little under

/** Work is all or mostly cylinders: the only case where VertiGo is offered. */
export const roundFocus = (a) => {
  const mats = a.material || [];
  return a.round === "most" || (mats.length > 0 && mats.every((x) => x === "drinkware") && a.round !== "flat");
};
export const hasRound = (a) => (a.material || []).includes("drinkware") || a.round === "some" || a.round === "most";
const fits = (m, [w, h]) => (m.w >= w - TOL && m.h >= h - TOL) || (m.w >= h - TOL && m.h >= w - TOL);

/** Score every machine against the answers. Returns [{ key, score, reasons }] best first; machines that cannot do the job are left out. */
export function rank(a, available = () => true, price = () => 0) {
  const mats = a.material || [];
  const answered = Object.values(a).some((v) => (Array.isArray(v) ? v.length : v));
  const focus = roundFocus(a);
  const big = a.size && ["l", "xl", "xxl"].includes(a.size);
  return Object.entries(M)
    .map(([key, m]) => {
      let score = a.size ? 0 : NUDGE[key] || 0; // once size is answered it decides the model inside a family
      let out = false;
      const reasons = [];
      const add = (n, why) => { score += n; if (why && n > 0) reasons.push([n, why]); };
      const rf = m.tube === "rf" || m.tube === "rf70" || m.tube === "hybrid";

      if (m.vertical) {
        // VertiGo: cylinders only, engraving only, small pieces only
        if (answered && (!focus || a.work === "cut" || big)) out = true;
        if (focus) add(8, "Built-in vertical rotary for drinkware");
        if (a.work === "engrave") add(2, "RF source: fast, clean engraving");
        if (a.work === "both") add(0.5);
        if (a.shop === "side") add(2, "Desktop size and price to start with");
        if (a.shop === "full") add(1.5);
        return { key, score, out, reasons: tidy(reasons) };
      }

      // flatbeds
      if (a.size) {
        if (!fits(m, SIZES[a.size])) out = true;
        else {
          const ratio = (m.w * m.h) / (SIZES[a.size][0] * SIZES[a.size][1]);
          if (ratio < 2.3) add(3, "Work area fits your largest piece");
          else if (ratio < 4.2) add(1.5, "Work area with room to grow");
          else add(0.3);
        }
      }
      if (hasRound(a)) add(focus ? 0.2 : 0.5, "Takes a rotary attachment for round items");

      const cutting = a.work !== "engrave";
      if (mats.includes("wood")) {
        if (!cutting) add(0.5);
        else if (m.tube === "glass") add(1.5, "Glass CO₂ power for cutting wood and acrylic");
        else if (m.tube === "hybrid") add(1.5, "Hybrid option adds a glass tube for cutting");
        else if (m.tube === "rf70") add(1, "70W RF power for cutting with clean edges");
        else add(0.5);
      }
      if (mats.includes("leather")) add(1, rf ? "Clean RF edges on leather, fabric and paper" : undefined);
      if (mats.includes("stone")) add(0.5);
      if (mats.includes("coated")) add(rf ? 2 : 0.5, rf ? "RF tube: crisp marks on coated and anodized metal" : undefined);
      if (mats.includes("photo")) add(m.dpi >= 2000 ? 3 : 0, "2,000 DPI for photos and fine detail");

      if (a.work === "engrave") add(rf ? 3 : 1, rf ? "RF source: fast, clean engraving" : undefined);
      if (a.work === "both") {
        if (m.tube === "hybrid") add(3, "RF for engraving, glass tube for cutting");
        else if (m.tube === "glass") add(2, "Glass CO₂ power for cutting wood and acrylic");
        else if (m.tube === "rf70") add(1.5, "70W RF power for cutting with clean edges");
        else add(1);
      }
      if (a.work === "cut") {
        if (m.tube === "glass") add(3, "High-power glass tube for cutting");
        else if (m.tube === "hybrid") add(2.5, "Hybrid option adds a glass tube for cutting");
        else if (m.tube === "rf70") add(1.5, "70W RF power for cutting with clean edges");
      }

      if (a.shop === "side") add(m.tier === 1 ? 3 : m.tier === 2 ? 2 : 0, m.tier === 1 ? "Desktop size and price to start with" : "Workshop capacity at an entry price");
      if (a.shop === "full") add(m.tier === 3 ? 2.5 : m.tier === 2 ? 2 : 0.5, m.tier === 3 ? "2,000 mm/s and 4G for daily production" : "Sized for a full-time workshop");
      if (a.shop === "high") add(m.tier === 3 ? 4 : m.tier === 2 ? 1.5 : 0, "Industrial speed for high-volume runs");
      return { key, score, out, reasons: tidy(reasons) };
    })
    .filter((r) => !r.out && available(M[r.key].handle))
    .sort((x, y) => y.score - x.score || price(M[x.key].handle) - price(M[y.key].handle)); // tie: the lower price first
}
const tidy = (reasons) => reasons.sort((x, y) => y[0] - x[0]).map((r) => r[1]).filter((r, i, all) => all.indexOf(r) === i).slice(0, 3);
