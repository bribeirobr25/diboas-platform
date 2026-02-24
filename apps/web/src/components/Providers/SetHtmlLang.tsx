'use client';

import { useEffect } from 'react';

interface SetHtmlLangProps {
  locale: string;
}

export function SetHtmlLang({ locale }: SetHtmlLangProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
