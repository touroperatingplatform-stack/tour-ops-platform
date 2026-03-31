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

  const currentFlag = locale === 'en' ? '🇺🇸' : '🇲🇽'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
      >
        {currentFlag}
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
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                  locale === loc.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
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
