export const supportedLocales = ['en', 'fr', 'ar'] as const;
export type Locale = (typeof supportedLocales)[number];
export const directionFor = (locale: Locale): 'ltr' | 'rtl' =>
  locale === 'ar' ? 'rtl' : 'ltr';
