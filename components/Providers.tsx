'use client'

import { TranslationProvider } from '@/lib/i18n/useTranslation'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>
}
