import { useEffect, useRef, useState } from "react";
import { getLang, t } from "../i18n.js";
import { byHandle, frontImg, img, money, products, openMachineFinder } from "../lib.js";
import { useCart } from "../cart.jsx";
import { AddButton, Icon, Link } from "./ui.jsx";
import { M, STEPS, rank } from "./finderRules.js";
import { contact, homeFaq, homeReviews, promo } from "../data/site.js";

/* Floating shopping assistant, after the "Shop with AI" agent on poolinstore.com (checked 2026-11-19):
   a black pill at the bottom centre whose label rotates; it opens a dark chat panel at the bottom right
   (full screen on phones) with a welcome line, swipeable category cards, suggested questions and a message box.
   Design draft: this static preview has no AI behind it. Replies come from preset rules over the real catalog,
   the machine finder's matching rules, and the site's own deal, warranty, return, financing and support text. */

const LABELS = ["Shop with AI", "Shop Deals", "Find my laser"];
const CATS = [
  ["xrf", "XRF desktop", "onelaser-xrf-desktop-laser-machine"],
  ["cobra", "Cobra Series", "cobra-10-100w-co2-laser-engraver-cutter"],
  ["hydra", "Hydra Gen2", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine"],
  ["vertigo", "VertiGo", "vertigo-vertical-laser-engraver"],
  ["deals", "Black Friday deals", null],
  ["rotary", "Rotary attachments", "piburn-v-for-onelaser"],
];
const CHIPS = ["Which laser fits me?", "Show me Black Friday deals", "Cobra or Hydra?", "What do owners say?", "Can I pay monthly?", "Talk to a person"];
const SERIES = {
  xrf: ["onelaser-xrf-desktop-laser-machine"],
  cobra: ["cobra-8-90w-co2-laser-engraver-cutter", "cobra-10-100w-co2-laser-engraver-cutter", "cobra-14-130w-co2-laser-engraver-cutter"],
  hydra: ["hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "hydra-13-gen-2-70w-rf-co2-dual-laser-machine", "hydra-16-gen-2-70w-rf-co2-dual-laser-machine"],
  vertigo: ["vertigo-vertical-laser-engraver"],
};
const faq = (q) => homeFaq.find(([k]) => k.startsWith(q))?.[1] || "";

/* Translatable text. A reply is built from pieces: a plain English string (looked up with t), a template
   tx("... {name} ...", { name }) whose values can be pieces too, a list { list, sep }, or an array of pieces.
   The same piece renders in English for the matching rules and in the visitor's language on screen. */
const tx = (tpl, v) => ({ tpl, v });
const fill = (str, v) => str.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? "" : v[k]));
function render(x, tr) {
  if (x == null || x === false) return "";
  if (Array.isArray(x)) return x.map((y) => render(y, tr)).filter(Boolean).join(" ");
  if (typeof x === "object") {
    if (x.list) {
      const cjk = tr === t && ["zh", "ja"].includes(getLang());
      const sep = x.sep || ", ";
      return x.list.map((y) => render(y, tr)).join(cjk ? (sep.startsWith(";") ? "；" : "、") : sep);
    }
    const v = Object.fromEntries(Object.entries(x.v || {}).map(([k, val]) => [k, typeof val === "object" ? render(val, tr) : val]));
    return fill(tr(x.tpl), v);
  }
  return tr(x);
}
const say = (x) => render(x, t); // on screen
const en = (x) => render(x, (y) => y); // for the matching rules
/* Typed questions in the other site languages: map common words onto the English keywords the rules use. */
const WORDS = [
  [/优惠|折扣|打折|黑五|促销|oferta|descuento|rebaja|promo|réduction|soldes|angebot|rabatt|セール|割引|ブラックフライデー/i, " deal "],
  [/分期|月供|贷款|付款方式|financ|mensual|cuota|mensualité|crédit|finanzier|raten|monatlich|分割|ローン|月々/i, " monthly "],
  [/保修|质保|garant|保証/i, " warranty "],
  [/退货|退款|devoluc|retour|rückgabe|返品/i, " return "],
  [/运费|配送|发货|物流|envío|livraison|versand|lieferung|配送|送料/i, " ship "],
  [/人工|客服|专家|电话|真人|humano|persona|experto|humain|conseiller|mensch|berater|担当者|オペレーター|電話|専門/i, " human "],
  [/评价|口碑|评论|reseña|opinion|avis|bewertung|レビュー|評価|口コミ/i, " review "],
  [/参数|规格|especific|caractéristique|technische daten|スペック|仕様/i, " spec "],
  [/配件|附件|accesorio|accessoire|zubehör|アクセサリー|付属品/i, " accessor "],
  [/对比|比较|区别|compar|vergleich|比較|違い/i, " compare "],
  [/推荐|适合|哪款|哪个|选哪|recomiend|cuál|recommand|quel|empfehl|welche|おすすめ|どれ|選び/i, " which "],
  [/冷水机|enfriador|refroidisseur|kühler|チラー/i, " chiller "],
  [/木|亚克力|madera|acrílico|bois|acrylique|holz|acryl|木材|アクリル/i, " wood "],
  [/皮革|皮|cuero|cuir|leder|レザー|革/i, " leather "],
  [/杯|保温杯|vaso|termo|gobelet|becher|タンブラー|マグ/i, " tumbler "],
  [/切割|cortar|corte|découp|schneid|カット|切断/i, " cut "],
  [/雕刻|grabar|grabado|gravure|graver|gravier|彫刻|刻印/i, " engrav "],
  [/价格|多少钱|precio|prix|preis|価格|値段/i, " price "],
  [/需要|要不要|必须|necesito|hace falta|besoin|brauche|必要/i, " need do i "],
  [/怎么说|好不好|靠谱|值得|vale la pena|ça vaut|lohnt|評判/i, " review "],
  [/切|corta|découpe|schneide|切り/i, " cut "],
  [/雕|graba|grave|graviere|彫/i, " engrav "],
  [/全职|工作室|生意|小店|negocio|taller|entreprise|atelier|betrieb|werkstatt|事業|工房|商売/i, " business "],
  [/新手|入门|刚起步|兴趣|业余|principiante|débutant|anfänger|初心者|趣味/i, " beginner "],
  [/量产|大批量|工厂|producción|production|serienfertigung|量産|大量/i, " production "],
  [/大件|大尺寸|大幅面|grande|großformat|大判|大きい/i, " large "],
  [/小件|杯垫|钥匙扣|吊牌|pequeñ|petit|klein|小物|キーホルダー/i, " small piece "],
];
const normalize = (q) => WORDS.reduce((s, [re, w]) => (re.test(s) ? `${s}${w}` : s), q);
const has = (s, words) => words.some((w) => s.includes(w));

/** Turn a message into finder answers (only what the words say). */
function parse(s) {
  const a = {};
  const mats = [];
  if (has(s, ["wood", "acrylic", "mdf", "plywood", "sign"])) mats.push("wood");
  if (has(s, ["leather", "fabric", "paper", "patch"])) mats.push("leather");
  if (has(s, ["tumbler", "cup", "mug", "bottle", "drinkware", "yeti"])) mats.push("drinkware");
  if (has(s, ["glass", "stone", "slate", "tile"])) mats.push("stone");
  if (has(s, ["metal", "anodized", "coated", "aluminum", "steel"])) mats.push("coated");
  if (has(s, ["photo", "portrait", "detail"])) mats.push("photo");
  if (mats.length) a.material = mats;
  if (has(s, ["cut", "cutting"])) a.work = has(s, ["engrav"]) ? "both" : "cut";
  else if (has(s, ["engrav"])) a.work = "engrave";
  if (/small (piece|item|part|thing|sign)|coaster|ornament|keychain|\btags?\b/.test(s)) a.size = "s"; // not "small business"
  if (has(s, ["large", "big", "furniture", "sheet", "4x8", "batch"])) a.size = "l";
  if (has(s, ["beginner", "start", "hobby", "side", "garage", "home"])) a.shop = "side";
  if (has(s, ["business", "full-time", "full time", "shop"])) a.shop = a.shop || "full";
  if (has(s, ["production", "volume", "factory", "industrial"])) a.shop = "high";
  if (has(s, ["tumbler", "cup", "mug", "bottle", "drinkware", "round", "cylinder"])) a.round = mats.length > 1 ? "some" : "most";
  return a;
}

const short = (p) => p.name.replace(/™/g, "");
const siblings = (p) => (SERIES[p.series] || []).map((h) => byHandle[h]).filter(Boolean);
/** Accessories that fit a machine, from the catalog (chiller only where a glass tube is used; Hydra 7 Gen2 is RF only). */
const fitsWith = (p) => [
  ["cobra", "hydra"].includes(p.series) && !/hydra-7/.test(p.handle) ? "onelaser-industrial-chiller-for-hydra-laser-engraver" : null,
  p.series === "xrf" ? "onelaser-automatic-conveyor-feeder" : null,
  p.series !== "vertigo" ? "piburn-v-for-onelaser" : null,
  "air-assist-for-laser-engraver-cutter", "filtrabox-micro", "lightburn-software-pro-license-key", "engineer-1-on-1-training-support",
].filter(Boolean).map((h) => byHandle[h]).filter((x) => x && x.handle !== p.handle);
const productChips = (p) => (p.kind === "machine"
  ? [tx("What is the {name} best for?", { name: short(p) }), "What do owners say?", "Key specs", "Is it on sale?", "Which accessories fit?", siblings(p).length > 1 ? "Compare the other sizes" : "Compare with other series"]
  : ["Is it on sale?", "Which machines work with it?", "Show me laser machines", "Talk to an expert"]);

/* Owner reviews: Judge.me averages per product page (site.js, read 2026-11-18). Gen2, Cobra and VertiGo pages have none yet,
   so for those we say so and show reviews of other OneLaser machines, labelled with the machine they are about. */
const REVIEW_STATS = {
  "onelaser-xrf-desktop-laser-machine": ["4.94", 49, "XRF 38W"],
  "onelaser-hydra-9-laser-engraving-machine": ["4.89", 19, "Hydra 9"],
  "onelaser-xt-desktop-laser-machine": ["4.89", 18, "XT"],
  "onelaser-hydra-16-cabinet-dual-laser-system-with150w-glass-tube-and-38w-rf-metal-tube": ["5.00", 4, "Hydra 16"],
};
function reviewsReply(p) {
  const own = p && REVIEW_STATS[p.handle];
  if (own) {
    const quotes = homeReviews.items.filter((r) => r.product === own[2] || r.product.startsWith(own[2])).slice(0, 3);
    return { text: tx("Owners rate the {name} {avg} out of 5 from {n} reviews. In their words:", { name: short(p), avg: own[0], n: own[1] }), quotes, links: [["Read all reviews", homeReviews.url]], src: ["Owner reviews on 1laser.com (Judge.me)"] };
  }
  return {
    text: [p && tx("The {name} has no owner reviews on its page yet.", { name: short(p) }), tx("Across OneLaser machines, owners average {avg} out of 5 from {n} reviews. A few recent ones, each labelled with its machine:", { avg: homeReviews.average, n: homeReviews.count })],
    quotes: homeReviews.items.slice(0, 3), links: [["Read all reviews", homeReviews.url]], src: ["Owner reviews on 1laser.com (Judge.me)"],
  };
}
const ROWS = ["Laser source", "Work area", "Max engraving speed", "Max resolution"];
const table = (list) => ({ cols: list.map((x) => x.handle), rows: [...ROWS.filter((k) => list.some((x) => x.specs?.[k])).map((k) => [k, ...list.map((x) => x.specs?.[k] || "—")]), ["Price", ...list.map((x) => (x.priceVaries ? tx("From {price}", { price: money(x.price) }) : money(x.price)))]] });

/* Guided match in the chat: the finder's three required questions as tap-to-answer buttons. */
const GUIDE = ["material", "work", "size"];
function guide(ans, intro = "") {
  const id = GUIDE.find((k) => !ans[k]);
  if (id) {
    const st = STEPS.find((x) => x.id === id);
    return { text: [intro, st.title], quick: { id, step: GUIDE.indexOf(id) + 1, options: st.options.map((o) => [o[0], o[1]]) }, src: ["Machine finder questions"] };
  }
  const top = rank({ ...ans, material: [ans.material] }, (h) => !!byHandle[h], (h) => byHandle[h]?.price || 0).slice(0, 3);
  return {
    text: tx("Here is my match. {name} comes first; the reason for each pick is under its card.", { name: byHandle[M[top[0].key].handle].name }),
    cards: top.map((r) => M[r.key].handle), why: Object.fromEntries(top.map((r) => [M[r.key].handle, r.reasons.slice(0, 2)])),
    finder: true, src: ["Machine finder rules", "Catalog specs and prices"], next: ["What do owners say?", "Can I pay monthly?", "Talk to a person"],
  };
}

/** Replies about the product being viewed; null when the question is about something else. */
function productReply(s, p) {
  if (!p) return null;
  const save = p.compareAt > p.price ? p.compareAt - p.price : 0;
  if (has(s, ["review", "owners say", "customers say", "people say", "rating", "reliable", "worth it"])) return { ...reviewsReply(p), next: ["Key specs", "Is it on sale?", "Talk to an expert"] };
  if (has(s, ["best for", "good for", "what can", "use it", "made for", "who is"])) return { text: [tx("{name}:", { name: short(p) }), p.tagline, tx("Best for: {what}.", { what: p.bestFor ? { tpl: p.bestFor } : { tpl: "see the product details" } })], src: ["Product page"], next: ["Key specs", "What do owners say?", "Which accessories fit?"] };
  if (has(s, ["compare", "other size", "bigger", "smaller", " vs", "difference"])) {
    const sib = siblings(p).filter((x) => x.handle !== p.handle);
    return sib.length ? { text: tx("{series}, side by side. Your current model is first:", { series: { tpl: p.seriesName || "This series" } }), table: table([p, ...sib]), links: [["Compare every spec", "/compare"]], src: ["Product specs", "Catalog prices"], next: ["Which accessories fit?", "Monthly payments for this machine", "Talk to an expert"] } : null;
  }
  if (has(s, ["spec", "work area", "speed", "power", "watt", "resolution", "dpi", "size"]) && p.specs && Object.keys(p.specs).length)
    return { text: tx("{name} key specs:", { name: short(p) }), specs: Object.entries(p.specs).filter(([k]) => k !== "Product line").slice(0, 7), links: [["Compare every spec", "/compare"]], src: ["Product specs"], next: [siblings(p).length > 1 ? "Compare the other sizes" : "What do owners say?", "Is it on sale?", "Which accessories fit?"] };
  if (has(s, ["sale", "price", "deal", "discount", "cost", "how much", "cheaper"]))
    return { text: save
      ? [tx(p.priceVaries ? "Yes. {name} is from {price} today, {save} off the regular {was}." : "Yes. {name} is {price} today, {save} off the regular {was}.", { name: short(p), price: money(p.price), save: money(save), was: money(p.compareAt) }), promo.label]
      : [tx(p.priceVaries ? "{name} is from {price}." : "{name} is {price}.", { name: short(p), price: money(p.price) }), promo.label], options: p.variants.length > 1 ? p.variants.map((v) => [v.title, v.price, v.compareAt]) : null, src: ["Catalog prices", "Black Friday offer"], next: ["Monthly payments for this machine", "Which accessories fit?", "What do owners say?"] };
  if (has(s, ["option", "version", "config", "variant", "hybrid", "pro "])) return p.variants.length > 1 ? { text: tx("{name} comes in {n} configurations:", { name: short(p), n: p.variants.length }), options: p.variants.map((v) => [v.title, v.price, v.compareAt]) } : null;
  if (has(s, ["accessor", "fit", "add-on", "addon", "rotary", "chiller", "work with", "compatible", "need with"]))
    return p.kind === "machine" ? { text: tx("These fit the {name}:", { name: short(p) }), cards: fitsWith(p), src: ["Catalog compatibility notes"], next: ["Do I need a chiller?", "Is it on sale?", "Talk to an expert"] } : { text: "Compatibility is listed in the product description. If you're unsure which machine it fits, an expert can check for you.", links: [["Book a free call", "/pages/sales-consultation"]] };
  if (has(s, ["monthly", "financ", "pay over", "installment", "afford", "per month"]))
    return { text: tx("{name} can be financed: installments at checkout, or $0-down business options. Estimate the monthly payment for this machine:", { name: short(p) }), links: [[tx("Estimate payments for {name}", { name: short(p) }), `/pages/financing?p=${p.handle}`]], src: ["OneLaser financing page"], next: ["Is it on sale?", "Talk to an expert"] };
  return null;
}

/** Preset replies. Returns { text, cards?, links?, chips? }. */
function reply(raw, product) {
  const s = raw.toLowerCase();
  if (has(s, ["need a chiller", "chiller"]) && has(s, ["need", "do i"])) return { text: "Glass CO₂ tubes need water cooling, so Cobra and the glass-tube Hydra configurations need a chiller. RF machines (XRF, VertiGo, Hydra 7 Gen2 and the Pro 70W RF options) are air-cooled.", cards: products.filter((p) => p.category === "cooling"), src: ["Catalog specs"], next: ["Which accessories fit?", "Talk to an expert"] };
  const own = productReply(s, product);
  if (own) return own;
  const list = (hs) => hs.map((h) => byHandle[h]).filter(Boolean);
  if (has(s, ["person", "human", "call", "phone", "talk", "expert", "sales", "agent"]))
    return { src: ["OneLaser contact details"], next: ["Shipping and returns", "Can I pay monthly?"], text: "Happy to hand you over. A OneLaser expert can take a free 30-minute call, or you can ring the team now.", links: [["Book a free call", "/pages/sales-consultation"], [tx("Call {phone}", { phone: contact.phone }), `tel:${contact.tel}`]] };
  if (has(s, ["deal", "black friday", "sale", "discount", "cheap", "save", "offer", "coupon"])) {
    const deals = products.filter((p) => p.compareAt > p.price).sort((x, y) => (y.compareAt - y.price) - (x.compareAt - x.price)).slice(0, 6);
    return { text: [promo.label, promo.headline, "These have the biggest savings right now:"], cards: deals, links: [["See all deals", "/collections/machines"]], src: ["Catalog prices", "Black Friday offer"], next: ["Which laser fits me?", "Can I pay monthly?", "What do owners say?"] };
  }
  if (has(s, ["financ", "monthly", "per month", "pay over", "installment", "loan", "lease", "afford"]))
    return { text: [faq("Is financing available"), "Business loans can start at $0 down with terms up to 60 months."], links: [["Estimate my monthly payment", "/pages/financing"]], src: ["OneLaser financing page"], next: ["Which laser fits me?", "Show me Black Friday deals"] };
  if (has(s, ["ship", "deliver", "return", "refund", "warranty", "guarantee"]))
    return { text: [faq("What warranty"), faq("Can I return"), "Shipping rates and delivery dates are shown at checkout once you enter your address; machines ship by freight."], links: [["Read the warranty policy", "https://www.1laser.com/pages/warranty-policy"]], src: ["OneLaser warranty and return policy"], next: ["What do owners say?", "Talk to a person"] };
  if (has(s, ["review", "owners say", "customers say", "rating", "reliable", "worth it"])) return { ...reviewsReply(null), next: ["Which laser fits me?", "Show me Black Friday deals"] };
  if (has(s, ["software", "lightburn", "mac", "windows"]))
    return { text: faq("Which software"), cards: list(["lightburn-software-pro-license-key"]) };
  if (has(s, ["support", "help after", "broken", "repair", "service"]))
    return { text: faq("How does support"), links: [["Contact support", "https://zohodesk.1laser.com/portal/en/newticket"]] };
  if (has(s, [" vs", "versus", "compare", "difference", " or "]) && has(s, ["cobra", "hydra", "xrf", "vertigo"]))
    return { text: "Short version: XRF is an all-in-one 38W RF desktop for fine engraving. Cobra uses 90–130W glass CO₂ tubes, the value pick for cutting wood and acrylic. Hydra Gen2 adds RF engraving and a glass tube in one machine, with 2,000 mm/s and 4G for production. VertiGo is a vertical RF machine for round items only.", table: table(list(["onelaser-xrf-desktop-laser-machine", "cobra-10-100w-co2-laser-engraver-cutter", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine"])), links: [["Compare every spec", "/compare"]], src: ["Product specs", "Catalog prices"], next: ["Which laser fits me?", "What do owners say?"] };
  for (const k of Object.keys(SERIES)) if (s.includes(k)) return { text: tx("Here is the {series} line-up with today's prices.", { series: { tpl: k === "xrf" ? "XRF" : k === "vertigo" ? "VertiGo" : k === "cobra" ? "Cobra Series" : "Hydra Gen2" } }), cards: list(SERIES[k]) };
  if (has(s, ["rotary", "piburn", "round"]) && !has(s, ["which", "best", "recommend"])) return { text: "Rotary attachments for engraving round items:", cards: products.filter((p) => p.category === "rotary").slice(0, 6) };
  if (has(s, ["fume", "smoke", "filter", "vent", "extract"])) return { text: "FiltraBox fume extractors, for rooms without an outside vent:", cards: products.filter((p) => p.category === "fume" && p.price > 1000) };
  if (has(s, ["chiller", "cooling", "water"])) return { text: "Glass tubes need water cooling. These chillers fit Cobra and Hydra:", cards: products.filter((p) => p.category === "cooling") };
  if (has(s, ["material", "acrylic sheet", "leatherette", "blank"])) return { text: "MakerDepot materials, cut and tested for lasers:", cards: products.filter((p) => p.kind === "material").slice(0, 6) };
  const a = parse(s);
  if (has(s, ["which", "recommend", "best", "fit", "should i", "need", "want", "looking", "beginner", "start"]) || Object.keys(a).length) {
    const top = rank(a, (h) => !!byHandle[h], (h) => byHandle[h]?.price || 0).slice(0, 3).map((r) => ({ p: byHandle[M[r.key].handle], why: r.reasons }));
    const MAT = { wood: "wood and acrylic", leather: "leather and fabric", drinkware: "tumblers", stone: "glass and stone", coated: "coated metal", photo: "photos" };
    const WORK = { engrave: "mostly engraving", cut: "mostly cutting", both: "cutting and engraving" };
    const USE = { side: "just starting out", full: "a full-time shop", high: "high-volume production" };
    const heard = [a.material && { list: a.material.map((m) => MAT[m]), sep: ", " }, WORK[a.work], a.size && (a.size === "s" ? "small pieces" : "large pieces"), USE[a.shop]].filter(Boolean);
    if (!heard.length) return guide({}, "Three quick taps and I'll match you.");
    return { text: tx("From what you said ({heard}), {name} is my first pick. The reason for each is under its card.", { heard: { list: heard, sep: "; " }, name: top[0].p.name }), cards: top.map((x) => x.p), why: Object.fromEntries(top.map((x) => [x.p.handle, x.why.slice(0, 2)])), finder: true, src: ["Machine finder rules", "Catalog specs and prices"], next: ["What do owners say?", "Can I pay monthly?", "Talk to a person"] };
  }
  return { text: "I can match a machine to your work, show today's deals, compare models, share what owners say, or explain financing, shipping and warranty. Or I can connect you with a person.", next: ["Which laser fits me?", "Show me Black Friday deals", "Talk to a person"] };
}

function Cards({ list, why = {} }) {
  return (
    <div className="ai-cards">
      {list.map((h) => byHandle[h]).filter(Boolean).map((p) => (
        <div key={p.handle} className="ai-card">
          <Link to={`/products/${p.handle}`} className="ai-card-img"><img src={img(p.kind === "machine" ? frontImg(p) : p.images[0], 300)} alt="" loading="lazy" /></Link>
          <b>{p.name}</b>
          <p>{p.priceVaries && <small>{t("From")} </small>}{money(p.price)}{p.compareAt > p.price && <s>{money(p.compareAt)}</s>}</p>
          {[].concat(why[p.handle] || []).map((w) => <em key={w} className="ai-why"><Icon name="check" size={12} />{t(w)}</em>)}
          <div className="ai-card-btns">
            <AddButton product={p} className="ai-add" drop="up" iconSize={14} />
            <Link to={`/products/${p.handle}`} className="ai-view">{t("View")}</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Reply text that types itself out once, the way streamed answers appear. */
function Typed({ text, live, onDone }) {
  const [n, setN] = useState(live ? 0 : text.length);
  useEffect(() => {
    if (n >= text.length) { onDone?.(); return undefined; }
    const id = setTimeout(() => setN((x) => Math.min(text.length, x + 3)), 14);
    return () => clearTimeout(id);
  }, [n, text, onDone]);
  return <p>{text.slice(0, n)}{n < text.length && <span className="ai-caret" />}</p>;
}

function Table({ data }) {
  const list = data.cols.map((h) => byHandle[h]).filter(Boolean);
  return (
    <div className="ai-table-wrap">
      <table className="ai-table">
        <thead><tr><th />{list.map((p, i) => <th key={p.handle} className={i === 0 ? "me" : ""}><Link to={`/products/${p.handle}`}><img src={img(frontImg(p), 160)} alt="" />{short(p).replace(" Gen2", "")}</Link></th>)}</tr></thead>
        <tbody>{data.rows.map(([k, ...v]) => <tr key={k}><th>{t(k)}</th>{v.map((x, i) => <td key={i} className={i === 0 ? "me" : ""}>{typeof x === "string" && /^\$/.test(x) ? x : say(x)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

const STORE = "onelaser-ai-v1";
const load = () => { try { return JSON.parse(sessionStorage.getItem(STORE)) || {}; } catch { return {}; } };
const keep = (v) => { try { sessionStorage.setItem(STORE, JSON.stringify(v)); } catch { /* private mode: this page only */ } };
const wide = () => typeof window !== "undefined" && !window.matchMedia("(max-width: 860px)").matches;

export default function Assistant({ product }) {
  const labels = product ? [tx("Ask about {name}", { name: short(product) }), "Shop with AI", product.compareAt > product.price ? "See today's deal" : "Find my laser"] : LABELS;
  const chips = product ? productChips(product) : CHIPS;
  const cats = product?.kind === "machine" && siblings(product).length > 1 ? siblings(product).map((p) => [p.handle, short(p), p.handle, true]) : CATS;
  const ctx = product?.handle || "site";
  const saved = useRef(load()).current;
  const [open, setOpen] = useState(() => !!saved.open && wide()); // a desktop chat stays open from page to page
  const [label, setLabel] = useState(0);
  const [msgs, setMsgs] = useState(() => {
    const m = saved.msgs || [];
    if (m.length && saved.ctx !== ctx) return [...m, { divider: product ? tx("Now viewing {name}", { name: product.name }) : "Back to browsing" }];
    return m;
  });
  const [ans, setAns] = useState(saved.ans || {});
  const [live, setLive] = useState(-1); // index of the reply that is still typing
  const [fb, setFb] = useState({});
  const [nudge, setNudge] = useState(false);
  useEffect(() => { keep({ msgs, ans, open, ctx }); }, [msgs, ans, open, ctx]);
  useEffect(() => {
    if (!product || product.kind !== "machine") return undefined;
    let seen = false;
    try { seen = !!sessionStorage.getItem("onelaser-ai-nudge"); } catch { /* ignore */ }
    if (seen) return undefined;
    const id = setTimeout(() => setNudge(true), 12000);
    return () => clearTimeout(id);
  }, [product]);
  // phones: the pill shrinks to its icon while scrolling down, grows back on the way up or when scrolling stops
  const [mini, setMini] = useState(false);
  useEffect(() => {
    let y = window.scrollY, idle;
    const on = () => {
      const ny = window.scrollY;
      if (Math.abs(ny - y) > 6) setMini(ny > y && ny > 160);
      y = ny;
      clearTimeout(idle);
      idle = setTimeout(() => setMini(false), 1400);
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); clearTimeout(idle); };
  }, []);
  // phones: the drawer takes a history entry, so the system back gesture closes it instead of leaving the page
  // Only an entry this drawer pushed itself is ever popped (a reload keeps history.state, so that cannot be trusted).
  const pushed = useRef(false);
  useEffect(() => {
    if (!open || wide()) return undefined;
    if (!pushed.current) { window.history.pushState({ ...(window.history.state || {}), ai: 1 }, ""); pushed.current = true; }
    const back = () => { pushed.current = false; setOpen(false); };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [open]);
  const close = () => { if (pushed.current) window.history.back(); else setOpen(false); };
  // phones: drag the drawer down by its header to close it
  const drag = useRef(null);
  const [dy, setDy] = useState(0);
  const onTouchStart = (e) => { if (!wide()) drag.current = e.touches[0].clientY; };
  const onTouchMove = (e) => { if (drag.current != null) setDy(Math.max(0, e.touches[0].clientY - drag.current)); };
  const onTouchEnd = () => { if (drag.current == null) return; drag.current = null; if (dy > 110) close(); setDy(0); };
  const closeNudge = () => { setNudge(false); try { sessionStorage.setItem("onelaser-ai-nudge", "1"); } catch { /* ignore */ } };
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const { count } = useCart();
  const body = useRef(null);
  const input = useRef(null);

  useEffect(() => { const id = setInterval(() => setLabel((n) => (n + 1) % 3), 3200); return () => clearInterval(id); }, []);
  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "smooth" }); }, [msgs, typing, open]);
  useEffect(() => {
    if (!open) return undefined;
    input.current?.focus({ preventScroll: true });
    const key = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", key);
    const small = window.matchMedia("(max-width: 860px)").matches;
    const prev = document.body.style.overflow;
    if (small) document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [open]);

  const answer = (r) => {
    const out = { ...r, cards: r.cards?.map((p) => (typeof p === "string" ? p : p.handle)) };
    if (!out.next) out.next = (product ? productChips(product) : CHIPS).slice(0, 3);
    if (!out.src) out.src = ["OneLaser catalog"];
    setMsgs((m) => { setLive(m.length); return [...m, out]; });
    setTyping(false);
  };
  /** typed = what the visitor wrote; otherwise q is a suggestion piece, shown translated and matched in English. */
  const ask = (q, typed = false) => {
    const shown = typed ? q.trim() : say(q);
    const v = typed ? normalize(q.trim()) : en(q);
    if (!shown || typing) return;
    setMsgs((m) => [...m, { me: true, text: shown }]);
    setText("");
    setTyping(true);
    if (/which laser fits|help me choose|find my laser/i.test(v)) { setAns({}); setTimeout(() => answer(guide({}, "Three quick taps and I'll match you.")), 500); return; }
    setTimeout(() => answer(reply(v, product)), 600);
  };
  const pick = (id, val, label) => {
    if (typing) return;
    const next = { ...ans, [id]: val };
    setAns(next);
    setMsgs((m) => [...m, { me: true, text: label }]);
    setTyping(true);
    setTimeout(() => answer(guide(next)), 450);
  };
  const openWith = (q) => { closeNudge(); setOpen(true); if (q) setTimeout(() => ask(q), 250); };
  const cat = ([k, name, h, model]) => (model ? (window.location.hash = `#/products/${h}`) : ask(k === "deals" ? "Show me Black Friday deals" : k === "rotary" ? "Rotary attachments" : tx("Show me the {name}", { name: { tpl: name } })));
  const toFinder = () => {
    setOpen(false);
    openMachineFinder();
  };

  return (
    <>
      {nudge && !open && (
        <div className="ai-nudge" role="status">
          <button type="button" className="ai-nudge-x" aria-label={t("Dismiss")} onClick={closeNudge}><Icon name="close" size={14} /></button>
          <button type="button" className="ai-nudge-body" onClick={() => openWith(siblings(product).length > 1 ? "Compare the other sizes" : "Key specs")}>
            <b>{say(siblings(product).length > 1 ? tx("Choosing a {series}?", { series: { tpl: product.seriesName || "size" } }) : tx("Questions about the {name}?", { name: short(product) }))}</b>
            <span>{t(siblings(product).length > 1 ? "I can line up every size, side by side." : "Ask me about specs, price or what fits it.")}</span>
          </button>
        </div>
      )}
      <button type="button" className={`ai-pill${open ? " hide" : ""}${mini ? " mini" : ""}`} onClick={() => openWith()} aria-label={t("Open the OneLaser shopping assistant")} aria-expanded={open}>
        <span className="ai-avatar"><Icon name="sparkle" size={20} /></span>
        <span className="ai-pill-text" key={label}>{say(labels[label % labels.length])}</span>
      </button>
      {open && <div className="ai-backdrop" onClick={close} aria-hidden="true" />}
      {open && (
        <div className={`ai-panel${msgs.length ? " chatting" : ""}${dy ? " dragging" : ""}`} role="dialog" aria-modal="true" aria-label={t("OneLaser shopping assistant")} style={dy ? { transform: `translateY(${dy}px)` } : undefined}>
          <div className="ai-grab" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} aria-hidden="true"><i /></div>
          <header className="ai-head" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <span className="ai-avatar sm"><Icon name="sparkle" size={16} /></span>
            <span className="ai-title"><b><span className="ai-long">{t("OneLaser Shopping Assistant")}</span><span className="ai-short">{t("OneLaser Assistant")}</span></b><small><i />{t("Online · replies instantly")}</small></span>
            <Link to="/cart" className="ai-icon" aria-label={t("Cart")}><Icon name="cart" size={20} />{count > 0 && <em>{count}</em>}</Link>
            {msgs.length > 0 && <button type="button" className="ai-icon" aria-label={t("New chat")} title={t("New chat")} onClick={() => { setMsgs([]); setAns({}); setFb({}); }}><Icon name="refresh" size={18} /></button>}
            <button type="button" className="ai-icon" aria-label={t("Close")} onClick={close}><Icon name="close" size={20} /></button>
          </header>
          <div className="ai-body" ref={body}>
            <div className="ai-welcome">
              {product ? (
                <>
                  <h2>{t("Questions about this one?")}</h2>
                  <div className="ai-product">
                    <img src={img(product.kind === "machine" ? frontImg(product) : product.images[0], 200)} alt="" />
                    <span><b>{product.name}</b><small>{product.priceVaries && `${t("From")} `}{money(product.price)}{product.compareAt > product.price && <s>{money(product.compareAt)}</s>}</small></span>
                    {product.compareAt > product.price && <em>{t("Save")} {money(product.compareAt - product.price)}</em>}
                  </div>
                  <p>{t("I know its specs, today's price, what fits it and how to pay for it.")}</p>
                </>
              ) : (
                <>
                  <h2>{t("Welcome to OneLaser")} 👋</h2>
                  <p>{t("Ask me anything: which laser fits your work, today's deals, financing or shipping.")}</p>
                </>
              )}
              {product && cats !== CATS && <p className="ai-sub">{t("Other sizes in this series")}</p>}
              <div className="ai-cats-wrap"><div className="ai-cats">
                {cats.map((c) => {
                  const p = c[2] && byHandle[c[2]];
                  return (
                    <button key={c[0]} type="button" onClick={() => cat(c)} className={product && c[2] === product.handle ? "on" : ""}>
                      <span className="ai-cat-img">{p ? <img src={img(p.kind === "machine" ? frontImg(p) : p.images[0], 240)} alt="" /> : <b className="ai-cat-deal">{promo.headline}</b>}</span>
                      <span className="ai-cat-name">{t(c[1])}</span>
                    </button>
                  );
                })}
              </div></div>
              {msgs.length === 0 && (
                <div className="ai-try">
                  <p>{t("Try asking")}</p>
                  <div className="ai-chips grid">{chips.map((c) => <button key={en(c)} type="button" onClick={() => ask(c)}><Icon name="sparkle" size={12} />{say(c)}</button>)}</div>
                </div>
              )}
            </div>
            {msgs.map((m, n) => {
              if (m.divider) return <p key={n} className="ai-divider"><span>{say(m.divider)}</span></p>;
              if (m.me) return <p key={n} className="ai-me">{m.text}</p>;
              const typingNow = n === live;
              const last = n === msgs.length - 1;
              return (
                <div key={n} className="ai-bot">
                  <Typed text={say(m.text)} live={typingNow} onDone={typingNow ? () => setLive(-1) : undefined} />
                  {!typingNow && (
                    <div className="ai-extra">
                      {m.quick && (
                        <div className="ai-quick">
                          <small>{t("Step")} {m.quick.step} / 3</small>
                          {m.quick.options.map(([v, l]) => <button key={v} type="button" disabled={!last} className={ans[m.quick.id] === v ? "on" : ""} onClick={() => pick(m.quick.id, v, t(l))}>{t(l)}</button>)}
                        </div>
                      )}
                      {m.specs && <dl className="ai-specs">{m.specs.map(([k, v]) => <div key={k}><dt>{t(k)}</dt><dd>{v}</dd></div>)}</dl>}
                      {m.table && <Table data={m.table} />}
                      {m.options && <ul className="ai-opts">{m.options.map(([o, pr, was]) => <li key={o}><span>{o}</span><b>{money(pr)}{was > pr && <s>{money(was)}</s>}</b></li>)}</ul>}
                      {m.quotes && <ul className="ai-quotes">{m.quotes.map((r) => <li key={r.name}><span className="ai-stars" aria-label={t("5 out of 5 stars")}>★★★★★</span><p>“{r.text}”</p><small>{r.name} · {r.product}</small></li>)}</ul>}
                      {m.cards?.length > 0 && <Cards list={m.cards} why={m.why} />}
                      {(m.links || m.finder) && (
                        <div className="ai-links">
                          {m.finder && <button type="button" onClick={toFinder}>{t("Open the full machine finder")} →</button>}
                          {m.links?.map(([l, u]) => (/^(https?:|tel:)/.test(u) ? <Link key={u} href={u}>{say(l)} →</Link> : <Link key={u} to={u} onClick={() => !wide() && setOpen(false)}>{say(l)} →</Link>))}
                        </div>
                      )}
                      <div className="ai-meta">
                        {m.src && <small>{t("Based on")}: {m.src.map((x) => t(x)).join(" · ")}</small>}
                        <span className="ai-fb">
                          {fb[n] ? <em>{t(fb[n] === "up" ? "Thanks!" : "Thanks, noted.")}</em> : (
                            <>
                              <button type="button" aria-label={t("Helpful")} onClick={() => setFb((f) => ({ ...f, [n]: "up" }))}>👍</button>
                              <button type="button" aria-label={t("Not helpful")} onClick={() => setFb((f) => ({ ...f, [n]: "down" }))}>👎</button>
                            </>
                          )}
                        </span>
                      </div>
                      {last && !m.quick && m.next?.length > 0 && <div className="ai-chips ai-next">{m.next.map((c) => <button key={en(c)} type="button" onClick={() => ask(c)}>{say(c)}</button>)}</div>}
                    </div>
                  )}
                </div>
              );
            })}
            {typing && <div className="ai-typing" aria-label={t("Assistant is typing")}><i /><i /><i /></div>}
          </div>
          <form className="ai-input" onSubmit={(e) => { e.preventDefault(); ask(text, true); }}>
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Message the OneLaser assistant")} aria-label={t("Message")} />
            <button type="submit" disabled={!text.trim() || typing} aria-label={t("Send")}><Icon name="arrow" size={18} /></button>
          </form>
          <p className="ai-fine">{t("Design draft: replies come from preset rules over the real catalog, not a live AI.")}</p>
        </div>
      )}
    </>
  );
}
