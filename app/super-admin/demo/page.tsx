'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'

interface DemoStats {
  tours: number
  guests: number
  pickup_stops: number
  checkins: number
  incidents: number
  expenses: number
  feedback: number
  activity: number
  vehicles: number
}

export default function SuperAdminDemoPage() {
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoStats, setDemoStats] = useState<DemoStats>({
    tours: 0, guests: 0, pickup_stops: 0, checkins: 0, incidents: 0, expenses: 0, feedback: 0, activity: 0, vehicles: 0
  })
  const [demoMessage, setDemoMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [demoProgress, setDemoProgress] = useState('')

  useEffect(() => {
    loadDemoStats()
  }, [])

  async function loadDemoStats() {
    const tables = ['tours', 'guests', 'pickup_stops', 'guide_checkins', 'incidents', 'tour_expenses', 'guest_feedback', 'activity_feed', 'vehicles']
    const stats: any = {}
    
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (error) console.error(`Failed to count ${table}:`, error)
      stats[table] = count || 0
    }
    
    setDemoStats({
      tours: stats.tours || 0,
      guests: stats.guests || 0,
      pickup_stops: stats.pickup_stops || 0,
      checkins: stats.guide_checkins || 0,
      incidents: stats.incidents || 0,
      expenses: stats.tour_expenses || 0,
      feedback: stats.guest_feedback || 0,
      activity: stats.activity_feed || 0,
      vehicles: stats.vehicles || 0
    })
  }

  async function handleClearDemoData() {
    if (!confirm('⚠️ DANGER: This will delete ALL demo data!\n\nThis will remove:\n- All tours created today\n- All guests\n- All guide check-ins\n- All pickup stops\n- All incidents\n- All tour expenses\n- All checklist completions\n- All guest feedback\n- All activity feed entries\n- All vehicles\n\nUsers/auth, brands, companies will be preserved.\n\nContinue?')) {
      return
    }

    setDemoLoading(true)
    setDemoMessage(null)

    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's tour IDs
      const { data: todaysTours } = await supabase
        .from('tours')
        .select('id')
        .eq('tour_date', today)
      
      const todayTourIds = todaysTours?.map(t => t.id) || []

      // Delete in correct order (FK constraints)
      // guest_feedback MUST be deleted before guests (guest_id has no ON DELETE CASCADE)
      const tables = [
        'guest_feedback',      // Delete FIRST - guest_id FK has no cascade
        'cash_confirmations',
        'payments',
        'checklist_completions',
        'tour_expenses',
        'incident_comments',
        'incidents',
        'guide_checkins',
        'pickup_stops',
        'guests',
        'external_bookings',
        'activity_feed',
        'push_notifications',
        'tours',                // tours after feedback (tour_id has CASCADE)
        'vehicles'              // vehicles last (created by demo, no FK dependencies)
      ]

      let deleted = 0
      for (const table of tables) {
        try {
          // Use gt (greater than) instead of neq - works for all tables including guest_feedback
          // Supabase requires a WHERE clause, gt('id', '0000...') matches all real UUIDs
          const { data, error } = await supabase
            .from(table)
            .delete()
            .gt('id', '00000000-0000-0000-0000-000000000000')
          
          const recordCount = (data as unknown as any[])?.length || 0
          deleted += recordCount
          if (error) console.error(`Failed to clear ${table}:`, error)
        } catch (tableError) {
          console.error(`Error clearing ${table}:`, tableError)
        }
      }

      setDemoMessage({ type: 'success', text: `✅ Cleared ${deleted} demo records.` })
      setTimeout(() => loadDemoStats(), 1000)
    } catch (err) {
      setDemoMessage({ type: 'error', text: '❌ Error clearing demo data: ' + (err as Error).message })
    } finally {
      setDemoLoading(false)
    }
  }

  async function handleGenerateDemoData() {
    if (!confirm('📦 Generate Full Demo Data?\n\nThis will create:\n- Tours for TODAY with all guides\n- Guests, pickup stops, check-ins\n- Incidents, expenses, feedback\n- Activity feed entries\n- Vehicles\n\nThis takes ~15 seconds. Continue?')) {
      return
    }

    setDemoLoading(true)
    setDemoMessage(null)

    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      
      // Get guides
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
      const randomSuffix = Math.floor(Math.random() * 10000)

      // Step 0: Create driver profiles for test drivers
      setDemoProgress('🚗 Setting up test drivers...')
      const testDrivers = [
        { email: 'felipe@lifeoperations.com', type: 'freelance', license: 'LIC-FEL-001', expiry: '2027-12-31' },
        { email: 'driver1@lifeoperations.com', type: 'employee', license: 'LIC-DRV1-001', expiry: '2027-06-30' },
        { email: 'driver2@lifeoperations.com', type: 'employee', license: 'LIC-DRV2-001', expiry: '2027-08-15' },
        { email: 'driver3@lifeoperations.com', type: 'employee', license: 'LIC-DRV3-001', expiry: '2027-09-20' }
      ]

      let driverSetupCount = 0
      for (const driver of testDrivers) {
        // Update profile role to driver
        await supabase.from('profiles').update({ role: 'driver' }).eq('email', driver.email)
        
        // Get profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', driver.email)
          .single()
        
        if (profile) {
          // Create driver_profile (upsert to avoid duplicates)
          await supabase.from('driver_profiles').upsert({
            profile_id: profile.id,
            license_number: driver.license,
            license_expiry: driver.expiry,
            driver_type: driver.type,
            hire_date: '2025-01-15',
            status: 'active',
            company_id: companyId
          })
          driverSetupCount++
        }
      }

      setDemoProgress(`✅ Set up ${driverSetupCount} test drivers`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 1: Create vehicles (VERIFIED: company_id, plate_number, make, model, year, capacity, status)
      setDemoProgress('🚗 Creating vehicles...')
      const vehicleFleet = [
        { make: 'Toyota', model: 'Hiace 2020', capacity: 13 },
        { make: 'Mercedes', model: 'Sprinter 2021', capacity: 19 },
        { make: 'Ford', model: 'Transit 2019', capacity: 15 },
        { make: 'Chevrolet', model: 'Express 2018', capacity: 12 },
        { make: 'Nissan', model: 'Urvan 2020', capacity: 15 },
        { make: 'Hyundai', model: 'H350 2021', capacity: 16 }
      ]

      let vehicleCount = 0
      for (const v of vehicleFleet) {
        await supabase.from('vehicles').insert({
          company_id: companyId,
          plate_number: `DEM-${randomSuffix}-${vehicleCount}`,
          make: v.make,
          model: v.model,
          year: 2020,
          capacity: v.capacity,
          status: 'available'
        })
        vehicleCount++
      }

      setDemoProgress(`✅ Created ${vehicleCount} vehicles`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 2: Create tours
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

        if (data) createdTourIds.push(data.id)
        else if (error) console.error('Failed to create tour:', error)
      }

      setDemoProgress(`✅ Created ${createdTourIds.length} tours for today`)
      
      // Assign drivers to tours
      setDemoProgress('👷 Assigning drivers to tours...')
      const { data: allDrivers } = await supabase
        .from('driver_profiles')
        .select('profile_id')
        .eq('status', 'active')
      
      const driverIds = allDrivers?.map(d => d.profile_id) || []
      
      if (driverIds.length > 0) {
        for (let i = 0; i < createdTourIds.length; i++) {
          const driverId = driverIds[i % driverIds.length]
          await supabase.from('tours').update({ driver_id: driverId }).eq('id', createdTourIds[i])
        }
        setDemoProgress(`✅ Assigned drivers to ${createdTourIds.length} tours`)
      } else {
        setDemoProgress('⚠️ No active drivers found for assignment')
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 3: Create guests
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
        const guestsForTour = Math.floor(Math.random() * 4) + 1
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

      // Step 4: Create pickup stops
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
          const stopsCount = Math.floor(Math.random() * 3) + 1
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

      // Step 5: Create guide check-ins
      setDemoProgress('📍 Simulating guide check-ins...')
      let checkinCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 5))) {
        const { data: tour } = await supabase.from('tours').select('guide_id, brand_id, start_time').eq('id', tourId).single()
        if (tour) {
          const startTime = tour.start_time || '08:00'
          const [hours, minutes] = startTime.split(':').map(Number)
          const checkinTime = new Date()
          checkinTime.setHours(hours, minutes - 20, 0)
          
          const minutesEarly = Math.floor(Math.random() * 15) - 5
          
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

      // Step 5b: Create driver check-ins (vehicle inspections)
      setDemoProgress('🚗 Creating driver vehicle inspections...')
      let driverCheckinCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 5))) {
        const { data: tour } = await supabase
          .from('tours')
          .select('driver_id, vehicle_id, start_time')
          .eq('id', tourId)
          .single()
        
        if (tour?.driver_id) {
          const startTime = tour.start_time || '08:00'
          const [hours, minutes] = startTime.split(':').map(Number)
          const checkinTime = new Date()
          checkinTime.setHours(hours, minutes - 45, 0) // Driver checks in 45 min before tour
          
          const mileageBase = 45000 + Math.floor(Math.random() * 5000)
          const fuelLevels = ['full', '3/4', '1/2', '1/4', 'empty']
          const conditions = ['good', 'good', 'good', 'fair', 'poor']
          
          await supabase.from('driver_checkins').insert({
            tour_id: tourId,
            driver_id: tour.driver_id,
            vehicle_id: tour.vehicle_id,
            checked_in_at: checkinTime.toISOString(),
            mileage_start: mileageBase,
            mileage_end: null,
            fuel_level_before: fuelLevels[Math.floor(Math.random() * fuelLevels.length)],
            fuel_level_after: null,
            vehicle_condition: conditions[Math.floor(Math.random() * conditions.length)],
            issues: Math.random() > 0.7 ? 'Minor scratch on rear bumper, already documented' : null,
            inspection_data: {
              tires: 'ok',
              brakes: 'ok',
              lights: 'ok',
              ac: Math.random() > 0.8 ? 'issue' : 'ok',
              cleanliness: 'good',
              first_aid: 'ok',
              fire_extinguisher: 'ok'
            }
          })
          driverCheckinCount++
        }
      }

      setDemoProgress(`✅ Created ${driverCheckinCount} driver vehicle inspections`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 6: Create incidents (VERIFIED: tour_id, reported_by, type, severity, description, status, guide_id, resolution_notes, escalation_level)
      setDemoProgress('⚠️ Creating incidents...')
      const incidentTypes = [
        { type: 'medical', severity: 'medium', desc: 'Guest felt dizzy during hike. Possible dehydration. Gave water and rest in shade.' },
        { type: 'vehicle_issue', severity: 'medium', desc: 'AC not working properly in van. Blowing warm air. Guests uncomfortable in heat.' },
        { type: 'delay', severity: 'low', desc: 'Traffic jam on highway 307. Construction zone. Running 20 min behind schedule.' }
      ]

      let incidentCount = 0
      for (const incident of incidentTypes) {
        if (createdTourIds[incidentCount]) {
          const { data: tour } = await supabase.from('tours').select('guide_id').eq('id', createdTourIds[incidentCount]).single()
          if (tour) {
            await supabase.from('incidents').insert({
              tour_id: createdTourIds[incidentCount],
              reported_by: tour.guide_id,
              type: incident.type,
              severity: incident.severity,
              description: incident.desc,
              status: incidentCount === 0 ? 'resolved' : 'reported',
              guide_id: tour.guide_id,
              resolution_notes: incidentCount === 0 ? 'Guest recovered after 30 min rest. Completed tour with no further issues.' : null,
              escalation_level: 1
            })
            incidentCount++
          }
        }
      }

      setDemoProgress(`✅ Created ${incidentCount} incidents`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 7: Create expenses
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

      // Step 8: Create guest feedback (VERIFIED: tour_id, brand_id, guide_id, guest_name, rating, comments, review_title, review_text, review_date, responded, guest_id)
      setDemoProgress('⭐ Generating guest feedback...')
      let feedbackCount = 0
      const feedbackRatings = [
        { rating: 5, title: 'Absolutely Amazing!', text: 'Best tour of our vacation! Guide was knowledgeable and locations were breathtaking.' },
        { rating: 5, title: 'Great Experience', text: 'Loved every moment. Well organized and great value for money.' },
        { rating: 4, title: 'Wonderful Tour', text: 'Amazing experience! Would definitely book again.' }
      ]
      
      for (let i = 0; i < Math.min(createdTourIds.length, 3); i++) {
        const feedback = feedbackRatings[i % feedbackRatings.length]
        // Get a guest from this tour
        const { data: guests } = await supabase.from('guests').select('id, first_name, last_name').eq('tour_id', createdTourIds[i]).limit(1)
        if (guests && guests.length > 0) {
          const { data: tour } = await supabase.from('tours').select('guide_id, brand_id').eq('id', createdTourIds[i]).single()
          try {
            await supabase.from('guest_feedback').insert({
              tour_id: createdTourIds[i],
              brand_id: tour?.brand_id,
              guide_id: tour?.guide_id,
              guest_name: `${guests[0].first_name} ${guests[0].last_name}`,
              rating: feedback.rating,
              comments: feedback.text,
              review_title: feedback.title,
              review_text: feedback.text,
              review_date: now.toISOString(),
              responded: false,
              guest_id: guests[0].id
            })
            feedbackCount++
          } catch (fbError) {
            console.error('Failed to create feedback:', fbError)
          }
        }
      }

      setDemoProgress(`✅ Generated ${feedbackCount} guest reviews`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 9: Create activity feed
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
        text: `✅ Demo data generated successfully!\n\n${createdTourIds.length} tours, ${guestCount} guests, ${stopCount} pickups, ${checkinCount} check-ins, ${incidentCount} incidents, ${expenseCount} expenses, ${feedbackCount} reviews, ${activityCount} activities, ${vehicleCount} vehicles`
      })
      setTimeout(() => loadDemoStats(), 2000)

    } catch (err) {
      setDemoMessage({ type: 'error', text: '❌ Error generating demo data: ' + (err as Error).message })
      console.error('Demo generation error:', err)
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Demo Management</h1>
          
          {demoMessage && (
            <div className={`mb-6 p-4 rounded-lg ${demoMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {demoMessage.text}
            </div>
          )}

          {demoLoading && demoProgress && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="font-medium">{demoProgress}</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                Removes all demo data (guests, check-ins, incidents, expenses, feedback, vehicles) while preserving users, brands, and configuration.
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
                  <p className="text-sm text-gray-500">Populate with sample data</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Creates realistic demo data including vehicles, tours, guests, check-ins, incidents, expenses, and feedback for testing and demos.
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

          {/* Current Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Current Demo Data</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{demoStats.tours}</p>
                <p className="text-xs text-gray-500">Tours</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{demoStats.guests}</p>
                <p className="text-xs text-gray-500">Guests</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{demoStats.vehicles}</p>
                <p className="text-xs text-gray-500">Vehicles</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{demoStats.checkins}</p>
                <p className="text-xs text-gray-500">Check-ins</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{demoStats.incidents}</p>
                <p className="text-xs text-gray-500">Incidents</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{demoStats.expenses}</p>
                <p className="text-xs text-gray-500">Expenses</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{demoStats.feedback}</p>
                <p className="text-xs text-gray-500">Reviews</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{demoStats.activity}</p>
                <p className="text-xs text-gray-500">Activity</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{demoStats.pickup_stops}</p>
                <p className="text-xs text-gray-500">Pickups</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
