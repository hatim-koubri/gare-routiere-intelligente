export const locales = ['fr', 'ar'] as const;
export const defaultLocale = 'fr';

export type Locale = typeof locales[number];

export const getDirection = (locale: Locale): 'ltr' | 'rtl' => {
  return locale === 'ar' ? 'rtl' : 'ltr';
};