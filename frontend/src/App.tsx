import { useState } from "react";

import { InfoTip } from "./components/InfoTip";
import { ReportExplorer } from "./components/ReportExplorer";
import { translations, type Locale } from "./lib/i18n";

export function App() {
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const dictionary = translations[locale];

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-panel-actions">
          <InfoTip content={dictionary.appSubtitle} label={dictionary.appSummaryLabel} />
          <div className="locale-switcher" role="group" aria-label={dictionary.languageLabel}>
            <button
              type="button"
              className={`locale-flag-button ${locale === "pt-BR" ? "locale-flag-button-active" : ""}`}
              aria-pressed={locale === "pt-BR"}
              aria-label="Português do Brasil"
              title="Português do Brasil"
              onClick={() => setLocale("pt-BR")}
            >
              <span aria-hidden="true">🇧🇷</span>
            </button>
            <button
              type="button"
              className={`locale-flag-button ${locale === "en-US" ? "locale-flag-button-active" : ""}`}
              aria-pressed={locale === "en-US"}
              aria-label="English (United States)"
              title="English (United States)"
              onClick={() => setLocale("en-US")}
            >
              <span aria-hidden="true">🇺🇸</span>
            </button>
          </div>
        </div>
        <div className="hero-topbar">
          <div>
            <p className="eyebrow">{dictionary.appEyebrow}</p>
            <h1>
              {dictionary.appTitle}
              <InfoTip content={dictionary.appSubtitle} label={dictionary.appSummaryLabel} />
            </h1>
          </div>
        </div>
      </section>

      <ReportExplorer locale={locale} />
    </main>
  );
}
