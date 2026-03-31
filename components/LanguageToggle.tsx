'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'

export default function LanguageToggle() {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 text-xs font-medium rounded ${
          locale === 'en'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('es')}
        className={`px-2 py-1 text-xs font-medium rounded ${
          locale === 'es'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        ES
      </button>
    </div>
  )
}
