export const setDocumentDirection = (locale: string) => {
  if (typeof document !== 'undefined') {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }
};

export const isRTL = (locale: string): boolean => {
  return locale === 'ar';
};