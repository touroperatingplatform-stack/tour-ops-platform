'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getLocalDate } from '@/lib/timezone'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Guide {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Availability {
  guide_id: string
  schedule_date: string
  is_available: boolean
}

// Get today's date as YYYY-MM-DD
function getToday(): string {
  return getLocalDate()
}

// Get year/month from YYYY-MM-DD
function getYearMonthDay(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-')
  return {
    year: parseInt(parts[0]) || 2024,
    month: parseInt(parts[1]) || 1,
    day: parseInt(parts[2]) || 1
  }
}

// Create YYYY-MM-DD from components
function makeDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Get first day of month (0 = Sunday)
function getFirstDay(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// Add months to a date
function addMonths(dateStr: string, addMonths: number): string {
  const { year, month, day } = getYearMonthDay(dateStr)
  const newDate = new Date(year, month - 1 + addMonths, day)
  return makeDateStr(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate())
}

// Format month name
function formatMonthName(dateStr: string): string {
  const { year, month } = getYearMonthDay(dateStr)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function GuideAvailabilityPage() {
  const { t } = useTranslation()
  const [guides, setGuides] = useState<Guide[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const today = getToday()
  const [currentMonthStr, setCurrentMonthStr] = useState(today.slice(0, 7) + '-01') // YYYY-MM-01
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Parse current month
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

      // Load guides
      const { data: guidesData, error: guidesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('company_id', profile.company_id)
        .eq('role', 'guide')
        .eq('status', 'active')
        .order('first_name')

      if (guidesError) {
        setError('Failed to load guides: ' + guidesError.message)
        setLoading(false)
        return
      }

      if (guidesData) {
        setGuides(guidesData)
      }

      // Load availability
      const startDate = makeDateStr(currentYear, currentMonth, 1)
      const endDate = makeDateStr(currentYear, currentMonth + 1, 1)

      const { data: availData, error: availError } = await supabase
        .from('guide_schedules')
        .select('guide_id, schedule_date, is_available')
        .gte('schedule_date', startDate)
        .lt('schedule_date', endDate)

      if (availError) {
        setError('Failed to load availability: ' + availError.message)
        setLoading(false)
        return
      }

      if (availData) {
        setAvailability(availData)
      }
    } catch (e: any) {
      setError('Error: ' + e.message)
    }

    setLoading(false)
  }

  // Build calendar days
  const calendarDays = useMemo(() => {
    const firstDay = getFirstDay(currentYear, currentMonth)
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    
    const days: (string | null)[] = []
    
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(makeDateStr(currentYear, currentMonth, i))
    }
    
    return days
  }, [currentYear, currentMonth])

  function getUnavailableCount(dateStr: string): number {
    return availability.filter(a => a.schedule_date === dateStr && !a.is_available).length
  }

  function isPast(dateStr: string): boolean {
    return dateStr < today
  }

  function isTodayDate(dateStr: string): boolean {
    return dateStr === today
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('common.loading') || 'Loading...'}</div>
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Guide Availability</h1>
              <p className="text-gray-500 text-sm">Click a date to manage availability</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentMonthStr(addMonths(currentMonthStr, -1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <span className="text-lg font-semibold min-w-[180px] text-center">
                {formatMonthName(currentMonthStr)}
              </span>
              <button
                onClick={() => setCurrentMonthStr(addMonths(currentMonthStr, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
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
              
              const unavailableCount = getUnavailableCount(dateStr)
              const isPastDate = isPast(dateStr)
              const isToday = isTodayDate(dateStr)
              const dayNum = parseInt(dateStr.split('-')[2]) || 1
              const isWeekend = [0, 6].includes(new Date(currentYear, currentMonth - 1, dayNum).getDay())
              
              return (
                <div
                  key={dateStr}
                  onClick={() => !isPastDate && setSelectedDate(dateStr)}
                  className={`
                    bg-white min-h-[100px] p-2 cursor-pointer transition-colors relative
                    ${isPastDate ? 'bg-gray-50' : 'hover:bg-gray-50'}
                    ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}
                    ${isWeekend && !isPastDate ? 'bg-gray-50/50' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-semibold mb-1
                    ${isPastDate ? 'text-gray-400' : 'text-gray-700'}
                    ${isToday ? 'text-blue-600' : ''}
                  `}>
                    {dayNum}
                  </div>
                  
                  {unavailableCount > 0 && (
                    <div className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded inline-block">
                      {unavailableCount} unavailable
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Slide-out Panel */}
      {selectedDate && (
        <SlideOutPanel
          date={selectedDate}
          guides={guides}
          availability={availability}
          onClose={() => setSelectedDate(null)}
          onSave={async (selectedIds) => {
            setSaving(true)
            try {
              const updates = guides.map(guide => ({
                guide_id: guide.id,
                schedule_date: selectedDate,
                is_available: !selectedIds.has(guide.id)
              }))
              
              await supabase
                .from('guide_schedules')
                .upsert(updates, { onConflict: 'guide_id,schedule_date' })
              
              await loadData()
            } catch (e) {
              console.error(e)
            }
            setSaving(false)
          }}
          saving={saving}
        />
      )}
    </div>
  )
}

interface SlideOutPanelProps {
  date: string
  guides: Guide[]
  availability: Availability[]
  onClose: () => void
  onSave: (selectedIds: Set<string>) => void
  saving: boolean
}

function SlideOutPanel({ date, guides, availability, onClose, onSave, saving }: SlideOutPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    const unavailableIds = availability
      .filter(a => a.schedule_date === date && !a.is_available)
      .map(a => a.guide_id)
    setSelectedIds(new Set(unavailableIds))
  }, [date, availability])
  
  const toggle = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-xl">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">{date}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">✕</button>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-3">
              {guides.map(guide => {
                const selected = selectedIds.has(guide.id)
                return (
                  <div
                    key={guide.id}
                    onClick={() => toggle(guide.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                      selected ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selected ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                    }`}>
                      {selected && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="flex-1">{guide.first_name} {guide.last_name}</span>
                  </div>
                )
              })}
            </div>
            
            <button
              onClick={() => onSave(selectedIds)}
              disabled={saving}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
