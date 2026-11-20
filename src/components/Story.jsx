import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { img } from "../lib.js";
import { Icon } from "./ui.jsx";

/* Product overview, laid out after the black overview on the Insta360 Store product page
   (store.insta360.com/product/x5, measured 2026-11-17 at 1440):
   centered feature = 18/21.6 bold accent eyebrow, 44/50.6 bold title, 560-wide 16/24 gray text, 800×450 media with 24px radius;
   side feature = 620×349 media + 420 copy, padding 80/170;
   tab feature = 800×450 slides 20px apart with the neighbours showing, 48px round arrows, pill tab bar on #1a1a1a, 640-wide text;
   "closer look" = four columns of 302×170 thumbs (10px radius), 20/24 bold title, 14/19.6 gray text.
   Blocks come from src/data/stories.json (scraped from the 1laser.com product pages), in the official order.
   Specs and FAQ blocks are rendered by the product page itself. */

const ytId = (url) => (url.match(/embed\/([\w-]+)/) || url.match(/[?&]v=([\w-]+)/) || [])[1];

function Reveal({ as: Tag = "section", className = "", children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return el?.classList.add("in");
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (el.classList.add("in"), io.disconnect()), { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`is-reveal ${className}`} {...rest}>{children}</Tag>;
}

const Head = ({ b }) =>
  b.title || b.eyebrow ? (
    <header className="is-head">
      {b.eyebrow && <h4>{b.eyebrow}</h4>}
      {b.title && <h2>{b.title}</h2>}
      {b.intro && <p>{b.intro}</p>}
    </header>
  ) : null;

const Media = ({ item, width = 1600 }) =>
  item.video && !/youtube/.test(item.video) ? (
    <video src={item.video} poster={img(item.img || item.image, width)} muted loop playsInline autoPlay preload="none" />
  ) : (
    <img src={img(item.img || item.image, width)} alt={item.title || ""} loading="lazy" />
  );

const hasMedia = (x) => !!(x.img || x.video);
const Notes = ({ text }) => (text ? <p className="is-notes">{text}</p> : null);

/** Insta360 "closer look" grid: also used for text-only feature cards. */
export function Look({ title, items, cols = 4 }) {
  return (
    <Reveal className="is-look">
      {title && <h2>{title}</h2>}
      <ul className={`n${cols}`}>
        {items.map((it, n) => (
          <li key={n}>
            {hasMedia(it) && <div className="is-thumb"><Media item={it} width={700} /></div>}
            {it.eyebrow && <span>{it.eyebrow}</span>}
            <h4>{it.title}</h4>
            {it.text && <p>{it.text}</p>}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function Slides({ b, items }) {
  const [i, setI] = useState(0);
  const item = items[i] || items[0];
  const n = items.length;
  return (
    <Reveal className="is-slides">
      <Head b={b} />
      <div className="is-track-wrap">
        <ul className="is-track" style={{ "--i": i }}>
          {items.map((it, k) => (
            <li key={k} className={k === i ? "on" : ""} onClick={() => setI(k)}><Media item={it} /></li>
          ))}
        </ul>
        {n > 1 && (
          <>
            <button type="button" className="is-arrow prev" aria-label={t("Previous")} disabled={i === 0} onClick={() => setI(i - 1)}><Icon name="chevron" size={18} /></button>
            <button type="button" className="is-arrow next" aria-label={t("Next")} disabled={i === n - 1} onClick={() => setI(i + 1)}><Icon name="chevron" size={18} /></button>
          </>
        )}
      </div>
      <div className="is-pills" role="tablist">
        {items.map((it, k) => <button key={k} type="button" role="tab" aria-selected={k === i} className={k === i ? "on" : ""} onClick={() => setI(k)}>{it.eyebrow || it.title}</button>)}
      </div>
      <div className="is-slide-text" key={i}>
        {item.eyebrow && item.title && <h3>{item.title}</h3>}
        {item.text && <p>{item.text}</p>}
        <Notes text={item.footer} />
      </div>
    </Reveal>
  );
}

function Feature({ b }) {
  const media = b.items.filter(hasMedia);
  const text = b.items.filter((x) => !hasMedia(x));
  if (!media.length && b.image) media.push({ img: b.image, title: "", text: "" });
  return (
    <>
      {media.length >= 2 ? (
        <Slides b={b} items={media} />
      ) : (
        <Reveal className="is-feature">
          <Head b={b} />
          {media[0] && <div className="is-media"><Media item={media[0]} /></div>}
          {media[0]?.title && (
            <div className="is-slide-text">
              <h3>{media[0].title}</h3>
              {media[0].text && media[0].text !== b.intro && <p>{media[0].text}</p>}
              <Notes text={media[0].footer} />
            </div>
          )}
        </Reveal>
      )}
      {text.length > 0 && <Look items={text} cols={Math.min(Math.max(text.length, 2), 4)} />}
      {b.stats?.length > 0 && (
        <Reveal className="is-stats"><ul>{b.stats.slice(0, 4).map(([v, l]) => <li key={v + l}><b>{v}</b><span>{l}</span></li>)}</ul></Reveal>
      )}
    </>
  );
}

function Gallery({ b }) {
  const [all, setAll] = useState(false);
  const items = all ? b.items : b.items.slice(0, 8);
  return (
    <Reveal className="is-look">
      <Head b={b} />
      <ul className="n4 photos">
        {items.map((it, n) => <li key={n}><div className="is-thumb"><img src={img(it.img, 700)} alt="" loading="lazy" /></div><h4>{it.title}</h4></li>)}
      </ul>
      {b.items.length > 8 && !all && <button type="button" className="is-more" onClick={() => setAll(true)}>{t("Show all")} {b.items.length}</button>}
    </Reveal>
  );
}

const PROMISE_ICONS = ["refresh", "shield", "headset"];

export default function Story({ blocks }) {
  const [video, setVideo] = useState(null);
  useEffect(() => {
    if (!video) return undefined;
    const close = (e) => e.key === "Escape" && setVideo(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [video]);
  let splits = 0;
  const Play = ({ id, thumb }) => (
    <button type="button" className="is-video" onClick={() => setVideo(id)} aria-label={t("Play video")}>
      <img src={thumb ? img(thumb, 1400) : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
      <span aria-hidden="true" />
    </button>
  );
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "banner":
            return (
              <Reveal as="div" className="is-banner" key={i}>
                <picture>
                  {b.mobile && <source media="(max-width: 640px)" srcSet={img(b.mobile, 900)} />}
                  <img src={img(b.image, 2400)} alt="" loading="lazy" />
                </picture>
              </Reveal>
            );
          case "split":
            return (
              <Reveal className={`is-split${splits++ % 2 ? " flip" : ""}`} key={i}>
                <div className="is-media">{b.video && ytId(b.video) ? <Play id={ytId(b.video)} thumb={b.image} /> : <Media item={b} />}</div>
                <Head b={b} />
              </Reveal>
            );
          case "tabs":
          case "features":
            return <Feature b={b} key={i} />;
          case "gallery":
            return <Gallery b={b} key={i} />;
          case "videos":
            return (
              <Reveal className="is-videos" key={i}>
                <Head b={b} />
                <ul>{b.videos.map((v) => <li key={v.id}><Play id={v.id} thumb={v.img} /></li>)}</ul>
              </Reveal>
            );
          case "table":
            return (
              <Reveal className="is-feature" key={i}>
                <Head b={b} />
                {b.video && ytId(b.video) && <div className="is-media"><Play id={ytId(b.video)} /></div>}
                {b.rows?.length > 1 && (
                  <div className="is-table-scroll">
                    <table className="is-table">
                      <thead><tr>{b.rows[0].map((c, n) => <th key={n}>{c}</th>)}</tr></thead>
                      <tbody>{b.rows.slice(1).map((r, n) => <tr key={n}>{r.map((c, k) => (k ? <td key={k}>{c}</td> : <th key={k}>{c}</th>))}</tr>)}</tbody>
                    </table>
                  </div>
                )}
              </Reveal>
            );
          case "promise":
            return (
              <Reveal className="is-look" key={i}>
                <ul className="n3 promise">
                  {b.items.map((it, n) => <li key={n}><Icon name={PROMISE_ICONS[n % 3]} size={32} /><h4>{it.title}</h4><p>{it.text}</p></li>)}
                </ul>
              </Reveal>
            );
          default:
            return null;
        }
      })}
      {video && (
        <div className="is-modal" role="dialog" aria-modal="true" aria-label={t("Video")} onClick={() => setVideo(null)}>
          <button type="button" aria-label={t("Close video")}>×</button>
          <div onClick={(e) => e.stopPropagation()}>
            <iframe src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0`} title={t("Video")} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}
    </>
  );
}
