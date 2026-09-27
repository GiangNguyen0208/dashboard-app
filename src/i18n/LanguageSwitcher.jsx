import { Languages } from 'lucide-react';

import { useI18n } from './index';

function cx(...values) {
  return values.filter(Boolean).join(' ');
}

/**
 * Compact language switch used in the app shell, the login screen and the
 * mobile navigation sheet. `compact` renders the short codes (VI/EN).
 */
export default function LanguageSwitcher({ className = '', compact = true }) {
  const { locale, setLocale, locales, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('language.switchLabel')}
      className={cx(
        'inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1',
        className,
      )}
    >
      <Languages className="ml-1.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
      {locales.map((item) => {
        const isActive = item.code === locale;
        return (
          <button
            key={item.code}
            type="button"
            lang={item.code}
            title={item.label}
            aria-pressed={isActive}
            onClick={() => setLocale(item.code)}
            className={cx(
              'inline-flex min-h-8 items-center justify-center rounded-xl px-2.5 text-[11px] font-semibold transition',
              compact ? 'uppercase tracking-[0.14em]' : 'tracking-[0.02em]',
              isActive
                ? 'bg-cyan-400/15 text-cyan-100'
                : 'text-[var(--text-soft)] hover:bg-white/8 hover:text-white',
            )}
          >
            {compact ? item.shortLabel : item.label}
          </button>
        );
      })}
    </div>
  );
}
