import { createContext, useContext, useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { asset, byHandle, img, lockScroll, money, frontImg, openMachineFinder } from "../lib.js";
import { contact, footer, heroSlides, homeFaq, homeProof, homeReviews, homeStandard, homeFeaturedMachines, homeShopCategories, trustpilot, promo } from "../data/site.js";
import { AddButton, Countdown, Icon, Link, SpecIcon, useDragScroll } from "../components/ui.jsx";
import FinderCard, { FinderHelp } from "../components/Finder.jsx";

const SLIDE_MS = 10000;

function HeroButtons({ slide }) {
  const product = slide.to?.startsWith("/products/") ? byHandle[slide.to.slice(10)] : null;
  return (
    <div className="ih-btns">
      <Link to={slide.to} href={slide.href} className="ih-btn light">{t(slide.cta)}</Link>
      {product?.available && <AddButton product={product} className="ih-btn ghost" drop="down" iconSize={18} />}
    </div>
  );
}

function HeroVideo({ src, paused }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (paused) video.pause();
    else video.play().catch(() => {});
  }, [paused]);

  return (
    <video ref={ref} src={src} className={ready ? "ready" : undefined} muted loop playsInline preload="none" aria-hidden="true" onPlaying={() => setReady(true)} />
  );
}

function Hero() {
  const [index, setIndex] = useState(0);
  const [motionPaused, setMotionPaused] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [seen, setSeen] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const box = useRef(null);
  const touch = useRef(null);
  const count = heroSlides.length;
  const stopRotation = motionPaused || hovered || focused || touching || !seen || !pageVisible;

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (stopRotation) return undefined;
    const timer = setTimeout(() => setIndex((current) => (current + 1) % count), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, stopRotation, count]);

  const changeSlide = (direction) => setIndex((current) => (current + direction + count) % count);
  const onTouchStart = (event) => {
    const point = event.touches[0];
    touch.current = { x: point.clientX, y: point.clientY };
    setTouching(true);
  };
  const onTouchEnd = (event) => {
    const start = touch.current;
    touch.current = null;
    setTouching(false);
    if (!start) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2) changeSlide(dx < 0 ? 1 : -1);
  };

  return (
    <section
      ref={box}
      className="ih-hero"
      aria-label={t("Homepage highlights")}
      aria-roledescription="carousel"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => setFocused(event.target.matches(":focus-visible"))}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => { touch.current = null; setTouching(false); }}
    >
      <div className="ih-hero-controls">
        <div className="ih-pages">
          {heroSlides.map((slide, position) => (
            <button key={slide.id} type="button" aria-current={position === index ? "true" : undefined} onClick={() => setIndex(position)}>
              <span>{t(slide.tab)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="ih-hero-motion"
          aria-label={t(motionPaused ? "Play banner" : "Pause banner")}
          onClick={() => setMotionPaused((paused) => !paused)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            {motionPaused ? <path d="M5 2.5v11l8-5.5z" /> : <path d="M4 3h2.5v10H4zm5.5 0H12v10H9.5z" />}
          </svg>
        </button>
      </div>
      {heroSlides.map((slide, position) => {
        const current = position === index;
        const Title = position === 0 ? "h1" : "h2";
        return (
          <article key={slide.id} className={`ih-slide ih-slide--${slide.id}${current ? " on" : ""}`} inert={!current} aria-hidden={!current}>
            <div className="ih-slide-media" aria-hidden="true">
              <img src={asset(slide.image)} alt="" fetchPriority={position === 0 ? "high" : undefined} />
              {slide.video && current && seen && <HeroVideo src={asset(slide.video)} paused={motionPaused || !pageVisible} />}
            </div>
            <div className="ih-slide-copy">
              <p className="ih-top">{t(slide.eyebrow)}</p>
              <Title className="ih-slide-title">{t(slide.title)}</Title>
              <p className="ih-slogan">{t(slide.text)}</p>
              <HeroButtons slide={slide} />
            </div>
          </article>
        );
      })}
      <button type="button" className="ih-hero-arrow prev" aria-label={t("Previous slide")} onClick={() => changeSlide(-1)}>
        <Icon name="chevron" size={23} />
      </button>
      <button type="button" className="ih-hero-arrow next" aria-label={t("Next slide")} onClick={() => changeSlide(1)}>
        <Icon name="chevron" size={23} />
      </button>
    </section>
  );
}

const FINANCE_MONTHS = 24;

function HomeCard({ product, description, badge }) {
  const { handle, name, price, compareAt, priceVaries } = product;
  const productPath = `/products/${handle}`;
  const savings = compareAt - price;
  const monthly = (price / FINANCE_MONTHS).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <article className="ih-card">
      {badge && <span className="ih-new">{t(badge)}</span>}
      <div className="ih-card-info">
        <h3><Link to={productPath}>{name}</Link></h3>
        <p>{t(description)}</p>
      </div>
      <Link to={productPath} className="ih-card-media" tabIndex={-1} aria-hidden="true">
        <img src={img(frontImg(product), 700)} alt="" loading="lazy" className="front" />
      </Link>
      <p className="ih-card-price">
        {priceVaries && <span>{t("From")}</span>}
        <b>{money(price)}</b>
        {savings > 0 && <><s>{money(compareAt)}</s><span className="ih-card-break" aria-hidden="true" /><em>{t("Save")} {money(savings)}</em></>}
      </p>
      <p className="ih-card-monthly">{t("or")} <b>${monthly}</b>{t("/mo for 24 months")}</p>
      <div className="ih-card-btns">
        <AddButton product={product} className="ih-btn line sm" />
        <Link to={productPath} className="ih-btn dark sm">{t("Learn more")}</Link>
      </div>
    </article>
  );
}

function FeaturedMachines() {
  return (
    <section className="ih-products ih-wrap" aria-labelledby="featured-machines-title">
      <h2 className="ih-h2" id="featured-machines-title">{t("Choose a machine for your work")}</h2>
      <div className="ih-grid">
        <div className="ih-row">
          {homeFeaturedMachines.map(({ handle, description, badge }) => {
            const product = byHandle[handle];
            return product && <HomeCard key={handle} product={product} description={description} badge={badge} />;
          })}
        </div>
      </div>
    </section>
  );
}

function MachineFinder() {
  return (
    <section className="ih-block ih-finder ih-wrap" id="machine-finder" aria-labelledby="machine-finder-title">
      <h2 className="ih-h2" id="machine-finder-title">{t("Find your machine")}</h2>
      <p className="ih-finder-intro">{t("Answer a few questions about your materials and jobs, and get a matched machine.")}</p>
      <FinderCard />
      <FinderHelp />
    </section>
  );
}

function ShopCategories() {
  return (
    <section className="ih-block ih-wrap" aria-labelledby="home-shop-title">
      <h2 className="ih-h2" id="home-shop-title">{t("Accessories")} &amp; {t("Materials")}</h2>
      <ul className="ih-shop-categories">
        {homeShopCategories.map(({ label, types, image, to }) => (
          <li key={label}>
            <Link to={to}>
              <img src={asset(image)} alt="" loading="lazy" />
              <div className="ih-shop-copy">
                <h3>{t(label)}</h3>
                <span>{types.map((type) => t(type)).join(" · ")}</span>
                <b>{t("Shop now")} <Icon name="chevron" size={16} /></b>
              </div>
            </Link>
          </li>
        ))}
      </ul>
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

/** Phone sheets: drag down from the top (sheet scrolled to its top) to close; a short drag springs back. */
function useSwipeClose(onClose) {
  const st = useRef(null);
  return {
    onTouchStart: (e) => { const el = e.currentTarget; st.current = el.scrollTop <= 0 ? { y: e.touches[0].clientY, el, dy: 0 } : null; },
    onTouchMove: (e) => {
      const s = st.current; if (!s) return;
      s.dy = Math.max(0, e.touches[0].clientY - s.y);
      if (s.dy > 0 && s.el.scrollTop <= 0) { s.el.style.transition = "none"; s.el.style.transform = `translateY(${s.dy}px)`; }
    },
    onTouchEnd: () => {
      const s = st.current; st.current = null; if (!s) return;
      s.el.style.transition = "transform .25s ease"; s.el.style.transform = "";
      if (s.dy > 110) onClose();
    },
  };
}

function TrustDialog({ kind, onClose, onTrustpilot }) {
  const [film, setFilm] = useState(false);
  const [clip, setClip] = useState(PRESS[0]);
  const [fin, setFin] = useState({ h: FIN_MACHINES[2], n: 36 });
  const quotes = useRef(null);
  const swipe = useSwipeClose(onClose);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => { window.removeEventListener("keydown", onKey); unlock(); };
  }, [onClose]);
  const More = ({ href, to, ghost, children }) => (href ? <Link href={href} className={`tdlg-more${ghost ? " ghost" : ""}`}>{children} <Icon name="arrow" size={16} /></Link> : <Link to={to} className={`tdlg-more${ghost ? " ghost" : ""}`}>{children} <Icon name="arrow" size={16} /></Link>);
  const Head = ({ title, sub }) => {
    const [, kicker] = DLG_HEAD[kind];
    return (
      <header className="tdlg-head">
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
  if (kind === "reviews") {
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
          {[[3, "years mechanical", "Frame, motion system and mechanical parts"], [2, "years electrical", "Power, control board and electronics"], [1, "year optics", "Optical components and laser source parts"]].map(([n, l, x]) => (
            <div key={l}><b>{n}</b><span><strong>{t(l)}</strong><small>{t(x)}</small></span><i><em style={{ width: `${(n / 3) * 100}%` }} /></i></div>
          ))}
          <p>{t("X Series (XRF, XT) and Hydra machines.")}</p>
        </div>
        <div className="tdlg-terms">
          <div><b>Cobra</b><span>{t("1 year on mechanical and electrical parts. Optical lenses are not covered.")}</span></div>
          <div><b>VertiGo</b><span>{t("1 year on mechanical and electrical parts, 6 months on the laser source, 1 month on lens and mirror.")}</span></div>
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
      <div className={`tdlg tdlg-${kind}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} {...swipe}>
        <span className="tdlg-grab" aria-hidden="true" />
        <button type="button" className="tdlg-x" aria-label={t("Close")} onClick={onClose}><Icon name="close" size={20} /></button>
        {body}
      </div>
    </div>
  );
}


/* Press and brand-film clips, shown in the company and FOX dialogs. Real OneLaser videos only. */
const PRESS = [
  ["seseyuxIZt4", "TV feature", "As seen on FOX & Discovery"],
  ["8tn7O69iCnQ", "FOX News", "Picked as a best holiday DIY gift"],
  ["KAtO7_wkmMk", "Trade show", "APA Show 2025, International Personalization Expo"],
  ["waBw5gDMPIM", "Conference", "Hands-on at the Next Level Maker Conference"],
];
const BRAND_FILM = ["_dv0xXmHSiA", "Engineered in the USA: What Makes OneLaser Different"];
const embed = (id, title) => <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />;
/* Video wall: one large player and a list of OneLaser's own clips (brand film, TV, news, trade show, conference).
   Picking a clip loads it into the player and plays it there; nothing leaves the page. */
const CLIPS = [[BRAND_FILM[0], "Brand film", "What makes OneLaser different"], ...PRESS];
function Credibility() {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [id, tag, title] = CLIPS[cur];
  const pick = (n) => { setCur(n); setPlaying(true); };
  return (
    <section className="ih-block icred">
      <div className="ih-wrap">
        <p className="icred-kicker">{t("Who stands behind your machine")}</p>
        <h2 className="ih-h2 narrow">{t("A real U.S. company, seen on TV.")}</h2>
        <div className="icv">
          <div className="icv-main">
            <div className="icv-player">
              {playing ? embed(id, title) : (
                <button type="button" onClick={() => setPlaying(true)} aria-label={`${t("Play video")}: ${t(title)}`}>
                  <img src={cur === 0 ? img(homeStandard.image, 1400) : thumb(id)} onError={(e) => thumbFallback(e, id)} alt="" loading="lazy" />
                  <span className="icv-play" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg></span>
                </button>
              )}
            </div>
            <p className="icv-meta"><small>{t(tag)}</small><b>{t(title)}</b></p>
          </div>
          <ol className="icv-list">
            {CLIPS.map(([cid, ctag, ctitle], n) => (
              <li key={cid}>
                <button type="button" className={n === cur ? "on" : ""} aria-current={n === cur ? "true" : undefined} onClick={() => pick(n)}>
                  <span className="icv-thumb"><img src={thumb(cid)} onError={(e) => thumbFallback(e, cid)} alt="" loading="lazy" />{n === cur && playing ? <em>{t("Playing")}</em> : <i aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg></i>}</span>
                  <span className="icv-text"><small>{t(ctag)}</small><b>{t(ctitle)}</b></span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** "Read all reviews": the Trustpilot profile figures and a selection of reviews in a dialog, so the visitor stays on the page. */
function ReviewsDialog({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => { window.removeEventListener("keydown", onKey); unlock(); };
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


/* Ownership promises, each one a door to the policy or service behind it. Copy speaks to the buyer's worry first. */
/* spec-plate labels per promise: [section code, figure] */
const PROMISE_SPEC = { returns: ["Returns", "30 days"], warranty: ["Warranty", "3·2·1"], support: ["Support", "U.S."], training: ["Training", "1:1"] };
const PROMISES = [ // [icon, worry, promise, link label, dialog]
  ["refresh", "Worried about choosing wrong?", "30-day returns. Use it on real jobs first.", "Refund policy", "returns"],
  ["shield", "Something breaks?", "3-2-1 warranty on X Series and Hydra: 3 years mechanical, 2 electrical, 1 optics and laser source.", "Warranty policy", "warranty"],
  ["headset", "Stuck on a job?", "Call U.S. engineers who build, tune and repair these machines.", "Contact support", "support"],
  ["user", "First laser?", "One-on-one training, so you are not figuring it out alone.", "1-on-1 training", "training"],
];


// The front row covers the machine families represented in the collected product reviews.
const OWNER_REVIEWS = [
  ...homeReviews.items.map((review) => ({ ...review, source: "Judge.me" })),
  ...trustpilot.items.map((review) => ({ ...review, source: "Trustpilot" })),
].filter(({ productHandle }) => byHandle[productHandle]);

function ReviewStars({ rating }) {
  return (
    <span className="irv-stars" role="img" aria-label={`${rating} / 5`}>
      <span aria-hidden="true">{"★".repeat(rating)}<span className="irv-stars-empty">{"★".repeat(5 - rating)}</span></span>
    </span>
  );
}

function OwnerReviewDetail({ review, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    return lockScroll();
  }, []);

  const product = byHandle[review.productHandle];
  const fromTrustpilot = review.source === "Trustpilot";
  const sourceUrl = fromTrustpilot ? trustpilot.url : `${product.sourceUrl}#judgeme_product_reviews`;
  const sourceLabel = fromTrustpilot ? "See all reviews on Trustpilot" : "Read all owner reviews";

  return (
    <dialog
      ref={dialogRef}
      className="irv-detail"
      aria-labelledby="irv-detail-name"
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
    >
      <div className="irv-detail-content">
        <button type="button" className="irv-detail-close" aria-label={t("Close")} onClick={() => dialogRef.current.close()}><Icon name="close" size={20} /></button>
        <h3 id="irv-detail-name">{review.name}</h3>
        <ReviewStars rating={review.rating} />
        <p className="irv-meta">{review.source} · {review.date}</p>
        <blockquote>“{review.text}”</blockquote>
        <Link href={sourceUrl}>{t(sourceLabel)} <Icon name="arrow" size={16} /></Link>
      </div>
    </dialog>
  );
}

function OwnerReviews({ onReadAll }) {
  const row = useDragScroll();
  const [bounds, setBounds] = useState({ start: true, end: false });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const list = row.current;
    const update = () => {
      const start = list.scrollLeft < 2;
      const end = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
      setBounds((previous) => previous.start === start && previous.end === end ? previous : { start, end });
    };
    update();
    list.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", update);
    };
  }, [row]);

  const move = (direction) => {
    const list = row.current;
    const [first, second] = list.children;
    if (!second) return;
    const left = direction * (second.offsetLeft - first.offsetLeft);
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    list.scrollBy({ left, behavior });
  };

  return (
    <section className="ih-block irv" aria-labelledby="owner-reviews-title">
      <div className="ih-wrap irv-head">
        <h2 className="ih-h2" id="owner-reviews-title">{t("Hear it from owners.")}</h2>
        <div className="irv-tools">
          <button type="button" className="irv-score" aria-haspopup="dialog" onClick={onReadAll}>
            <span className="irv-score-number"><span aria-hidden="true">★</span> <b>{homeReviews.average}</b> <small>{t("out of 5")}</small></span>
            <span className="irv-score-total">{homeReviews.count} {t("machine reviews")} · Judge.me</span>
          </button>
          <div className="ih-arrows irv-arrows">
            <button type="button" aria-label={t("Previous")} aria-controls="owner-reviews-list" disabled={bounds.start} onClick={() => move(-1)}><Icon name="chevron" size={16} /></button>
            <button type="button" aria-label={t("Next")} aria-controls="owner-reviews-list" disabled={bounds.end} onClick={() => move(1)}><Icon name="chevron" size={16} /></button>
          </div>
        </div>
      </div>

      <ul className="ih-scroller irv-row" id="owner-reviews-list" role="list" ref={row}>
        {OWNER_REVIEWS.map((review) => {
          const product = byHandle[review.productHandle];
          const initials = review.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
          return (
            <li className="irv-card" key={review.source + review.name}>
              <header className="irv-card-head">
                <div>
                  <h3>{review.name}</h3>
                  <ReviewStars rating={review.rating} />
                  <p className="irv-meta">{review.source} · {review.date}</p>
                </div>
                <span className="irv-avatar" aria-hidden="true">{initials}</span>
              </header>
              <blockquote className="irv-quote">“{review.text}”</blockquote>
              <button type="button" className="irv-read" aria-haspopup="dialog" onClick={() => setSelected(review)}>{t("Read review")}</button>
              <Link to={`/products/${product.handle}`} className="irv-machine">
                <img src={img(frontImg(product), 200)} alt="" width="78" height="52" loading="lazy" draggable={false} />
                <span>{product.name}</span>
                <Icon name="chevron" size={16} />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="ih-wrap irv-footer">
        <button type="button" aria-haspopup="dialog" onClick={onReadAll}>{t("Read all reviews")} <Icon name="arrow" size={16} /></button>
      </div>
      {selected && <OwnerReviewDetail review={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

const ASSURANCES = [
  { kind: "support", icon: "headset", label: "Under 10 minutes", detail: "Typical support response, business hours" },
  { kind: "warranty", icon: "shield", label: "12-month parts warranty", detail: "1 year on every machine" },
  { kind: "shipping", icon: "truck", label: "Fast shipping", detail: "Ships From California", href: "https://www.1laser.com/pages/shipping-policy" },
  { kind: "company", icon: "pin", label: "U.S. company", detail: "Local team for sales and support" },
];

function AssuranceBar({ onOpen }) {
  return (
    <section className="ih-assurance" aria-label={t("Support and warranty")}>
      <ul className="ih-wrap ih-assurance-list">
        {ASSURANCES.map(({ kind, icon, label, detail, href }) => {
          const content = (
            <>
              <span className="ih-assurance-icon"><Icon name={icon} size={22} /></span>
              <span className="ih-assurance-copy">
                <strong>{t(label)}</strong>
                <small>{t(detail)}</small>
              </span>
            </>
          );
          return (
            <li key={kind}>
              {href ? <Link href={href}>{content}</Link> : (
                <button type="button" aria-haspopup="dialog" onClick={() => onOpen(kind)}>{content}</button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* Why OneLaser cards animate when they scroll into view (and again on each later visit): figures count up, bars grow. */
const SeenCtx = createContext(false);
// Confetti bits thrown out from each multiple badge as it pops: fixed angles and distances, five brand colours.
const BADGE_BITS = Array.from({ length: 16 }, (_, k) => {
  const a = (k / 16) * Math.PI * 2 + (k % 2) * 0.2;
  const r = 34 + (k % 3) * 16;
  return { "--x": `${Math.round(Math.cos(a) * r * 1.4)}px`, "--y": `${Math.round(Math.sin(a) * r)}px`, "--c": ["#e7310e", "#38bdf8", "#fbbf24", "#34d399", "#f472b6"][k % 5], "--r": `${(k * 67) % 360}deg` };
});
function ProofGrid({ children }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setSeen(true); return undefined; }
    // play when a good part of the cards is on screen; reset once they have left the screen, so it plays again next time
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio >= 0.35) setSeen(true); else if (!e.isIntersecting) setSeen(false); }, { threshold: [0, 0.35] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <SeenCtx.Provider value={seen}><div ref={ref} className={`ip2-grid${seen ? " seen" : ""}`}>{children}</div></SeenCtx.Provider>;
}
function CountUp({ text }) {
  const seen = useContext(SeenCtx);
  const [, num, unit] = text.match(/^([\d,]+)\s*(.*)$/) || [null, null, text];
  const target = num ? Number(num.replace(/,/g, "")) : 0;
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!seen || !num) { setV(0); return undefined; }
    const t0 = performance.now(); let raf;
    const tick = (now) => { const k = Math.min(1, (now - t0) / 1400); setV(Math.round(target * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen]);
  if (!num) return t(text);
  return <>{(seen ? v : 0).toLocaleString("en-US")}{unit && <> {t(unit)}</>}</>;
}

export default function Home({ openFinder = false }) {
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [dlg, setDlg] = useState(null); // promise / next-step dialogs, so the visitor stays on the home page
  useEffect(() => {
    if (openFinder) openMachineFinder();
  }, [openFinder]);
  return (
    <div className="ih">
      <Hero />
      <AssuranceBar onOpen={setDlg} />
      <FeaturedMachines />
      <MachineFinder />

      <Credibility />

      <OwnerReviews onReadAll={() => setDlg("reviews")} />
      {reviewsOpen && <ReviewsDialog onClose={() => setReviewsOpen(false)} />}

      {/* Why OneLaser */}
      <section className="ih-block ip2 iwhy">
        <div className="ih-wrap">
          <p className="ist-kicker">{t("Why OneLaser")}</p>
          <div className="ip2-head">
            <h2 className="ih-h2">{t("Faster, steadier, and dependable day after day.")}</h2>
            <p>{t("What decides whether a laser keeps running job after job, year after year.")}</p>
          </div>
          <ProofGrid>
            {homeProof.map((x, n) => (
              <article key={x.figure} style={{ "--n": n }}>
                <div className="ip2-top"><span className="ip2-badge"><em>{t(x.times)}</em><span className="ip2-pop" aria-hidden="true">{BADGE_BITS.map((s, k) => <i key={k} style={s} />)}</span></span><b><CountUp text={x.figure} /></b></div>
                <h3>{t(x.title)}</h3>
                <dl className="ip2-vs">
                  <div className="me"><dt>OneLaser</dt><dd><i><u style={{ width: `${x.us}%` }} /></i><span>{t(x.usLabel)}</span></dd></div>
                  <div><dt>{t("Typical glass-tube laser")}</dt><dd><i><u style={{ width: `${x.them}%` }} /></i><span>{t(x.themLabel)}</span></dd></div>
                </dl>
                <p>{t(x.meaning)}</p>
              </article>
            ))}
          </ProofGrid>
        </div>
      </section>

      {/* Ownership: five promises, each one opens the policy or service behind it */}
      <section className="ih-block iprom">
        <div className="ih-wrap">
          <p className="ist-kicker">{t("After you buy")}</p>
          <h2 className="ih-h2 narrow">{t("U.S. engineers have you covered.")}</h2>
          <ul>
            {PROMISES.map(([icon, worry, promise, label, kind], n) => (
              <li key={worry}><button type="button" className="plate" onClick={() => setDlg(kind)} aria-haspopup="dialog"><span className="spec-idx"><span>{String(n + 1).padStart(2, "0")} / {t(PROMISE_SPEC[kind][0])}</span><span>{t(PROMISE_SPEC[kind][1])}</span></span><SpecIcon name={icon} /><b>{t(worry)}</b><p>{t(promise)}</p><em className="spec-cta">{t(label)}<span aria-hidden="true">↗</span></em></button></li>
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

      <ShopCategories />

      {/* Next step: three ways forward, side by side */}
      <section className="ih-block inext">
        <div className="ih-wrap">
          <h2 className="ih-h2">{t("Your next step.")}</h2>
          <ul>
            <li><button type="button" className="plate" onClick={openMachineFinder}><span className="spec-idx"><span>01 / {t("Finder")}</span><span>{t("4 steps")}</span></span><SpecIcon name="search" /><small>{t("Choose it yourself")}</small><b>{t("Find your machine in 30 seconds")}</b><p>{t("Answer a few questions about your materials and jobs, and get a matched machine.")}</p><em>{t("Start the finder")}<Icon name="chevron" size={16} /></em></button></li>
            <li><Link to="/pages/sales-consultation" className="plate"><span className="spec-idx"><span>02 / {t("Call")}</span><span>{t("Free")}</span></span><SpecIcon name="calendar" /><small>{t("Talk it through")}</small><b>{t("Book a free 30-minute call with a laser expert")}</b><p>{t("Talk through your materials, space and budget before you choose.")}</p><em>{t("Pick a time")}<Icon name="chevron" size={16} /></em></Link></li>
            <li><button type="button" className="plate" onClick={() => setDlg("financing")} aria-haspopup="dialog"><span className="spec-idx"><span>03 / {t("Finance")}</span><span>{t("Estimate")}</span></span><SpecIcon name="card" /><small>{t("Do the math")}</small><b>{t("See your monthly payment")}</b><p>{t("Pick a machine and a term to see a rough monthly payment right away.")}</p><em>{t("Open the estimator")}<Icon name="chevron" size={16} /></em></button></li>
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
