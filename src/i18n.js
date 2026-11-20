import { useSyncExternalStore } from "react";
import es from "./locales/es.js";
import fr from "./locales/fr.js";
import de from "./locales/de.js";
import zh from "./locales/zh.js";
import ja from "./locales/ja.js";

/* Interface language. English strings are the keys; a missing entry falls back to English.
   Product names, descriptions, specs and the long product stories come from 1laser.com in English and are not translated here.
   The selector follows insta360.com's "Choose Your Country or Region" dialog. */
export const LANGS = [
  { code: "en", region: "United States", label: "English" },
  { code: "es", region: "España", label: "Español" },
  { code: "fr", region: "France", label: "Français" },
  { code: "de", region: "Deutschland", label: "Deutsch" },
  { code: "zh", region: "中国大陆", label: "简体中文" },
  { code: "ja", region: "日本", label: "日本語" },
];
const DICT = { es, fr, de, zh, ja };
const KEY = "onelaser-store-lang-v1";
const listeners = new Set();
const read = () => {
  try {
    const v = localStorage.getItem(KEY);
    return LANGS.some((l) => l.code === v) ? v : "en";
  } catch {
    return "en";
  }
};
let lang = read();
if (typeof document !== "undefined") document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;

export const getLang = () => lang;
export function setLang(code) {
  if (!LANGS.some((l) => l.code === code) || code === lang) return;
  lang = code;
  try { localStorage.setItem(KEY, code); } catch { /* private mode: keep it for this visit only */ }
  document.documentElement.lang = code === "zh" ? "zh-CN" : code;
  listeners.forEach((fn) => fn());
}
export const useLang = () => useSyncExternalStore((fn) => (listeners.add(fn), () => listeners.delete(fn)), getLang);
/** Translate an interface string. Non-strings and unknown strings pass through unchanged. */
export const missing = new Set(); // strings asked for but not in the current dictionary (dev aid: window.__i18nMissing)
if (typeof window !== "undefined") window.__i18nMissing = missing;
export const t = (s) => {
  if (lang === "en" || typeof s !== "string") return s;
  const hit = DICT[lang]?.[s];
  if (hit == null) missing.add(s);
  return hit ?? s;
};
