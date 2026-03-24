'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>({ tours: [], users: [], vehicles: [], guests: [] })
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch()
      } else {
        setResults({ tours: [], users: [], vehicles: [], guests: [] })
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  async function performSearch() {
    setLoading(true)
    const searchTerm = `%${query}%`

    const [{ data: tours }, { data: users }, { data: vehicles }, { data: guests }] = await Promise.all([
      supabase
        .from('tours')
        .select('id, name, tour_date, status')
        .ilike('name', searchTerm)
        .limit(5),
      supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from('vehicles')
        .select('id, plate_number, make, model')
        .or(`plate_number.ilike.${searchTerm},make.ilike.${searchTerm},model.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from('guests')
        .select('id, first_name, last_name, email, phone')
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5),
    ])

    setResults({
      tours: tours || [],
      users: users || [],
      vehicles: vehicles || [],
      guests: guests || [],
    })
    setLoading(false)
    setShowResults(true)
  }

  const totalResults = 
    results.tours.length + 
    results.users.length + 
    results.vehicles.length + 
    results.guests.length

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Search tours, users, vehicles..."
          className="w-full md:w-96 pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
        <span className="absolute left-3 top-2 text-gray-400">🔍</span>
        {loading && <span className="absolute right-3 top-2 text-gray-400 text-xs">Loading...</span>}
      </div>

      {showResults && totalResults > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {results.tours.length > 0 && (
            <div className="border-b border-gray-100">
              <p className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Tours</p>
              {results.tours.map((tour: any) => (
                <Link
                  key={tour.id}
                  href={`/admin/tours/${tour.id}`}
                  onClick={() => { setShowResults(false); setQuery(''); }}
                  className="block px-4 py-2 hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">{tour.name}</p>
                  <p className="text-xs text-gray-500">
                    {tour.tour_date && new Date(tour.tour_date).toLocaleDateString()} • {tour.status}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {results.users.length > 0 && (
            <div className="border-b border-gray-100">
              <p className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Users</p>
              {results.users.map((user: any) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  onClick={() => { setShowResults(false); setQuery(''); }}
                  className="block px-4 py-2 hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </Link>
              ))}
            </div>
          )}

          {results.vehicles.length > 0 && (
            <div className="border-b border-gray-100">
              <p className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Vehicles</p>
              {results.vehicles.map((vehicle: any) => (
                <Link
                  key={vehicle.id}
                  href={`/admin/vehicles/${vehicle.id}`}
                  onClick={() => { setShowResults(false); setQuery(''); }}
                  className="block px-4 py-2 hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">{vehicle.plate_number}</p>
                  <p className="text-xs text-gray-500">{vehicle.make} {vehicle.model}</p>
                </Link>
              ))}
            </div>
          )}

          {results.guests.length > 0 && (
            <div>
              <p className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">Guests</p>
              {results.guests.map((guest: any) => (
                <Link
                  key={guest.id}
                  href={`/admin/guests`}
                  onClick={() => { setShowResults(false); setQuery(''); }}
                  className="block px-4 py-2 hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">{guest.first_name} {guest.last_name}</p>
                  {guest.email && <p className="text-xs text-gray-500">{guest.email}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {showResults && totalResults === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-center text-gray-500">
          No results found
        </div>
      )}
    </div>
  )
}
