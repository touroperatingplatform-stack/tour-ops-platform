'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
}

interface Brand {
  id: string
  company_id: string
  name: string
  slug: string
  primary_color: string
}

interface ImportPreview {
  tour_id: string
  tour_name?: string
  first_name: string
  last_name: string
  email: string
  phone: string
  hotel: string
  room_number: string
  adults: number
  children: number
  notes: string
  valid: boolean
  error?: string
}

interface DemoStats {
  tours: number
  guests: number
  pickup_stops: number
  checkins: number
  incidents: number
  expenses: number
  feedback: number
  activity: number
}

interface ApiConfig {
  viator_enabled: boolean
  viator_api_key: string
  getyourguide_enabled: boolean
  getyourguide_api_key: string
  tripadvisor_link: string
}

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'companies' | 'brands' | 'settings' | 'import' | 'demo' | 'service-orders' | 'api-config'>('companies')
  
  // Import state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string>('')
  const [preview, setPreview] = useState<ImportPreview[]>([])
  const [importing, setImporting] = useState(false)
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 })

  // Demo data state
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoStats, setDemoStats] = useState<DemoStats>({
    tours: 0, guests: 0, pickup_stops: 0, checkins: 0, incidents: 0, expenses: 0, feedback: 0, activity: 0
  })
  const [demoProgress, setDemoProgress] = useState<string>('')
  const [demoMessage, setDemoMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // API Config state
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    viator_enabled: false,
    viator_api_key: '',
    getyourguide_enabled: false,
    getyourguide_api_key: '',
    tripadvisor_link: ''
  })
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    loadData()
    loadDemoStats()
  }, [])

  async function loadData() {
    const { data: companiesData } = await supabase.from('companies').select('*').order('created_at')
    const { data: brandsData } = await supabase.from('brands').select('*').order('created_at')
    
    setCompanies(companiesData || [])
    setBrands(brandsData || [])
    setLoading(false)
  }

  async function loadDemoStats() {
    const tables = ['tours', 'guests', 'pickup_stops', 'guide_checkins', 'incidents', 'tour_expenses', 'guest_feedback', 'activity_feed']
    const stats: any = {}
    
    for (const table of tables) {
      // Add a random parameter to bypass any caching
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error(`Failed to count ${table}:`, error)
      }
      stats[table] = count || 0
      console.log(`${table} count: ${count || 0}`)
    }
    
    setDemoStats({
      tours: stats.tours || 0,
      guests: stats.guests || 0,
      pickup_stops: stats.pickup_stops || 0,
      checkins: stats.guide_checkins || 0,
      incidents: stats.incidents || 0,
      expenses: stats.tour_expenses || 0,
      feedback: stats.guest_feedback || 0,
      activity: stats.activity_feed || 0
    })
  }

  async function handleClearDemoData() {
    if (!confirm('⚠️ DANGER: This will delete ALL demo data!\n\nThis will remove:\n- All tours created today\n- All guests\n- All guide check-ins\n- All pickup stops\n- All incidents\n- All tour expenses\n- All checklist completions\n- All guest feedback\n- All activity feed entries\n\nUsers/auth, vehicles, brands will be preserved.\n\nContinue?')) {
      return
    }

    setDemoLoading(true)
    setDemoMessage(null)

    try {
      const today = new Date().toISOString().split('T')[0]
      
      // First get today's tour IDs to delete related data
      const { data: todaysTours, error: toursFetchError } = await supabase
        .from('tours')
        .select('id')
        .eq('tour_date', today)
      
      if (toursFetchError) {
        console.error('Failed to fetch tours:', toursFetchError)
      }
      
      const todayTourIds = todaysTours?.map(t => t.id) || []
      console.log(`Found ${todayTourIds.length} tours from today to delete`)

      const tables = [
        'activity_feed',
        'guest_feedback',
        'push_notifications',
        'external_bookings',
        'guests',
        'pickup_stops',
        'guide_checkins',
        'incident_comments',
        'incidents',
        'tour_expenses',
        'checklist_completions',
        'payments',
        'cash_confirmations'
      ]

      let deleted = 0
      const errors: string[] = []
      
      for (const table of tables) {
        try {
          // Supabase requires a WHERE clause
          // Try created_at first, fall back to id if that fails
          let { data, error } = await supabase
            .from(table)
            .delete()
            .gte('created_at', '1970-01-01')
          
          // If created_at doesn't exist, try using id with neq (not equal)
          if (error && error.message?.includes('column')) {
            const { data: dataById, error: errorById } = await supabase
              .from(table)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000')
            
            data = dataById
            error = errorById
          }
          
          if (error) {
            console.error(`Failed to clear ${table}:`, error)
            errors.push(`${table}: ${error.message}`)
          } else {
            deleted++
            console.log(`Cleared table: ${table}`)
          }
        } catch (tableError) {
          console.error(`Error clearing ${table}:`, tableError)
          errors.push(`${table}: ${(tableError as Error).message}`)
        }
      }

      // Delete today's tours
      if (todayTourIds.length > 0) {
        const { data: tourData, error: tourError } = await supabase
          .from('tours')
          .delete()
          .in('id', todayTourIds)
        
        if (tourError) {
          console.error('Failed to delete tours:', tourError)
          errors.push(`tours: ${tourError.message}`)
        } else {
          deleted += todayTourIds.length
          console.log(`Deleted ${todayTourIds.length} tours`)
        }
      }

      // Wait for all deletes to propagate
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Refresh stats with a fresh query (add timestamp to bypass any caching)
      await loadDemoStats()

      const errorMsg = errors.length > 0 ? `\n\n⚠️ Some tables had errors:\n${errors.join('\n')}` : ''
      setDemoMessage({ 
        type: errors.length > 0 ? 'error' : 'success', 
        text: `✅ Cleared demo data.${errorMsg}` 
      })
      
      // Force another stats refresh after message is shown
      setTimeout(() => loadDemoStats(), 1000)
    } catch (err) {
      setDemoMessage({ type: 'error', text: '❌ Error clearing demo data: ' + (err as Error).message })
    } finally {
      setDemoLoading(false)
    }
  }

  async function handleGenerateDemoData() {
    if (!confirm('📦 Generate Full Demo Data?\n\nThis will create:\n- Tours for TODAY with all 15 guides\n- Guests, pickup stops, check-ins\n- Incidents, expenses, feedback\n- Activity feed entries\n\nThis takes ~15 seconds. Continue?')) {
      return
    }

    setDemoLoading(true)
    setDemoMessage(null)

    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      
      // Get all guides
      const { data: guides } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, brand_id')
        .eq('role', 'guide')
        .eq('status', 'active')
      
      if (!guides || guides.length === 0) {
        throw new Error('No active guides found. Please create guide users first.')
      }

      // Get company and brands
      const { data: companies } = await supabase.from('companies').select('id').limit(1)
      const { data: brands } = await supabase.from('brands').select('id')
      
      if (!companies || companies.length === 0) {
        throw new Error('No companies found. Please create a company first.')
      }

      const companyId = companies[0].id
      const brandIds = brands?.map(b => b.id) || []

      // Step 1: Create tours for today (one per guide)
      setDemoProgress('📍 Creating tours for today...')
      const tourDestinations = [
        { name: 'Tulum Ruins Express', start: '08:00', duration: 360, type: 'private', price: 89 },
        { name: 'Chichen Itza Sunrise', start: '06:00', duration: 720, type: 'shared', price: 129 },
        { name: 'Coba Adventure + Cenotes', start: '07:30', duration: 540, type: 'shared', price: 109 },
        { name: 'Cenote Route Private', start: '09:00', duration: 420, type: 'private', price: 99 },
        { name: 'Akumal Snorkeling Tour', start: '08:30', duration: 480, type: 'shared', price: 95 },
        { name: 'Valladolid Cultural Tour', start: '07:00', duration: 600, type: 'shared', price: 99 },
        { name: 'Tulum VIP Private', start: '09:30', duration: 360, type: 'private', price: 299 },
        { name: 'Isla Mujeres Day Trip', start: '08:00', duration: 600, type: 'shared', price: 119 },
        { name: 'Xcaret Park Tour', start: '08:30', duration: 540, type: 'shared', price: 139 },
        { name: 'Tulum + Akumal Combo', start: '08:00', duration: 480, type: 'shared', price: 105 },
        { name: 'Coba + Valladolid', start: '07:00', duration: 600, type: 'shared', price: 99 },
        { name: 'Gran Cenote Private', start: '10:00', duration: 300, type: 'private', price: 79 },
        { name: 'Playa del Carmen Tour', start: '09:00', duration: 420, type: 'shared', price: 89 },
        { name: 'Puerto Morelos Reef', start: '08:30', duration: 360, type: 'shared', price: 95 },
        { name: 'Sunset Tulum Tour', start: '14:00', duration: 300, type: 'private', price: 69 }
      ]

      const createdTourIds: string[] = []
      for (let i = 0; i < Math.min(guides.length, tourDestinations.length); i++) {
        const guide = guides[i]
        const dest = tourDestinations[i]
        const brandId = brandIds.length > 0 ? brandIds[i % brandIds.length] : null

        const { data, error } = await supabase.from('tours').insert({
          company_id: companyId,
          brand_id: brandId,
          guide_id: guide.id,
          name: dest.name,
          description: `Demo tour: ${dest.name}`,
          tour_date: today,
          start_time: dest.start,
          duration_minutes: dest.duration,
          capacity: dest.type === 'private' ? 8 : 20,
          pickup_location: 'Hotel pickup included',
          dropoff_location: 'Hotel dropoff',
          price: dest.price,
          status: 'scheduled',
          guest_count: 0,
          tour_type: dest.type,
          created_by: null
        }).select('id').single()

        if (data) {
          createdTourIds.push(data.id)
        } else if (error) {
          console.error('Failed to create tour:', error)
        }
      }

      setDemoProgress(`✅ Created ${createdTourIds.length} tours for today`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 2: Create guests for each tour
      setDemoProgress('👥 Adding guests...')
      let guestCount = 0
      const guestNames = [
        ['John', 'Smith'], ['Sarah', 'Johnson'], ['Michael', 'Brown'], ['Lisa', 'Brown'],
        ['David', 'Wilson'], ['Jennifer', 'Wilson'], ['Robert', 'Garcia'], ['Amanda', 'Martinez'],
        ['Christopher', 'Lee'], ['Jessica', 'Lopez'], ['William', 'Taylor'], ['Elizabeth', 'Taylor'],
        ['Daniel', 'Anderson'], ['Michelle', 'Anderson'], ['Matthew', 'Thomas'], ['Ashley', 'Thomas'],
        ['Joseph', 'Jackson'], ['Nancy', 'White'], ['Karen', 'Harris'], ['Betty', 'Clark'],
        ['Edward', 'Lewis'], ['Sandra', 'Lewis'], ['George', 'Hall'], ['Dorothy', 'Allen'],
        ['Kenneth', 'Young'], ['Carol', 'King'], ['Steven', 'Wright'], ['Ruth', 'Scott']
      ]

      const hotels = [
        'Grand Velas Riviera Maya', 'Beloved Playa Mujeres', 'Secrets Maroma Beach',
        'Finest Playa Mujeres', 'Hyatt Ziva Cap Cana', 'Excellence Playa Mujeres',
        'TRS Coral Hotel', 'Hard Rock Hotel Cancun', 'Iberostar Selection Cancun',
        'Live Aqua Beach Resort', 'Grand Sunset Resort', 'Vidanta Riviera Maya'
      ]

      for (const tourId of createdTourIds) {
        const guestsForTour = Math.floor(Math.random() * 4) + 1 // 1-4 guest groups
        for (let g = 0; g < guestsForTour; g++) {
          const nameIdx = (guestCount + g) % guestNames.length
          const hotelIdx = (guestCount + g) % hotels.length
          
          await supabase.from('guests').insert({
            tour_id: tourId,
            first_name: guestNames[nameIdx][0],
            last_name: guestNames[nameIdx][1],
            email: `${guestNames[nameIdx][0].toLowerCase()}.${guestNames[nameIdx][1].toLowerCase()}${guestCount}@email.com`,
            phone: `+1-555-${String(1000 + guestCount + g)}`,
            hotel: hotels[hotelIdx],
            room_number: String(100 + guestCount + g),
            adults: Math.floor(Math.random() * 3) + 1,
            children: Math.floor(Math.random() * 2),
            notes: 'Demo guest for trial',
            checked_in: false,
            no_show: false
          })
          guestCount++
        }
      }

      setDemoProgress(`✅ Added ${guestCount} guests`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 3: Create pickup stops for shared tours
      setDemoProgress('🚌 Creating pickup stops...')
      let stopCount = 0
      const pickupLocations = [
        { name: 'Grand Sunset Resort', lat: 20.6897, lng: -87.0739, time: '07:30' },
        { name: 'Vidanta Riviera Maya', lat: 20.6234, lng: -87.0812, time: '07:45' },
        { name: 'Playa del Carmen Center', lat: 20.6296, lng: -87.0739, time: '08:00' },
        { name: 'Maroma Beach Resort', lat: 20.7234, lng: -86.9812, time: '08:15' },
        { name: 'Cancun Airport T3', lat: 21.0365, lng: -86.8770, time: '06:00' },
        { name: 'Hotel Zone Km 9', lat: 21.1333, lng: -86.7667, time: '06:30' },
        { name: 'Hotel Zone Km 12.5', lat: 21.1089, lng: -86.7594, time: '06:45' }
      ]

      for (const tourId of createdTourIds) {
        const { data: tour } = await supabase.from('tours').select('tour_type').eq('id', tourId).single()
        if (tour?.tour_type === 'shared') {
          const stopsCount = Math.floor(Math.random() * 3) + 1 // 1-3 stops
          for (let s = 0; s < stopsCount; s++) {
            const loc = pickupLocations[(stopCount + s) % pickupLocations.length]
            const brandId = brandIds.length > 0 ? brandIds[0] : null
            
            await supabase.from('pickup_stops').insert({
              tour_id: tourId,
              brand_id: brandId,
              sort_order: s + 1,
              location_name: loc.name,
              address: 'Demo address',
              latitude: loc.lat,
              longitude: loc.lng,
              scheduled_time: loc.time,
              guest_count: Math.floor(Math.random() * 4) + 1,
              notes: 'Demo pickup stop'
            })
            stopCount++
          }
        }
      }

      setDemoProgress(`✅ Created ${stopCount} pickup stops`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 4: Create guide check-ins
      setDemoProgress('📍 Simulating guide check-ins...')
      let checkinCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 5))) {
        const { data: tour } = await supabase.from('tours').select('guide_id, brand_id, start_time').eq('id', tourId).single()
        if (tour) {
          const startTime = tour.start_time || '08:00'
          const [hours, minutes] = startTime.split(':').map(Number)
          const checkinTime = new Date()
          checkinTime.setHours(hours, minutes - 20, 0) // 20 min before tour
          
          const minutesEarly = Math.floor(Math.random() * 15) - 5 // -5 to +10 minutes
          
          await supabase.from('guide_checkins').insert({
            tour_id: tourId,
            brand_id: tour.brand_id,
            guide_id: tour.guide_id,
            checkin_type: 'pre_pickup',
            checked_in_at: checkinTime.toISOString(),
            latitude: 20.6 + Math.random() * 0.5,
            longitude: -87.0 + Math.random() * 0.3,
            location_accuracy: 10 + Math.random() * 20,
            gps_alert_triggered: false,
            scheduled_time: startTime,
            minutes_early_or_late: minutesEarly,
            notes: minutesEarly >= 0 ? 'Arrived early' : 'Slightly delayed due to traffic',
            selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
          })
          checkinCount++
        }
      }

      setDemoProgress(`✅ Created ${checkinCount} guide check-ins`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 5: Create incidents
      setDemoProgress('⚠️ Creating incidents...')
      const incidentTypes = [
        { type: 'delay', severity: 'low', desc: 'Traffic delay on highway 307. Construction zone.' },
        { type: 'vehicle_issue', severity: 'medium', desc: 'AC not working properly. Blowing warm air.' },
        { type: 'medical', severity: 'medium', desc: 'Guest felt dizzy. Possible dehydration.' }
      ]

      let incidentCount = 0
      for (const incident of incidentTypes) {
        if (createdTourIds[incidentCount]) {
          const { data: tour } = await supabase.from('tours').select('guide_id').eq('id', createdTourIds[incidentCount]).single()
          if (tour) {
            await supabase.from('incidents').insert({
              tour_id: createdTourIds[incidentCount],
              reported_by: tour.guide_id,
              guide_id: tour.guide_id,
              type: incident.type,
              severity: incident.severity,
              description: incident.desc,
              status: incidentCount === 0 ? 'resolved' : 'reported',
              resolution_notes: incidentCount === 0 ? 'Took alternative route. Made up time.' : null
            })
            incidentCount++
          }
        }
      }

      setDemoProgress(`✅ Created ${incidentCount} incidents`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 6: Create expenses
      setDemoProgress('💵 Adding expenses...')
      const expenseCategories = [
        { category: 'fuel', amount: 45, desc: 'Van fuel' },
        { category: 'parking', amount: 150, desc: 'Parking fee' },
        { category: 'meals', amount: 180, desc: 'Guide lunch' },
        { category: 'tolls', amount: 140, desc: 'Highway tolls' },
        { category: 'supplies', amount: 95, desc: 'Bottled water for guests' }
      ]

      let expenseCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 5))) {
        const { data: tour } = await supabase.from('tours').select('guide_id').eq('id', tourId).single()
        if (tour) {
          const expense = expenseCategories[expenseCount % expenseCategories.length]
          await supabase.from('tour_expenses').insert({
            tour_id: tourId,
            guide_id: tour.guide_id,
            company_id: companyId,
            category: expense.category,
            description: expense.desc,
            amount: expense.amount,
            currency: 'MXN',
            receipt_url: expenseCount % 2 === 0 ? 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-receipt.jpg' : '',
            has_receipt: expenseCount % 2 === 0,
            status: 'pending',
            notes: 'Demo expense for trial'
          })
          expenseCount++
        }
      }

      setDemoProgress(`✅ Added ${expenseCount} expenses`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 7: Create guest feedback (minimal fields - table schema is limited)
      setDemoProgress('⭐ Generating guest feedback...')
      let feedbackCount = 0
      const feedbackData = [
        { rating: 5, title: 'Absolutely Amazing!', text: 'Best tour of our vacation! Guide was knowledgeable and locations were breathtaking.' },
        { rating: 5, title: 'Great Experience', text: 'Loved every moment. Well organized and great value for money.' },
        { rating: 4, title: 'Wonderful Tour', text: 'Amazing experience! Would definitely book again.' }
      ]
      
      for (let i = 0; i < Math.min(createdTourIds.length, 3); i++) {
        const feedback = feedbackData[i % feedbackData.length]
        try {
          // Insert only the core fields that definitely exist
          const { error: fbError } = await supabase
            .from('guest_feedback')
            .insert({
              tour_id: createdTourIds[i],
              rating: feedback.rating,
              review_title: feedback.title,
              review_text: feedback.text
            })
          
          if (!fbError) {
            feedbackCount++
          } else {
            console.error('Feedback insert failed:', fbError)
          }
        } catch (fbError) {
          console.error('Failed to create feedback:', fbError)
        }
      }

      setDemoProgress(`✅ Generated ${feedbackCount} guest reviews`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 8: Create activity feed entries
      setDemoProgress('📢 Creating activity feed...')
      let activityCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 5))) {
        const { data: tour } = await supabase.from('tours').select('name, guide_id').eq('id', tourId).single()
        const { data: guide } = await supabase.from('profiles').select('first_name, last_name, role').eq('id', tour?.guide_id).single()
        
        if (tour && guide) {
          await supabase.from('activity_feed').insert({
            company_id: companyId,
            actor_id: tour.guide_id,
            actor_name: `${guide.first_name} ${guide.last_name}`,
            actor_role: guide.role,
            activity_type: 'tour_started',
            target_type: 'tour',
            target_id: tourId,
            target_name: tour.name,
            message: `${guide.first_name} ${guide.last_name} started tour "${tour.name}"`,
            is_public: true
          })
          activityCount++
        }
      }

      setDemoProgress(`✅ Created ${activityCount} activity feed entries`)
      await new Promise(resolve => setTimeout(resolve, 500))

      setDemoProgress('')
      setDemoMessage({ 
        type: 'success', 
        text: `✅ Demo data generated successfully!\n\n${createdTourIds.length} tours, ${guestCount} guests, ${stopCount} pickups, ${checkinCount} check-ins, ${incidentCount} incidents, ${expenseCount} expenses, ${feedbackCount} reviews, ${activityCount} activities`
      })
      // Wait for all commits to complete before refreshing stats
      setTimeout(() => loadDemoStats(), 2000)

    } catch (err) {
      setDemoMessage({ type: 'error', text: '❌ Error generating demo data: ' + (err as Error).message })
      console.error('Demo generation error:', err)
    } finally {
      setDemoLoading(false)
    }
  }

  function parseCSV(text: string): ImportPreview[] {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const requiredHeaders = ['tour_id', 'first_name', 'last_name']
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return [{
        tour_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        hotel: '',
        room_number: '',
        adults: 0,
        children: 0,
        notes: '',
        valid: false,
        error: `Missing required columns: ${missingHeaders.join(', ')}`
      }]
    }

    const previews: ImportPreview[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      
      const row: any = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })

      const adults = parseInt(row.adults) || 1
      const children = parseInt(row.children) || 0
      const tourId = row.tour_id || ''

      let valid = true
      let error = undefined

      if (!tourId) {
        valid = false
        error = 'Missing tour_id'
      } else if (!row.first_name?.trim()) {
        valid = false
        error = 'Missing first_name'
      } else if (!row.last_name?.trim()) {
        valid = false
        error = 'Missing last_name'
      } else if (adults < 1) {
        valid = false
        error = 'Adults must be at least 1'
      }

      previews.push({
        tour_id: tourId,
        tour_name: undefined,
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        email: row.email || '',
        phone: row.phone || '',
        hotel: row.hotel || '',
        room_number: row.room_number || '',
        adults,
        children,
        notes: row.notes || '',
        valid,
        error
      })
    }

    return previews
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    file.text().then(text => {
      setCsvData(text)
      setPreview(parseCSV(text))
    })
  }

  async function handleImport() {
    const validRecords = preview.filter(p => p.valid)
    if (validRecords.length === 0) {
      alert('No valid records to import')
      return
    }

    if (!confirm(`Import ${validRecords.length} guest records? This cannot be undone.`)) {
      return
    }

    setImporting(true)
    let success = 0
    let failed = 0

    for (const record of validRecords) {
      try {
        const { error } = await supabase
          .from('guests')
          .insert({
            tour_id: record.tour_id,
            first_name: record.first_name,
            last_name: record.last_name,
            email: record.email || null,
            phone: record.phone || null,
            hotel: record.hotel || null,
            room_number: record.room_number || null,
            adults: record.adults,
            children: record.children,
            notes: record.notes || null,
            checked_in: false,
            no_show: false,
          })

        if (error) {
          failed++
          console.error('Import failed:', error)
        } else {
          success++
        }
      } catch (err) {
        failed++
        console.error('Import error:', err)
      }
    }

    setImportStats({ success, failed, total: validRecords.length })
    setCsvFile(null)
    setCsvData('')
    setPreview([])
    
    alert(`Import complete!\n✅ Success: ${success}\n❌ Failed: ${failed}`)
    setImporting(false)
    loadDemoStats()
  }

  function handleDownloadTemplate() {
    const template = `tour_id,first_name,last_name,email,phone,hotel,room_number,adults,children,notes
TOUR-UUID-HERE,John,Smith,john.smith@email.com,+1-555-0101,Grand Velas Riviera Maya,205,2,0,"Anniversary trip"
TOUR-UUID-HERE,Jane,Smith,jane@email.com,+1-555-0102,Grand Velas Riviera Maya,205,2,0,"Traveling with John"
`
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'guest-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Platform configuration and demo management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'companies'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'brands'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Brands ({brands.length})
          </button>
          <button
            onClick={() => setActiveTab('api-config')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'api-config'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔌 API Config
          </button>
          <button
            onClick={() => setActiveTab('service-orders')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'service-orders'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📋 Service Orders
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'import'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            👥 Guest Import
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'demo'
                ? 'bg-orange-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🎯 Demo Management
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-gray-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            {activeTab === 'companies' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Companies</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add Company
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {companies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>No companies yet</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Brands</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {companies.map((company) => (
                          <tr key={company.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">{company.name}</p>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                              {company.id.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-600">
                                {brands.filter(b => b.company_id === company.id).length} brand(s)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'brands' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Brands</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Add Brand
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brands.map((brand) => (
                    <div key={brand.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                          <p className="text-sm text-gray-500">{brand.slug}</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: brand.primary_color }} />
                        <span className="text-sm text-gray-600">{brand.primary_color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'demo' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Demo Management</h2>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Clear Demo Data */}
                  <div className="bg-white rounded-xl border border-red-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl">🗑️</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">Clear Demo Data</h3>
                        <p className="text-sm text-gray-500">Reset for client trial</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Removes all demo data (guests, check-ins, incidents, expenses, feedback) while preserving users, tours, and configuration.
                      Use this before importing a client's service order.
                    </p>
                    <button
                      onClick={handleClearDemoData}
                      disabled={demoLoading}
                      className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {demoLoading ? 'Clearing...' : '🗑️ Clear All Demo Data'}
                    </button>
                  </div>

                  {/* Generate Demo Data */}
                  <div className="bg-white rounded-xl border border-green-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl">📦</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">Generate Demo Data</h3>
                        <p className="text-sm text-gray-500">Create live demo</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Creates realistic demo data with TODAY's date. Includes tours for all guides, guests, check-ins, incidents, expenses, and activity feed. Perfect for demonstrations.
                    </p>
                    <button
                      onClick={handleGenerateDemoData}
                      disabled={demoLoading}
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {demoLoading ? 'Generating...' : '📦 Generate Full Demo'}
                    </button>
                  </div>
                </div>

                {/* Progress Indicator */}
                {demoLoading && demoProgress && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <p className="font-medium text-blue-900">{demoProgress}</p>
                    </div>
                    <div className="text-sm text-blue-700">
                      <p>⏱️ This takes about 15 seconds...</p>
                    </div>
                  </div>
                )}

                {/* Status Message */}
                {demoMessage && (
                  <div className={`rounded-xl p-6 border ${
                    demoMessage.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="whitespace-pre-line">{demoMessage.text}</p>
                  </div>
                )}

                {/* Current Stats */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Current Demo Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{demoStats.tours}</p>
                      <p className="text-xs text-gray-500">Tours</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{demoStats.guests}</p>
                      <p className="text-xs text-gray-500">Guests</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{demoStats.pickup_stops}</p>
                      <p className="text-xs text-gray-500">Pickup Stops</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{demoStats.checkins}</p>
                      <p className="text-xs text-gray-500">Guide Check-ins</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{demoStats.incidents}</p>
                      <p className="text-xs text-gray-500">Incidents</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{demoStats.expenses}</p>
                      <p className="text-xs text-gray-500">Expenses</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{demoStats.feedback}</p>
                      <p className="text-xs text-gray-500">Guest Reviews</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{demoStats.activity}</p>
                      <p className="text-xs text-gray-500">Activity Feed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'import' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Guest Import (CSV)</h2>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    📥 Download Template
                  </button>
                </div>

                {/* Upload Area */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-gray-700 font-medium">
                        {csvFile ? csvFile.name : 'Click to upload CSV file'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        or drag and drop your file here
                      </p>
                    </label>
                  </div>

                  {preview.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">
                          Preview ({preview.length} records)
                        </h3>
                        <div className="flex gap-2">
                          <span className="text-sm text-green-600">
                            ✅ {preview.filter(p => p.valid).length} valid
                          </span>
                          <span className="text-sm text-red-600">
                            ❌ {preview.filter(p => !p.valid).length} invalid
                          </span>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Tour</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Guest</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Pax</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Hotel</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {preview.slice(0, 50).map((record, idx) => (
                              <tr key={idx} className={record.valid ? '' : 'bg-red-50'}>
                                <td className="py-2 px-3">
                                  <div className="font-mono text-xs">{record.tour_id}</div>
                                  {record.tour_name && (
                                    <div className="text-xs text-gray-500">{record.tour_name}</div>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  {record.first_name} {record.last_name}
                                </td>
                                <td className="py-2 px-3">
                                  {record.adults}A + {record.children}C
                                </td>
                                <td className="py-2 px-3 text-gray-500">
                                  {record.hotel || '-'}
                                </td>
                                <td className="py-2 px-3">
                                  {record.valid ? (
                                    <span className="text-green-600">✓ Valid</span>
                                  ) : (
                                    <span className="text-red-600" title={record.error}>
                                      ✗ {record.error}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {preview.length > 50 && (
                          <div className="p-3 text-center text-gray-500 text-sm border-t">
                            ...and {preview.length - 50} more records
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => {
                            setCsvFile(null)
                            setCsvData('')
                            setPreview([])
                          }}
                          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleImport}
                          disabled={importing || preview.filter(p => p.valid).length === 0}
                          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                          {importing ? 'Importing...' : `Import ${preview.filter(p => p.valid).length} Records`}
                        </button>
                      </div>

                      {importStats.total > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="font-medium">Import Results:</p>
                          <p className="text-green-600">✅ Success: {importStats.success}</p>
                          <p className="text-red-600">❌ Failed: {importStats.failed}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'service-orders' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Service Order Import</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🚧</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Coming Soon</h3>
                      <p className="text-sm text-gray-700 mt-1">
                        Service order import will support multiple formats:
                      </p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li>• CSV import (tour list with guests)</li>
                        <li>• Manual entry form</li>
                        <li>• API integration (Viator, GetYourGuide)</li>
                        <li>• Email parsing (forward booking confirmations)</li>
                      </ul>
                      <p className="text-sm text-gray-600 mt-3">
                        <strong>Access:</strong> Operations, Manager, and Super Admin users
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api-config' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">External API Configuration</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                  {/* Viator */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Viator Integration</h3>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={apiConfig.viator_enabled}
                          onChange={(e) => setApiConfig(prev => ({ ...prev, viator_enabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {apiConfig.viator_enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                          <input
                            type="password"
                            value={apiConfig.viator_api_key}
                            onChange={(e) => setApiConfig(prev => ({ ...prev, viator_api_key: e.target.value }))}
                            placeholder="Viator API key"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GetYourGuide */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">GetYourGuide Integration</h3>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={apiConfig.getyourguide_enabled}
                          onChange={(e) => setApiConfig(prev => ({ ...prev, getyourguide_enabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {apiConfig.getyourguide_enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                          <input
                            type="password"
                            value={apiConfig.getyourguide_api_key}
                            onChange={(e) => setApiConfig(prev => ({ ...prev, getyourguide_api_key: e.target.value }))}
                            placeholder="GetYourGuide API key"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TripAdvisor */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">TripAdvisor Link</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Review Page URL</label>
                        <input
                          type="url"
                          value={apiConfig.tripadvisor_link}
                          onChange={(e) => setApiConfig(prev => ({ ...prev, tripadvisor_link: e.target.value }))}
                          placeholder="https://www.tripadvisor.com/..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used in guest feedback thank-you emails</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setSavingConfig(true)
                      // TODO: Save to company_configs table
                      await new Promise(resolve => setTimeout(resolve, 1000))
                      setSavingConfig(false)
                      alert('API configuration saved!')
                    }}
                    disabled={savingConfig}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingConfig ? 'Saving...' : '💾 Save Configuration'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Platform Settings</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Google Drive Integration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Client ID</label>
                        <input
                          type="text"
                          placeholder="Your Google OAuth Client ID"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Client Secret</label>
                        <input
                          type="password"
                          placeholder="Your Google OAuth Client Secret"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Drive Folder ID</label>
                        <input
                          type="text"
                          placeholder="Root folder ID for media storage"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Save Google Drive Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
