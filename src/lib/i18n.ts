/** Locale scaffolding for ZA launch. Primary: en-ZA. Room for af/zu/xh. */
export const DEFAULT_LOCALE = "en-ZA";
export const DEFAULT_COUNTRY = "ZA";

const strings = {
  "en-ZA": {
    brand: "Resona",
    tagline: "Match on how you think, not how you look.",
    ctaStart: "Start matching",
    ctaLogin: "Log in",
  },
  af: {
    brand: "Resona",
    tagline: "Pas by hoe jy dink, nie hoe jy lyk nie.",
    ctaStart: "Begin pas",
    ctaLogin: "Teken in",
  },
  zu: {
    brand: "Resona",
    tagline: "Hlangana ngokucabanga kwakho, hhayi ukubukeka.",
    ctaStart: "Qala ukufanisa",
    ctaLogin: "Ngena",
  },
  xh: {
    brand: "Resona",
    tagline: "Dibanisa ngendlela ocinga ngayo, hayi ngendlela ojonga ngayo.",
    ctaStart: "Qala ukutshatisa",
    ctaLogin: "Ngena",
  },
} as const;

export type LocaleCode = keyof typeof strings;

export function t(locale: string = DEFAULT_LOCALE) {
  const key = (locale in strings ? locale : "en-ZA") as LocaleCode;
  return strings[key];
}
