'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate, formatDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react'

interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
}

interface Availability {
  driver_id: string
  date: string
  is_available: boolean
}

interface Tour {
  id: string
  driver_id: string
  date: string
}

export default function DriverAvailabilityPage() {
  const { t } = useTranslation()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const today = getLocalDate()

  useEffect(() => {
    loadData()
  }, [currentDate])

  async function loadData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.company_id) {
      setLoading(false)
      return
    }
    
    setCompanyId(profile.company_id)

    // Load drivers
    const { data: driversData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .eq('company_id', profile.company_id)
      .eq('role', 'driver')
      .eq('status', 'active')
      .order('first_name')

    if (driversData) {
      setDrivers(driversData)
    }

    // Load availability for current month
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month + 2).padStart(2, '0')}-01`

    const { data: availData } = await supabase
      .from('driver_schedules')
      .select('driver_id, date, is_available')
      .eq('company_id', profile.company_id)
      .gte('date', startDate)
      .lt('date', endDate)

    if (availData) {
      setAvailability(availData)
    }

    // Load tours for conflict checking
    const { data: toursData } = await supabase
      .from('tours')
      .select('id, driver_id, date')
      .eq('company_id', profile.company_id)
      .gte('date', startDate)
      .lt('date', endDate)
      .not('driver_id', 'is', null)

    if (toursData) {
      setTours(toursData)
    }

    setLoading(false)
  }

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const days: (Date | null)[] = []
    
    // Padding from previous month
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }, [currentDate])

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function getUnavailableForDate(date: Date): Driver[] {
    const dateStr = date.toISOString().split('T')[0]
    const unavailableIds = availability
      .filter(a => a.date === dateStr && !a.is_available)
      .map(a => a.driver_id)
    return drivers.filter(d => unavailableIds.includes(d.id))
  }

  function getConflictsForDate(date: Date): Tour[] {
    const dateStr = date.toISOString().split('T')[0]
    const unavailableIds = availability
      .filter(a => a.date === dateStr && !a.is_available)
      .map(a => a.driver_id)
    return tours.filter(t => t.date === dateStr && unavailableIds.includes(t.driver_id))
  }

  function isPastDate(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0]
    return dateStr < today
  }

  function isToday(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0]
    return dateStr === today
  }

  async function saveAllChanges(selectedIds: Set<string>) {
    if (!selectedDate || !companyId) return
    
    const dateStr = selectedDate.toISOString().split('T')[0]
    setSaving(true)
    
    const updates = drivers.map(driver => ({
      driver_id: driver.id,
      company_id: companyId,
      date: dateStr,
      is_available: !selectedIds.has(driver.id)
    }))
    
    await supabase
      .from('driver_schedules')
      .upsert(updates, {
        onConflict: 'driver_id,date'
      })
    
    await loadData()
    setSaving(false)
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('roles.driver')} {t('calendar.title')}</h1>
              <p className="text-gray-500 text-sm">{t('calendar.clickDate')}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-semibold min-w-[140px] text-center">{monthYear}</span>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Calendar */}
      <main className="flex-1 overflow-hidden bg-white">
        <div className="h-full p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 uppercase py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
            {calendarDays.map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="bg-gray-50 min-h-[100px]" />
              }
              
              const unavailable = getUnavailableForDate(date)
              const conflicts = getConflictsForDate(date)
              const isPast = isPastDate(date)
              const isTodayDate = isToday(date)
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              
              return (
                <div
                  key={date.toISOString()}
                  onClick={() => !isPast && setSelectedDate(date)}
                  className={`
                    bg-white min-h-[100px] p-2 cursor-pointer transition-colors relative
                    ${isPast ? 'bg-gray-50' : 'hover:bg-gray-50'}
                    ${isTodayDate ? 'ring-2 ring-blue-500 ring-inset' : ''}
                    ${isWeekend && !isPast ? 'bg-gray-50/50' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-semibold mb-1
                    ${isPast ? 'text-gray-400' : 'text-gray-700'}
                    ${isTodayDate ? 'text-blue-600' : ''}
                  `}>
                    {date.getDate()}
                  </div>
                  
                  {/* Unavailable badges */}
                  <div className="space-y-1">
                    {unavailable.slice(0, 3).map(driver => (
                      <div
                        key={driver.id}
                        className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded truncate"
                      >
                        {driver.first_name}
                      </div>
                    ))}
                    {unavailable.length > 3 && (
                      <div className="text-xs text-gray-500">+{unavailable.length - 3} more</div>
                    )}
                  </div>
                  
                  {/* Conflict indicator */}
                  {conflicts.length > 0 && (
                    <div className="absolute top-2 right-2" title={`${conflicts.length} conflict(s)`}>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Legend */}
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

      {/* Slide-out Panel */}
      {selectedDate && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedDate(null)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-xl">
            <div className="h-full flex flex-col">
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  <p className="text-sm text-gray-500">{t('calendar.selectUnavailable', { role: t('roles.driver').toLowerCase() })}</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Driver list */}
              <div className="flex-1 overflow-auto p-6">
                <DatePanelContent
                  date={selectedDate}
                  drivers={drivers}
                  availability={availability}
                  tours={tours}
                  onSave={saveAllChanges}
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
  date: Date
  drivers: Driver[]
  availability: Availability[]
  tours: Tour[]
  onSave: (selectedIds: Set<string>) => void
  saving: boolean
}

function DatePanelContent({ date, drivers, availability, tours, onSave, saving }: DatePanelContentProps) {
  const { t } = useTranslation()
  const dateStr = date.toISOString().split('T')[0]
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    // Initialize with currently unavailable drivers
    const unavailableIds = availability
      .filter(a => a.date === dateStr && !a.is_available)
      .map(a => a.driver_id)
    setSelectedIds(new Set(unavailableIds))
  }, [date, availability])
  
  const toggleDriver = (driverId: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(driverId)) {
      newSet.delete(driverId)
    } else {
      newSet.add(driverId)
    }
    setSelectedIds(newSet)
  }
  
  const hasTour = (driverId: string) => {
    return tours.some(t => t.date === dateStr && t.driver_id === driverId)
  }

  return (
    <div className="space-y-4">
      {drivers.map(driver => {
        const isSelected = selectedIds.has(driver.id)
        const hasAssignedTour = hasTour(driver.id)
        
        return (
          <div
            key={driver.id}
            onClick={() => toggleDriver(driver.id)}
            className={`
              flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${isSelected 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
            `}>
              {isSelected && <span className="text-white text-xs">✓</span>}
            </div>
            
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-sm">
              {driver.first_name[0]}{driver.last_name[0]}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {driver.first_name} {driver.last_name}
              </div>
              <div className="text-xs text-gray-500">{driver.email}</div>
            </div>
            
            {hasAssignedTour && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>Has tour</span>
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
        {saving ? t('calendar.saving') : t('calendar.saveChanges')}
      </button>
    </div>
  )
}
