import { useCallback, useMemo, useSyncExternalStore } from 'react';

import en from './locales/en';
import vi from './locales/vi';

export const LOCALES = [
  { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VI', intlLocale: 'vi-VN' },
  { code: 'en', label: 'English', shortLabel: 'EN', intlLocale: 'en-US' },
];

export const DEFAULT_LOCALE = 'vi';
const STORAGE_KEY = 'dashboard-locale';
const DICTIONARIES = { vi, en };
const listeners = new Set();

function isSupportedLocale(locale) {
  return LOCALES.some((item) => item.code === locale);
}

function detectLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) return stored;
  } catch {
    // localStorage can be unavailable (private mode, blocked storage): fall through to detection.
  }

  const candidates = window.navigator?.languages?.length
    ? window.navigator.languages
    : [window.navigator?.language];

  for (const candidate of candidates) {
    const normalized = String(candidate || '').toLowerCase();
    const match = LOCALES.find((item) => normalized === item.code || normalized.startsWith(`${item.code}-`));
    if (match) return match.code;
  }

  return DEFAULT_LOCALE;
}

let activeLocale = detectLocale();

export function getLocale() {
  return activeLocale;
}

export function getIntlLocale(locale = activeLocale) {
  const entry = LOCALES.find((item) => item.code === locale) || LOCALES[0];
  return entry.intlLocale;
}

export function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = params[name];
    return value === undefined || value === null ? match : String(value);
  });
}

export function translate(key, params, locale = activeLocale) {
  const dictionary = DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
  const fallback = DICTIONARIES[DEFAULT_LOCALE];
  const template = dictionary[key] ?? fallback[key] ?? key;
  return interpolate(template, params);
}

/**
 * Module level translator. It always reads the active locale at call time, so
 * pure helpers can translate without receiving a `t` argument. React trees still
 * need `useI18n()` somewhere above them so a language switch re-renders.
 */
export const t = translate;

function applyDomLocale(locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.title = translate('app.name', undefined, locale);
}

export function setLocale(locale) {
  if (!isSupportedLocale(locale) || locale === activeLocale) return;
  activeLocale = locale;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Persisting is best effort only.
  }
  applyDomLocale(locale);
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

applyDomLocale(activeLocale);

export function useI18n() {
  const locale = useSyncExternalStore(subscribe, getLocale, getLocale);
  const changeLocale = useCallback((next) => setLocale(next), []);

  return useMemo(() => ({
    locale,
    t: translate,
    setLocale: changeLocale,
    locales: LOCALES,
    intlLocale: getIntlLocale(locale),
  }), [locale, changeLocale]);
}

export default useI18n;
