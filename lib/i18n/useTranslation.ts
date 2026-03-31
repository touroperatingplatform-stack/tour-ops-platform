'use client'

import { useState, useEffect } from 'react'

type Locale = 'en' | 'es'

// Global store
let currentLocale: Locale = 'en'
let translations: Record<string, any> = {}
let loaded = false
const listeners: Set<() => void> = new Set()

function notifyListeners() {
  listeners.forEach(fn => fn())
}

// Load translations immediately
async function loadTranslations(locale: Locale) {
  try {
    const response = await fetch(`/locales/${locale}.json`)
    translations = await response.json()
    loaded = true
    notifyListeners()
  } catch (error) {
    console.error('Failed to load translations:', error)
    loaded = true
    notifyListeners()
  }
}

// Initial load
loadTranslations('en')

export function useTranslation() {
  const [localeState, setLocaleState] = useState<Locale>(currentLocale)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const handler = () => {
      setLocaleState(currentLocale)
      forceUpdate({})
    }
    listeners.add(handler)

    return () => {
      listeners.delete(handler)
    }
  }, [])

  function setLocale(newLocale: Locale) {
    currentLocale = newLocale
    loadTranslations(newLocale)
    notifyListeners()
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

  return {
    locale: localeState,
    setLocale,
    t
  }
}
