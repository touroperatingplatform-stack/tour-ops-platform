'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function LanguageToggle() {
  const { locale, setLocale } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const locales = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇲🇽' }
  ]

  function handleSelect(code: 'en' | 'es') {
    setLocale(code)
    setIsOpen(false)
  }

  const currentLocale = locales.find(l => l.code === locale)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors border border-gray-200"
        title="Change language"
      >
        <span className="text-lg">{currentLocale?.flag}</span>
        <span className="text-sm font-medium uppercase">{locale}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => handleSelect(loc.code as 'en' | 'es')}
                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                  locale === loc.code ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500' : 'text-gray-700 hover:bg-gray-100 border-l-2 border-transparent'
                }`}
              >
                <span>{loc.flag}</span>
                <span>{loc.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
