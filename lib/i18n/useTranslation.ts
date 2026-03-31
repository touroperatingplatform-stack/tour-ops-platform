'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Locale = 'en' | 'es'

interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

let translations: Record<string, any> = {}

async function loadTranslations(locale: Locale) {
  try {
    const response = await fetch(`/locales/${locale}.json`)
    translations = await response.json()
  } catch (error) {
    console.error('Failed to load translations:', error)
  }
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    loadTranslations(locale)
  }, [locale])

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale)
  }

  function t(key: string): string {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key
      }
    }

    return typeof value === 'string' ? value : key
  }

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}
