import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { asset, byHandle, img, money, products, frontImg } from "../lib.js";
import { contact, footer, heroSlides, homeAmbition, homeFaq, homeProof, homeReviews, homeStandard, homeTabs, trustpilot, newHandles, promo, shortSlogans } from "../data/site.js";
import { AddButton, Countdown, Icon, Link, useDragScroll } from "../components/ui.jsx";
import FinderCard, { FinderHelp } from "../components/Finder.jsx";

/* Module order, sizes and type follow the insta360.com homepage (measured 2026-11-17 at 1440 and 375):
   full-bleed hero 660 with segmented progress → headline + sticky pill tabs + 3-column product cards (416×554, radius 24)
   → feature banner 480 → Shop by interest (310×480 tiles) → two half cards 640×480 → image banner 480
   → story carousel (864×486) → business band 376 → four support tiles 240. 64px gutters, 64px between blocks.
   Typeface is Poppins, as on Insta360. Only the brand red is OneLaser's own (Insta360 uses yellow). */

const SLIDE_MS = 10000;

/* Insta360's hero has "Buy now" + "Learn more", both leading to the same page. Here the second button does something else:
   a product slide adds that product to the cart (first available option, stays on the page); a series slide opens the comparison. */
function HeroButtons({ s, tab }) {
  const product = s.to.startsWith("/products/") ? byHandle[s.to.slice(10)] : null;
  return (
    <div className="ih-btns">
      <Link to={s.to} className="ih-btn light" tabIndex={tab}>{product ? t("Buy now") : t("Shop now")}</Link>
      {product && product.available ? (
        <AddButton product={product} className="ih-btn ghost" drop="down" iconSize={18} />
      ) : (
        <Link to="/compare" className="ih-btn ghost" tabIndex={tab}>{t("Compare models")}</Link>
      )}
    </div>
  );
}

/** Background clip for a hero slide: loads and plays only while its slide is showing, rewinds when it leaves. */
function HeroVideo({ src, poster, active }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    const v = ref.current;
    if (!v || still) return;
    if (active) v.play().catch(() => {});
    else { v.pause(); try { v.currentTime = 0; } catch { /* not loaded yet */ } }
  }, [active, still]);
  if (still) return null;
  return <video ref={ref} className={ready ? "ready" : ""} src={active || ready ? src : undefined} poster={poster} muted loop playsInline preload="none" onPlaying={() => setReady(true)} aria-hidden="true" />;
}

/** Muted YouTube clip over a hero slide. The frame stays invisible until the player itself reports "playing" (state 1) through the
    IFrame API messages, so a blocked or sign-in-walled player never shows; the slide's own video or image stays in view instead. */
function HeroYouTube({ id, start = 0, active }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!active) { setPlaying(false); return undefined; }
    const onMessage = (e) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname) || e.source !== ref.current?.contentWindow) return;
      let data;
      try { data = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      const state = data?.info?.playerState;
      if (state === 1) setPlaying(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [active]);
  if (still || !active) return null;
  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&start=${start}&playsinline=1&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  const listen = () => ref.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
  return (
    <div className={`ih-yt${playing ? " ready" : ""}`} aria-hidden="true">
      <iframe ref={ref} src={src} title="" tabIndex={-1} allow="autoplay; encrypted-media" onLoad={() => { listen(); setTimeout(listen, 600); setTimeout(listen, 1500); }} />
    </div>
  );
}

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  /* Only rotate slides and run the slide videos while the banner is on screen. A YouTube player that starts or loops
     can make Chrome scroll the page back up to its frame, so off screen the frame is not mounted at all. */
  const box = useRef(null);
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    const el = box.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (paused || !seen) return undefined;
    const t = setTimeout(() => setI((n) => (n + 1) % heroSlides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, paused, seen]);
  // Finger swipe (phones and tablets): a mostly horizontal move of 40px or more changes the slide; vertical moves still scroll the page.
  const touch = useRef(null);
  const n = heroSlides.length;
  const onTouchStart = (e) => { const p = e.touches[0]; touch.current = { x: p.clientX, y: p.clientY }; setPaused(true); };
  const onTouchEnd = (e) => {
    const s = touch.current; touch.current = null; setPaused(false);
    if (!s) return;
    const p = e.changedTouches[0]; const dx = p.clientX - s.x; const dy = p.clientY - s.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2) setI((k) => (k + (dx < 0 ? 1 : n - 1)) % n);
  };
  return (
    <section ref={box} className="ih-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => { touch.current = null; setPaused(false); }} aria-roledescription="carousel">
      {heroSlides.map((s, n) => (
        <article key={s.title} className={`ih-slide${n === i ? " on" : ""}`} aria-hidden={n !== i}>
          <img src={asset(s.image)} alt="" />
          {s.video && <HeroVideo src={/^https?:/.test(s.video) ? s.video : asset(s.video)} poster={asset(s.image)} active={n === i && seen} />}
          {s.youtube && <HeroYouTube id={s.youtube} start={s.start} active={n === i && seen} />}
          <div className="ih-slide-copy">
            <p className="ih-top">{t(s.eyebrow)}</p>
            <h1>{t(s.title)}</h1>
            <p className="ih-slogan">{t(s.text)}</p>
            <HeroButtons s={s} tab={n === i ? 0 : -1} />
          </div>
        </article>
      ))}
      <button type="button" className="ih-hero-arrow prev" aria-label={t("Previous slide")} onClick={() => setI((i + heroSlides.length - 1) % heroSlides.length)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16 5L9 12L16 19" stroke="white" strokeWidth="2.5" strokeLinejoin="round" /></svg>
      </button>
      <button type="button" className="ih-hero-arrow next" aria-label={t("Next slide")} onClick={() => setI((i + 1) % heroSlides.length)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5L15 12L8 19" stroke="white" strokeWidth="2.5" strokeLinejoin="round" /></svg>
      </button>
      <div className="ih-pages">
        {heroSlides.map((s, n) => (
          <button key={s.title} type="button" aria-label={`Slide ${n + 1}: ${s.title}`} className={n === i ? "on" : ""} onClick={() => setI(n)}>
            <em>{t(s.title)}</em>
            <i><span style={n === i ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined} /></i>
          </button>
        ))}
      </div>
    </section>
  );
}

/* Insta360's card has "Learn more" + "Buy now", both leading to the product page. Here the left control adds to the cart instead:
   it adds the first available option (the one the product page preselects), stays on the page and confirms for a moment. */
// Monthly figure = price ÷ 24, the same "24-month payment" 1laser.com shows on its product pages ($4,399 → $183.29/mo.).
// It is an illustration, not an offer: the real rate and term depend on the lender's approval.
const FINANCE_MONTHS = 24;

function HomeCard({ p }) {
  return (
    <article className="ih-card">
      <div className="ih-card-info">
        {newHandles.includes(p.handle) && <span className="ih-new">{t("NEW")}</span>}
        <h3><Link to={`/products/${p.handle}`}>{p.name}</Link></h3>
        <p>{t(shortSlogans[p.handle] || p.tagline)}</p>
      </div>
      <Link to={`/products/${p.handle}`} className="ih-card-media" tabIndex={-1} aria-hidden="true"><img src={img(frontImg(p), 700)} alt="" loading="lazy" className={p.kind === "machine" ? "front" : undefined} /></Link>
      <p className="ih-card-price">
        {p.priceVaries && <span>{t("From")}</span>}
        <b>{money(p.price)}</b>
        {p.compareAt > p.price && <s>{money(p.compareAt)}</s>}
        {p.compareAt > p.price && <em>{t("Save")} {money(p.compareAt - p.price)}</em>}
      </p>
      {p.kind === "machine" && (
        <p className="ih-card-monthly">{t("or")} <b>${(p.price / FINANCE_MONTHS).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>{t("/mo for 24 months")}</p>
      )}
      <div className="ih-card-btns">
        <AddButton product={p} className="ih-btn line sm" />
        <Link to={`/products/${p.handle}`} className="ih-btn dark sm">{t("Buy now")}</Link>
      </div>
    </article>
  );
}

function ProductBlock() {
  const tabsRef = useDragScroll({ wheel: true });
  const [ti, setTi] = useState(0);
  const tab = homeTabs[ti];
  const machines = !!tab.picks; // the finder only belongs with the machine tabs
  useEffect(() => {
    const back = () => setTi((n) => (homeTabs[n].picks ? n : 0));
    window.addEventListener("onelaser:finder", back);
    return () => window.removeEventListener("onelaser:finder", back);
  }, []);
  const list = (tab.picks ? tab.picks.map((h) => byHandle[h]) : products.filter((p) => p.category === tab.collection || (tab.collection === "materials" && p.kind === "material"))).filter(Boolean).slice(0, 6);
  return (
    <section className="ih-products">
      <div className="ih-wrap"><h2 className="ih-h2 narrow">{t("Laser machines for makers and growing businesses.")}</h2></div>
      <div className="ih-sticky">
        <div className="ih-wrap">
          <div className="ih-tabs" role="tablist" ref={tabsRef}>
            {homeTabs.map((x, n) => <button key={x.label} type="button" role="tab" aria-selected={n === ti} className={n === ti ? "on" : ""} onClick={() => setTi(n)}>{t(x.label)}</button>)}
          </div>
        </div>
      </div>
      <div className="ih-wrap">
        {tab.note && <p className="ih-tab-note" key={`n${ti}`}>{t(tab.note)} · {t("from")} <b>{money(Math.min(...list.map((p) => p.price)))}</b></p>}
        <div className="ih-grid" key={ti}>
          <div className="ih-row">
            {list.slice(0, machines ? 4 : 6).map((p) => (
              <HomeCard key={p.handle} p={p} />
            ))}
          </div>
          {machines && <FinderCard />}
        </div>
        {machines && <div id="fc-result" />}
        <div className="ih-viewall"><Link to={tab.all}>{t("View all")}</Link></div>
        {machines && <FinderHelp />}
      </div>
    </section>
  );
}

/* Video module: pill tabs per product line, one large player on the left and the rest of the list on the right.
   Clicking a row loads it into the player; nothing from YouTube loads until a video is played (privacy-enhanced embed). */
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hq720.jpg`;
const thumbFallback = (e, id) => { if (!e.target.dataset.fb) { e.target.dataset.fb = 1; e.target.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; } };

/* Trust strip right above the videos: four facts, each a door to its proof. All real:
   Judge.me owner rating (homeReviews), U.S. company (homeStandard), 3-2-1 warranty on XRF + Hydra and 30-day returns
   (homeFaq), FOX & Discovery coverage (the OneLaser videos below). */
const TRUST_ICONS = {
  star: <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  shield: <><path d="M12 3.5 19 6v5.5c0 4.3-3 7.7-7 9-4-1.3-7-4.7-7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  tv: <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="m10.5 8.8 4 2.2-4 2.2zM8 20.5h8" /></>,
};
/* Judge.me averages per product page (read 2026-11-18, as in site.js homeReviews): the 4.92 is review-weighted across these. */
const faqText = (q) => homeFaq.find(([k]) => k.startsWith(q))?.[1] || "";

/** One dialog per trust fact or promise, so visitors stay on the home page; each ends with a link to the full page.
    Everything shown is real: Judge.me averages, homeStandard, footer contacts, homeFaq answers, the training product,
    the financing options and OneLaser's own videos. The payment figure is a plain estimate, marked as such. */
const DLG_HEAD = {
  reviews: ["star", "Owner reviews"], company: ["flag", "U.S. company"], warranty: ["shield", "Warranty and returns"],
  returns: ["refresh", "Worried about choosing wrong?"], support: ["headset", "Stuck on a job?"], training: ["user", "First laser?"],
  financing: ["card", "Budget tight?"], fox: ["tv", "TV feature"],
};
const FIN_MACHINES = ["onelaser-xrf-desktop-laser-machine", "cobra-10-100w-co2-laser-engraver-cutter", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "hydra-16-gen-2-70w-rf-co2-dual-laser-machine"];
const perMonth = (amount, apr, n) => { const r = apr / 1200; return r ? (amount * r) / (1 - (1 + r) ** -n) : amount / n; };
const Faces = () => <span className="tdlg-faces" aria-hidden="true">{[1, 2, 3].map((n) => <img key={n} src={asset(`team-${n}.jpg`)} alt="" />)}</span>;

function TrustDialog({ kind, onClose, onTrustpilot }) {
  const [film, setFilm] = useState(false);
  const [clip, setClip] = useState(PRESS[0]);
  const [fin, setFin] = useState({ h: FIN_MACHINES[2], n: 36 });
  const quotes = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const More = ({ href, to, ghost, children }) => (href ? <Link href={href} className={`tdlg-more${ghost ? " ghost" : ""}`}>{children} <Icon name="arrow" size={16} /></Link> : <Link to={to} className={`tdlg-more${ghost ? " ghost" : ""}`}>{children} <Icon name="arrow" size={16} /></Link>);
  const Head = ({ title, sub }) => {
    const [icon, kicker] = DLG_HEAD[kind];
    return (
      <header className="tdlg-head">
        <span className="tdlg-head-ico">{TRUST_ICONS[icon] ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{TRUST_ICONS[icon]}</svg> : <Icon name={icon} size={26} />}</span>
        <p className="tdlg-kicker">{t(kicker)}</p>
        <h3>{title}</h3>
        {sub && <p className="tdlg-sub">{sub}</p>}
      </header>
    );
  };
  const Contacts = () => (
    <ul className="tdlg-contact">
      {footer.contact.map(([label, value, href]) => <li key={label}><a href={href}><Icon name={/^tel:/.test(href) ? "phone" : "mail"} size={20} /><span><b>{value}</b><small>{t(label)}</small></span></a></li>)}
    </ul>
  );
  let body;
  if (kind === "finder") {
    body = (
      <>
        <div className="tdlg-finder"><FinderCard modal /></div>
        <div id="fc-result-modal" className="tdlg-finder-result" />
      </>
    );
  } else if (kind === "reviews") {
    body = (
      <>
        <Head title={<span className="tdlg-score"><b>{homeReviews.average}</b><span className="tdlg-stars" aria-hidden="true">★★★★★</span></span>} sub={`${t("Average of")} ${homeReviews.count} ${t("owner reviews on 1laser.com product pages (Judge.me).")}`} />
        <div className="tdlg-qhead"><b>{t("In their words")}</b><span><button type="button" aria-label={t("Previous")} onClick={() => quotes.current?.scrollBy({ left: -300, behavior: "smooth" })}><Icon name="chevron" size={16} /></button><button type="button" aria-label={t("Next")} onClick={() => quotes.current?.scrollBy({ left: 300, behavior: "smooth" })}><Icon name="chevron" size={16} /></button></span></div>
        <ul className="tdlg-quotes row" ref={quotes}>
          {homeReviews.items.map((r) => <li key={r.name}><span className="tdlg-stars sm" aria-hidden="true">★★★★★</span><p>“{r.text}”</p><small>{r.name} · {r.product} · {r.date}</small></li>)}
        </ul>
        <div className="tdlg-links">
          <More href={homeReviews.url}>{t("Read all owner reviews")}</More>
          <button type="button" className="tdlg-more ghost" onClick={onTrustpilot}>{t("Trustpilot")}: {trustpilot.score} · {trustpilot.count} {t("reviews")} <Icon name="arrow" size={16} /></button>
        </div>
      </>
    );
  } else if (kind === "company") {
    body = (
      <>
        <div className={`tdlg-photo${film ? " film" : ""}`}>
          {film ? embed(...BRAND_FILM) : (
            <>
              <img src={img(homeStandard.image, 1400)} alt={t("OneLaser headquarters in the United States")} />
              <button type="button" className="icred-film" onClick={() => setFilm(true)}>
                <i aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg></i>
                <span><small>{t("Brand film")}</small><b>{t("What makes OneLaser different")}</b></span>
              </button>
            </>
          )}
        </div>
        <Head title={t("A U.S. company you can reach")} sub={t(homeStandard.text)} />
        <div className="tdlg-team"><Faces /><span><b>{t("Real people, ready to help you compare machines and plan your next step.")}</b></span></div>
        <ul className="tdlg-points two">{homeStandard.points.map(([h, x]) => <li key={h}><Icon name="check" size={18} /><span><b>{t(h)}</b>{t(x)}</span></li>)}</ul>
        <p className="tdlg-addr"><Icon name="pin" size={18} /><span><b>{t("Headquarters")}</b>{footer.address}</span></p>
        <Contacts />
        <div className="tdlg-links"><More href="https://www.1laser.com/pages/about-us">{t("About OneLaser")}</More></div>
      </>
    );
  } else if (kind === "warranty") {
    body = (
      <>
        <Head title={t("Covered after you buy")} />
        <div className="tdlg-timeline">
          {[[3, "years mechanical", "Frame, motion system and mechanical parts"], [2, "years electrical", "Power, control board and electronics"], [1, "year optics", "Lenses, mirrors and optical parts"]].map(([n, l, x]) => (
            <div key={l}><b>{n}</b><span><strong>{t(l)}</strong><small>{t(x)}</small></span><i><em style={{ width: `${(n / 3) * 100}%` }} /></i></div>
          ))}
          <p>{t("Covers XRF and Hydra machines. Other products follow the official warranty policy.")}</p>
        </div>
        <div className="tdlg-cards"><section><b className="tdlg-big">30</b><p className="tdlg-days">{t("day returns")}</p><p>{t(faqText("Can I return"))}</p></section>
          <section><Faces /><p className="tdlg-days">{t("U.S.-based support")}</p><p>{t(faqText("How does support"))}</p></section></div>
        <div className="tdlg-links">
          <More href="https://www.1laser.com/pages/warranty-policy">{t("Warranty policy")}</More>
          <More href="https://www.1laser.com/pages/refund-policy" ghost>{t("Refund policy")}</More>
        </div>
      </>
    );
  } else if (kind === "returns") {
    body = (
      <>
        <Head title={t("Use it on real jobs first")} />
        <ol className="tdlg-steps">
          <li><b>1</b><span><strong>{t("Order your machine")}</strong><small>{t("Pay in full, or spread the cost with financing.")}</small></span></li>
          <li><b>2</b><span><strong>{t("Put it to work")}</strong><small>{t("Run real jobs on your own materials.")}</small></span></li>
          <li><b>3</b><span><strong>{t("Not right? Return it within 30 days")}</strong><small>{t(faqText("Can I return"))}</small></span></li>
        </ol>
        <div className="tdlg-callout"><Faces /><span><b>{t("Want to pick right the first time?")}</b><small>{t("Not sure it is the right machine? A free call with a laser expert before you order is the surest way to pick right.")}</small></span></div>
        <div className="tdlg-links">
          <More to="/pages/sales-consultation">{t("Book a free call")}</More>
          <More href="https://www.1laser.com/pages/refund-policy" ghost>{t("Refund policy")}</More>
        </div>
      </>
    );
  } else if (kind === "support") {
    const tr = byHandle["engineer-1-on-1-training-support"];
    body = (
      <>
        <Head title={t("Real people who know these machines")} sub={t(faqText("How does support"))} />
        <div className="tdlg-team"><Faces /><span><b>{t("U.S.-based support")}</b><small>{t("Talk to real laser engineers.")}</small></span></div>
        <Contacts />
        {tr && (
          <div className="tdlg-upsell">
            <img src={img(tr.images[0], 300)} alt="" />
            <span><b>{t("One hour, one engineer, your machine")}</b><small>{money(tr.price)}{tr.compareAt > tr.price && <s>{money(tr.compareAt)}</s>}</small></span>
            <AddButton product={tr} className="ih-btn line sm" drop="up" />
          </div>
        )}
        <div className="tdlg-links">
          <More href="https://zohodesk.1laser.com/portal/en/newticket">{t("Open a support ticket")}</More>
          <More href="https://wiki.1laser.com" ghost>{t("Product knowledge base")}</More>
        </div>
      </>
    );
  } else if (kind === "training") {
    const p = byHandle["engineer-1-on-1-training-support"];
    body = (
      <>
        <div className="tdlg-train">
          {p && <div className="tdlg-train-pic"><img src={img(p.images[0], 1000)} alt="" /></div>}
          <div className="tdlg-train-body">
            <p className="tdlg-kicker">{t("First laser?")}</p>
            <h3>{t("One hour, one engineer, your machine")}</h3>
            <p className="tdlg-chips"><span><Icon name="clock" size={16} />{t("1 hour")}</span><span><Icon name="calendar" size={16} />{t("Live video")}</span><span><Icon name="user" size={16} />{t("One-on-one")}</span></p>
            <p className="tdlg-sub">{t("A 1-hour live video session with an experienced OneLaser technician: machine assembly, software setup and troubleshooting, so you start cutting and engraving faster and avoid costly mistakes.")}</p>
            <ul className="tdlg-train-points">{["Machine assembly", "Software setup", "Troubleshooting", "Fine-tuning your workflow"].map((x) => <li key={x}><Icon name="check" size={16} />{t(x)}</li>)}</ul>
            {p && <div className="tdlg-train-buy">
              <p className="tdlg-price"><b>{money(p.price)}</b>{p.compareAt > p.price && <><s>{money(p.compareAt)}</s><em>{t("Save")} {money(p.compareAt - p.price)}</em></>}</p>
              <div className="tdlg-links">
                <AddButton product={p} className="tdlg-more" drop="up" />
                <More to={`/products/${p.handle}`} ghost>{t("Full details")}</More>
              </div>
            </div>}
          </div>
        </div>
      </>
    );
  } else if (kind === "financing") {
    const m = byHandle[fin.h];
    const pay = m ? perMonth(m.price, 15, fin.n) : 0;
    body = (
      <>
        <Head title={t("Spread the cost four ways")} />
        <div className="tdlg-calc">
          <label><span>{t("Machine")}</span><select value={fin.h} onChange={(e) => setFin((f) => ({ ...f, h: e.target.value }))}>{FIN_MACHINES.map((h) => byHandle[h] && <option key={h} value={h}>{byHandle[h].name} · {money(byHandle[h].price)}</option>)}</select></label>
          <div className="tdlg-seg">{[12, 24, 36, 60].map((n) => <button key={n} type="button" className={fin.n === n ? "on" : ""} onClick={() => setFin((f) => ({ ...f, n }))}>{n} {t("mo")}</button>)}</div>
          <p className="tdlg-pay"><b>{money(Math.round(pay))}</b><span>/{t("mo")}</span><small>{t("Estimate at 15% APR. Your rate is set by the lender.")}</small></p>
        </div>
        <ul className="tdlg-fin">
          <li><b>{t("OneLaser Subsidy Loan")}</b><span>{t("$0 down, first 3 months payment-free, up to 60 months.")}</span></li>
          <li><b>{t("First Citizens Bank")}</b><span>{t("Equipment finance for established businesses.")}</span></li>
          <li><b>{t("Shop Pay Installments")}</b><span>{t("3, 6 or 12 monthly payments, chosen at checkout.")}</span></li>
          <li><b>ClickLease</b><span>{t("Lease to own, $0 down, approval in minutes.")}</span></li>
        </ul>
        <div className="tdlg-links"><More to={`/pages/financing?p=${fin.h}`}>{t("Compare all financing options")}</More></div>
      </>
    );
  } else {
    body = (
      <>
        <div className="tdlg-video"><iframe key={clip[0]} src={`https://www.youtube-nocookie.com/embed/${clip[0]}?autoplay=1&rel=0`} title={clip[2]} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /></div>
        <Head title={t(clip[2])} />
        <ul className="tdlg-clips">
          {PRESS.map((c) => (
            <li key={c[0]}><button type="button" className={c[0] === clip[0] ? "on" : ""} onClick={() => setClip(c)}>
              <img src={thumb(c[0])} onError={(e) => thumbFallback(e, c[0])} alt="" /><span><small>{t(c[1])}</small><b>{t(c[2])}</b></span>
            </button></li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <div className="tdlg-scrim" onClick={onClose}>
      <div className={`tdlg tdlg-${kind}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tdlg-x" aria-label={t("Close")} onClick={onClose}><Icon name="close" size={20} /></button>
        {body}
      </div>
    </div>
  );
}


/* Credibility: who stands behind the machine. Real material only: the U.S. headquarters photo and points (homeStandard),
   and OneLaser's own brand film, TV, news and trade-show videos, each playing right where it is clicked. */
const PRESS = [
  ["seseyuxIZt4", "TV feature", "As seen on FOX & Discovery"],
  ["8tn7O69iCnQ", "FOX News", "Picked as a best holiday DIY gift"],
  ["KAtO7_wkmMk", "Trade show", "APA Show 2025, International Personalization Expo"],
  ["waBw5gDMPIM", "Conference", "Hands-on at the Next Level Maker Conference"],
];
const BRAND_FILM = ["_dv0xXmHSiA", "Engineered in the USA: What Makes OneLaser Different"];
const embed = (id, title) => <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />;
function Credibility() {
  const [playing, setPlaying] = useState(null); // one video plays at a time, right where it was clicked
  return (
    <section className="ih-block icred">
      <div className="ih-wrap">
        <p className="icred-kicker">{t("Who stands behind your machine")}</p>
        <h2 className="ih-h2 narrow">{t("Headquartered in California, with a team you can actually reach.")}</h2>
        <div className="icred-grid">
          <figure className={`icred-hq${playing === BRAND_FILM[0] ? " playing" : ""}`}>
            {playing === BRAND_FILM[0] ? embed(...BRAND_FILM) : (
              <>
                <img src={img(homeStandard.image, 1200)} alt={t("OneLaser headquarters in the United States")} loading="lazy" />
                <button type="button" className="icred-film" onClick={() => setPlaying(BRAND_FILM[0])}>
                  <i aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg></i>
                  <span><small>{t("Brand film")}</small><b>{t("What makes OneLaser different")}</b></span>
                </button>
              </>
            )}
            {playing !== BRAND_FILM[0] && <figcaption>
              <b>{t("OneLaser headquarters, USA")}</b>
              <ul>{homeStandard.points.filter((_, n) => n !== 2).map(([h]) => <li key={h}><Icon name="check" size={16} />{t(h)}</li>)}</ul>
            </figcaption>}
          </figure>
          <ul className="icred-press">
            {PRESS.map(([id, tag, title]) => (
              <li key={id}>
                <div className={`icred-tile${playing === id ? " playing" : ""}`}>
                  {playing === id ? <span className="icred-thumb">{embed(id, title)}</span> : (
                    <button type="button" className="icred-thumb" onClick={() => setPlaying(id)} aria-label={`${t("Play video")}: ${t(title)}`}>
                      <img src={thumb(id)} onError={(e) => thumbFallback(e, id)} alt="" loading="lazy" /><i aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg></i>
                    </button>
                  )}
                  <span className="icred-text"><small>{t(tag)}</small><b>{t(title)}</b></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* "Built for every ambition" (official heading and segment copy) with a pill switch for Makers / Business / Education.
   Each segment is one full-bleed row: an intro card with the official photo and copy, then that segment's videos, which open
   in a dialog on this page. */
function Makers({ sub = false }) {
  const [seg, setSeg] = useState(0);
  const [open, setOpen] = useState(null);
  const row = useDragScroll();
  const slide = (dir) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: "smooth" });
  useEffect(() => { row.current?.scrollTo({ left: 0 }); }, [seg]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);
  const A = homeAmbition;
  const cur = A.segments[seg];
  return (
    <section className={sub ? "iu iu-sub" : "ih-block iu"}>
      <div className="ih-wrap">
        {sub ? (
          <h3 className="iu-subhead">{t("What they make with it")}</h3>
        ) : (
          <>
            <p className="ist-kicker">{t(A.kicker)}</p>
            <div className="ip2-head">
              <h2 className="ih-h2">{t(A.title)}</h2>
              <p>{t(A.text)}</p>
            </div>
          </>
        )}
        <div className="iu-bar">
          <div className="iu-seg" role="tablist">
            {A.segments.map((g, n) => <button key={g.label} type="button" role="tab" aria-selected={n === seg} className={n === seg ? "on" : ""} onClick={() => setSeg(n)}>{t(g.label)}</button>)}
          </div>
          <div className="ih-arrows">
            <button type="button" aria-label={t("Previous")} onClick={() => slide(-1)}><Icon name="chevron" size={18} /></button>
            <button type="button" aria-label={t("Next")} onClick={() => slide(1)}><Icon name="chevron" size={18} /></button>
          </div>
        </div>
      </div>
      <div className="ih-scroller iu-row" ref={row} key={seg}>
        <Link to={A.cta[1]} className="iu-intro">
          <img src={img(cur.image, 1000)} alt="" loading="lazy" />
          <span><small>{t(cur.label)}</small><b>{t(cur.title)}</b><em>{t(cur.text)}</em><i>{t(A.cta[0])} ›</i></span>
        </Link>
        {cur.videos.map(([id, title, channel, what, machine]) => (
          <button key={id} type="button" className="iu-card" onClick={() => setOpen([id, title])} aria-label={`${t("Play video")}: ${title}`}>
            <span className="iu-thumb">
              <img src={thumb(id)} onError={(e) => thumbFallback(e, id)} alt="" loading="lazy" />
              <i aria-hidden="true" />
              <em>{machine}</em>
            </span>
            <span className="iu-what">{t(what)}</span>
            <b>{title}</b>
            <small>{channel}</small>
          </button>
        ))}
      </div>
      {open && (
        <div className="is-modal" role="dialog" aria-modal="true" aria-label={open[1]} onClick={() => setOpen(null)}>
          <button type="button" aria-label={t("Close video")}>×</button>
          <div onClick={(e) => e.stopPropagation()}>
            <iframe src={`https://www.youtube-nocookie.com/embed/${open[0]}?autoplay=1&rel=0`} title={open[1]} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          </div>
        </div>
      )}
    </section>
  );
}

/** "Read all reviews": the Trustpilot profile figures and a selection of reviews in a dialog, so the visitor stays on the page. */
function ReviewsDialog({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const tp = trustpilot;
  const Stars = ({ n }) => <span className="tp-stars" aria-label={`${n} / 5`}>{[1, 2, 3, 4, 5].map((k) => <i key={k} className={k <= n ? "on" : ""}>★</i>)}</span>;
  return (
    <div className="tp-scrim" onClick={onClose}>
      <div className="tp-dialog" role="dialog" aria-modal="true" aria-label={t("Reviews on Trustpilot")} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tp-close" aria-label={t("Close")} onClick={onClose}><Icon name="close" size={22} /></button>
        <header className="tp-head">
          <div>
            <p className="tp-kicker">{t("Reviews on Trustpilot")}</p>
            <p className="tp-score"><b>{tp.score}</b><span>/ 5</span><Stars n={Math.round(Number(tp.score))} /></p>
            <p className="tp-count">{t("TrustScore")} · {tp.count} {t("reviews")} · {tp.asOf}</p>
          </div>
          <ul className="tp-bars">
            {tp.stars.map(([n, c]) => <li key={n}><span>{n}★</span><i><b style={{ width: `${(c / tp.count) * 100}%` }} /></i><em>{c}</em></li>)}
          </ul>
        </header>
        <p className="tp-note">{t("Showing a selection of our 4 and 5-star reviews.")}</p>
        <div className="tp-list">
          {tp.items.map((r) => (
            <article key={r.name}>
              <Stars n={r.rating} />
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              <footer><b>{r.name}</b><span>{r.date}</span></footer>
            </article>
          ))}
        </div>
        <p className="tp-foot"><Link href={tp.url}>{t("See all reviews on Trustpilot")} ↗</Link></p>
      </div>
    </div>
  );
}

/* Why OneLaser, against the category most first-time buyers compare with. Category traits only (no brand named);
   diode light passes through clear acrylic, so diode lasers cannot cut it. OneLaser figures are from the catalog. */
const COMPARE = [
  ["Laser source", "CO₂ glass tube or RF metal tube", "Semiconductor diode"],
  ["Laser power", "38W to 150W", "Usually under 40W"],
  ["Cuts clear acrylic", true, false],
  ["Engraves glass, stone and coated metal", true, "Limited"],
  ["Engraving speed", "Up to 2,000 mm/s (Hydra Gen2)", "Usually much slower"],
  ["RF tube life", "Up to 30,000 h, air-cooled (XRF, Hydra)", "—"],
  ["Support and warranty", "U.S. engineers · 3-2-1 warranty (XRF, Hydra)", "Varies by brand"],
];
const tick = (v) => (v === true ? <span className="icmp-yes"><Icon name="check" size={18} />{t("Yes")}</span> : v === false ? <span className="icmp-no">✕ {t("No")}</span> : t(v));

/* Ownership promises, each one a door to the policy or service behind it. Copy speaks to the buyer's worry first. */
const PROMISES = [ // [icon, worry, promise, link label, dialog]
  ["refresh", "Worried about choosing wrong?", "30-day returns. Use it on real jobs first.", "Refund policy", "returns"],
  ["shield", "Something breaks?", "3-2-1 warranty on XRF and Hydra: 3 years mechanical, 2 electrical, 1 optics.", "Warranty policy", "warranty"],
  ["headset", "Stuck on a job?", "Call U.S. engineers who build, tune and repair these machines.", "Contact support", "support"],
  ["user", "First laser?", "One-on-one training, so you are not figuring it out alone.", "1-on-1 training", "training"],
  ["card", "Budget tight?", "$0-down business financing and installments at checkout.", "See financing", "financing"],
];


/* Featured owner quotes: one sentence each, word for word, from the real Judge.me reviews in homeReviews. They rotate every
   few seconds (paused while the pointer or focus is on them, and not at all with reduced motion); the dots pick one. */
const QUOTES = [
  ["James Kirk", "I started out with a Full Spectrum K40 style, upgraded to a GlowForge, dabbled with some blue diode lasers, but the XRF is amazing."],
  ["Thomas M Eichhorn", "If I had the funds, I would replace several of the other lasers I have with OneLasers."],
  ["Chris Vaughn", "So much faster and reliable to cut! Really stoked on my purchase with this machine."],
  ["Emily R.", "Needed a laser that could keep up with my growing business, and this one delivers."],
  ["Thomas M Eichhorn", "Tech support is fantastic and quick to respond, material quality is great."],
  ["Jack Anderson", "The magnetic lens assembly is a lifesaver!"],
].map(([name, q]) => ({ q, ...homeReviews.items.find((r) => r.name === name) }));

function QuoteReel() {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setTimeout(() => setI((n) => (n + 1) % QUOTES.length), 5500);
    return () => clearTimeout(id);
  }, [i, hold]);
  const r = QUOTES[i];
  return (
    <blockquote className="iowners-quote" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)} aria-live="polite">
      <div className="iowners-q" key={i}>
        <p>“{t(r.q)}”</p>
        <footer><b>{r.name}</b> · {r.product}</footer>
      </div>
      <div className="iowners-dots" role="tablist" aria-label={t("Owner quotes")}>
        {QUOTES.map((x, n) => <button key={n} type="button" role="tab" aria-selected={n === i} aria-label={`${n + 1} / ${QUOTES.length}`} className={n === i ? (hold ? "on held" : "on") : ""} onClick={() => setI(n)}><i /></button>)}
      </div>
    </blockquote>
  );
}

export default function Home() {
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [dlg, setDlg] = useState(null); // promise / next-step dialogs, so the visitor stays on the home page
  const rv = useDragScroll();
  const rvSlide = (dir) => rv.current?.scrollBy({ left: dir * rv.current.clientWidth * 0.8, behavior: "smooth" });
  const toFinder = () => {
    window.dispatchEvent(new Event("onelaser:finder")); // switches the product tabs back to a machine tab
    setTimeout(() => document.querySelector(".fx")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };
  return (
    <div className="ih">
      <Hero />
      <ProductBlock />

      <Credibility />

      {/* Owners: real words on top, what they make below */}
      <section className="ih-block irv iowners">
        <div className="ih-wrap">
          <p className="ist-kicker">{t("Real owner reviews")}</p>
          <div className="irv-head">
            <h2 className="ih-h2">{t("Don't take our word for it. Hear it from owners.")}</h2>
            <button type="button" className="irv-score" onClick={() => setReviewsOpen(true)}>
              <span className="irv-stars" aria-hidden="true">★★★★★</span>
              <b>{homeReviews.average}</b>
              <em>{t("out of 5")} · {homeReviews.count} {t("machine reviews")}</em>
            </button>
          </div>
          <QuoteReel />
          <div className="ih-arrows irv-arrows">
            <button type="button" aria-label={t("Previous")} onClick={() => rvSlide(-1)}><Icon name="chevron" size={16} /></button>
            <button type="button" aria-label={t("Next")} onClick={() => rvSlide(1)}><Icon name="chevron" size={16} /></button>
          </div>
        </div>
        <div className="ih-scroller irv-row" ref={rv}>
            {[...homeReviews.items, ...trustpilot.items.map((r) => ({ ...r, product: "Trustpilot" }))].map((r) => (
              <figure key={r.product + r.name}>
                <span className="irv-stars" aria-label={`${r.rating || 5} / 5`}>{"★".repeat(r.rating || 5)}</span>
                <blockquote>“{r.text}”</blockquote>
                <figcaption><b>{r.name}</b><span>{r.product} · {r.date}</span></figcaption>
              </figure>
            ))}
        </div>
        <div className="ih-wrap">
          <p className="fd-links"><button type="button" onClick={() => setReviewsOpen(true)}>{t("Read all reviews")} ›</button><Link href={trustpilot.url}>{t("See us on Trustpilot")} ›</Link></p>
          {reviewsOpen && <ReviewsDialog onClose={() => setReviewsOpen(false)} />}
        </div>
        <Makers sub />
      </section>

      {/* Why OneLaser: the numbers, then an honest comparison with the category most buyers weigh us against */}
      <section className="ih-block ip2 iwhy">
        <div className="ih-wrap">
          <p className="ist-kicker">{t("Why OneLaser")}</p>
          <div className="ip2-head">
            <h2 className="ih-h2">{t("Faster, steadier, and dependable day after day.")}</h2>
            <p>{t("What decides whether a laser keeps running job after job, year after year.")}</p>
          </div>
          <div className="ip2-grid">
            {homeProof.map((x) => (
              <article key={x.figure}>
                <div className="ip2-top"><em>{t(x.times)}</em><b>{x.figure}</b></div>
                <h3>{t(x.title)}</h3>
                <dl className="ip2-vs">
                  <div className="me"><dt>OneLaser</dt><dd><i><u style={{ width: `${x.us}%` }} /></i><span>{t(x.usLabel)}</span></dd></div>
                  <div><dt>{t("Typical glass-tube laser")}</dt><dd><i><u style={{ width: `${x.them}%` }} /></i><span>{t(x.themLabel)}</span></dd></div>
                </dl>
                <p><strong>{t("For you:")}</strong> {t(x.meaning)}</p>
              </article>
            ))}
          </div>
          <p className="ip2-note">{t("Compared with the published specs of a typical 55W glass-tube desktop CO2 laser. Years estimated at 8 hours a day. Bars are for illustration.")}</p>
          <div className="icmp">
            <h3>{t("OneLaser or a typical desktop diode laser?")}</h3>
            <div className="icmp-scroll">
              <table>
                <thead><tr><th /><th className="me">OneLaser</th><th>{t("Typical diode laser")}</th></tr></thead>
                <tbody>{COMPARE.map(([k, ours, theirs]) => <tr key={k}><th>{t(k)}</th><td className="me">{tick(ours)}</td><td>{tick(theirs)}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="icmp-note">{t("Category traits in general; individual models vary. OneLaser figures are from our product specs.")} <Link to="/compare">{t("Compare every OneLaser spec")} ›</Link></p>
          </div>
        </div>
      </section>

      {/* Ownership: five promises, each one opens the policy or service behind it */}
      <section className="ih-block iprom">
        <div className="ih-wrap">
          <p className="ist-kicker">{t("After you buy")}</p>
          <h2 className="ih-h2 narrow">{t("If something goes wrong, our U.S. engineers have you covered.")}</h2>
          <ul>
            {PROMISES.map(([icon, worry, promise, label, kind]) => (
              <li key={worry}><button type="button" onClick={() => setDlg(kind)} aria-haspopup="dialog"><span className="iprom-ico"><Icon name={icon} size={24} /></span><b>{t(worry)}</b><p>{t(promise)}</p><em>{t(label)} ›</em></button></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ih-block">
        <div className="ih-wrap">
          <Link href={promo.link} className="ih-banner">
            <img src={asset("home-bf-lineup.jpg")} alt="" loading="lazy" />
            <span className="ih-banner-copy">
              <small>{t(promo.label)}</small>
              <b>{t(promo.headline)}</b>
              <Countdown endsAt={promo.endsAt} />
              <span className="ih-btn light">{t("Learn more")}</span>
            </span>
          </Link>
        </div>
      </section>

      {/* Next step: three ways forward, side by side */}
      <section className="ih-block inext">
        <div className="ih-wrap">
          <h2 className="ih-h2">{t("Ready when you are. Pick your next step.")}</h2>
          <ul>
            <li><button type="button" onClick={() => setDlg("finder")} aria-haspopup="dialog"><span className="inext-top"><span className="inext-ico"><Icon name="search" size={24} /></span><i>{t("6 questions")}</i></span><small>{t("Choose it yourself")}</small><b>{t("Find your machine in 30 seconds")}</b><p>{t("Answer a few questions about your materials and jobs, and get a matched machine.")}</p><em>{t("Start the finder")}<Icon name="chevron" size={16} /></em></button></li>
            <li className="hot"><Link to="/pages/sales-consultation"><span className="inext-top"><span className="inext-ico"><Icon name="calendar" size={24} /></span><i>{t("Free")}</i></span><small>{t("Talk it through")}</small><b>{t("Book a free 30-minute call with a laser expert")}</b><p>{t("Talk through your materials, space and budget before you choose.")}</p><em>{t("Pick a time")}<Icon name="chevron" size={16} /></em></Link></li>
            <li><button type="button" onClick={() => setDlg("financing")} aria-haspopup="dialog"><span className="inext-top"><span className="inext-ico"><Icon name="card" size={24} /></span><i>{t("Estimate")}</i></span><small>{t("Do the math")}</small><b>{t("See your monthly payment")}</b><p>{t("Pick a machine and a term to see a rough monthly payment right away.")}</p><em>{t("Open the estimator")}<Icon name="chevron" size={16} /></em></button></li>
          </ul>
        </div>
      </section>

      <section className="ih-block ifq">
        <div className="ih-wrap">
          <h2 className="ih-h2">{t("Questions? Answers.")}</h2>
          <ul className="iw-faq">
            {homeFaq.map(([q, ans], n) => (
              <li key={q}><details open={n === 0}><summary><span>{t(q)}</span><Icon name="chevron" size={16} /></summary><p>{t(ans)}</p></details></li>
            ))}
          </ul>
          {dlg && <TrustDialog kind={dlg} onClose={() => setDlg(null)} onTrustpilot={() => { setDlg(null); setReviewsOpen(true); }} />}
        </div>
      </section>
    </div>
  );
}
