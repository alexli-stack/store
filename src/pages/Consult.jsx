import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n.js";
import { img } from "../lib.js";
import { Icon, Link } from "../components/ui.jsx";
import { contact, homeReviews } from "../data/site.js";

/* Free sales consultation, redesigned from 1laser.com/pages/sales-consultation.
   Content, team and opening hours are the live page's: a 30-minute phone call, Monday to Friday,
   10:00–11:30 AM and 2:00–4:30 PM Pacific time, in 30-minute slots.
   The live page books through Appointo; here the booking is a design draft and nothing is sent. */

const CDN = "https://www.1laser.com/cdn/shop/files/";
const TEAM = [
  ["Sean Sullivan", "OneLaser Team", "A member of the OneLaser team. Bring your questions about machines, setup and purchasing to your consultation.", "onelaser-team-gray-redhair-2026.png"],
  ["Murphy Limon", "Sales Manager", "An experienced sales manager who helps you compare options and choose the machine that best fits your current needs.", "onelaser-team-gray-cap-2026.png"],
  ["Sakura Huang", "Customer Support", "An experienced customer service specialist for laser engraving machines.", "onelaser-team-gray-longhair-2026.png"],
];
const FOR = [
  ["search", "You're just beginning your research and want to know where to start."],
  ["compare", "You're comparing OneLaser with another brand."],
  ["up", "You're ready to upgrade from a hobby machine."],
  ["shop", "You run a business and need a machine that fits your workload."],
  ["school", "You're choosing a laser for a school, makerspace or institution."],
  ["quote", "You're ready to purchase and want to discuss a quote."],
];
const STEPS = [
  ["Tell us what you want to make", "Share your materials, production goals, available space and budget."],
  ["Explore the right setup", "Talk through suitable machines, configurations and accessories with our team."],
  ["Know your next steps", "Discuss pricing, setup needs and what to consider before making a decision."],
];
const ZONES = [
  ["America/Los_Angeles", "Pacific Time"],
  ["America/Denver", "Mountain Time"],
  ["America/Phoenix", "Arizona"],
  ["America/Chicago", "Central Time"],
  ["America/New_York", "Eastern Time"],
  ["America/Anchorage", "Alaska"],
  ["Pacific/Honolulu", "Hawaii"],
  ["America/Toronto", "Toronto"],
  ["Europe/London", "London"],
  ["Europe/Berlin", "Central Europe"],
  ["Australia/Sydney", "Sydney"],
];
const HQ = "America/Los_Angeles";
const SLOTS = ["10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]; // Pacific
const DAYS_AHEAD = 15; // business days offered
// Form after the thunderlaserusa.com consultation form, with the OneLaser line-up and price bands.
const MACHINES = [["XRF", "Desktop · 38W RF"], ["Cobra Series", "Glass CO₂ · 8 / 10 / 14"], ["Hydra Gen2", "RF + CO₂ · 7 / 9 / 13 / 16"], ["VertiGo", "Vertical · round items"], ["Need help deciding", ""]];
const TIMELINE = ["I'm ready to buy", "Within the next 1–3 months", "Just exploring for now"];
const BUDGETS = ["Under $5,000", "$5,000 to $10,000", "$10,000 to $15,000", "No set budget, I want the best fit"];
const CODES = [["+1", "US"], ["+1", "CA"], ["+44", "UK"], ["+61", "AU"], ["+49", "DE"], ["+33", "FR"], ["+34", "ES"], ["+81", "JP"], ["+86", "CN"]];

/** Minutes a time zone is ahead of UTC at a given instant. */
const offset = (tz, at) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(at).map((x) => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(at.getTime() / 60000) * 60000) / 60000;
};
/** The instant of a wall-clock time (y, m, d, "hh:mm") in the HQ time zone. */
const hqInstant = ([y, m, d], hm) => {
  const [h, min] = hm.split(":").map(Number);
  const guess = Date.UTC(y, m, d, h, min);
  return new Date(guess - offset(HQ, new Date(guess)) * 60000);
};
/** Next business days in HQ time, as [y, m, d]. */
function businessDays() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: HQ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const out = [];
  for (let i = 0; out.length < DAYS_AHEAD; i++) {
    const d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day + i));
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    const ymd = [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
    if (SLOTS.some((s) => hqInstant(ymd, s) > new Date(Date.now() + 60 * 60000))) out.push(ymd); // need an hour's notice
  }
  return out;
}
const guessZone = () => {
  try {
    const z = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return ZONES.some(([id]) => id === z) ? z : z || HQ;
  } catch {
    return HQ;
  }
};
const fmt = (at, tz, opts) => new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(at);
const zoneLabel = (tz) => {
  const known = ZONES.find(([id]) => id === tz);
  const gmt = fmt(new Date(), tz, { timeZoneName: "shortOffset" }).split(" ").pop();
  return `${known ? t(known[1]) : tz.replace(/_/g, " ").split("/").pop()} (${gmt})`;
};

function Booking() {
  const days = useMemo(businessDays, []);
  const [zone, setZone] = useState(guessZone);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState(null);
  const [step, setStep] = useState("time"); // time → details → done
  const [err, setErr] = useState({});
  const [machines, setMachines] = useState([]);
  const stripRef = useRef(null);
  const soon = useMemo(() => {
    const out = [];
    // the first open time on each of the next three days, so the shortcut also offers a choice of day
    days.forEach((ymd, n) => { const at = SLOTS.map((h) => hqInstant(ymd, h)).find((x) => x > new Date(Date.now() + 60 * 60000)); if (at) out.push([n, at]); });
    return out.slice(0, 3);
  }, [days]);
  const pickSoon = (n, at) => { setDay(n); setSlot(at); setStep("details"); };
  const calendarFile = () => {
    const z = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OneLaser//Consultation//EN", "BEGIN:VEVENT", `UID:${slot.getTime()}@1laser.com`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(slot)}`, `DTEND:${z(new Date(slot.getTime() + 30 * 60000))}`, "SUMMARY:OneLaser free consultation call", "DESCRIPTION:A OneLaser expert calls you on the number you gave. Questions: sales@1laser.com", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  };
  const zones = ZONES.some(([id]) => id === zone) ? ZONES : [[zone, zone.replace(/_/g, " ")], ...ZONES];
  const slots = SLOTS.map((s) => hqInstant(days[day], s)).filter((at) => at > new Date(Date.now() + 60 * 60000));
  const dayLabel = (ymd) => new Date(Date.UTC(...ymd, 12));
  const when = slot && `${fmt(slot, zone, { weekday: "long", month: "long", day: "numeric" })} · ${fmt(slot, zone, { hour: "numeric", minute: "2-digit" })}`;

  const pickDay = (n) => { setDay(n); setSlot(null); };
  const scrollDays = (dir) => stripRef.current?.scrollBy({ left: dir * stripRef.current.clientWidth * 0.8, behavior: "smooth" });
  const submit = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const bad = {};
    if (!String(f.get("first") || "").trim()) bad.first = true;
    if (!String(f.get("last") || "").trim()) bad.last = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.get("email") || ""))) bad.email = true;
    if (String(f.get("phone") || "").replace(/\D/g, "").length < 7) bad.phone = true;
    if (!machines.length) bad.machines = true;
    if (!f.get("timeline")) bad.timeline = true;
    if (!f.get("budget")) bad.budget = true;
    setErr(bad);
    if (Object.keys(bad).length) {
      e.currentTarget.querySelector(".bad input, .bad button, .bad")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStep("done");
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="cs-book" id="book">
      <div className="cs-book-head">
        <span className="cs-live"><i />{t("Live availability")}</span>
        <h2>{t("Talk with a OneLaser expert")}</h2>
        <p className="cs-meta"><span><Icon name="clock" size={16} />{t("30 minutes")}</span><span><Icon name="phone" size={16} />{t("Phone call")}</span><span><Icon name="check" size={16} />{t("Free")}</span></p>
        <ol className="cs-progress" aria-label={t("Booking steps")}>
          <li className={step === "time" ? "now" : "done"}><i>{step === "time" ? 1 : <Icon name="check" size={12} />}</i>{t("Pick a time")}</li>
          <li className={step === "details" ? "now" : step === "done" ? "done" : ""}><i>{step === "done" ? <Icon name="check" size={12} /> : 2}</i>{t("Your details")}</li>
        </ol>
      </div>

      {step === "time" && (
        <div className="cs-book-body">
          {soon.length > 0 && (
            <div className="cs-soon">
              <p>{t("Soonest open times")}</p>
              <div>
                {soon.map(([n, at]) => (
                  <button key={at.getTime()} type="button" onClick={() => pickSoon(n, at)}>
                    <small>{t(fmt(at, zone, { weekday: "short" }))} {fmt(at, zone, { month: "short", day: "numeric" })}</small>
                    <b>{fmt(at, zone, { hour: "numeric", minute: "2-digit" })}</b>
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="cs-zone">
            <Icon name="globe" size={16} />
            <select value={zone} onChange={(e) => { setZone(e.target.value); setSlot(null); }} aria-label={t("Your timezone")}>
              {zones.map(([id]) => <option key={id} value={id}>{zoneLabel(id)}</option>)}
            </select>
            <Icon name="chevron" size={14} />
          </label>
          <div className="cs-days-head">
            <b>{fmt(dayLabel(days[day]), "UTC", { month: "long", year: "numeric" })}</b>
            <span>
              <button type="button" aria-label={t("Earlier dates")} onClick={() => scrollDays(-1)}><Icon name="chevron" size={16} /></button>
              <button type="button" aria-label={t("Later dates")} onClick={() => scrollDays(1)}><Icon name="chevron" size={16} /></button>
            </span>
          </div>
          <div className="cs-days" ref={stripRef} role="listbox" aria-label={t("Pick a day")}>
            {days.map((ymd, n) => {
              const d = dayLabel(ymd);
              return (
                <button key={ymd.join("-")} type="button" role="option" aria-selected={n === day} className={n === day ? "on" : ""} onClick={() => pickDay(n)}>
                  <small>{t(fmt(d, "UTC", { weekday: "short" }))}</small>
                  <b>{d.getUTCDate()}</b>
                  <small>{t(fmt(d, "UTC", { month: "short" }))}</small>
                </button>
              );
            })}
          </div>
          <p className="cs-slots-head">{t("All times")} <span>· {t("shown in your timezone")}</span></p>
          <div className="cs-slots">
            {slots.map((at) => {
              const on = slot && slot.getTime() === at.getTime();
              const otherDay = fmt(at, zone, { day: "numeric" }) !== String(days[day][2]);
              return (
                <button key={at.getTime()} type="button" className={on ? "on" : ""} aria-pressed={on} onClick={() => setSlot(at)}>
                  {fmt(at, zone, { hour: "numeric", minute: "2-digit" })}
                  {otherDay && <small>{t(fmt(at, zone, { weekday: "short" }))}</small>}
                </button>
              );
            })}
          </div>
          <button type="button" className="cs-next" disabled={!slot} onClick={() => setStep("details")}>
            {slot ? <>{t("Continue")} · {fmt(slot, zone, { hour: "numeric", minute: "2-digit" })}</> : t("Pick a time to continue")}
          </button>
          <p className="cs-alt">{t("Can't find a suitable time?")} <a href={`tel:${contact.tel}`}>{t("Call us")}</a> {t("or")} <a href={`mailto:sales@1laser.com`}>{t("email the team")}</a>.</p>
        </div>
      )}

      {step === "details" && (
        <form className="cs-book-body cs-form" onSubmit={submit} noValidate>
          <button type="button" className="cs-back" onClick={() => setStep("time")}><Icon name="arrow" size={16} />{t("Back to times")}</button>
          <div className="cs-when"><Icon name="calendar" size={18} /><span><b>{when}</b><small>{zoneLabel(zone)}</small></span></div>
          <div className="cs-row">
            <label className={`cs-field${err.first ? " bad" : ""}`}><span>{t("First name")} <i>*</i></span><input name="first" autoComplete="given-name" autoFocus /></label>
            <label className={`cs-field${err.last ? " bad" : ""}`}><span>{t("Last name")} <i>*</i></span><input name="last" autoComplete="family-name" /></label>
          </div>
          <label className={`cs-field${err.email ? " bad" : ""}`}><span>{t("Email")} <i>*</i></span><input name="email" type="email" inputMode="email" autoComplete="email" /></label>
          <div className={`cs-field${err.phone ? " bad" : ""}`}>
            <span>{t("Phone")} <i>*</i> <small>{t("We call you on this number")}</small></span>
            <div className="cs-phone">
              <select name="code" aria-label={t("Country code")} defaultValue="+1 US">{CODES.map(([c, r]) => <option key={c + r} value={`${c} ${r}`}>{r} {c}</option>)}</select>
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" aria-label={t("Phone number")} />
            </div>
          </div>
          <label className="cs-check">
            <input type="checkbox" name="sms" />
            <span><b>{t("Optional: text reminders.")}</b> {t("Text me a reminder about this appointment at the number above. Consent is not a condition of booking or purchase. Message and data rates may apply. Reply STOP to opt out.")}</span>
          </label>
          <fieldset className={`cs-group${err.machines ? " bad" : ""}`}>
            <legend>{t("Which machine(s) are you interested in?")} <i>*</i> <small>{t("Pick any")}</small></legend>
            <div className="cs-tiles">
              {MACHINES.map(([m, sub]) => {
                const on = machines.includes(m);
                return (
                  <button key={m} type="button" aria-pressed={on} className={on ? "on" : ""} onClick={() => setMachines((x) => (on ? x.filter((y) => y !== m) : [...x, m]))}>
                    <i>{on && <Icon name="check" size={12} />}</i><span><b>{t(m)}</b>{sub && <small>{t(sub)}</small>}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="cs-field"><span>{t("Do you own a laser now? If so, which brand and model?")} <small>{t("Optional")}</small></span><input name="current" placeholder={t("e.g. a 10W diode, or none yet")} /></label>
          <fieldset className={`cs-group${err.timeline ? " bad" : ""}`}>
            <legend>{t("When do you plan to get started?")} <i>*</i></legend>
            <div className="cs-radios">{TIMELINE.map((x) => <label key={x}><input type="radio" name="timeline" value={x} /><span>{t(x)}</span></label>)}</div>
          </fieldset>
          <fieldset className={`cs-group${err.budget ? " bad" : ""}`}>
            <legend>{t("What is your budget?")} <i>*</i></legend>
            <div className="cs-radios two">{BUDGETS.map((x) => <label key={x}><input type="radio" name="budget" value={x} /><span>{t(x)}</span></label>)}</div>
          </fieldset>
          <label className="cs-field"><span>{t("Anything we should know?")} <small>{t("Optional")}</small></span><textarea name="note" rows={2} placeholder={t("What you want to make, materials, space…")} /></label>
          {Object.keys(err).length > 0 && <p className="cs-err" role="alert">{t("Please fill in the fields marked *.")}</p>}
          <button type="submit" className="cs-next">{t("Confirm booking")}</button>
          <p className="cs-fine">{t("By submitting, you agree to receive follow-ups from the OneLaser team (human or AI) by email, phone, or text regarding your inquiry.")}</p>
        </form>
      )}

      {step === "done" && (
        <div className="cs-book-body cs-done" role="status">
          <span className="cs-ok"><Icon name="check" size={30} /></span>
          <h3>{t("Thanks — this is a design draft")}</h3>
          <p className="cs-done-when"><Icon name="calendar" size={18} /><span><b>{when}</b><small>{zoneLabel(zone)}</small></span></p>
          <p>{t("Booking is not connected yet, so nothing was sent. On the live site you would get a confirmation email, and a OneLaser expert would call you at this time.")}</p>
          <ol className="cs-after">
            <li><b>{t("Confirmation")}</b><span>{t("An email with your booking details.")}</span></li>
            <li><b>{t("We call you")}</b><span>{t("A OneLaser expert calls the number you gave, at your time.")}</span></li>
            <li><b>{t("Bring your ideas")}</b><span>{t("Materials, sizes, space and budget help us point you to the right machine.")}</span></li>
          </ol>
          <a className="cs-next" href={slot ? calendarFile() : undefined} download="onelaser-consultation.ics"><Icon name="calendar" size={18} />{t("Add to my calendar")}</a>
          <button type="button" className="cs-link" onClick={() => { setStep("time"); setSlot(null); }}>{t("Pick another time")}</button>
        </div>
      )}
    </div>
  );
}

const FOR_ICONS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  compare: <><path d="M4 7h11M11 3l4 4-4 4M20 17H9M13 13l-4 4 4 4" /></>,
  up: <><path d="M12 19V5M6 11l6-6 6 6" /></>,
  shop: <><path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16v10.5H4zM9.5 20v-5h5v5" /></>,
  school: <><path d="m2.5 9 9.5-5 9.5 5-9.5 5zM6.5 11v5c1.5 1.6 3.4 2.5 5.5 2.5s4-.9 5.5-2.5v-5" /></>,
  quote: <><path d="M6 3.5h9l3 3v14H6zM9 10h6M9 14h6M9 18h3" /></>,
};

// Real owner reviews (Judge.me, 1laser.com product pages), from homeReviews in site.js. The hero quote is shortened with "…" only.
const QUOTE = { ...homeReviews.items[0], text: "I absolutely love this laser. … Tech support is fantastic and quick to respond, material quality is great." };
const FAQ = [
  ["Is the call really free?", "Yes. It is a free 30-minute phone call with the OneLaser team, with no obligation to buy."],
  ["What should I have ready?", "An idea of what you want to make: your materials, the size of your pieces, your space and your budget. A rough idea is fine."],
  ["Can I get a quote on the call?", "Yes. If you are ready to purchase, we can go through pricing, configurations and accessories, and discuss a quote."],
  ["What if none of the times work?", "Call us or email sales@1laser.com and we will find a time that suits you."],
];

export default function Consult() {
  useEffect(() => { document.title = "Free Sales Consultation | OneLaser"; return () => { document.title = "OneLaser Store — Redesign Draft"; }; }, []);
  const [bookInView, setBookInView] = useState(true);
  useEffect(() => {
    const check = () => {
      const r = document.getElementById("book")?.getBoundingClientRect();
      setBookInView(!!r && r.top < window.innerHeight * 0.85 && r.bottom > 120);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, []);
  const toBook = () => document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div className="cs">
      <section className="cs-hero">
        <div className="cs-wrap cs-hero-grid">
          <div className="cs-intro">
            <p className="cs-kicker">{t("Free 30-minute call · No pressure")}</p>
            <h1>{t("Not sure which laser is right for you?")}</h1>
            <p className="cs-sub">{t("Let's figure it out together, for free.")}</p>
            <ul className="cs-ticks">
              {["A clear machine recommendation, without pressure.", "Straightforward guidance on pricing and setup.", "Answers from the OneLaser team, with no obligation."].map((x) => <li key={x}><Icon name="check" size={18} />{t(x)}</li>)}
            </ul>
            <blockquote className="cs-quote">
              <p>“{QUOTE.text}”</p>
              <footer><span className="cs-stars" aria-label={t("5 out of 5 stars")}>★★★★★</span><b>{QUOTE.name}</b><small>{QUOTE.product}</small></footer>
            </blockquote>
            <figure className="cs-team-shot">
              <img src={img(`${CDN}onelaser-team-gray-group-2026.png`, 1000)} alt={t("The OneLaser team")} />
              <figcaption>
                <span className="cs-faces">{TEAM.map(([n, , , f]) => <img key={n} src={img(`${CDN}${f}`, 120)} alt="" />)}</span>
                <span><b>{t("You'll talk with the OneLaser team")}</b><small>{t("Real people, ready to help you compare machines and plan your next step.")}</small></span>
              </figcaption>
            </figure>
          </div>
          <Booking />
        </div>
      </section>

      <section className="cs-proof" aria-label={t("Why OneLaser")}>
        <ul className="cs-wrap">
          <li><b>{homeReviews.average}<em>★</em></b><span>{t("Average from")} {homeReviews.count} {t("owner reviews")}</span></li>
          <li><b>{t("30 min")}</b><span>{t("Free, no obligation")}</span></li>
          <li><b>3-2-1</b><span>{t("Year warranty: mechanical, electrical, optics")}</span></li>
          <li><b>{t("U.S.")}</b><span>{t("Support from laser engineers")}</span></li>
        </ul>
      </section>

      <section className="cs-sec">
        <div className="cs-wrap">
          <p className="cs-kicker">{t("Who this call is for")}</p>
          <h2 className="cs-h2">{t("No pressure. Just honest answers.")}</h2>
          <ul className="cs-for">
            {FOR.map(([k, x]) => <li key={k}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{FOR_ICONS[k]}</svg><p>{t(x)}</p></li>)}
          </ul>
          <p className="cs-note">{t("Wherever you are in the process, we'll help you understand your options and plan your next step.")}</p>
        </div>
      </section>

      <section className="cs-sec soft">
        <div className="cs-wrap">
          <p className="cs-kicker">{t("Here's how it works")}</p>
          <h2 className="cs-h2">{t("Three steps. About 30 minutes.")}</h2>
          <p className="cs-lede">{t("Bring your questions or an idea. We'll help you work through the details.")}</p>
          <ol className="cs-steps">
            {STEPS.map(([h, p], n) => <li key={h}><span>{String(n + 1).padStart(2, "0")}</span><h3>{t(h)}</h3><p>{t(p)}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="cs-sec">
        <div className="cs-wrap">
          <p className="cs-kicker">{t("Who you'll speak with")}</p>
          <h2 className="cs-h2">{t("Meet the team behind your next step.")}</h2>
          <p className="cs-lede">{t("Get help comparing machines, matching materials to your projects, and planning a setup that fits your space and budget.")}</p>
          <ul className="cs-team">
            {TEAM.map(([n, role, bio, f]) => (
              <li key={n}>
                <div className="cs-team-img"><img src={img(`${CDN}${f}`, 700)} alt={n} loading="lazy" /></div>
                <h3>{n}</h3>
                <p className="cs-role">{t(role)}</p>
                <p>{t(bio)}</p>
              </li>
            ))}
          </ul>
          <div className="cs-again"><button type="button" className="cs-next" onClick={toBook}><Icon name="calendar" size={18} />{t("Pick a time for your free call")}</button></div>
        </div>
      </section>

      <section className="cs-sec soft">
        <div className="cs-wrap">
          <p className="cs-kicker">{t("From OneLaser owners")}</p>
          <div className="cs-rev-head">
            <h2 className="cs-h2">{t("Help that keeps going after you buy.")}</h2>
            <p><b>{homeReviews.average} ★</b> {t("from")} {homeReviews.count} {t("owner reviews")} · <Link href={homeReviews.url}>{t("Read all reviews")} ›</Link></p>
          </div>
          <ul className="cs-revs">
            {[2, 4, 1].map((n) => homeReviews.items[n]).map((r) => (
              <li key={r.name}>
                <span className="cs-stars" aria-label={t("5 out of 5 stars")}>★★★★★</span>
                <p>“{r.text}”</p>
                <footer><b>{r.name}</b><small>{r.product} · {r.date}</small></footer>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cs-sec">
        <div className="cs-wrap cs-faq">
          <div>
            <p className="cs-kicker">{t("Before you book")}</p>
            <h2 className="cs-h2">{t("Quick answers.")}</h2>
            <button type="button" className="cs-next" onClick={toBook}><Icon name="calendar" size={18} />{t("Pick a time")}</button>
          </div>
          <div>
            {FAQ.map(([q, a], n) => (
              <details key={q} open={n === 0}>
                <summary>{t(q)}<Icon name="plus" size={18} /></summary>
                <p>{t(a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cs-sec soft">
        <div className="cs-wrap">
          <p className="cs-kicker">{t("Not ready for a call?")}</p>
          <h2 className="cs-h2">{t("Start the conversation another way.")}</h2>
          <ul className="cs-ways">
            <li><a href="mailto:sales@1laser.com"><Icon name="mail" size={24} /><h3>{t("Email our team")}</h3><p>{t("Tell us about your projects, materials and machine questions. Contact our sales team by email.")}</p><span>sales@1laser.com<Icon name="arrow" size={16} /></span></a></li>
            <li><Link href="https://www.1laser.com/pages/contact-us"><Icon name="quote" size={24} /><h3>{t("Write to us")}</h3><p>{t("Send your question through our contact form so our team can follow up on your inquiry.")}</p><span>{t("Open the contact form")}<Icon name="arrow" size={16} /></span></Link></li>
            <li><Link href="https://www.1laser.com/pages/faq"><Icon name="search" size={24} /><h3>{t("Browse helpful answers")}</h3><p>{t("Find answers about choosing a machine, purchasing, financing and product support.")}</p><span>{t("Explore OneLaser FAQs")}<Icon name="arrow" size={16} /></span></Link></li>
          </ul>
        </div>
      </section>

      <section className="cs-fin">
        <div className="cs-wrap">
          <div>
            <p className="cs-kicker">{t("Financing")}</p>
            <h2>{t("Make the right machine fit your budget.")}</h2>
            <p>{t("Ask about current financing options on the call, and we'll include them in your quote.")}</p>
          </div>
          <div className="cs-fin-btns">
            <button type="button" className="cs-next" onClick={toBook}><Icon name="calendar" size={18} />{t("Book my free call")}</button>
            <Link to="/pages/financing" className="cs-next ghost">{t("See financing options")}</Link>
          </div>
        </div>
      </section>

      <div className={`cs-bar${bookInView ? " off" : ""}`}><button type="button" className="cs-next" onClick={toBook}><Icon name="calendar" size={18} />{t("Book a free 30-minute call")}</button></div>
    </div>
  );
}
