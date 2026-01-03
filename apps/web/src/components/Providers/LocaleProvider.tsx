'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type SupportedLocale } from '@diboas/i18n/server';

interface LocaleContextType {
  locale: SupportedLocale;
  isHydrated: boolean;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

interface LocaleProviderProps {
  children: React.ReactNode;
  initialLocale: SupportedLocale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale: initialLocale, isHydrated }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}