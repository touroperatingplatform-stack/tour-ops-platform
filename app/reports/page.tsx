'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface RevenueMetrics {
  total_revenue: number
  avg_per_tour: number
  avg_per_guest: number
  expenses: number
  net_profit: number
  profit_margin: number
}

interface TourPerformance {
  tour_name: string
  total_tours: number
  total_guests: number
  avg_rating: number
  revenue: number
  occupancy_rate: number
}

interface GuidePerformance {
  guide_name: string
  total_tours: number
  total_guests: number
  avg_rating: number
  on_time_percentage: number
  incidents: number
}

interface SatisfactionMetrics {
  avg_rating: number
  total_reviews: number
  rating_distribution: { 5: number; 4: number; 3: number; 2: number; 1: number }
  response_rate: number
}

export default function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'tours' | 'guides' | 'satisfaction'>('overview')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const [loading, setLoading] = useState(true)

  const [revenue, setRevenue] = useState<RevenueMetrics>({
    total_revenue: 0,
    avg_per_tour: 0,
    avg_per_guest: 0,
    expenses: 0,
    net_profit: 0,
    profit_margin: 0
  })

  const [tourPerformance, setTourPerformance] = useState<TourPerformance[]>([])
  const [guidePerformance, setGuidePerformance] = useState<GuidePerformance[]>([])
  const [satisfaction, setSatisfaction] = useState<SatisfactionMetrics>({
    avg_rating: 0,
    total_reviews: 0,
    rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    response_rate: 0
  })

  const [overview, setOverview] = useState({
    total_tours: 0,
    total_guests: 0,
    total_revenue: 0,
    avg_rating: 0
  })

  useEffect(() => {
    loadAllData()
  }, [dateRange])

  async function loadAllData() {
    setLoading(true)
    await Promise.all([
      loadRevenueData(),
      loadTourPerformance(),
      loadGuidePerformance(),
      loadSatisfactionData(),
      loadOverview()
    ])
    setLoading(false)
  }

  function getDateRange() {
    const now = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1))
        break
      case 'all':
        startDate = new Date(2024, 0, 1)
        break
    }
    
    return startDate.toISOString()
  }

  async function loadOverview() {
    const since = getDateRange()
    
    const { count: toursCount } = await supabase
      .from('tours')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since)

    const { count: guestsCount } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since)

    const { data: feedback } = await supabase
      .from('guest_feedback')
      .select('rating')
      .gte('created_at', since)

    const avgRating = feedback?.length 
      ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length 
      : 0

    // Estimate revenue (guests * avg price of $99)
    const estimatedRevenue = (guestsCount || 0) * 99

    setOverview({
      total_tours: toursCount || 0,
      total_guests: guestsCount || 0,
      total_revenue: estimatedRevenue,
      avg_rating: Math.round(avgRating * 10) / 10
    })
  }

  async function loadRevenueData() {
    const since = getDateRange()

    // Get tour revenue (estimated from guest count * price)
    const { data: tours } = await supabase
      .from('tours')
      .select('guest_count, price')
      .gte('created_at', since)

    const totalRevenue = tours?.reduce((sum, t) => sum + ((t.guest_count || 0) * (t.price || 99)), 0) || 0

    // Get expenses
    const { data: expensesData } = await supabase
      .from('tour_expenses')
      .select('amount')
      .gte('created_at', since)

    const totalExpenses = expensesData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0

    const totalGuests = tours?.reduce((sum, t) => sum + (t.guest_count || 0), 0) || 0
    const avgPerGuest = totalGuests ? totalRevenue / totalGuests : 0
    const avgPerTour = tours?.length ? totalRevenue / tours.length : 0

    setRevenue({
      total_revenue: Math.round(totalRevenue),
      avg_per_tour: Math.round(avgPerTour),
      avg_per_guest: Math.round(avgPerGuest),
      expenses: Math.round(totalExpenses),
      net_profit: Math.round(netProfit),
      profit_margin: Math.round(profitMargin)
    })
  }

  async function loadTourPerformance() {
    const since = getDateRange()

    const { data: tours } = await supabase
      .from('tours')
      .select('name, guest_count, capacity, price')
      .gte('created_at', since)
      .not('name', 'is', null)

    // Group by tour name
    const tourMap = new Map<string, TourPerformance>()
    
    tours?.forEach((t: any) => {
      const name = t.name || 'Unnamed Tour'
      if (!tourMap.has(name)) {
        tourMap.set(name, {
          tour_name: name,
          total_tours: 0,
          total_guests: 0,
          avg_rating: 0,
          revenue: 0,
          occupancy_rate: 0
        })
      }
      const perf = tourMap.get(name)!
      perf.total_tours += 1
      perf.total_guests += t.guest_count || 0
      perf.revenue += (t.guest_count || 0) * (t.price || 99)
      
      if (t.capacity && t.capacity > 0) {
        perf.occupancy_rate += (t.guest_count || 0) / t.capacity * 100
      }
    })

    // Get ratings per tour
    const { data: feedback } = await supabase
      .from('guest_feedback')
      .select('rating, tour_id')
      .gte('created_at', since)

    const tourRatings = new Map<string, { sum: number; count: number }>()
    feedback?.forEach((f: any) => {
      // Would need tour_id to tour_name mapping
      // Simplified for now
    })

    const result = Array.from(tourMap.values()).map(t => ({
      ...t,
      occupancy_rate: t.total_tours ? Math.round(t.occupancy_rate / t.total_tours) : 0
    })).sort((a, b) => b.revenue - a.revenue)

    setTourPerformance(result.slice(0, 10)) // Top 10 tours
  }

  async function loadGuidePerformance() {
    const since = getDateRange()

    const { data: guides } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('role', 'guide')

    const guideStats = new Map<string, GuidePerformance>()

    guides?.forEach((g: any) => {
      guideStats.set(g.id, {
        guide_name: `${g.first_name} ${g.last_name}`,
        total_tours: 0,
        total_guests: 0,
        avg_rating: 0,
        on_time_percentage: 100,
        incidents: 0
      })
    })

    // Get tours per guide
    const { data: tours } = await supabase
      .from('tours')
      .select('guide_id, guest_count')
      .gte('created_at', since)
      .not('guide_id', 'is', null)

    tours?.forEach((t: any) => {
      const stats = guideStats.get(t.guide_id)
      if (stats) {
        stats.total_tours += 1
        stats.total_guests += t.guest_count || 0
      }
    })

    // Get check-ins for on-time percentage
    const { data: checkins } = await supabase
      .from('guide_checkins')
      .select('guide_id, minutes_early_or_late')
      .gte('created_at', since)

    const guideCheckins = new Map<string, { onTime: number; total: number }>()
    checkins?.forEach((c: any) => {
      if (!guideCheckins.has(c.guide_id)) {
        guideCheckins.set(c.guide_id, { onTime: 0, total: 0 })
      }
      const data = guideCheckins.get(c.guide_id)!
      data.total += 1
      if ((c.minutes_early_or_late || 0) >= -5) {
        data.onTime += 1
      }
    })

    guideCheckins.forEach((data, guideId) => {
      const stats = guideStats.get(guideId)
      if (stats) {
        stats.on_time_percentage = Math.round((data.onTime / data.total) * 100)
      }
    })

    // Get incidents per guide
    const { data: incidents } = await supabase
      .from('incidents')
      .select('guide_id')
      .gte('created_at', since)

    incidents?.forEach((i: any) => {
      const stats = guideStats.get(i.guide_id)
      if (stats) {
        stats.incidents += 1
      }
    })

    const result = Array.from(guideStats.values())
      .filter(g => g.total_tours > 0)
      .sort((a, b) => b.total_tours - a.total_tours)

    setGuidePerformance(result.slice(0, 10)) // Top 10 guides
  }

  async function loadSatisfactionData() {
    const since = getDateRange()

    const { data: feedback } = await supabase
      .from('guest_feedback')
      .select('rating, responded')
      .gte('created_at', since)

    const totalReviews = feedback?.length || 0
    const avgRating = feedback?.length
      ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length
      : 0

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let respondedCount = 0

    feedback?.forEach((f: any) => {
      const rating = Math.round(f.rating || 0)
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++
      }
      if (f.responded) respondedCount++
    })

    setSatisfaction({
      avg_rating: Math.round(avgRating * 10) / 10,
      total_reviews: totalReviews,
      rating_distribution: distribution,
      response_rate: totalReviews ? Math.round((respondedCount / totalReviews) * 100) : 0
    })
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col w-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Business intelligence and performance metrics</p>
          </div>
          
          <div className="flex items-center gap-2">
            {(['today', 'week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'overview', label: '📊 Overview', count: null },
            { id: 'revenue', label: '💰 Revenue', count: null },
            { id: 'tours', label: '🚌 Tours', count: tourPerformance.length },
            { id: 'guides', label: '👥 Guides', count: guidePerformance.length },
            { id: 'satisfaction', label: '⭐ Satisfaction', count: satisfaction.total_reviews }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 uppercase font-medium">Total Tours</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{overview.total_tours}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 uppercase font-medium">Total Guests</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{overview.total_guests}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 uppercase font-medium">Revenue</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(overview.total_revenue)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 uppercase font-medium">Avg Rating</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">⭐ {overview.avg_rating}</p>
              </div>
            </div>

            {/* Revenue Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">💰 Revenue Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-semibold text-green-600">{formatCurrency(revenue.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expenses</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(revenue.expenses)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-medium">Net Profit</span>
                    <span className="font-bold text-green-600">{formatCurrency(revenue.net_profit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit Margin</span>
                    <span className="font-semibold">{revenue.profit_margin}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">⭐ Customer Satisfaction</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="text-2xl">⭐ {satisfaction.avg_rating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Reviews</span>
                    <span className="font-semibold">{satisfaction.total_reviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Rate</span>
                    <span className="font-semibold">{satisfaction.response_rate}%</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex gap-1">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex-1">
                          <div className="text-xs text-center text-gray-500 mb-1">{rating}⭐</div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400"
                              style={{ width: `${satisfaction.total_reviews ? (satisfaction.rating_distribution[rating as keyof typeof satisfaction.rating_distribution] / satisfaction.total_reviews) * 100 : 0}%` }}
                            />
                          </div>
                          <div className="text-xs text-center text-gray-500 mt-1">
                            {satisfaction.rating_distribution[rating as keyof typeof satisfaction.rating_distribution]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">💰 Revenue Breakdown</h2>
              
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 uppercase font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">{formatCurrency(revenue.total_revenue)}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 uppercase font-medium">Avg per Tour</p>
                  <p className="text-3xl font-bold text-blue-700 mt-2">{formatCurrency(revenue.avg_per_tour)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 uppercase font-medium">Avg per Guest</p>
                  <p className="text-3xl font-bold text-purple-700 mt-2">{formatCurrency(revenue.avg_per_guest)}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Profit & Loss</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700">Gross Revenue</span>
                    <span className="font-bold text-green-700">{formatCurrency(revenue.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700">Total Expenses</span>
                    <span className="font-bold text-red-700">{formatCurrency(revenue.expenses)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border-2">
                    <span className="font-bold text-gray-900">Net Profit</span>
                    <span className="font-bold text-gray-900">{formatCurrency(revenue.net_profit)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span className="text-gray-600">Profit Margin</span>
                    <span className="font-semibold">{revenue.profit_margin}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tours' && (
          <div className="max-w-6xl">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">🚌 Tour Performance (Top 10)</h2>
              </div>
              
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tour Name</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Tours</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Guests</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Occupancy</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tourPerformance.map((tour, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{tour.tour_name}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{tour.total_tours}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{tour.total_guests}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tour.occupancy_rate >= 80 ? 'bg-green-100 text-green-700' :
                          tour.occupancy_rate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {tour.occupancy_rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        {formatCurrency(tour.revenue)}
                      </td>
                    </tr>
                  ))}
                  {tourPerformance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No tour data available for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'guides' && (
          <div className="max-w-6xl">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">👥 Guide Performance (Top 10)</h2>
              </div>
              
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Guide</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Tours</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Guests</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">On-Time</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Incidents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {guidePerformance.map((guide, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{guide.guide_name}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{guide.total_tours}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{guide.total_guests}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          guide.on_time_percentage >= 90 ? 'bg-green-100 text-green-700' :
                          guide.on_time_percentage >= 70 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {guide.on_time_percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {guide.incidents > 0 ? (
                          <span className="text-red-600 font-medium">{guide.incidents}</span>
                        ) : (
                          <span className="text-green-600">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {guidePerformance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No guide data available for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'satisfaction' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">⭐ Customer Satisfaction</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-600 uppercase font-medium">Average Rating</p>
                  <p className="text-4xl font-bold text-yellow-700 mt-2">⭐ {satisfaction.avg_rating}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 uppercase font-medium">Total Reviews</p>
                  <p className="text-4xl font-bold text-blue-700 mt-2">{satisfaction.total_reviews}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 uppercase font-medium">Response Rate</p>
                  <p className="text-4xl font-bold text-green-700 mt-2">{satisfaction.response_rate}%</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = satisfaction.rating_distribution[rating as keyof typeof satisfaction.rating_distribution]
                    const percentage = satisfaction.total_reviews ? (count / satisfaction.total_reviews) * 100 : 0
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="w-12 text-sm font-medium text-gray-700">{rating} Stars</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-16 text-sm text-gray-600 text-right">{count}</span>
                        <span className="w-12 text-sm text-gray-500 text-right">{Math.round(percentage)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
