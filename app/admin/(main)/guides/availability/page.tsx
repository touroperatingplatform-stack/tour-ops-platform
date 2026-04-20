'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Guide {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
}

interface Availability {
  guide_id: string
  schedule_date: string
  is_available: boolean
}

interface Tour {
  id: string
  guide_id: string
  tour_date: string
}

// Helper to get year and month from date string YYYY-MM-DD
function parseDateStr(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr) return { year: 2024, month: 0, day: 1 }
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month: month - 1, day } // month is 0-indexed
}

// Helper to format date string for display
function formatMonthYear(dateStr: string, locale: string = 'en-US'): string {
  const { year, month } = parseDateStr(dateStr)
  const date = new Date(year, month, 1)
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

// Helper to get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Helper to get first day of month (0 = Sunday)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

// Helper to create date string
function createDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Helper to add months to a date string
function addMonths(dateStr: string, months: number): string {
  const { year, month, day } = parseDateStr(dateStr)
  const newDate = new Date(year, month + months, day)
  return createDateStr(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())
}

export default function GuideAvailabilityPage() {
  const { t } = useTranslation()
  const [guides, setGuides] = useState<Guide[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  // Use string dates (YYYY-MM-DD) like the rest of the platform
  const [currentMonth, setCurrentMonth] = useState<string>(getLocalDate().slice(0, 7) + '-01')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const today = getLocalDate()

  useEffect(() => {
    loadData()
  }, [currentMonth])

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

    // Load guides
    const { data: guidesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .eq('company_id', profile.company_id)
      .eq('role', 'guide')
      .eq('status', 'active')
      .order('first_name')

    if (guidesData) {
      setGuides(guidesData)
    }

    // Load availability for current month view
    const { year, month } = parseDateStr(currentMonth)
    const startDate = createDateStr(year, month, 1)
    const endDate = createDateStr(year, month + 1, 1)

    const { data: availData } = await supabase
      .from('guide_schedules')
      .select('guide_id, schedule_date, is_available')
      .gte('schedule_date', startDate)
      .lt('schedule_date', endDate)

    if (availData) {
      setAvailability(availData)
    }

    // Load tours for conflict checking
    const { data: toursData } = await supabase
      .from('tours')
      .select('id, guide_id, tour_date')
      .eq('company_id', profile.company_id)
      .gte('tour_date', startDate)
      .lt('tour_date', endDate)
      .not('guide_id', 'is', null)

    if (toursData) {
      setTours(toursData)
    }

    setLoading(false)
  }

  const calendarDays = useMemo(() => {
    const { year, month } = parseDateStr(currentMonth)
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    const days: (string | null)[] = []
    
    // Padding from previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(createDateStr(year, month, i))
    }
    
    return days
  }, [currentMonth])

  const monthYear = formatMonthYear(currentMonth)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function getUnavailableForDate(dateStr: string): Guide[] {
    const unavailableIds = availability
      .filter(a => a.schedule_date === dateStr && !a.is_available)
      .map(a => a.guide_id)
    return guides.filter(g => unavailableIds.includes(g.id))
  }

  function getConflictsForDate(dateStr: string): Tour[] {
    const unavailableIds = availability
      .filter(a => a.schedule_date === dateStr && !a.is_available)
      .map(a => a.guide_id)
    return tours.filter(t => t.tour_date === dateStr && unavailableIds.includes(t.guide_id))
  }

  function isPastDate(dateStr: string): boolean {
    return dateStr < today
  }

  function isToday(dateStr: string): boolean {
    return dateStr === today
  }

  async function saveAllChanges(selectedIds: Set<string>) {
    if (!selectedDate || !companyId) return
    
    setSaving(true)
    
    const updates = guides.map(guide => ({
      guide_id: guide.id,
      schedule_date: selectedDate,
      is_available: !selectedIds.has(guide.id)
    }))
    
    await supabase
      .from('guide_schedules')
      .upsert(updates, {
        onConflict: 'guide_id,schedule_date'
      })
    
    await loadData()
    setSaving(false)
  }

  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

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
              <h1 className="text-xl font-bold text-gray-900">{t('roles.guide')} {t('calendar.title')}</h1>
              <p className="text-gray-500 text-sm">{t('calendar.clickDate')}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
              <span className="text-lg font-semibold min-w-[140px] text-center">{monthYear}</span>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                →
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
            {calendarDays.map((dateStr, i) => {
              if (!dateStr) {
                return <div key={`empty-${i}`} className="bg-gray-50 min-h-[100px]" />
              }
              
              const unavailable = getUnavailableForDate(dateStr)
              const conflicts = getConflictsForDate(dateStr)
              const isPast = isPastDate(dateStr)
              const isTodayDate = isToday(dateStr)
              const parsed = parseDateStr(dateStr)
              const dayNum = parsed.day
              const isWeekend = [0, 6].includes(new Date(parsed.year, parsed.month, dayNum).getDay())
              
              return (
                <div
                  key={dateStr}
                  onClick={() => !isPast && setSelectedDate(dateStr)}
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
                    {dayNum}
                  </div>
                  
                  {/* Unavailable badges */}
                  <div className="space-y-1">
                    {unavailable.slice(0, 3).map(guide => (
                      <div
                        key={guide.id}
                        className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded truncate"
                      >
                        {guide.first_name}
                      </div>
                    ))}
                    {unavailable.length > 3 && (
                      <div className="text-xs text-gray-500">+{unavailable.length - 3} more</div>
                    )}
                  </div>
                  
                  {/* Conflict indicator */}
                  {conflicts.length > 0 && (
                    <div className="absolute top-2 right-2" title={`${conflicts.length} conflict(s)`}>
                      ⚠️
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
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
                    {selectedDate}
                  </h2>
                  <p className="text-sm text-gray-500">{t('calendar.selectUnavailable')}</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
              
              {/* Guide list */}
              <div className="flex-1 overflow-auto p-6">
                <DatePanelContent
                  date={selectedDate}
                  guides={guides}
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
  date: string
  guides: Guide[]
  availability: Availability[]
  tours: Tour[]
  onSave: (selectedIds: Set<string>) => void
  saving: boolean
}

function DatePanelContent({ date, guides, availability, tours, onSave, saving }: DatePanelContentProps) {
  const { t } = useTranslation()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    // Initialize with currently unavailable guides
    const unavailableIds = availability
      .filter(a => a.schedule_date === date && !a.is_available)
      .map(a => a.guide_id)
    setSelectedIds(new Set(unavailableIds))
  }, [date, availability])
  
  const toggleGuide = (guideId: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(guideId)) {
      newSet.delete(guideId)
    } else {
      newSet.add(guideId)
    }
    setSelectedIds(newSet)
  }
  
  const hasTour = (guideId: string) => {
    return tours.some(t => t.tour_date === date && t.guide_id === guideId)
  }

  return (
    <div className="space-y-4">
      {guides.map(guide => {
        const isSelected = selectedIds.has(guide.id)
        const hasAssignedTour = hasTour(guide.id)
        
        return (
          <div
            key={guide.id}
            onClick={() => toggleGuide(guide.id)}
            className={`
              flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${isSelected 
                ? 'border-amber-300 bg-amber-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-300'}
            `}>
              {isSelected && <span className="text-white text-xs">✓</span>}
            </div>
            
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm">
              {guide.first_name[0]}{guide.last_name[0]}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {guide.first_name} {guide.last_name}
              </div>
              <div className="text-xs text-gray-500">{guide.email}</div>
            </div>
            
            {hasAssignedTour && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                ⚠️ <span>{t('calendar.hasTour')}</span>
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
