import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { asset, byHandle, img, lockScroll, money, frontImg, openMachineFinder, useCampaignActive } from "../lib.js";
import { contact, footer, heroSlides, homeFaq, homeOwnership, homeWhy, homeReviews, homeStandard, homeFeaturedMachines, homeShopCategories, homeMakerVideos, promo, trustpilot } from "../data/site.js";
import { AddButton, Icon, Link, useDragScroll } from "../components/ui.jsx";
import FinderCard, { FinderHelp } from "../components/Finder.jsx";

function HeroButtons({ slide }) {
  if (slide.id === "overview") return (
    <div className="ih-btns">
      <button type="button" className="ih-btn light" onClick={openMachineFinder}>{t("Find my laser")} <Icon name="arrow" size={18} /></button>
      <Link to="/compare" className="ih-btn ghost">{t("Compare machines")}</Link>
    </div>
  );
  const product = slide.to?.startsWith("/products/") ? byHandle[slide.to.slice(10)] : null;
  return (
    <div className="ih-btns">
      <Link to={slide.to} href={slide.href} className="ih-btn light">{t(slide.cta)}</Link>
      {product?.available && <AddButton product={product} className="ih-btn ghost" drop="down" iconSize={18} />}
    </div>
  );
}

function HeroVideo({ src }) {
  const [ready, setReady] = useState(false);

  return (
    <video src={src} className={ready ? "ready" : undefined} autoPlay muted playsInline aria-hidden="true" onPlaying={() => setReady(true)} />
  );
}

function Hero() {
  const [activeId, setActiveId] = useState("overview");
  const [seenSlides, setSeenSlides] = useState(() => new Set(["overview"]));
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const touch = useRef(null);
  const campaignActive = useCampaignActive(promo.endsAt);
  const slides = campaignActive ? heroSlides : heroSlides.filter(({ id }) => id !== "friday");
  const index = Math.max(0, slides.findIndex(({ id }) => id === activeId));
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event) => setReduceMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const selectSlide = (id) => {
    setActiveId(id);
    setSeenSlides((previous) => previous.has(id) ? previous : new Set([...previous, id]));
  };
  const changeSlide = (direction) => selectSlide(slides[(index + direction + slides.length) % slides.length].id);
  const onTouchStart = (event) => {
    const point = event.touches[0];
    touch.current = { x: point.clientX, y: point.clientY };
  };
  const onTouchEnd = (event) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2) changeSlide(dx < 0 ? 1 : -1);
  };

  return (
    <section
      className="ih-hero"
      aria-label={t("Homepage highlights")}
      aria-roledescription="carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => { touch.current = null; }}
    >
      <div className="ih-pages">
        {slides.map((slide, position) => (
          <button key={slide.id} type="button" aria-current={position === index ? "true" : undefined} aria-controls={`slide-${slide.id}`} onClick={() => selectSlide(slide.id)}>
            <span>{t(slide.tab)}</span>
          </button>
        ))}
      </div>
      {slides.map((slide, position) => {
        const current = position === index;
        const Title = position === 0 ? "h1" : "h2";
        const poster = <img src={asset(slide.image)} alt="" fetchPriority={position === 0 ? "high" : undefined} decoding="async" />;
        return (
          <article key={slide.id} id={`slide-${slide.id}`} className={`ih-slide ih-slide--${slide.id}${current ? " on" : ""}`} inert={!current} aria-hidden={!current}>
            <div className="ih-slide-media" aria-hidden="true">
              {seenSlides.has(slide.id) && (slide.mobileImage ? (
                <picture>
                  <source media="(max-width: 860px)" srcSet={asset(slide.mobileImage)} />
                  {poster}
                </picture>
              ) : poster)}
              {slide.video && current && !reduceMotion && <HeroVideo src={asset(slide.video)} />}
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

function HomeCard({ product, description, badge }) {
  const { handle, name, price, compareAt, priceVaries } = product;
  const productPath = `/products/${handle}`;
  const savings = compareAt - price;

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
      <p className="ih-card-monthly"><Link to="/pages/financing">{t("See financing options")}</Link></p>
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

function Applications() {
  return (
    <section className="ih-block ih-wrap ih-applications" aria-labelledby="home-application-title">
      <h2 className="ih-h2" id="home-application-title">{t("What do you want to make?")}</h2>
      <p className="ih-intro">{t("Start with the work you do and see which machine fits.")}</p>
      <ul>
        {homeFeaturedMachines.map(({ handle, application }) => (
          <li key={handle}>
            <Link to={`/products/${handle}`}>
              <img src={asset(application.image)} alt="" loading="lazy" decoding="async" />
              <div>
                <h3>{t(application.label)}</h3>
                <p>{t(application.materials)}</p>
              </div>
              <Icon name="arrow" size={18} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MachineFinder() {
  return (
    <section className="ih-block ih-finder ih-wrap" id="machine-finder" aria-labelledby="machine-finder-title">
      <h2 className="ih-h2" id="machine-finder-title" tabIndex={-1}>{t("Find your machine")}</h2>
      <div className="ih-finder-heading">
        <p className="ih-intro">{t("In four steps, tell us about your work and get a machine recommendation.")}</p>
        <Link to="/compare" className="ih-text-action">{t("Compare machines")} <Icon name="arrow" size={16} /></Link>
      </div>
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
              <img src={asset(image)} alt="" width="800" height="800" loading="lazy" decoding="async" />
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

/** Details behind the homepage assurance bar and the owner review score. */
const DLG_HEAD = {
  reviews: ["star", "Owner reviews"], company: ["flag", "U.S. company"], warranty: ["shield", "Warranty and returns"],
  support: ["headset", "U.S.-based technical support"],
  fox: ["tv", "TV feature"],
};
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
  const dialogRef = useRef(null);
  const quotes = useRef(null);
  const swipe = useSwipeClose(onClose);
  useEffect(() => {
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    const unlock = lockScroll();
    return () => {
      unlock();
      opener?.focus({ preventScroll: true });
    };
  }, []);
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
        <div className="tdlg-cards"><section><p className="tdlg-days">{t("Returns and exchanges")}</p><p>{t(faqText("Can I return"))}</p></section>
          <section><Faces /><p className="tdlg-days">{t("U.S.-based support")}</p><p>{t(faqText("How does support"))}</p></section></div>
        <div className="tdlg-links">
          <More href="https://www.1laser.com/pages/warranty-policy">{t("Warranty policy")}</More>
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
          <More href={contact.supportTicket}>{t("Open a support ticket")}</More>
          <More href="https://wiki.1laser.com" ghost>{t("Product knowledge base")}</More>
        </div>
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
    <dialog ref={dialogRef} className="tdlg-scrim ih-trust-dialog" aria-label={t(DLG_HEAD[kind][1])}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`tdlg tdlg-${kind}`} {...swipe}>
        <span className="tdlg-grab" aria-hidden="true" />
        <button type="button" className="tdlg-x" aria-label={t("Close")} onClick={onClose}><Icon name="close" size={20} /></button>
        {body}
      </div>
    </dialog>
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
  { kind: "support", icon: "headset", label: "U.S.-based technical support", detail: contact.phone },
  { kind: "warranty", icon: "shield", label: "Warranty by model", detail: "See what your machine covers" },
  { kind: "shipping", icon: "truck", label: "Shipping and delivery", detail: "Check rates and timing", href: "https://www.1laser.com/pages/shipping-policy" },
  { kind: "company", icon: "pin", label: "U.S. company", detail: "Lake Forest, California" },
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

function WhyOneLaser() {
  return (
    <section className="ih-block iwhy" id="why-onelaser" aria-labelledby="why-onelaser-title">
      <div className="ih-wrap">
        <p className="ist-kicker">{t("Why OneLaser")}</p>
        <h2 className="ih-h2" id="why-onelaser-title">{t("From fine details to full production runs.")}</h2>
        <div className="iwhy-grid">
          {homeWhy.map(({ id, label, title, text, image, alt, cta, href, to }) => (
            <article className={`iwhy-card iwhy-card--${id}`} key={id}>
              <div className="iwhy-photo">
                <img src={asset(image)} alt={t(alt)} loading="lazy" decoding="async" />
              </div>
              <div className="iwhy-copy">
                <p className="iwhy-label">{t(label)}</p>
                <h3>{t(title)}</h3>
                <p className="iwhy-text">{t(text)}</p>
                <Link to={to} href={href} className="iwhy-link">{t(cta)} <Icon name="arrow" size={16} /></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AfterYouBuy() {
  return (
    <section className="ih-block iown" id="after-you-buy" aria-labelledby="after-you-buy-title">
      <div className="ih-wrap">
        <p className="ist-kicker">{t("After you buy")}</p>
        <h2 className="ih-h2" id="after-you-buy-title">{t("Support for your OneLaser")}</h2>
        <div className="iown-layout">
          <div className="iown-support">
            <div className="iown-support-copy">
              <span className="iown-icon"><Icon name="headset" size={24} /></span>
              <h3>{t("U.S.-based technical support")}</h3>
              <p>{t("Get help with machine setup, error messages, or a job that isn’t running as expected.")}</p>
              <div className="iown-actions">
                <Link href={contact.supportTicket} className="iown-ticket">{t("Open a support ticket")} <Icon name="arrow" size={17} /></Link>
                <a href={`tel:${contact.tel}`} className="iown-phone" aria-label={`${t("Call tech support")} ${contact.phone}`}>
                  <Icon name="phone" size={17} /> <span>{contact.phone}</span>
                </a>
              </div>
            </div>
            <div className="iown-support-media">
              <img src={asset("home-why-onelaser-team.webp")} alt={t("The OneLaser team gathered around a laser machine at an event")} width="280" height="220" loading="lazy" decoding="async" />
            </div>
          </div>
          <ul className="iown-resources">
            {homeOwnership.map(({ icon, title, text, href }) => (
              <li key={icon}>
                <Link href={href}>
                  <span className="iown-icon"><Icon name={icon} size={21} /></span>
                  <span className="iown-copy">
                    <span className="iown-resource-title">{t(title)}</span>
                    <span>{t(text)}</span>
                  </span>
                  <Icon name="arrow" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function MakerVideoCard({ video, onPlay }) {
  const [usePreview, setUsePreview] = useState(false);
  const { id, title, creator, model, preview } = video;
  return (
    <li className="imakers-card">
      <button type="button" aria-haspopup="dialog" onClick={() => onPlay(video)}>
        <span className="imakers-media">
          <img
            src={usePreview ? asset(preview) : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            onError={usePreview ? undefined : () => setUsePreview(true)}
            alt=""
            width="480"
            height="270"
            loading="lazy"
            decoding="async"
          />
          {usePreview && <small className="imakers-preview">{t("Project reference image")}</small>}
          <span className="imakers-play" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
        <span className="imakers-info">
          <span className="imakers-credit">{creator} <span aria-hidden="true">·</span> {model}</span>
          <span className="imakers-project">{t(title)}</span>
        </span>
      </button>
    </li>
  );
}

function MakerVideoDialog({ video, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    return lockScroll();
  }, []);

  return (
    <dialog ref={dialogRef} className="imakers-dialog" aria-labelledby="maker-video-title" onClose={onClose} onClick={(event) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    }}>
      <div className="imakers-dialog-content">
        <header className="imakers-dialog-head">
          <div>
            <h3 id="maker-video-title">{t(video.title)}</h3>
            <p>{video.creator} <span aria-hidden="true">·</span> {video.model}</p>
          </div>
          <button type="button" aria-label={t("Close video")} onClick={() => dialogRef.current.close()}><Icon name="close" size={22} /></button>
        </header>
        <div className="imakers-player">{embed(video.id, t(video.title))}</div>
        <Link href={`https://www.youtube.com/watch?v=${video.id}`} className="imakers-more">{t("Watch on YouTube")} <Icon name="arrow" size={16} /></Link>
      </div>
    </dialog>
  );
}

function MakerVideos() {
  const [selected, setSelected] = useState(null);
  return (
    <section className="ih-block imakers" id="maker-videos" aria-labelledby="maker-videos-title">
      <div className="ih-wrap">
        <div className="imakers-heading">
          <h2 className="ih-h2" id="maker-videos-title">{t("See what creators make with OneLaser")}</h2>
          <Link href="https://www.1laser.com/pages/community-videos" className="imakers-more">{t("More community videos")} <Icon name="arrow" size={16} /></Link>
        </div>
        <ul className="imakers-grid">
          {homeMakerVideos.map((video) => <MakerVideoCard key={video.id} video={video} onPlay={setSelected} />)}
        </ul>
        {selected && <MakerVideoDialog video={selected} onClose={() => setSelected(null)} />}
      </div>
    </section>
  );
}

const ROI_FIELDS = [
  { name: "investment", label: "Total upfront cost ($)", min: 1 },
  { name: "price", label: "Selling price per item ($)", min: 0 },
  { name: "volume", label: "Items sold per month", min: 0, step: 1 },
  { name: "materials", label: "Material cost per item ($)", min: 0 },
  { name: "labor", label: "Labor and other costs per item ($)", min: 0 },
  { name: "fixed", label: "Monthly fixed costs ($)", min: 0 },
];

function PaybackEstimator() {
  const [result, setResult] = useState(null);
  const estimate = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const { investment, price, materials, labor, fixed, volume } = Object.fromEntries(
      ROI_FIELDS.map(({ name }) => [name, Number(data.get(name))]),
    );
    const monthly = Math.round(((price - materials - labor) * volume - fixed) * 100) / 100;
    setResult({ monthly, months: monthly > 0 ? Math.ceil(investment / monthly) : null });
  };
  return (
    <section className="ih-block ih-wrap ih-payback" aria-labelledby="home-payback-title">
      <details>
        <summary>
          <div><h2 id="home-payback-title">{t("Estimate your payback period")}</h2><p>{t("See how your prices, costs and order volume affect the time it could take to recover your investment.")}</p></div>
          <Icon name="chevron" size={20} />
        </summary>
        <form onSubmit={estimate} onChange={() => setResult(null)}>
          <div className="ih-payback-inputs">
            {ROI_FIELDS.map(({ name, label, min, step = ".01" }) => (
              <label key={name}>{t(label)}
                <input name={name} type="number" min={min} max="10000000" step={step} required inputMode={step === 1 ? "numeric" : "decimal"} />
              </label>
            ))}
          </div>
          <p>{t("Include equipment and setup in upfront cost. The estimate assumes steady sales and costs and excludes taxes and financing unless you enter them.")}</p>
          <button type="submit" className="ih-btn dark sm">{t("Calculate estimate")}</button>
          <div className="ih-payback-result" aria-live="polite" aria-atomic="true">
            {result && (
              <>
                <p>{t("Estimated monthly operating profit")} <strong>{money(result.monthly)}</strong></p>
                <p>{result.months
                  ? <>{t("Estimated months to pay back")} <strong>{result.months.toLocaleString()}</strong></>
                  : t("At this sales volume and cost, the investment would not be recovered.")}</p>
              </>
            )}
          </div>
        </form>
      </details>
    </section>
  );
}

function HelpToChoose() {
  return (
    <section className="ih-block ih-wrap ih-next" aria-labelledby="home-next-title">
      <div>
        <h2 id="home-next-title">{t("Want to see a machine in action?")}</h2>
        <p>{t("Find a demo host near you or talk with our U.S. team about your materials, workspace and budget.")}</p>
      </div>
      <div className="ih-next-actions">
        <Link href={contact.demo} className="ih-btn dark">{t("Find a demo host")}</Link>
        <Link href={contact.booking} className="ih-btn line">{t("Schedule a Sales Call")}</Link>
      </div>
    </section>
  );
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
      <Applications />
      <FeaturedMachines />
      <MachineFinder />

      <OwnerReviews onReadAll={() => setDlg("reviews")} />
      {reviewsOpen && <ReviewsDialog onClose={() => setReviewsOpen(false)} />}

      <MakerVideos />
      <WhyOneLaser />
      <Credibility />

      <AfterYouBuy />
      <ShopCategories />
      <PaybackEstimator />

      <section className="ih-block ifq">
        <div className="ih-wrap">
          <h2 className="ih-h2">{t("Questions? Answers.")}</h2>
          <ul className="iw-faq">
            {homeFaq.map(([q, ans, link], n) => (
              <li key={q}>
                <details open={n === 0}>
                  <summary><span>{t(q)}</span><Icon name="chevron" size={16} /></summary>
                  <p>{t(ans)}</p>
                  {link && <Link to={link.to} href={link.href} className="ih-text-action">{t(link.label)} <Icon name="arrow" size={16} /></Link>}
                </details>
              </li>
            ))}
          </ul>
          {dlg && <TrustDialog kind={dlg} onClose={() => setDlg(null)} onTrustpilot={() => { setDlg(null); setReviewsOpen(true); }} />}
        </div>
      </section>
      <HelpToChoose />
    </div>
  );
}
