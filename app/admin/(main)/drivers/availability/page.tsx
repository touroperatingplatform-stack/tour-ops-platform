'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Availability {
  driver_id: string
  schedule_date: string
  is_available: boolean
}

interface Tour {
  id: string
  driver_id: string
  tour_date: string
}

function getYearMonthDay(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-')
  return {
    year: parseInt(parts[0]) || 2024,
    month: parseInt(parts[1]) || 1,
    day: parseInt(parts[2]) || 1
  }
}

function makeDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getFirstDay(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function addMonths(dateStr: string, months: number): string {
  const { year, month, day } = getYearMonthDay(dateStr)
  const newDate = new Date(year, month - 1 + months, day)
  return makeDateStr(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate())
}

function formatMonthName(dateStr: string): string {
  const { year, month } = getYearMonthDay(dateStr)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function DriverAvailabilityPage() {
  const { t } = useTranslation()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const today = getLocalDate()
  const [currentMonthStr, setCurrentMonthStr] = useState(today.slice(0, 7) + '-01')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { year: currentYear, month: currentMonth } = getYearMonthDay(currentMonthStr)

  useEffect(() => {
    loadData()
  }, [currentMonthStr])

  async function loadData() {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (!profile?.company_id) {
        setError('No company')
        setLoading(false)
        return
      }

      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('company_id', profile.company_id)
        .eq('role', 'driver')
        .eq('status', 'active')
        .order('first_name')

      if (driversError) throw driversError
      if (driversData) setDrivers(driversData)

      // Load availability
      const startDate = makeDateStr(currentYear, currentMonth, 1)
      const endDate = makeDateStr(currentYear, currentMonth + 1, 1)

      const { data: availData, error: availError } = await supabase
        .from('driver_schedules')
        .select('driver_id, schedule_date, is_available')
        .eq('company_id', profile.company_id)
        .gte('schedule_date', startDate)
        .lt('schedule_date', endDate)

      if (availError) throw availError
      if (availData) setAvailability(availData)

      // Load tours for conflict checking
      const { data: toursData, error: toursError } = await supabase
        .from('tours')
        .select('id, driver_id, tour_date')
        .eq('company_id', profile.company_id)
        .gte('tour_date', startDate)
        .lt('tour_date', endDate)
        .not('driver_id', 'is', null)

      if (toursError) throw toursError
      if (toursData) setTours(toursData)

    } catch (e: any) {
      setError('Error: ' + e.message)
    }

    setLoading(false)
  }

  const calendarDays = useMemo(() => {
    const firstDay = getFirstDay(currentYear, currentMonth)
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    
    const days: (string | null)[] = []
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(makeDateStr(currentYear, currentMonth, i))
    }
    
    return days
  }, [currentYear, currentMonth])

  function getUnavailableForDate(dateStr: string): Driver[] {
    const unavailableIds = availability
      .filter(a => a.schedule_date === dateStr && !a.is_available)
      .map(a => a.driver_id)
    return drivers.filter(d => unavailableIds.includes(d.id))
  }

  function getConflictsForDate(dateStr: string): Tour[] {
    const unavailableIds = availability
      .filter(a => a.schedule_date === dateStr && !a.is_available)
      .map(a => a.driver_id)
    return tours.filter(t => t.tour_date === dateStr && unavailableIds.includes(t.driver_id))
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('roles.driver')} {t('calendar.title')}</h1>
              <p className="text-gray-500 text-sm">{t('calendar.clickDate')}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentMonthStr(addMonths(currentMonthStr, -1))} className="p-2 hover:bg-gray-100 rounded-lg">←</button>
              <span className="text-lg font-semibold min-w-[180px] text-center">{formatMonthName(currentMonthStr)}</span>
              <button onClick={() => setCurrentMonthStr(addMonths(currentMonthStr, 1))} className="p-2 hover:bg-gray-100 rounded-lg">→</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-white">
        <div className="h-full p-6">
          <div className="grid grid-cols-7 gap-px mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 uppercase py-2">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
            {calendarDays.map((dateStr, i) => {
              if (!dateStr) {
                return <div key={`empty-${i}`} className="bg-gray-50 min-h-[100px]" />
              }
              
              const unavailable = getUnavailableForDate(dateStr)
              const conflicts = getConflictsForDate(dateStr)
              const isPast = dateStr < today
              const isToday = dateStr === today
              const dayNum = parseInt(dateStr.split('-')[2]) || 1
              const isWeekend = [0, 6].includes(new Date(currentYear, currentMonth - 1, dayNum).getDay())
              
              return (
                <div
                  key={dateStr}
                  onClick={() => !isPast && setSelectedDate(dateStr)}
                  className={`bg-white min-h-[100px] p-2 cursor-pointer transition-colors relative ${isPast ? 'bg-gray-50' : 'hover:bg-gray-50'} ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''} ${isWeekend && !isPast ? 'bg-gray-50/50' : ''}`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isPast ? 'text-gray-400' : 'text-gray-700'} ${isToday ? 'text-blue-600' : ''}`}>
                    {dayNum}
                  </div>
                  
                  <div className="space-y-1">
                    {unavailable.slice(0, 3).map(driver => (
                      <div key={driver.id} className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded truncate">
                        {driver.first_name}
                      </div>
                    ))}
                    {unavailable.length > 3 && (
                      <div className="text-xs text-gray-500">+{unavailable.length - 3} more</div>
                    )}
                  </div>
                  
                  {conflicts.length > 0 && (
                    <div className="absolute top-2 right-2" title={`${conflicts.length} conflict(s)`}>⚠️</div>
                  )}
                </div>
              )
            })}
          </div>
          
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span>{t('calendar.unavailable')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>{t('calendar.conflict')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-500"></div>
              <span>{t('calendar.today')}</span>
            </div>
          </div>
        </div>
      </main>

      {selectedDate && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedDate(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-xl">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedDate}</h2>
                  <p className="text-sm text-gray-500">{t('calendar.selectUnavailable')}</p>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                <DatePanelContent
                  date={selectedDate}
                  drivers={drivers}
                  availability={availability}
                  tours={tours}
                  onSave={async (selectedIds) => {
                    setSaving(true)
                    try {
                      const updates = drivers.map(driver => ({
                        driver_id: driver.id,
                        schedule_date: selectedDate,
                        is_available: !selectedIds.has(driver.id)
                      }))
                      
                      const { error } = await supabase
                        .from('driver_schedules')
                        .upsert(updates, { onConflict: 'driver_id,schedule_date' })
                      
                      if (error) {
                        console.error('Supabase error:', error)
                        throw error
                      }
                      await loadData()
                      setSelectedDate(null)
                    } catch (e: any) {
                      console.error('Save error:', e)
                      setError('Save failed: ' + (e.message || 'Unknown error'))
                    }
                    setSaving(false)
                  }}
                  saving={saving}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface DatePanelContentProps {
  date: string
  drivers: Driver[]
  availability: Availability[]
  tours: Tour[]
  onSave: (selectedIds: Set<string>) => void
  saving: boolean
}

function DatePanelContent({ date, drivers, availability, tours, onSave, saving }: DatePanelContentProps) {
  const { t } = useTranslation()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    const unavailableIds = availability
      .filter(a => a.schedule_date === date && !a.is_available)
      .map(a => a.driver_id)
    setSelectedIds(new Set(unavailableIds))
  }, [date, availability])
  
  const toggle = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }
  
  const hasTour = (driverId: string) => {
    return tours.some(t => t.tour_date === date && t.driver_id === driverId)
  }

  return (
    <div className="space-y-4">
      {drivers.map(driver => {
        const selected = selectedIds.has(driver.id)
        const hasAssignedTour = hasTour(driver.id)
        
        return (
          <div
            key={driver.id}
            onClick={() => toggle(driver.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
              {selected && <span className="text-white text-xs">✓</span>}
            </div>
            
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-sm">
              {(driver.first_name || '')[0]}{(driver.last_name || '')[0]}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900">{driver.first_name || ''} {driver.last_name || ''}</div>
              <div className="text-xs text-gray-500">{driver.email || ''}</div>
            </div>
            
            {hasAssignedTour && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                ⚠️ <span>{t('calendar.hasTour') || 'Has tour'}</span>
              </div>
            )}
          </div>
        )
      })}
      
      <button
        onClick={() => onSave(selectedIds)}
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? (t('calendar.saving') || 'Saving...') : (t('calendar.saveChanges') || 'Save Changes')}
      </button>
    </div>
  )
}
