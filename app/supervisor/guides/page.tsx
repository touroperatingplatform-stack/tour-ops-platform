'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Guide {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'on_tour'
}

interface Tour {
  id: string
  name: string
  tour_date: string
  status: string
  guest_count: number
}

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)
  const [guideTours, setGuideTours] = useState<Tour[]>([])
  const [companyName, setCompanyName] = useState('Tour Ops')

  useEffect(() => {
    loadGuides()
    loadCompanySettings()
  }, [])

  useEffect(() => {
    if (selectedGuide) {
      loadGuideTours(selectedGuide.id)
    }
  }, [selectedGuide])

  async function loadCompanySettings() {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'company_name')
      .single()

    if (data?.value) {
      setCompanyName(data.value)
    }
  }

  async function loadGuides() {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, role, status')
      .eq('role', 'guide')
      .order('last_name')

    if (data) {
      const formattedGuides: Guide[] = data.map((g: any) => ({
        id: g.id,
        first_name: g.first_name,
        last_name: g.last_name,
        email: g.email || '-',
        phone: g.phone || '-',
        status: g.status || 'active'
      }))
      setGuides(formattedGuides)
    }
    setLoading(false)
  }

  async function loadGuideTours(guideId: string) {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('tours')
      .select('id, name, tour_date, status, guest_count')
      .eq('guide_id', guideId)
      .gte('tour_date', today)
      .order('tour_date')
      .limit(5)

    if (data) {
      setGuideTours(data)
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-500',
      on_tour: 'bg-blue-100 text-blue-700'
    }
    const labels: Record<string, string> = {
      active: 'Available',
      inactive: 'Offline',
      on_tour: 'On Tour'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    )
  }

  const filteredGuides = guides.filter(g =>
    `${g.first_name} ${g.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading guides...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Guides</h1>
          <p className="text-sm text-gray-500">{guides.length} total guides</p>
        </div>
        <input
          type="text"
          placeholder="Search guides..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
        />
      </div>

      {/* Guides List */}
      <div className="bg-white rounded-lg border border-gray-200 flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredGuides.map((guide) => (
              <tr key={guide.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs">
                      {guide.first_name[0]}{guide.last_name[0]}
                    </div>
                    <span className="font-medium text-gray-900">{guide.first_name} {guide.last_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">{guide.email}</td>
                <td className="px-4 py-3 text-gray-600">{guide.phone}</td>
                <td className="px-4 py-3">{getStatusBadge(guide.status)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`https://wa.me/${guide.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(guide.first_name)}%2C%20this%20is%20from%20${encodeURIComponent(companyName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 p-1"
                      title="WhatsApp"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                    <button
                      onClick={() => setSelectedGuide(guide)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredGuides.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No guides found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Guide Detail Panel */}
      {selectedGuide && (
        <div className="fixed inset-0 z-50 flex justify-end p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedGuide(null)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl rounded-lg overflow-hidden border-4 border-transparent">
            <div className="h-full overflow-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Guide Details</h2>
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mx-auto mb-3">
                  {selectedGuide.first_name[0]}{selectedGuide.last_name[0]}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedGuide.first_name} {selectedGuide.last_name}
                </h3>
                <p className="text-sm text-gray-500">{getStatusBadge(selectedGuide.status)}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="text-sm text-gray-900">{selectedGuide.email}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Phone</p>
                    <p className="text-sm text-gray-900">{selectedGuide.phone}</p>
                  </div>
                  <a
                    href={`https://wa.me/${selectedGuide.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(selectedGuide.first_name)}%2C%20this%20is%20from%20${encodeURIComponent(companyName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Tours</h4>
                {guideTours.length > 0 ? (
                  <div className="space-y-2">
                    {guideTours.map((tour) => (
                      <div key={tour.id} className="bg-gray-50 rounded p-3">
                        <p className="text-sm font-medium text-gray-900">{tour.name}</p>
                        <p className="text-xs text-gray-500">{tour.tour_date} • {tour.guest_count} guests</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No upcoming tours scheduled</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
