'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
    // Standard hydration-detection pattern: SSR renders with isHydrated=false;
    // after first client mount we flip to true so consumers can show
    // hydration-only UI. The cascade is intentional (one re-render on mount).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  const value = useMemo<LocaleContextType>(
    () => ({ locale: initialLocale, isHydrated }),
    [initialLocale, isHydrated]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
