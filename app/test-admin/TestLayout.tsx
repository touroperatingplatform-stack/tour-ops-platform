'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/tours', label: 'Tours', icon: '🚌' },
  { href: '/admin/guests', label: 'Guests', icon: '👤' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/vehicles', label: 'Fleet', icon: '🚐' },
  { href: '/admin/expenses', label: 'Expenses', icon: '💵' },
]

const moreItems = [
  { href: '/admin/users', label: 'Team', icon: '👥' },
  { href: '/admin/brands', label: 'Brands', icon: '🏷️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

const userMenuItems = [
  { label: 'Profile', icon: '👤', action: () => console.log('Profile') },
  { label: 'Settings', icon: '⚙️', action: () => console.log('Settings') },
  { label: 'Logout', icon: '🚪', action: () => console.log('Logout') },
]

export default function TestLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [language, setLanguage] = useState('EN')
  const [notifications, setNotifications] = useState(3)

  const currentPage = 'Test Page'

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Navigation */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="px-4 py-3 border-8 border-transparent">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                T
              </div>
              <span className="font-bold text-gray-900">{currentPage}</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Language Toggle - Flag Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                >
                  {language === 'EN' ? '🇺🇸' : '🇲🇽'}
                </button>
                
                {showLangMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-50"
                      onClick={() => setShowLangMenu(false)}
                    />
                    <div className="absolute top-10 right-0 bg-white rounded-lg shadow-xl z-50 p-2">
                      <button 
                        onClick={() => { setLanguage('EN'); setShowLangMenu(false); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg w-full ${language === 'EN' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                      >
                        <span>🇺🇸</span>
                        <span>English</span>
                      </button>
                      <button 
                        onClick={() => { setLanguage('ES'); setShowLangMenu(false); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg w-full mt-1 ${language === 'ES' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                      >
                        <span>🇲🇽</span>
                        <span>Español</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* Notifications */}
              <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 relative">
                🔔
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
              
              {/* User Button */}
              <button 
                onClick={() => setShowUserMenu(true)}
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
              >
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white border-8 border-transparent">
        <div className="w-full h-full overflow-auto px-10 py-6 border-8 border-transparent">
          <div className="h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white border-t z-50">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[48px] ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center py-2 px-2 min-w-[48px] text-gray-500"
          >
            <span className="text-xl mb-1">☰</span>
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu */}
      {showMore && (
        <>
          <div 
            className="fixed inset-0 bg-white z-50"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed inset-4 bg-white rounded-2xl shadow-2xl z-50 flex flex-col">
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-center mb-4 p-4">
                <span className="font-bold text-2xl">Menu</span>
                <button 
                  onClick={() => setShowMore(false)}
                  className="absolute right-10 p-4 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
              <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-4 p-2">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-gray-600 hover:bg-gray-50 bg-gray-50 h-full"
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* User Menu */}
      {showUserMenu && (
        <>
          <div 
            className="fixed inset-0 z-50"
            onClick={() => setShowUserMenu(false)}
          />
          <div className="fixed top-20 right-8 w-64 bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-2">
              <div className="border-b pb-3 mb-3">
                <div className="flex flex-col items-center gap-3 p-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    👤
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Admin User</p>
                    <p className="text-xs text-gray-500">admin@example.com</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {userMenuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
