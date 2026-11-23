// Editable store content: promo, navigation, homepage sections.
// Copy and offers follow www.1laser.com as of 2026-11-16.
export const promo = {
  label: "Black Friday deals · Ends Cyber Monday, Nov 30",
  headline: "Save up to $3,000",
  image: "https://www.1laser.com/cdn/shop/files/exec-051cb678-d9c0-4c36-b080-528914f5f413.png?v=1794186467",
  endsAt: "2026-12-01T07:59:59Z", // Nov 30, 11:59 PM PT
  link: "https://www.1laser.com/pages/bfcm26", // official Black Friday page
};

export const collections = {
  machines: { title: "Laser Machines", intro: "Engraving, cutting and marking machines for makers, workshops and production floors.", filter: (p) => p.kind === "machine" },
  "xrf-series": { title: "XRF Series", intro: "All-in-one RF desktop lasers.", filter: (p) => p.series === "xrf" },
  "cobra-series": { title: "Cobra Series", intro: "Workshop-essential glass CO₂ engravers and cutters.", filter: (p) => p.series === "cobra" },
  "hydra-gen2": { title: "Hydra Gen2", intro: "Industrial RF and hybrid dual-laser systems.", filter: (p) => p.series === "hydra" },
  vertigo: { title: "VertiGo", intro: "Vertical rotary laser built for drinkware.", filter: (p) => p.series === "vertigo" },
  "previous-generation": { title: "Previous Generation", intro: "Proven performance. Exceptional value. Very limited inventory.", filter: (p) => p.series === "legacy" },
  accessories: { title: "Laser Accessories", intro: "Rotaries, fume extraction, optics, cooling and expansion for your OneLaser.", filter: (p) => p.kind === "accessory" },
  rotary: { title: "Rotary Attachments", intro: "Engrave tumblers, mugs, bottles and more.", filter: (p) => p.category === "rotary" },
  fume: { title: "Fume Extractors", intro: "FiltraBox filtration systems and replacement filters.", filter: (p) => p.category === "fume" },
  optics: { title: "Lens, Mirrors & Tubes", intro: "Focus lenses, mirrors, beam optics and laser tubes.", filter: (p) => p.category === "optics" },
  cooling: { title: "Chillers", intro: "Water chillers for glass-tube systems.", filter: (p) => p.category === "cooling" },
  expansion: { title: "Expansion", intro: "Riser bases, conveyor feeders and air assist.", filter: (p) => p.category === "expansion" || p.category === "air" },
  software: { title: "Software & Training", intro: "LightBurn licenses and 1-on-1 engineer training.", filter: (p) => p.category === "software" },
  materials: { title: "Materials", intro: "Laser-ready acrylic and leatherette sheets from MakerDepot.", filter: (p) => p.kind === "material" },
  acrylic: { title: "Acrylic Sheets", intro: "Frosted, translucent, glitter and mirror acrylic.", filter: (p) => p.category === "acrylic" },
  leatherette: { title: "Leatherette", intro: "Heat-activated adhesive leatherette sheets.", filter: (p) => p.category === "leatherette" },
  deals: { title: "Black Friday Deals", intro: "Every product currently on sale.", filter: (p) => p.compareAt },
};

// Top navigation: labels, order and grouping follow www.1laser.com (read 2026-11-18). Shop links point to this store's pages;
// service links go to the official site.
const SITE = "https://www.1laser.com";
export const nav = [
  {
    label: "Machines", to: "/collections/machines",
    // Series cards as in the new 1laser.com theme preview (render, name, one-line description, starting price) plus a "More" column.
    // Added here: each card lists its models as direct links, and "Help me choose" opens the machine finder on the home page.
    // crop = where the machine sits inside its front-view photo (frontImg): [left, top, right, bottom] as fractions, then the photo's width ÷ height.
    // The menu tile uses it to show every machine at the same visual size (the photos have very different margins).
    series: [
      { title: "X Series", crop: [0.083, 0.405, 0.917, 0.611, 1], to: "/products/onelaser-xrf-desktop-laser-machine", desc: "Compact 38W RF desktop engraving", items: ["onelaser-xrf-desktop-laser-machine"] },
      { title: "Cobra Series", crop: [0.028, 0.028, 0.972, 0.972, 1.724], to: "/products/cobra-10-100w-co2-laser-engraver-cutter", desc: "90W–130W CO₂ glass laser cutters", items: ["cobra-8-90w-co2-laser-engraver-cutter", "cobra-10-100w-co2-laser-engraver-cutter", "cobra-14-130w-co2-laser-engraver-cutter"] },
      { title: "Hydra Series", crop: [0.028, 0.028, 0.972, 0.972, 1.418], to: "/products/hydra-9-gen-2-70w-rf-co2-dual-laser-machine", desc: "RF and hybrid lasers for larger projects", items: ["hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "hydra-13-gen-2-70w-rf-co2-dual-laser-machine", "hydra-16-gen-2-70w-rf-co2-dual-laser-machine"] },
      { title: "VertiGo", crop: [0.191, 0.152, 0.806, 0.855, 1], to: "/products/vertigo-vertical-laser-engraver", desc: "Vertical 38W RF engraving for drinkware", items: ["vertigo-vertical-laser-engraver"] },
    ],
    more: [["All laser machines", "/collections/machines"], ["Accessories", "/collections/accessories"], ["Compare machines", "/compare"]],
  },
  { label: "Accessories", to: "/collections/accessories" },
  { label: "Material", to: "/collections/materials" },
  { label: "Black Friday", to: "/collections/deals", hot: true },
  {
    label: "Support", href: `${SITE}/pages/sales-consultation`,
    // Two picture cards plus a link list, as on 1laser.com.
    cards: [
      ["Get a Quote", `${SITE}/products/sales-consultation-call`, `${SITE}/cdn/shop/files/Consultation_Call_Session_f357d165-c36d-445e-8589-cd76cb193639.png?v=1764916744`],
      ["1-on-1 Support", `${SITE}/products/engineer-1-on-1-training-support`, `${SITE}/cdn/shop/files/1-on-1_training.png?v=1764920272`],
    ],
    links: [["Contact Support", "https://zohodesk.1laser.com/portal/en/newticket"], ["Financing", "/pages/financing"], ["Policy", `${SITE}/pages/shipping-policy`], ["Blogs", `${SITE}/blogs/topic`], ["Product Knowledge Base", "https://wiki.1laser.com"]],
  },
  {
    label: "Community", href: `${SITE}/pages/laser-engraving-community`,
    cards: [
      ["Become Affiliate", "https://af.uppromote.com/OneLaser/register", `${SITE}/cdn/shop/files/3_154dd9e8-536b-43e4-9e64-5e1532331fdd.png?v=1782712883`],
      ["Purchase Rewards", `${SITE}/pages/onelaser-rewards`, `${SITE}/cdn/shop/files/OneLaser_Forum_4979b167-4ed1-476c-a24f-bd1b496f235a.png?v=1782714101`],
    ],
    links: [["Join Community", `${SITE}/pages/laser-engraving-community`], ["Testimonials", `${SITE}/pages/testimonials`]],
  },
  { label: "Contact", href: `${SITE}/pages/contact-us` },
];
export const contact = { phone: "626 800 4130", tel: "+16268004130", call: "/pages/sales-consultation" };

// Footer: columns, links, contact lines and social accounts as on www.1laser.com (read 2026-11-18).
export const footer = {
  groups: [
    ["Community", [["Purchase Rewards", `${SITE}/pages/onelaser-rewards`], ["Become Affiliate", "https://af.uppromote.com/OneLaser/register"], ["Join Community", `${SITE}/pages/laser-engraving-community`], ["Testimonials", `${SITE}/pages/testimonials`]]],
    ["Machines", [["OneLaser Machines", "/collections/machines"], ["X Series", "/collections/xrf-series"], ["Cobra Series", "/collections/cobra-series"], ["Hydra Gen2 Series", "/collections/hydra-gen2"], ["Hydra Series", "/collections/previous-generation"], ["VertiGo", "/products/vertigo-vertical-laser-engraver"], ["Laser Accessories", "/collections/accessories"]]],
    ["Support", [["About Us", `${SITE}/pages/about-us`], ["Contact Us", `${SITE}/pages/contact-us`], ["Financing", "/pages/financing"], ["Blog Center", `${SITE}/blogs/topic`], ["Payment Methods", `${SITE}/pages/payment-methods`], ["Common FAQ", `${SITE}/pages/faq`], ["Laser Engraving & Cutting Chart", `${SITE}/pages/laser-cutter-engraving-settings-for-different-materials`]]],
    ["Policy", [["Shipping Policy", `${SITE}/pages/shipping-policy`], ["Privacy Policy", `${SITE}/pages/privacy-policy`], ["Refund Policy", `${SITE}/pages/refund-policy`], ["Terms of Service", `${SITE}/pages/terms-of-service`], ["Warranty Policy", `${SITE}/pages/warranty-policy`], ["Pre & Backorder Policy", `${SITE}/pages/pre-order-backorder-policy`], ["Giveaway General Terms & Conditions", `${SITE}/pages/onelaser-giveaway-general-terms-conditions`]]],
  ],
  contact: [["Phone", "626-800-4130", "tel:+16268004130"], ["Tech Support", "ts@1laser.com", "mailto:ts@1laser.com"], ["Customer Support", "cs@1laser.com", "mailto:cs@1laser.com"], ["Sales Consultation", "sales@1laser.com", "mailto:sales@1laser.com"]],
  address: "20472 Crescent Bay Dr, STE 104, Lake Forest, CA 92630",
  social: [["Facebook", "https://www.facebook.com/onelaser.official"], ["Instagram", "https://www.instagram.com/onelaser.official/"], ["YouTube", "https://www.youtube.com/@OneLaser.Official"], ["TikTok", "https://www.tiktok.com/@onelaser.official"], ["X (Twitter)", "https://x.com/OneLaserHQ"]],
  legal: [["Privacy Policy", `${SITE}/policies/privacy-policy`], ["Terms of Service", `${SITE}/policies/terms-of-service`]],
};

// Home "The OneLaser Standard" block with the headquarters photo, copied from www.1laser.com (read 2026-11-18).
export const homeStandard = {
  image: `${SITE}/cdn/shop/files/onelaser-us-headquarters.webp?v=1788363337`,
  kicker: "The OneLaser Standard", title: "Make better with one.",
  text: "Ownership is backed by a U.S. company, local guidance, training, official policy coverage, and technical support after delivery.",
  points: [
    ["U.S. company and local team", "An accountable OneLaser team for sales, service, and product guidance in the U.S."],
    ["Training that gets work moving", "One-on-one training and knowledge resources help teams move from setup to real jobs."],
    ["Warranty and easy returns", "Official warranty coverage and a 30-day return policy provide a clearer ownership path."],
    ["Technical support after delivery", "Support continues through real technicians, service resources, and available parts."],
  ],
  cta: ["Explore OneLaser support", `${SITE}/products/sales-consultation-call`],
};

// Hero videos are short, silent background clips. Each slide has a still for its first frame.
export const heroSlides = [
  {
    id: "friday",
    tab: "Black Friday",
    eyebrow: "Ends Cyber Monday, Nov 30",
    title: "Black Friday Deals",
    text: promo.headline,
    image: "home-bf-lineup.jpg",
    cta: "Shop Black Friday Deals",
    href: promo.link,
  },
  {
    id: "xrf",
    tab: "XRF",
    eyebrow: "Flagship desktop laser",
    title: "XRF 38W",
    text: "All-in-one RF power for fine engraving and everyday production.",
    image: "home-hero-xrf.jpg",
    video: "home-hero-xrf-loop.mp4",
    cta: "Explore XRF",
    to: "/products/onelaser-xrf-desktop-laser-machine",
  },
  {
    id: "vertigo",
    tab: "VertiGo",
    eyebrow: "Built for drinkware",
    title: "VertiGo",
    text: "Built-in vertical rotary for tumblers, bottles and more.",
    image: "home-product-vertigo-scene.webp",
    cta: "Explore VertiGo",
    to: "/products/vertigo-vertical-laser-engraver",
  },
  {
    id: "about",
    tab: "About Us",
    eyebrow: "About Us",
    title: homeStandard.title,
    text: "Laser machines for creators, backed by a U.S. team.",
    image: "home-hero-brand-poster.webp",
    video: "home-hero-brand-loop.mp4",
    cta: "Schedule a Sales Call",
    to: contact.call,
  },
];

export const categoryRail = [
  ["XRF Series", "/collections/xrf-series", "onelaser-xrf-desktop-laser-machine"],
  ["Cobra Series", "/collections/cobra-series", "cobra-10-100w-co2-laser-engraver-cutter"],
  ["Hydra Gen2", "/collections/hydra-gen2", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine"],
  ["VertiGo", "/collections/vertigo", "vertigo-vertical-laser-engraver"],
  ["Rotary", "/collections/rotary", "piburn-omni-for-onelaser"],
  ["Fume Extractors", "/collections/fume", "filtrabox-compact-x"],
  ["Lens & Optics", "/collections/optics", "2-inch-focal-lens-laser-engraver"],
  ["Chillers", "/collections/cooling", "onelaser-industrial-chiller-for-hydra-laser-engraver"],
  ["Materials", "/collections/materials", "1-8-glitter-acrylic-sheets-12-12-4-pack-for-laser-engraving-cutting"],
];

// One flagship per machine line, so the home page does not repeat the same machines module after module.
export const hot = [
  "onelaser-xrf-desktop-laser-machine", "hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "cobra-8-90w-co2-laser-engraver-cutter",
  "vertigo-vertical-laser-engraver",
];

// Lifestyle backgrounds for the What's Hot tiles: generated with ChatGPT from the official 1laser.com renders (2026-11-16).
export const hotImages = {
  "onelaser-xrf-desktop-laser-machine": "hot-xrf.jpg", "hydra-7-gen-2-70w-rf-co2-dual-laser-machine": "hot-hydra7.jpg",
  "cobra-8-90w-co2-laser-engraver-cutter": "hot-cobra8.jpg", "vertigo-vertical-laser-engraver": "hot-vertigo.jpg",
  "piburn-omni-for-onelaser": "hot-piburn.jpg", "onelaser-x-series-riser-base": "hot-riser.jpg", "filtrabox-micro": "hot-filtrabox.jpg",
};

export const bestSellers = [
  "onelaser-xrf-desktop-laser-machine", "cobra-10-100w-co2-laser-engraver-cutter", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine",
  "vertigo-vertical-laser-engraver", "hydra-7-gen-2-70w-rf-co2-dual-laser-machine",
];

export const promoBanner = { kicker: "OneLaser Store Picks", title: "Black Friday: save up to $3,000", text: "Every machine and accessory currently on sale, in one place.", product: "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", image: "promo-hydra9.jpg", to: "/collections/deals" };

export const seriesBlocks = [
  { kicker: "Create anywhere", title: "Desktop", name: "XRF 38W", text: "Air-cooled RF, true 3G acceleration and a 0.07 mm laser spot in an all-in-one desktop machine.", image: "home-product-xrf-scene.webp", to: "/products/onelaser-xrf-desktop-laser-machine", view: "/collections/machines", viewLabel: "Explore Desktop Machines and Accessories",
    picks: ["onelaser-xrf-desktop-laser-machine", "vertigo-vertical-laser-engraver", "onelaser-x-series-riser-base", "onelaser-automatic-conveyor-feeder"] },
  { kicker: "For production", title: "Workshop", name: "Cobra Series", text: "90W to 130W glass CO₂ power with Smart Dual Air-Assist for wood, acrylic and leather.", image: "home-product-cobra-scene.webp", to: "/collections/cobra-series", view: "/collections/cobra-series", viewLabel: "Explore Cobra Machines and Accessories",
    picks: ["cobra-8-90w-co2-laser-engraver-cutter", "cobra-10-100w-co2-laser-engraver-cutter", "cobra-14-130w-co2-laser-engraver-cutter", "onelaser-industrial-chiller-for-hydra-laser-engraver"] },
  { kicker: "Scale up", title: "Industrial", name: "Hydra Gen2", text: "70W RF Pro or 38W RF + glass-tube Hybrid configurations for precision, speed and scale.", image: "home-product-hydra-gen2-scene.webp", to: "/collections/hydra-gen2", view: "/collections/hydra-gen2", viewLabel: "Explore Hydra Gen2 Machines and Accessories",
    picks: ["hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "hydra-13-gen-2-70w-rf-co2-dual-laser-machine", "hydra-16-gen-2-70w-rf-co2-dual-laser-machine"] },
  { kicker: "Complete your setup", title: "Accessories & Materials", name: "Built for OneLaser", text: "Rotaries, fume extraction, optics and laser-ready materials tested for OneLaser machines.", image: "home-product-vertigo-scene.webp", to: "/collections/accessories", view: "/collections/accessories", viewLabel: "Explore Accessories and Materials",
    picks: ["piburn-omni-for-onelaser", "filtrabox-micro", "1-8-glitter-acrylic-sheets-12-12-4-pack-for-laser-engraving-cutting", "makerdepot-1-0mm-no-foam-leatherette-sheets-12-20-5-pack-for-laser-engraving-cutting"] },
];

// TODO(team): confirm each promise with the boss before launch.
export const benefits = [
  ["30-Day Easy Returns", "Shop with confidence."],
  ["3-2-1 Warranty", "3-year mechanical, 2-year electrical, 1-year optics on X Series and Hydra."],
  ["U.S.-Based Support", "Talk to real laser engineers."],
  ["Official Accessories", "Tested for OneLaser machines."],
  ["Secure Payment", "Encrypted checkout."],
];

export const faq = [
  ["What is the return policy?", "OneLaser offers 30-day easy returns. See the Refund Policy on 1laser.com for conditions."],
  ["What warranty is included?", "X Series (XRF, XT) and Hydra: 3-year mechanical parts, 2-year electrical components, 1-year optics and laser source. Cobra: 1-year mechanical and electrical (optical lenses not covered). VertiGo: 1-year mechanical and electrical, 6-month laser source, 1-month lens and mirror."],
  ["Where can I get help choosing?", "Book a free sales consultation call or contact U.S.-based support from the Support page."],
];

// Product-page "Don't Miss Top Accessories", by machine family. TODO(team): confirm compatibility per model.
const common = ["lightburn-software-pro-license-key", "engineer-1-on-1-training-support"];
export const addOns = {
  xrf: ["onelaser-x-series-riser-base", "onelaser-automatic-conveyor-feeder", "multi-function-rotary-axis-57-motor", "filtrabox-micro", ...common],
  vertigo: ["filtrabox-micro", ...common],
  cobra: ["onelaser-industrial-chiller-for-hydra-laser-engraver", "multi-function-rotary-axis-57-motor", "piburn-omni-for-onelaser", "filtrabox-compact-x", ...common],
  hydra: ["multi-function-rotary-axis-57-motor", "piburn-omni-for-onelaser", "filtrabox-compact-x", "2-inch-focal-lens-laser-engraver", ...common],
};


/* ---------- Home, Insta360-style (2026-11-17) ---------- */
export const homeFeaturedMachines = [
  { handle: "onelaser-xrf-desktop-laser-machine", description: "38W RF desktop laser.", badge: "Best Seller" },
  { handle: "cobra-8-90w-co2-laser-engraver-cutter", description: "90W CO₂ workshop laser.", badge: "NEW" },
  { handle: "hydra-7-gen-2-70w-rf-co2-dual-laser-machine", description: "70W air-cooled RF laser." },
  { handle: "vertigo-vertical-laser-engraver", description: "Vertical laser for drinkware." },
];

export const homeShopCategories = [
  { label: "Accessories", types: ["Rotary Attachments", "Fume Extractors"], image: "hot-piburn.jpg", to: "/collections/accessories" },
  { label: "Materials", types: ["Acrylic Sheets", "Leatherette"], image: "material-acrylic.webp", to: "/collections/materials" },
];

export const newHandles = ["onelaser-xrf-desktop-laser-machine", "vertigo-vertical-laser-engraver"];
export const homeFeature = { title: "Hydra 9 Gen2", text: ["70W RF + CO₂ dual laser.", "Save up to $3,000 this Black Friday."], image: "promo-hydra9.jpg", to: "/products/hydra-9-gen-2-70w-rf-co2-dual-laser-machine" };
export const interests = [
  ["Wood décor", "home-project-walnut-mountain-wall.webp", "/collections/hydra-gen2"],
  ["Leather goods", "home-project-batch-leather-gifts.webp", "/collections/xrf-series"],
  ["Acrylic signs", "home-project-large-acrylic-sign.webp", "/collections/cobra-series"],
  ["Drinkware", "home-project-vertigo-corporate-tumbler-batch.webp", "/collections/vertigo"],
  ["Weddings & events", "home-project-etsy-wedding-welcome-suite.webp", "/collections/machines"],
  ["Acrylic sheets", "material-acrylic.webp", "/collections/acrylic"],
  ["Leatherette", "material-leather.webp", "/collections/leatherette"],
];
// TODO(team): replace with real customer stories and links once marketing supplies them.
export const homeStories = [
  ["XRF 38W: an RF laser for the desktop", "Air-cooled RF, true 3G acceleration and a 0.07 mm laser spot.", "hot-xrf.jpg", "/products/onelaser-xrf-desktop-laser-machine"],
  ["Hydra Gen2: RF precision at industrial scale", "70W RF Pro or 38W RF + glass-tube Hybrid configurations.", "hot-hydra7.jpg", "/collections/hydra-gen2"],
  ["Cobra Series: workshop cutting power", "90W to 130W glass CO₂ for wood, acrylic and leather.", "hot-cobra8.jpg", "/collections/cobra-series"],
  ["VertiGo: built for drinkware", "Built-in vertical rotary. No setup, no alignment.", "hot-vertigo.jpg", "/products/vertigo-vertical-laser-engraver"],
  ["PiBurn OMNI: rotary engraving", "Roller and chuck modes with two drive systems and two motors.", "hot-piburn.jpg", "/products/piburn-omni-for-onelaser"],
];

// Home video module. Lists supplied by the team on 2026-11-18; titles and channels read from YouTube. [id, title, channel]
// The brand, TV, news and trade-show videos play in the home credibility block; this module keeps the machine videos.
export const homeVideos = [
  { label: "XRF", items: [
    ["RxgWwJg5kAk", "Behind The Maker Ep. 001 | Holly Whiteside", "OneLaser"],
    ["jNaj50MkKiE", "I Was Wrong About the One Laser X Desktop Laser", "Make or Break Shop"],
    ["zHtW_nGm19U", "Pro Desktop Laser at a Budget Price - OneLaser X Series Review", "Make or Break Shop"],
    ["r5m8As2oOJ4", "Hobby Laser vs. OneLaser XRF: Does Speed Actually Matter?", "OneLaser"],
    ["j0WL-yfH3wE", "OneLaser XRF Overview | The Best Budget Friendly Desktop RF Laser", "ESENTL LASERHYDE"],
  ] },
  { label: "Hydra", items: [
    ["y0YUu-4rx7A", "Should You Get an Industrial Size Laser?", "Make or Break Shop"],
    ["HhpgAgg2ZCs", "My Biggest Regret After a Year With the OneLaser Hydra...", "OneLaser"],
    ["HdP62cQVzs0", "The Machine Behind His Best-Selling Maps | OneLaser Hydra 16 Testimonial", "OneLaser"],
    ["Fqtlsk_NsKM", "Is the OneLaser Hydra 13 Worth It? A Pottery Owner's Honest Review", "OneLaser"],
    ["mUyYcwdeC1g", "Year review ONELaser Hydra 9", "Ash&Ember Woodshop"],
    ["vf5KO_kGgmU", "How We Built The Fast & Furious Supra Interior (And How We Do It Now)", "OneLaser"],
    ["sJx0-QZcXWo", "Onelaser Hydra 9 | Ultimate Setup Guide", "Rise N Grind Workshop"],
  ] },
  { label: "VertiGo", items: [
    ["CwMCGw1aPTA", "Vertigo is the World's BEST Tumbler Machine", "LensDigital"],
    ["G9fXsZAbUXs", "If You Sell Tumblers, Buy This Laser", "Make or Break Shop"],
  ] },
  { label: "Cobra", items: [
    ["fdmr7l_crhI", "Perfecting Leatherette Hat Patches with the OneLaser Cobra 10 & XRF RF Tube", "ESENTL LASERHYDE"],
    ["F1ZJvoeANgk", "Meet the COBRA™: Official Product Tour & Launch Announcement", "OneLaser"],
    ["UxN-bVOpAKg", "I Spent 10 Years Evaluating Lasers—Here's Why I Chose the Cobra", "OneLaser"],
  ] },
];

// Home machine proof points (after the Build quality block on thunderlaserusa.com). Machine performance only:
// warranty, training and support are covered by the "OneLaser Standard" block with the headquarters photo.
// Every figure is taken from the official product pages on 1laser.com (see src/data/stories.json). [figure, title, text]
/* Why OneLaser cards: each figure next to the same spec on a typical 55W glass-tube desktop CO2 laser, taken from OneLaser's
   published side-by-side (XRF vs a typical 55W glass-tube desktop laser: 6,000–8,000 h water-cooled tube, 600 mm/s,
   12-month main parts / 6-month tube warranty). "Up to 4x detail" is OneLaser's own product-page claim. Years at 8 h a day. */
export const homeProof = [
  { figure: "30,000 h", title: "Laser tube life", times: "About 4x", us: 100, them: 27, usLabel: "30,000 h · air-cooled", themLabel: "6,000–8,000 h · water-cooled", meaning: "At 8 hours a day that is about 10 years of work. A typical glass tube needs replacing every 2–3 years." },
  { figure: "2,000 mm/s", title: "Engraving speed", times: "Over 3x", us: 100, them: 30, usLabel: "2,000 mm/s · Hydra Gen2", themLabel: "600 mm/s", meaning: "Big batches finish sooner, so you can take larger orders and still ship on time." },
  { figure: "2,000 DPI", title: "Engraving detail", times: "Up to 4x", us: 100, them: 25, usLabel: "0.07 mm RF laser dot", themLabel: "Glass-tube beam", meaning: "Small text, photos and logos come out crisp, so fewer pieces end up remade." },
  { figure: "3 years", title: "Warranty on mechanical parts", times: "3x", us: 100, them: 33, usLabel: "3-2-1 warranty · X Series and Hydra", themLabel: "12 months main parts · 6 months tube", meaning: "Longer cover means fewer surprise repair bills over the years you own it." },
];

// Home buying FAQ (after "Questions? Answers." on thunderlaserusa.com). Answers restate the policies and pages on 1laser.com.
export const homeFaq = [
  ["Which machine is right for me?", "Answer the six questions in “Find your machine” above, compare every model side by side, or schedule a call with a OneLaser engineer."],
  ["What warranty is included?", "X Series (XRF, XT) and Hydra: 3-year mechanical parts, 2-year electrical components, 1-year optics and laser source. Cobra: 1-year mechanical and electrical (optical lenses not covered). VertiGo: 1-year mechanical and electrical, 6-month laser source, 1-month lens and mirror."],
  ["Can I return a machine?", "OneLaser offers 30-day easy returns. See the Refund Policy on 1laser.com for conditions."],
  ["Is financing available?", "Yes. OneLaser works with Shop Pay Installments, Affirm and ClickLease. Rates and terms depend on the lender's approval."],
  ["Which software does it work with?", "OneLaser machines work with LightBurn, MakerBoost AI and RDWorks on Windows and macOS."],
  ["How does support work after I buy?", "You talk to U.S.-based engineers who have built, tuned and repaired these machines. Contact them from the Support page."],
  ["How much is shipping?", "The shipping rate and delivery estimate are shown at checkout once you enter your address. See the Shipping Policy for details."],
];

// Home owner reviews. Real reviews copied word for word (shortened only with "…") from the Judge.me widgets on the 1laser.com
// product pages, read 2026-11-18. verified = Judge.me "verified buyer" flag. Rating = review-weighted average of the four machines
// that have reviews: XRF 4.94 (49), Hydra 9 4.89 (19), XT 4.89 (18), Hydra 16 5.00 (4). The Gen2, Cobra and VertiGo pages have none yet.
export const homeReviews = {
  average: "4.92", count: 90, url: "https://www.1laser.com/pages/testimonials",
  items: [
    { name: "Thomas M Eichhorn", product: "XRF 38W", date: "May 2026", verified: true, text: "I absolutely love this laser. And for the record, I have four other lasers, none of which are OneLasers. If I had the funds, I would replace several of the other lasers I have with OneLasers. Tech support is fantastic and quick to respond, material quality is great." },
    { name: "Chris Vaughn", product: "Hydra 9", date: "May 2025", verified: false, text: "Finally got to use my glass tube (100w) in my Hydra 9 today! Man what a difference it makes when cutting! So much faster and reliable to cut! Really stoked on my purchase with this machine" },
    { name: "James Kirk", product: "XRF 38W", date: "Jun 2026", verified: true, text: "I started out with a Full Spectrum K40 style, upgraded to a GlowForge, dabbled with some blue diode lasers, but the XRF is amazing. Smooth, solid, relatively quiet, accurate. I love it! Puts the joy back into creating." },
    { name: "Emily R.", product: "Hydra 16", date: "Mar 2025", verified: false, text: "Needed a laser that could keep up with my growing business, and this one delivers. The airflow control makes a huge difference, no more annoying burn marks. Super happy with it!" },
    { name: "Jack Anderson", product: "XT", date: "Mar 2025", verified: false, text: "The magnetic lens assembly is a lifesaver! Cleaning the lens takes seconds, and the autofocus nails precision every time. The 12x24\" bed handles large plywood cuts smoothly. Perfect for small shops needing pro results without the hassle!" },
  ],
};

// Trustpilot snapshot for the "Read all reviews" dialog. Read from https://www.trustpilot.com/review/1laser.com on 2026-11-18.
// score, count and the star distribution are the real profile figures (all ratings). `items` is a selection of the recent 4 and
// 5-star reviews, copied word for word; long ones are cut at a sentence end and marked with "…". Refresh this by hand from time to time.
export const trustpilot = {
  url: "https://www.trustpilot.com/review/1laser.com", score: "4.2", count: 86, asOf: "Nov 18, 2026",
  stars: [[5, 65], [4, 6], [3, 4], [2, 6], [1, 5]],
  items: [
    { name: "Jason Olsen", rating: 5, date: "May 21, 2026", verified: true, title: "Everything from sales (Lex answered all…", text: "Everything from sales (Lex answered all of my questions over the phone before I purchased) to technical support! Tech support is not only here in America but the team is dedicated and passionate and it shows! Tech support either picks up and answers, or calls me right back, typically within an hour. They helped walk me through setting up my new XRF and navigation of LightBurn which helped get me up in running fast! I also absolutely love the new XRF laser too! It runs about 4 times faster than my S1 diode laser while engraving hat patches and also shows up way darker on my leather hat patches. …" },
    { name: "Heather", rating: 5, date: "Sep 17, 2026", verified: true, title: "I had been researching lasers for a few…", text: "I had been researching lasers for a few years and was very impressed with the One Laser XRF when it first appeared on the market. Fast forward to 2026 and I finally decided to take the plunge. One Laser has been nothing short of spectacular with any questions or concerns I have. They are top notch and always make me feel important. I’m still learning and have yet to complete my first project but support has been second to none. Thank you One Laser and Murphy (you are amazing!)." },
    { name: "Greg Nelson", rating: 5, date: "Oct 25, 2026", verified: true, title: "1laser is doing things right. Tech support is awesome!!", text: "I was very pleased when I had a tech call with you guys. The tech “ Sean “ was very helpful as I needed help setting up the conveyor/feeder. He was very knowledgeable, helpful and patient with me as I am a newbie. I’m confident that when I need help again I’ll be sure to ask for him. Thanks for the help Sean. Greg" },
    { name: "Joe Mustar", rating: 5, date: "Jul 4, 2026", verified: true, title: "I looked at a lot of desktop Co2…", text: "I looked at a lot of desktop Co2 machines for maybe 6 months. We run 2 diodes and needed to upgrade which supplied the push needed. I settled on the OneLaser XRF after seeing the LA Hobby Guy and Bearded Builds both talk so highly of it. I ordered it and it came within a reasonable amount of time, delivered right to my garage door. After about an hour of reading and assembly of the base the machine was set on it and running. …" },
    { name: "Steve Griggs", rating: 5, date: "Jul 10, 2026", verified: true, title: "Everything related to my XRF has been…", text: "Everything related to my XRF has been great, the minor bumps have been my oversight, fit and finish are excellent, easy to work with and results have been excellent. Definitely recommend this laser, looking forward to seeing the nxt advancement !" },
    { name: "Robert Parkhill", rating: 5, date: "Aug 18, 2026", verified: false, title: "Solid company - great product", text: "I purchased my XRF in May 2026. It arrived as scheduled with only minor issues that were quickly resolved. … DO NOT EXPECT everything to go smoothly. That's unrealistic. No company is perfect but it's obvious this company is working hard to deliver a top experience. Once everything was assembled and the machine was operative, all has gone well. I recommend the company without hesitation. …" },
    { name: "David F", rating: 4, date: "May 14, 2026", verified: true, title: "Why I bought the XRF and my first experiences", text: "There are a few things that brought me to ordering the OneLaser XRF. 1) the RF CO2 laser 2) Desk top size 3) The bed size 4) Speed. … I like having the RF tube because I'm able to run the laser at higher power and not having any water cooling. The laser dot size is actually better than my diode laser. … There does remain one issue that I am having with the auto focus. … In all, I am pleased with the function of the laser." },
    { name: "Evan Neal", rating: 5, date: "May 14, 2026", verified: true, title: "The team helped me get a replacement…", text: "The team helped me get a replacement part, even through I bought the machine secondhand. I really appreciate it!" },
    { name: "Edoardo DEPINE Poffo", rating: 5, date: "Jun 9, 2026", verified: true, title: "Great customer support.", text: "Great customer support. They provide instructions in videos and photos on how to troubleshoot the issues. Strongly recommend the brand." },
    { name: "Mark Lee", rating: 5, date: "Aug 14, 2026", verified: true, title: "First class experience", text: "First class experience. Not sure what you are paying Murphy, but he deserves a raise!" },
    { name: "Guills785", rating: 5, date: "Nov 2, 2026", verified: true, title: "No doubt this have to be one of the…", text: "No doubt this have to be one of the best laser in the market for sure . I don't regret it one second." },
    { name: "Josia Timothy", rating: 5, date: "Apr 20, 2026", verified: false, title: "Highly recommended", text: "The customer service was great and being able to chat to someone before buying was even better!" },
  ],
};

// Home "Built for every ambition": Makers / Business / Education, as on www.1laser.com (kicker, heading, the three panel texts and
// images are the official ones, read 2026-11-18). Each segment adds YouTube videos found the same day; titles and channels as published.
// videos: [id, title, channel, what it shows, machine]
const IND = "https://www.1laser.com/cdn/shop/files/home-industry-";
export const homeAmbition = {
  kicker: "Built for every ambition", title: "Different goals. A clearer machine path.",
  text: "Choose the environment that looks most like yours, then explore the OneLaser path designed around it.",
  cta: ["Let's Talk with Our Experts", "/pages/sales-consultation"],
  segments: [
    {
      label: "Makers", title: "Turn ideas into finished objects.", image: `${IND}makers-v3.webp?v=1788447362`,
      text: "Move from one-off experiments to polished gifts, home décor, signs, and personal work with a machine matched to the projects you actually want to make.",
      videos: [
        ["0gGxQMZZhOs", "How To Make Leather Patch Hats", "Wrico Goods", "Leather patch hats", "Hydra 9"],
        ["vBxXG9vpgIQ", "Laser ideas to make and sell online", "Peachy Creations", "Products to sell online", "XRF"],
        ["27nhcSEJkso", "Laser Engraving Multicam American Flag Patches", "Us2a Apparel", "Flag patches", "XRF"],
        ["LG3wz6y-tOE", "Engraving Bamboo Cutting Board in the OneLaser XRF 38W", "Peachy Creations", "Cutting boards", "XRF"],
        ["RxgWwJg5kAk", "Behind The Maker Ep. 001 | Holly Whiteside", "OneLaser", "Maker story", "XRF"],
        ["yoV9mOGnW-8", "First attempt at a Rubber Stamp on a Laser", "Peachy Creations", "Rubber stamps", "XRF"],
        ["RMR_8i4D5n8", "How to Engrave Tumblers with PiGrip2 on the OneLaser XRF", "NTX Laser Engraving & Prints", "Tumblers", "XRF"],
      ],
    },
    {
      label: "Business", title: "Build a workflow you can repeat.", image: `${IND}business-v3.webp?v=1788447362`,
      text: "Choose the right platform for personalization, broader catalogs, repeat orders, and dependable daily production—without pretending every shop needs the same machine.",
      videos: [
        ["WD5has9K3IY", "This Firefighter Made A Six Figure Business With A Laser", "OneLaser", "Six-figure laser business", "OneLaser"],
        ["HdP62cQVzs0", "The Machine Behind His Best-Selling Maps", "OneLaser", "Best-selling maps", "Hydra 16"],
        ["Fqtlsk_NsKM", "Is the OneLaser Hydra 13 Worth It? A Pottery Owner's Honest Review", "OneLaser", "Pottery studio", "Hydra 13"],
        ["godnvdc7raE", "Making 5' Store Signs with the OneLaser Hydra 16", "Maker Foundry", "Store signs", "Hydra 16"],
        ["vf5KO_kGgmU", "How We Built The Fast & Furious Supra Interior", "Stitchcraft Interiors", "Car interiors", "OneLaser"],
        ["sk-OcNSGa1o", "Running Small Production of Tumblers on the OneLaser Hydra 7", "Woodwork by Allan", "Tumbler production", "Hydra 7"],
        ["wdxvI3lI0Bg", "How VertiGo™ Pays for Itself — ROI Explained", "LensDigital", "Tumbler business ROI", "VertiGo"],
        ["MHP87JAPBc8", "Why did they buy a Hydra 9??? | Hooks Design Co", "Bearded Builds Co", "Design shop", "Hydra 9"],
      ],
    },
    {
      label: "Education", title: "Make learning tangible.", image: `${IND}education-v3.webp?v=1788447362`,
      text: "Bring prototyping, design, and hands-on STEM work into classrooms, labs, and maker spaces with training and support close at hand.",
      // No classroom videos featuring OneLaser were found on YouTube; these are the training videos a class would start with.
      videos: [
        ["EszLHwtuEUw", "Why Your Laser Engraving Looks Terrible (And How to Fix It!)", "OneLaser", "Engraving settings", "OneLaser"],
        ["R8uQVpeXr34", "LightBurn Material Test Card | OneLaser XRF Desktop", "OneLaser", "Material testing", "XRF"],
        ["nKiR0tltDNA", "OneLaser XRF Simple Maintenance Guide", "OneLaser", "Maintenance", "XRF"],
        ["bEAKhA2Wjj4", "OneLaser VertiGo: Step by Step Panel Tutorial", "OneLaser", "Control panel", "VertiGo"],
        ["onc1Xx2wrb8", "Perfect Laser Project Alignment Every Time – Score Mark Method in LightBurn", "Wrico Goods", "Alignment", "OneLaser"],
        ["-Xmny42Ubmo", "What's Inside the ONELASER XRF?", "OneLaser", "How it works", "XRF"],
      ],
    },
  ],
};
