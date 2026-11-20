// Normalizes the scraped 1laser.com product-page sections (data-source/product-pages.json)
// into render-ready story blocks: src/data/stories.json. Run: npm run stories
import { readFileSync, writeFileSync } from "node:fs";
const pages = JSON.parse(readFileSync(new URL("../data-source/product-pages.json", import.meta.url)));

const badImg = (u) => !u || /no-image|icons8|\.gif|payment|badge/i.test(u);
const imgs = (list) => [...new Set(list.filter((u) => !badImg(u)))];
// Video thumbnails on 1laser.com end with the YouTube id, e.g. "...-r5m8As2oOJ4.jpg".
const ytId = (u) => {
  const id = (u.match(/-([A-Za-z0-9_-]{11})\.(webp|jpg|png)/) || [])[1];
  return id && /[A-Z0-9]/.test(id) && /[a-z]/.test(id) ? id : "";
};
const SKIP = /^(blocks|feature_card_product|\d)/;
const cleanItem = (it) => ({
  eyebrow: /^\d+$/.test(it.eyebrow) ? "" : it.eyebrow,
  title: it.title.replace(/^\d{2}\s+/, ""),
  text: it.text,
  img: badImg(it.img) ? "" : it.img,
  video: (it.videos || []).find((v) => /\.mp4/.test(v)) || "",
  tags: it.tags || [],
  footer: it.footer && it.footer.includes(" · ") && it.footer.length < 70 ? it.footer : "",
});

function toBlock(s) {
  const head = { eyebrow: s.eyebrow, title: s.title, intro: s.intro };
  const pics = imgs(s.images);
  const items = s.items.map(cleanItem).filter((i) => i.title);
  const t = s.type;
  if (SKIP.test(t) || /Customer Reviews|Still Have Questions/i.test(s.title)) return null;
  if (/specs_accordion|collapsible/.test(t) || (s.specs.length && s.specs.every((g) => g.rows))) {
    const groups = s.specs.filter((g) => g.rows?.length).map((g) => ({ group: g.group, rows: g.rows }));
    if (groups.length) return { kind: "specs", ...head, groups };
  }
  if (/faq/.test(t) || (s.specs.length && s.specs.every((g) => g.text))) {
    const qa = s.specs.filter((g) => g.text).map((g) => [g.group, g.text]);
    return qa.length ? { kind: "faq", ...head, qa } : null;
  }
  if (s.table.length > 1 && s.table[0].length >= 2) {
    const rows = s.table.map((r) => r.filter((c, i) => i < 3)).filter((r) => r[0]);
    return { kind: "table", ...head, rows, video: s.videos.find((v) => /youtu/.test(v)) || "" };
  }
  const yts = /slide_introduction/.test(t) ? s.images.map((u) => ({ id: ytId(u), img: u })).filter((v) => v.id) : [];
  if (yts.length) return { kind: "videos", ...head, videos: yts };
  if (/opportunit/.test(t)) return { kind: "gallery", ...head, items: items.map(({ title, img }) => ({ title, img })).filter((i) => i.img) };
  if (/combination/.test(t)) return { kind: "promise", items: items.map(({ title, text }) => ({ title, text })) };
  if (/tab_feature|material_showcase|features_tab/.test(t) && items.length > 1) return { kind: "tabs", ...head, items };
  if (items.length) return { kind: "features", ...head, items, stats: s.stats, badges: s.badges, image: pics[0] || "" };
  const mp4 = s.videos.find((v) => /\.mp4/.test(v)) || "";
  if (s.title && (pics.length || mp4)) return { kind: "split", ...head, image: pics[0] || "", video: mp4 };
  if (pics.length) return { kind: "banner", image: pics[0], mobile: pics[1] || "" };
  return null;
}

const out = {};
for (const [handle, page] of Object.entries(pages)) {
  const blocks = page.sections.map(toBlock).filter(Boolean);
  // UGC clips on previous-generation pages: mp4s without headings.
  const highlights = page.highlights.filter((h) => h.includes(":") && h.length > 25 && !h.includes("$"));
  out[handle] = { highlights, blocks };
  console.log(handle.slice(0, 34).padEnd(35), blocks.map((b) => b.kind).join(" "));
}
writeFileSync(new URL("../src/data/stories.json", import.meta.url), JSON.stringify(out));
