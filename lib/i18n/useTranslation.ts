'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'en' | 'es'

interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

interface TranslationProviderProps {
  children: ReactNode
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [translations, setTranslations] = useState<Record<string, any>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
      setLocaleState(savedLocale)
    }
  }, [])

  useEffect(() => {
    async function loadTranslations() {
      try {
        const response = await fetch(`/locales/${locale}.json`)
        const data = await response.json()
        setTranslations(data)
        localStorage.setItem('locale', locale)
        setLoaded(true)
      } catch (error) {
        console.error('Failed to load translations:', error)
        setLoaded(true)
      }
    }
    loadTranslations()
  }, [locale])

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale)
  }

  function t(key: string): string {
    if (!loaded) return key
    
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

  const contextValue = { locale: locale, setLocale: setLocale, t: t }
  const Provider = TranslationContext.Provider
  
  return (
    <Provider value={contextValue}>
      {children}
    </Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
