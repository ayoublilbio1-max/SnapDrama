import { getLocales } from "expo-localization";
import { useMemo } from "react";
import { getSettings, useSettings, type LangPref } from "../data/settings";
import { STRINGS, type Key, type Lang } from "./strings";

export type { Key, Lang };

/** Languages offered in Settings › Language. */
export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "es", label: "Español", flag: "🇪🇸" },
  { id: "de", label: "Deutsch", flag: "🇩🇪" },
];

const LOCALE: Record<Lang, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
};

/** The phone's language if we have it, else English. */
export function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode ?? "en";
    return (["en", "fr", "es", "de"] as const).find((l) => l === code) ?? "en";
  } catch {
    return "en";
  }
}

export function resolveLang(pref: LangPref): Lang {
  return pref === "system" ? deviceLang() : pref;
}

type Params = Record<string, string | number>;

function format(text: string, params?: Params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) =>
    params[k] !== undefined ? String(params[k]) : m,
  );
}

function translate(lang: Lang, key: Key, params?: Params) {
  return format(STRINGS[lang][key] ?? STRINGS.en[key] ?? key, params);
}

export type T = ((key: Key, params?: Params) => string) & {
  lang: Lang;
  locale: string;
  /** Tag / category names from catalog.json → translated when we know them, else as written. */
  tag: (tag: string) => string;
};

function makeT(lang: Lang): T {
  const fn = ((key: Key, params?: Params) => translate(lang, key, params)) as T;
  fn.lang = lang;
  fn.locale = LOCALE[lang];
  fn.tag = (tag: string) => {
    const k = `tag.${tag}` as Key;
    return STRINGS[lang][k] ?? STRINGS.en[k] ?? tag;
  };
  return fn;
}

const cache = new Map<Lang, T>();
function getT(lang: Lang): T {
  let t = cache.get(lang);
  if (!t) {
    t = makeT(lang);
    cache.set(lang, t);
  }
  return t;
}

/** In components: `const t = useT();` → re-renders when the language changes. */
export function useT(): T {
  const { language } = useSettings();
  const lang = resolveLang(language);
  return useMemo(() => getT(lang), [lang]);
}

/** Outside components (notifications, helpers): the current language right now. */
export function tNow(): T {
  return getT(resolveLang(getSettings().language));
}
