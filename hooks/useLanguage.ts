'use client';
import { useEffect, useState } from 'react';
import type { Language } from '@/lib/pricing';

const storageKey = 'webcraft-language';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('ar');
  useEffect(() => {
    try { if (localStorage.getItem(storageKey) === 'en') setLanguage('en'); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
  }, [language]);
  function changeLanguage(next: Language) {
    setLanguage(next);
    try { localStorage.setItem(storageKey, next); } catch { /* storage unavailable */ }
  }
  return { language, changeLanguage, en: language === 'en' };
}
