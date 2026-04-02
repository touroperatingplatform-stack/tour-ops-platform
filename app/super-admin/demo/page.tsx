'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import RoleGuard from '@/lib/auth/RoleGuard'
import AdminNav from '@/components/navigation/AdminNav'
import { getLocalDate } from '@/lib/timezone'

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

interface DemoLogEntry {
  step: string
  status: 'success' | 'error' | 'skipped'
  count: number
  message: string
  error?: string
}

export default function SuperAdminDemoPage() {
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoStats, setDemoStats] = useState<DemoStats>({
    tours: 0, guests: 0, pickup_stops: 0, checkins: 0, incidents: 0, expenses: 0, feedback: 0, activity: 0, vehicles: 0
  })
  const [demoMessage, setDemoMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [demoProgress, setDemoProgress] = useState('')
  const [demoLog, setDemoLog] = useState<DemoLogEntry[]>([])
  const [showLog, setShowLog] = useState(false)

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
      const today = getLocalDate()
      
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
        'expenses',            // NEW: references tours.tour_id
        'driver_checkins',     // NEW: references tours.tour_id
        'reservation_manifest',// NEW: references tours.tour_id
        'incident_comments',
        'incidents',
        'guide_checkins',
        'pickup_stops',
        'guests',
        'external_bookings',
        'activity_feed',
        'push_notifications',
        'tours',                // tours after all children (tour_id has CASCADE)
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
      const today = getLocalDate()
      const now = new Date()
      
      console.log('DEMO V2: Creating tours for date:', today)
      console.log('DEMO V2: Current time:', now.toISOString())
      
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

      // Step 2: Create tours (spread across full day for realistic live demo)
      setDemoProgress('📍 Creating tours for today...')
      const tourDestinations = [
        // Early Morning (06:00-08:00)
        { name: 'Chichen Itza Sunrise', start: '06:00', duration: 720, type: 'shared', price: 129 },
        { name: 'Valladolid Cultural Tour', start: '06:30', duration: 660, type: 'shared', price: 119 },
        { name: 'Coba + Cenote Early Bird', start: '07:00', duration: 600, type: 'shared', price: 109 },
        { name: 'Tulum Ruins Sunrise', start: '07:30', duration: 420, type: 'shared', price: 95 },
        
        // Morning (08:00-11:00)
        { name: 'Tulum Ruins Express', start: '08:00', duration: 360, type: 'private', price: 89 },
        { name: 'Coba Adventure + Cenotes', start: '08:00', duration: 540, type: 'shared', price: 109 },
        { name: 'Akumal Snorkeling Tour', start: '08:30', duration: 480, type: 'shared', price: 95 },
        { name: 'Xcaret Park Tour', start: '08:30', duration: 540, type: 'shared', price: 139 },
        { name: 'Isla Mujeres Day Trip', start: '09:00', duration: 600, type: 'shared', price: 119 },
        { name: 'Cenote Route Private', start: '09:00', duration: 420, type: 'private', price: 99 },
        { name: 'Playa del Carmen Tour', start: '09:30', duration: 420, type: 'shared', price: 89 },
        { name: 'Gran Cenote Private', start: '10:00', duration: 300, type: 'private', price: 79 },
        
        // Afternoon (12:00-17:00)
        { name: 'Tulum + Akumal Combo', start: '12:00', duration: 480, type: 'shared', price: 105 },
        { name: 'Coba Ruins Afternoon', start: '13:00', duration: 420, type: 'private', price: 99 },
        { name: 'Sunset Tulum Tour', start: '15:00', duration: 360, type: 'private', price: 89 },
        
        // Evening/Night (17:00-22:00)
        { name: 'Puerto Morelos Reef Sunset', start: '17:00', duration: 300, type: 'shared', price: 95 },
        { name: 'Cancun Hotel Zone Night Tour', start: '18:00', duration: 240, type: 'private', price: 79 },
        { name: 'Playa del Carmen Evening', start: '19:00', duration: 300, type: 'shared', price: 69 },
        { name: 'Cenote Night Swim Experience', start: '20:00', duration: 240, type: 'private', price: 85 },
        { name: 'Tulum Ruins Moonlight Tour', start: '21:00', duration: 180, type: 'private', price: 75 }
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
      
      // Update tour statuses - evening tours active at night
      setDemoProgress('⏰ Setting realistic tour statuses...')
      const currentHour = now.getHours()
      
      for (let i = 0; i < tourDestinations.length && i < guides.length; i++) {
        const dest = tourDestinations[i]
        const tourId = createdTourIds[i]
        const [tourHour] = dest.start.split(':').map(Number)
        
        let status = 'scheduled'
        
        // At night (after 5 PM), evening/night tours are in progress
        if (currentHour >= 17) {
          if (tourHour >= 17) {
            status = 'in_progress'  // Evening/night tours currently running
          } else if (tourHour >= 14) {
            status = 'completed'    // Afternoon tours just finished
          } else {
            status = 'completed'    // Morning tours done
          }
        } else if (currentHour >= 12) {
          // Afternoon: noon-5pm
          if (tourHour < 12) {
            status = 'completed'    // Morning tours done
          } else if (tourHour <= currentHour) {
            status = 'in_progress'  // Current afternoon tours
          } else {
            status = 'scheduled'    // Evening tours coming up
          }
        } else {
          // Morning: before noon
          if (tourHour < currentHour - 1) {
            status = 'completed'    // Early tours done
          } else if (tourHour <= currentHour) {
            status = 'in_progress'    // Current tours
          } else {
            status = 'scheduled'    // Upcoming tours
          }
        }
        
        await supabase.from('tours').update({ status }).eq('id', tourId)
      }
      
      setDemoProgress('✅ Set realistic statuses (completed/in_progress/scheduled)')
      await new Promise(resolve => setTimeout(resolve, 500))
      
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

      // Step 5: Create guide check-ins with realistic GPS coordinates
      setDemoProgress('📍 Simulating guide check-ins...')
      
      // GPS coordinates for popular destinations
      const destinationCoords: Record<string, { lat: number, lng: number }> = {
        'Chichen Itza': { lat: 20.6843, lng: -88.5678 },
        'Valladolid': { lat: 20.6897, lng: -88.2037 },
        'Coba': { lat: 20.4933, lng: -87.7322 },
        'Tulum': { lat: 20.2114, lng: -87.4654 },
        'Akumal': { lat: 20.3951, lng: -87.3158 },
        'Xcaret': { lat: 20.5793, lng: -87.1206 },
        'Isla Mujeres': { lat: 21.2311, lng: -86.7315 },
        'Playa del Carmen': { lat: 20.6296, lng: -87.0739 },
        'Gran Cenote': { lat: 20.2356, lng: -87.4519 },
        'Cancun': { lat: 21.1619, lng: -86.8515 },
        'Puerto Morelos': { lat: 20.8485, lng: -86.8719 },
        'Cenote': { lat: 20.4500, lng: -87.3500 }
      }
      
      // Create check-ins for ALL tours (not just first 8)
      let checkinCount = 0
      let checkinErrors = []
      for (const tourId of createdTourIds) {
        const { data: tour, error: tourError } = await supabase
          .from('tours')
          .select('guide_id, brand_id, start_time, name')
          .eq('id', tourId)
          .single()
        
        if (tourError || !tour) {
          checkinErrors.push(`Tour ${tourId}: ${tourError?.message || 'not found'}`)
          continue
        }
        
        const startTime = tour.start_time || '08:00'
        const [hours, minutes] = startTime.split(':').map(Number)
        const checkinTime = new Date()
        checkinTime.setHours(hours, minutes - 20, 0)
        
        const minutesEarly = Math.floor(Math.random() * 15) - 5
        
        // Find destination coordinates based on tour name
        let coords = destinationCoords['Cancun']
        for (const [key, value] of Object.entries(destinationCoords)) {
          if (tour.name.toLowerCase().includes(key.toLowerCase())) {
            coords = value
            break
          }
        }
        
        // Add small random offset (50-200m) for realistic GPS variation
        const latOffset = (Math.random() - 0.5) * 0.002
        const lngOffset = (Math.random() - 0.5) * 0.002
        
        const { error: insertError } = await supabase.from('guide_checkins').insert({
          tour_id: tourId,
          brand_id: tour.brand_id,
          guide_id: tour.guide_id,
          checkin_type: 'pre_pickup',
          checked_in_at: checkinTime.toISOString(),
          latitude: coords.lat + latOffset,
          longitude: coords.lng + lngOffset,
          location_accuracy: 10 + Math.random() * 20,
          gps_alert_triggered: false,
          scheduled_time: startTime,
          minutes_early_or_late: minutesEarly,
          notes: minutesEarly >= 0 ? 'Arrived early' : 'Slightly delayed due to traffic',
          selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
        })
        
        if (insertError) {
          checkinErrors.push(`Check-in for ${tour.name}: ${insertError.message}`)
        } else {
          checkinCount++
        }
      }

      if (checkinErrors.length > 0) {
        console.error('Check-in errors:', checkinErrors)
      }
      setDemoProgress(`✅ Created ${checkinCount} guide check-ins${checkinErrors.length > 0 ? ` (${checkinErrors.length} errors)` : ''}`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 5b: Create driver check-ins for ALL tours with drivers
      setDemoProgress('🚗 Creating driver vehicle inspections...')
      let driverCheckinCount = 0
      for (const tourId of createdTourIds) {
        const { data: tour, error: tourError } = await supabase
          .from('tours')
          .select('driver_id, vehicle_id, start_time')
          .eq('id', tourId)
          .single()
        
        if (tourError) {
          console.error('Error fetching tour for driver checkin:', tourError)
          continue
        }
        
        if (tour?.driver_id) {
          const startTime = tour.start_time || '08:00'
          const [hours, minutes] = startTime.split(':').map(Number)
          const checkinTime = new Date()
          checkinTime.setHours(hours, minutes - 45, 0) // Driver checks in 45 min before tour
          
          const mileageBase = 45000 + Math.floor(Math.random() * 5000)
          const fuelLevels = ['full', '3/4', '1/2', '1/4', 'empty']
          const conditions = ['good', 'good', 'good', 'fair', 'poor']
          
          const { error: insertError } = await supabase.from('driver_checkins').insert({
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
          
          if (insertError) {
            console.error('Failed to create driver checkin:', insertError)
          } else {
            driverCheckinCount++
          }
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

  async function handleGenerateDemoDataV3() {
    if (!confirm('📦 V3: Complete 24-Hour Live Demo?\n\nThis creates a FULL realistic operation:\n\n✓ Tours spread 06:00-23:00 (including night tours)\n✓ Vehicles ASSIGNED with in_use status\n✓ Drivers ASSIGNED to tours\n✓ Reservation manifest with booking references\n✓ Complete checklist completions (pre-trip)\n✓ Full checkin workflow:\n  - Pre-departure (vehicle inspection)\n  - Pickup stops with GPS/selfie\n  - Activity stops\n  - Dropoff stops\n  - Office return (for completed tours)\n✓ Cash confirmations with expected/actual\n✓ Realistic timestamps based on current time\n\nPerfect for demoing at ANY hour - shows live operation.\n\nContinue?')) {
      return
    }

    setDemoLoading(true)
    setDemoMessage(null)
    setDemoLog([])
    setShowLog(true)

    try {
      const today = getLocalDate()
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeMinutes = currentHour * 60 + currentMinute

      setDemoProgress('🔍 Fetching guides, drivers, companies...')
      
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
      const { data: checklists } = await supabase.from('checklists').select('id, name').limit(1)
      
      if (!companies || companies.length === 0) {
        throw new Error('No companies found. Please create a company first.')
      }

      const companyId = companies[0].id
      const brandIds = brands?.map(b => b.id) || []
      const checklistId = checklists?.[0]?.id
      const randomSuffix = Math.floor(Math.random() * 10000)

      // Step 0: Setup drivers
      setDemoProgress('🚗 Setting up test drivers...')
      const testDrivers = [
        { email: 'felipe@lifeoperations.com', type: 'freelance', license: 'LIC-FEL-001', expiry: '2027-12-31', full_name: 'Felipe Ramirez' },
        { email: 'driver1@lifeoperations.com', type: 'employee', license: 'LIC-DRV1-001', expiry: '2027-06-30', full_name: 'Carlos Gonzalez' },
        { email: 'driver2@lifeoperations.com', type: 'employee', license: 'LIC-DRV2-001', expiry: '2027-08-15', full_name: 'Miguel Santos' },
        { email: 'driver3@lifeoperations.com', type: 'employee', license: 'LIC-DRV3-001', expiry: '2027-09-20', full_name: 'Jose Martinez' }
      ]

      let driverSetupCount = 0
      for (const driver of testDrivers) {
        // Check if profile exists first
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', driver.email)
          .single()
        
        if (existingProfile) {
          // Update role to driver
          await supabase.from('profiles').update({ role: 'driver' }).eq('id', existingProfile.id)
          
          // Upsert driver profile
          await supabase.from('driver_profiles').upsert({
            profile_id: existingProfile.id,
            license_number: driver.license,
            license_expiry: driver.expiry,
            driver_type: driver.type,
            hire_date: '2025-01-15',
            status: 'active',
            company_id: companyId
          })
          driverSetupCount++
        } else {
          // Create new profile with required fields
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              email: driver.email,
              full_name: driver.full_name,
              role: 'driver',
              status: 'active'
            })
            .select('id')
            .single()
          
          if (newProfile) {
            await supabase.from('driver_profiles').insert({
              profile_id: newProfile.id,
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
      }
      setDemoProgress(`✅ Set up ${driverSetupCount} drivers`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 1: Create vehicles
      setDemoProgress('🚌 Creating vehicle fleet...')
      const vehicleFleet = [
        { make: 'Toyota', model: 'Hiace 2020', capacity: 13, plate: `DEM-${randomSuffix}-01` },
        { make: 'Mercedes', model: 'Sprinter 2021', capacity: 19, plate: `DEM-${randomSuffix}-02` },
        { make: 'Ford', model: 'Transit 2019', capacity: 15, plate: `DEM-${randomSuffix}-03` },
        { make: 'Chevrolet', model: 'Express 2018', capacity: 12, plate: `DEM-${randomSuffix}-04` },
        { make: 'Nissan', model: 'Urvan 2020', capacity: 15, plate: `DEM-${randomSuffix}-05` },
        { make: 'Hyundai', model: 'H350 2021', capacity: 16, plate: `DEM-${randomSuffix}-06` },
        { make: 'VW', model: 'Crafter 2022', capacity: 18, plate: `DEM-${randomSuffix}-07` },
        { make: 'Toyota', model: 'Coaster 2019', capacity: 22, plate: `DEM-${randomSuffix}-08` }
      ]

      const vehicleIds: string[] = []
      for (const v of vehicleFleet) {
        const { data } = await supabase.from('vehicles').insert({
          company_id: companyId,
          plate_number: v.plate,
          make: v.make,
          model: v.model,
          year: parseInt(v.model.split(' ').pop() || '2020'),
          capacity: v.capacity,
          status: 'available'
        }).select('id').single()
        if (data) vehicleIds.push(data.id)
      }
      setDemoProgress(`✅ Created ${vehicleIds.length} vehicles`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 2: Get all drivers
      const { data: allDrivers } = await supabase.from('driver_profiles').select('profile_id').eq('status', 'active')
      const driverIds = allDrivers?.map(d => d.profile_id) || []

      // Step 3: Create tours with COMPLETE 24-hour schedule (including overnight)
      setDemoProgress('📍 Creating 24-hour tour schedule...')
      
      // Full day schedule: 06:00 - 23:00 (including night tours)
      const tourSchedule = [
        // Early Morning (06:00-08:00)
        { name: 'Chichen Itza Sunrise', startMin: 360, duration: 720, type: 'shared', price: 129, dest: 'Chichen Itza' },
        { name: 'Valladolid Cultural', startMin: 390, duration: 660, type: 'shared', price: 119, dest: 'Valladolid' },
        { name: 'Coba + Cenote Early Bird', startMin: 420, duration: 600, type: 'shared', price: 109, dest: 'Coba' },
        { name: 'Tulum Ruins Sunrise', startMin: 450, duration: 420, type: 'shared', price: 95, dest: 'Tulum' },
        
        // Morning (08:00-11:00)
        { name: 'Tulum Ruins Express', startMin: 480, duration: 360, type: 'private', price: 89, dest: 'Tulum' },
        { name: 'Coba Adventure + Cenotes', startMin: 480, duration: 540, type: 'shared', price: 109, dest: 'Coba' },
        { name: 'Akumal Snorkeling Tour', startMin: 510, duration: 480, type: 'shared', price: 95, dest: 'Akumal' },
        { name: 'Xcaret Park Tour', startMin: 510, duration: 540, type: 'shared', price: 139, dest: 'Xcaret' },
        { name: 'Isla Mujeres Day Trip', startMin: 540, duration: 600, type: 'shared', price: 119, dest: 'Isla Mujeres' },
        { name: 'Cenote Route Private', startMin: 540, duration: 420, type: 'private', price: 99, dest: 'Cenote' },
        { name: 'Playa del Carmen Tour', startMin: 570, duration: 420, type: 'shared', price: 89, dest: 'Playa del Carmen' },
        { name: 'Gran Cenote Private', startMin: 600, duration: 300, type: 'private', price: 79, dest: 'Cenote' },
        
        // Afternoon (12:00-17:00)
        { name: 'Tulum + Akumal Combo', startMin: 720, duration: 480, type: 'shared', price: 105, dest: 'Tulum' },
        { name: 'Coba Ruins Afternoon', startMin: 780, duration: 420, type: 'private', price: 99, dest: 'Coba' },
        { name: 'Puerto Morelos Snorkel', startMin: 840, duration: 360, type: 'shared', price: 85, dest: 'Puerto Morelos' },
        { name: 'Sunset Tulum Tour', startMin: 900, duration: 360, type: 'private', price: 89, dest: 'Tulum' },
        
        // Evening (17:00-20:00)
        { name: 'Puerto Morelos Sunset', startMin: 1020, duration: 300, type: 'shared', price: 95, dest: 'Puerto Morelos' },
        { name: 'Cancun Hotel Zone Night', startMin: 1080, duration: 240, type: 'private', price: 79, dest: 'Cancun' },
        { name: 'Playa del Carmen Evening', startMin: 1140, duration: 300, type: 'shared', price: 69, dest: 'Playa del Carmen' },
        
        // Night (20:00-23:00)
        { name: 'Cenote Night Swim', startMin: 1200, duration: 240, type: 'private', price: 85, dest: 'Cenote' },
        { name: 'Tulum Ruins Moonlight', startMin: 1260, duration: 180, type: 'private', price: 75, dest: 'Tulum' },
        { name: 'Night Snorkel Adventure', startMin: 1320, duration: 180, type: 'shared', price: 95, dest: 'Akumal' },
        { name: 'Stargazing Cenote Tour', startMin: 1380, duration: 120, type: 'private', price: 65, dest: 'Cenote' }
      ]

      const createdTourIds: string[] = []
      const tourVehicleMap: Record<string, string> = {}
      const tourDriverMap: Record<string, string> = {}
      const tourStatusMap: Record<string, string> = {}
      
      for (let i = 0; i < Math.min(guides.length, tourSchedule.length); i++) {
        const guide = guides[i]
        const tour = tourSchedule[i]
        const brandId = brandIds.length > 0 ? brandIds[i % brandIds.length] : null
        const vehicleId = vehicleIds[i % vehicleIds.length]
        const driverId = driverIds.length > 0 ? driverIds[i % driverIds.length] : null
        
        const startHour = Math.floor(tour.startMin / 60)
        const startMinute = tour.startMin % 60
        const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
        
        // Determine status based on current time
        const endMin = tour.startMin + tour.duration
        let status = 'scheduled'
        if (endMin < currentTimeMinutes - 30) {
          status = 'completed'
        } else if (tour.startMin < currentTimeMinutes) {
          status = 'in_progress'
        }
        
        const guestCount = tour.type === 'private' 
          ? Math.floor(Math.random() * 4) + 2
          : Math.floor(Math.random() * 8) + 5
        
        const { data } = await supabase.from('tours').insert({
          company_id: companyId,
          brand_id: brandId,
          guide_id: guide.id,
          driver_id: driverId,
          vehicle_id: vehicleId,
          name: tour.name,
          description: `Live demo: ${tour.name}`,
          tour_date: today,
          start_time: startTime,
          duration_minutes: tour.duration,
          capacity: tour.type === 'private' ? 8 : 20,
          pickup_location: 'Hotel pickup included',
          dropoff_location: 'Hotel dropoff',
          price: tour.price,
          status: status,
          guest_count: guestCount,
          tour_type: tour.type,
          created_by: null
        }).select('id').single()

        if (data) {
          createdTourIds.push(data.id)
          tourVehicleMap[data.id] = vehicleId
          tourDriverMap[data.id] = driverId || ''
          tourStatusMap[data.id] = status
          
          // Update vehicle status
          if (status === 'in_progress' || status === 'scheduled') {
            await supabase.from('vehicles').update({ status: 'in_use' }).eq('id', vehicleId)
          }
        }
      }

      setDemoProgress(`✅ Created ${createdTourIds.length} tours across 24 hours`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 4: Create guests and reservation manifest
      setDemoProgress('👥 Adding guests with reservations...')
      let guestCount = 0
      let manifestCount = 0
      const guestNames = [
        ['John', 'Smith'], ['Sarah', 'Johnson'], ['Michael', 'Brown'], ['Lisa', 'Garcia'],
        ['David', 'Martinez'], ['Jennifer', 'Lopez'], ['Robert', 'Wilson'], ['Amanda', 'Taylor'],
        ['Christopher', 'Anderson'], ['Jessica', 'Thomas'], ['William', 'Jackson'], ['Elizabeth', 'White'],
        ['Daniel', 'Harris'], ['Michelle', 'Clark'], ['Matthew', 'Lewis'], ['Ashley', 'Robinson'],
        ['Joseph', 'Walker'], ['Nancy', 'Hall'], ['Karen', 'Allen'], ['Betty', 'Young'],
        ['Edward', 'King'], ['Sandra', 'Wright'], ['George', 'Scott'], ['Dorothy', 'Green'],
        ['Kenneth', 'Baker'], ['Carol', 'Adams'], ['Steven', 'Nelson'], ['Ruth', 'Carter']
      ]

      const hotels = [
        'Grand Velas Riviera Maya', 'Beloved Playa Mujeres', 'Secrets Maroma Beach',
        'Finest Playa Mujeres', 'Hyatt Ziva Cap Cana', 'Excellence Playa Mujeres',
        'TRS Coral Hotel', 'Hard Rock Hotel Cancun', 'Iberostar Selection',
        'Live Aqua Beach', 'Grand Sunset Resort', 'Vidanta Riviera Maya'
      ]

      const platforms = ['Viator', 'GetYourGuide', 'TripAdvisor', 'Airbnb Experiences', 'Direct', 'Hotel Concierge']

      for (const tourId of createdTourIds) {
        const { data: tour } = await supabase.from('tours').select('guest_count, start_time').eq('id', tourId).single()
        const numGuests = tour?.guest_count || Math.floor(Math.random() * 4) + 2
        const [hours, minutes] = (tour?.start_time || '08:00').split(':').map(Number)
        
        // Create reservation manifest entries (groups)
        const numGroups = Math.max(1, Math.floor(numGuests / 3))
        for (let g = 0; g < numGroups; g++) {
          const groupSize = g === numGroups - 1 ? numGuests - (g * 3) : Math.min(3, Math.floor(Math.random() * 2) + 1)
          const nameIdx = (guestCount + g) % guestNames.length
          const hotelIdx = (guestCount + g) % hotels.length
          const platformIdx = (guestCount + g) % platforms.length
          
          // Create manifest entry
          const bookingRef = `${platforms[platformIdx].substring(0, 3).toUpperCase()}-${randomSuffix}-${tourId.substring(0, 4).toUpperCase()}-${g}`
          
          const { error: manifestError } = await supabase.from('reservation_manifest').insert({
            tour_id: tourId,
            brand_id: brandIds.length > 0 ? brandIds[0] : null,
            booking_reference: bookingRef,
            booking_platform: platforms[platformIdx],
            adult_pax: groupSize,
            child_pax: Math.floor(Math.random() * 2),
            infant_pax: Math.random() > 0.8 ? 1 : 0,
            // total_pax is GENERATED - calculated automatically
            hotel_name: hotels[hotelIdx],
            room_number: String(100 + Math.floor(Math.random() * 500)),
            language_code: Math.random() > 0.7 ? 'ES' : 'EN',
            pickup_time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
            rep_name: Math.random() > 0.5 ? 'Alex' : 'Maria',
            agency_name: Math.random() > 0.5 ? 'Cancun Tours' : 'Playa Adventures',
            primary_contact_name: `${guestNames[nameIdx][0]} ${guestNames[nameIdx][1]}`,
            contact_phone: `+1-555-${String(1000 + guestCount).substring(0, 4)}`,
            contact_email: `${guestNames[nameIdx][0].toLowerCase()}.${guestNames[nameIdx][1].toLowerCase()}@email.com`,
            dietary_restrictions: Math.random() > 0.8 ? ['vegetarian'] : [],
            accessibility_needs: Math.random() > 0.9 ? ['wheelchair'] : [],
            special_requests: Math.random() > 0.7 ? 'Ocean view preferred' : null,
            pickup_location: hotels[hotelIdx],
            checked_in: tourStatusMap[tourId] === 'completed',
            checked_in_at: tourStatusMap[tourId] === 'completed' ? new Date().toISOString() : null,
            no_show: false
          })
          if (!manifestError) {
            manifestCount++
          } else {
            console.error('Reservation manifest error:', manifestError)
          }
          
          // Create individual guests
          for (let p = 0; p < groupSize; p++) {
            const pNameIdx = (guestCount + p) % guestNames.length
            await supabase.from('guests').insert({
              tour_id: tourId,
              first_name: guestNames[pNameIdx][0],
              last_name: guestNames[pNameIdx][1],
              email: `${guestNames[pNameIdx][0].toLowerCase()}.${guestNames[pNameIdx][1].toLowerCase()}${guestCount}@email.com`,
              phone: `+1-555-${String(1000 + guestCount + p)}`,
              hotel: hotels[hotelIdx],
              room_number: String(100 + guestCount + p),
              adults: 1,
              children: Math.random() > 0.7 ? 1 : 0,
              notes: 'Demo guest',
              checked_in: tourStatusMap[tourId] === 'completed',
              no_show: false
            })
            guestCount++
          }
        }
      }
      setDemoProgress(`✅ Added ${guestCount} guests, ${manifestCount} reservations`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 5: Create pickup stops (complete sequence)
      setDemoProgress('🚌 Creating pickup/activity/dropoff stops...')
      let stopCount = 0
      const pickupLocations = [
        { name: 'Grand Sunset Resort', lat: 20.6897, lng: -87.0739 },
        { name: 'Vidanta Riviera Maya', lat: 20.6234, lng: -87.0812 },
        { name: 'Playa del Carmen', lat: 20.6296, lng: -87.0739 },
        { name: 'Maroma Beach', lat: 20.7234, lng: -86.9812 },
        { name: 'Cancun Airport T3', lat: 21.0365, lng: -86.8770 },
        { name: 'Hotel Zone Km 9', lat: 21.1333, lng: -86.7667 }
      ]

      const activityLocations: Record<string, { lat: number, lng: number }> = {
        'Chichen Itza': { lat: 20.6843, lng: -88.5678 },
        'Valladolid': { lat: 20.6897, lng: -88.2037 },
        'Coba': { lat: 20.4933, lng: -87.7322 },
        'Tulum': { lat: 20.2114, lng: -87.4654 },
        'Akumal': { lat: 20.3951, lng: -87.3158 },
        'Xcaret': { lat: 20.5793, lng: -87.1206 },
        'Isla Mujeres': { lat: 21.2311, lng: -86.7315 },
        'Playa del Carmen': { lat: 20.6296, lng: -87.0739 },
        'Cenote': { lat: 20.4500, lng: -87.3500 },
        'Cancun': { lat: 21.1619, lng: -86.8515 },
        'Puerto Morelos': { lat: 20.8485, lng: -86.8719 }
      }

      for (const tourId of createdTourIds) {
        const { data: tour } = await supabase.from('tours').select('tour_type, start_time, name, brand_id, duration_minutes').eq('id', tourId).single()
        if (!tour) continue
        
        const [hours, minutes] = (tour.start_time || '08:00').split(':').map(Number)
        const baseTime = hours * 60 + minutes
        const brandId = tour.brand_id || brandIds[0]
        
        // Get destination coords
        let destCoords = activityLocations['Cancun']
        for (const [key, value] of Object.entries(activityLocations)) {
          if (tour.name.toLowerCase().includes(key.toLowerCase())) {
            destCoords = value
            break
          }
        }
        
        // Pickups (2-4 per shared tour, 1 for private)
        const numPickups = tour.tour_type === 'shared' ? Math.floor(Math.random() * 3) + 2 : 1
        for (let p = 0; p < numPickups; p++) {
          const loc = pickupLocations[p % pickupLocations.length]
          const pickupTime = baseTime - 30 + (p * 10)
          await supabase.from('pickup_stops').insert({
            tour_id: tourId,
            brand_id: brandId,
            sort_order: p + 1,
            location_name: loc.name,
            address: `${loc.name}, Quintana Roo, Mexico`,
            latitude: loc.lat,
            longitude: loc.lng,
            scheduled_time: `${String(Math.floor(pickupTime / 60)).padStart(2, '0')}:${String(pickupTime % 60).padStart(2, '0')}`,
            guest_count: Math.floor(Math.random() * 4) + 1,
            stop_type: 'pickup',
            notes: 'Demo pickup stop'
          })
          stopCount++
        }
        
        // Activity stop (main destination)
        const activityTime = baseTime + Math.floor(tour.duration_minutes * 0.4)
        await supabase.from('pickup_stops').insert({
          tour_id: tourId,
          brand_id: brandId,
          sort_order: 100,
          location_name: tour.name.split(' ')[0] + ' Main Activity',
          address: `${destCoords.lat}, ${destCoords.lng}`,
          latitude: destCoords.lat + (Math.random() - 0.5) * 0.01,
          longitude: destCoords.lng + (Math.random() - 0.5) * 0.01,
          scheduled_time: `${String(Math.floor(activityTime / 60)).padStart(2, '0')}:${String(activityTime % 60).padStart(2, '0')}`,
          stop_type: 'activity',
          notes: 'Main tour activity'
        })
        stopCount++
        
        // Dropoff (same as pickup locations, reversed)
        if (tour.tour_type === 'shared') {
          for (let d = 0; d < numPickups; d++) {
            const loc = pickupLocations[(numPickups - 1 - d) % pickupLocations.length]
            const dropoffTime = baseTime + tour.duration_minutes - 30 + (d * 10)
            await supabase.from('pickup_stops').insert({
              tour_id: tourId,
              brand_id: brandId,
              sort_order: 200 + d,
              location_name: loc.name,
              address: `${loc.name}, Quintana Roo, Mexico`,
              latitude: loc.lat,
              longitude: loc.lng,
              scheduled_time: `${String(Math.floor(dropoffTime / 60)).padStart(2, '0')}:${String(dropoffTime % 60).padStart(2, '0')}`,
              stop_type: 'dropoff',
              notes: 'Demo dropoff stop'
            })
            stopCount++
          }
        }
      }
      setDemoProgress(`✅ Created ${stopCount} stops (pickup/activity/dropoff)`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 6: Create checklist completions for tours that have started
      setDemoProgress('☑️ Creating checklist completions...')
      let checklistCount = 0
      if (checklistId) {
        for (const tourId of createdTourIds) {
          const status = tourStatusMap[tourId]
          if (status === 'in_progress' || status === 'completed') {
            const { data: tour } = await supabase.from('tours').select('guide_id, brand_id, start_time').eq('id', tourId).single()
            if (tour) {
              const [hours, minutes] = (tour.start_time || '08:00').split(':').map(Number)
              const checkinTime = new Date()
              checkinTime.setHours(hours, minutes - 30, 0)
              
              await supabase.from('checklist_completions').insert({
                tour_id: tourId,
                brand_id: tour.brand_id,
                guide_id: tour.guide_id,
                template_id: checklistId,
                stage: 'pre_departure',
                completed_at: checkinTime.toISOString(),
                photo_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-checklist.jpg',
                is_confirmed: true,
                notes: 'Demo checklist completion'
              })
              checklistCount++
            }
          }
        }
      }
      setDemoProgress(`✅ Created ${checklistCount} checklist completions`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 7: Create FULL checkin workflow (pre_departure, pickup, activity, dropoff, office_return)
      setDemoProgress('📍 Creating full checkin workflow...')
      let checkinCount = 0
      
      const checkinTypes = ['pre_departure', 'pickup', 'activity', 'dropoff', 'office_return']
      
      for (const tourId of createdTourIds) {
        const status = tourStatusMap[tourId]
        const { data: tour } = await supabase.from('tours').select('guide_id, brand_id, start_time, name, duration_minutes').eq('id', tourId).single()
        if (!tour) continue
        
        const [hours, minutes] = (tour.start_time || '08:00').split(':').map(Number)
        const startTimeMinutes = hours * 60 + minutes
        
        // Get stops for this tour
        const { data: stops } = await supabase.from('pickup_stops').select('*').eq('tour_id', tourId).order('sort_order')
        
        // Create checkins based on tour status
        if (status === 'completed') {
          // Completed tours: ALL checkins
          
          // Pre-departure (before tour starts)
          const preDepartureTime = new Date()
          preDepartureTime.setHours(hours, minutes - 45, 0)
          
          await supabase.from('guide_checkins').insert({
            tour_id: tourId,
            brand_id: tour.brand_id,
            guide_id: tour.guide_id,
            checkin_type: 'pre_departure',
            checked_in_at: preDepartureTime.toISOString(),
            latitude: 21.1619 + (Math.random() - 0.5) * 0.05,
            longitude: -86.8515 + (Math.random() - 0.5) * 0.05,
            location_accuracy: 10 + Math.random() * 20,
            gps_alert_triggered: false,
            scheduled_time: tour.start_time,
            minutes_early_or_late: Math.floor(Math.random() * 15) - 5,
            notes: 'Vehicle ready, fuel checked',
            selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
          })
          checkinCount++
          
          // Pickup checkins
          const pickupStops = stops?.filter(s => s.stop_type === 'pickup') || []
          for (let i = 0; i < pickupStops.length; i++) {
            const stop = pickupStops[i]
            const pickupTime = new Date()
            pickupTime.setHours(hours, minutes - 20 + (i * 10), 0)
            
            await supabase.from('guide_checkins').insert({
              tour_id: tourId,
              brand_id: tour.brand_id,
              guide_id: tour.guide_id,
              pickup_stop_id: stop.id,
              checkin_type: 'pickup',
              checked_in_at: pickupTime.toISOString(),
              latitude: stop.latitude || 20.6 + Math.random() * 0.1,
              longitude: stop.longitude || -87.0 + Math.random() * 0.1,
              location_accuracy: 15,
              gps_alert_triggered: false,
              scheduled_time: stop.scheduled_time,
              minutes_early_or_late: Math.floor(Math.random() * 10) - 3,
              notes: `${stop.guest_count || 2} guests picked up`,
              selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
            })
            checkinCount++
          }
          
          // Activity checkin
          const activityStops = stops?.filter(s => s.stop_type === 'activity') || []
          for (const stop of activityStops) {
            const activityTime = new Date()
            activityTime.setHours(hours, minutes + Math.floor(tour.duration_minutes * 0.4), 0)
            
            await supabase.from('guide_checkins').insert({
              tour_id: tourId,
              brand_id: tour.brand_id,
              guide_id: tour.guide_id,
              pickup_stop_id: stop.id,
              checkin_type: 'activity',
              checked_in_at: activityTime.toISOString(),
              latitude: stop.latitude || 20.5,
              longitude: stop.longitude || -87.5,
              location_accuracy: 12,
              gps_alert_triggered: false,
              scheduled_time: stop.scheduled_time,
              minutes_early_or_late: Math.floor(Math.random() * 8) - 4,
              notes: 'Activity started on time',
              selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
            })
            checkinCount++
          }
          
          // Dropoff checkins
          const dropoffStops = stops?.filter(s => s.stop_type === 'dropoff') || []
          for (let i = 0; i < dropoffStops.length; i++) {
            const stop = dropoffStops[i]
            const dropoffTime = new Date()
            dropoffTime.setHours(hours, minutes + tour.duration_minutes - 30 + (i * 10), 0)
            
            await supabase.from('guide_checkins').insert({
              tour_id: tourId,
              brand_id: tour.brand_id,
              guide_id: tour.guide_id,
              pickup_stop_id: stop.id,
              checkin_type: 'dropoff',
              checked_in_at: dropoffTime.toISOString(),
              latitude: stop.latitude || 20.6,
              longitude: stop.longitude || -87.0,
              location_accuracy: 18,
              gps_alert_triggered: false,
              scheduled_time: stop.scheduled_time,
              minutes_early_or_late: Math.floor(Math.random() * 15),
              notes: 'Guests dropped off safely',
              selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
            })
            checkinCount++
          }
          
          // Office return
          const officeReturnTime = new Date()
          officeReturnTime.setHours(hours, minutes + tour.duration_minutes + 30, 0)
          
          await supabase.from('guide_checkins').insert({
            tour_id: tourId,
            brand_id: tour.brand_id,
            guide_id: tour.guide_id,
            checkin_type: 'office_return',
            checked_in_at: officeReturnTime.toISOString(),
            latitude: 21.1619,
            longitude: -86.8515,
            location_accuracy: 8,
            gps_alert_triggered: false,
            minutes_early_or_late: Math.floor(Math.random() * 20) - 10,
            notes: 'Tour completed successfully',
            selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
          })
          checkinCount++
          
        } else if (status === 'in_progress') {
          // In progress: pre_departure, pickups, maybe activity
          
          // Pre-departure
          const preDepartureTime = new Date()
          preDepartureTime.setHours(hours, minutes - 45, 0)
          
          await supabase.from('guide_checkins').insert({
            tour_id: tourId,
            brand_id: tour.brand_id,
            guide_id: tour.guide_id,
            checkin_type: 'pre_departure',
            checked_in_at: preDepartureTime.toISOString(),
            latitude: 21.1619 + (Math.random() - 0.5) * 0.05,
            longitude: -86.8515 + (Math.random() - 0.5) * 0.05,
            location_accuracy: 12,
            gps_alert_triggered: false,
            scheduled_time: tour.start_time,
            minutes_early_or_late: Math.floor(Math.random() * 10) - 3,
            notes: 'Started tour',
            selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
          })
          checkinCount++
          
          // Pickup checkins (partial)
          const pickupStops = stops?.filter(s => s.stop_type === 'pickup') || []
          const numCompletedPickups = Math.max(1, Math.floor(pickupStops.length * (currentTimeMinutes - startTimeMinutes) / tour.duration_minutes))
          
          for (let i = 0; i < Math.min(numCompletedPickups, pickupStops.length); i++) {
            const stop = pickupStops[i]
            const pickupTime = new Date()
            pickupTime.setHours(hours, minutes - 20 + (i * 10), 0)
            
            await supabase.from('guide_checkins').insert({
              tour_id: tourId,
              brand_id: tour.brand_id,
              guide_id: tour.guide_id,
              pickup_stop_id: stop.id,
              checkin_type: 'pickup',
              checked_in_at: pickupTime.toISOString(),
              latitude: stop.latitude || 20.6,
              longitude: stop.longitude || -87.0,
              location_accuracy: 15,
              gps_alert_triggered: false,
              scheduled_time: stop.scheduled_time,
              minutes_early_or_late: Math.floor(Math.random() * 8) - 2,
              notes: 'Pickup completed',
              selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
            })
            checkinCount++
          }
          
          // Maybe activity checkin (if far enough into tour)
          const progressRatio = (currentTimeMinutes - startTimeMinutes) / tour.duration_minutes
          if (progressRatio > 0.3) {
            const activityStops = stops?.filter(s => s.stop_type === 'activity') || []
            for (const stop of activityStops.slice(0, 1)) {
              await supabase.from('guide_checkins').insert({
                tour_id: tourId,
                brand_id: tour.brand_id,
                guide_id: tour.guide_id,
                pickup_stop_id: stop.id,
                checkin_type: 'activity',
                checked_in_at: new Date().toISOString(),
                latitude: stop.latitude || 20.5,
                longitude: stop.longitude || -87.5,
                location_accuracy: 12,
                gps_alert_triggered: false,
                notes: 'At activity location',
                selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
              })
              checkinCount++
            }
          }
        }
      }
      setDemoProgress(`✅ Created ${checkinCount} checkins (full workflow)`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 8: Create driver checkins
      setDemoProgress('🚗 Creating driver vehicle inspections...')
      let driverCheckinCount = 0
      for (const tourId of createdTourIds) {
        const status = tourStatusMap[tourId]
        if (status === 'in_progress' || status === 'completed') {
          const { data: tour } = await supabase.from('tours').select('driver_id, vehicle_id, start_time').eq('id', tourId).single()
          if (tour?.driver_id && tour?.vehicle_id) {
            const [hours, minutes] = (tour.start_time || '08:00').split(':').map(Number)
            const checkinTime = new Date()
            checkinTime.setHours(hours, minutes - 45, 0)
            
            const mileageBase = 45000 + Math.floor(Math.random() * 5000)
            
            await supabase.from('driver_checkins').insert({
              tour_id: tourId,
              driver_id: tour.driver_id,
              vehicle_id: tour.vehicle_id,
              checked_in_at: checkinTime.toISOString(),
              mileage_start: mileageBase,
              mileage_end: status === 'completed' ? mileageBase + Math.floor(Math.random() * 200) + 100 : null,
              fuel_level_before: ['full', '3/4', '1/2'][Math.floor(Math.random() * 3)],
              fuel_level_after: status === 'completed' ? ['full', '3/4', '1/2'][Math.floor(Math.random() * 3)] : null,
              vehicle_condition: 'good',
              issues: null,
              inspection_data: { tires: 'ok', brakes: 'ok', lights: 'ok', ac: 'ok', cleanliness: 'good' }
            })
            driverCheckinCount++
          }
        }
      }
      setDemoProgress(`✅ Created ${driverCheckinCount} driver inspections`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 9: Create cash confirmations
      setDemoProgress('💵 Creating cash confirmations...')
      let cashCount = 0
      for (const tourId of createdTourIds) {
        const status = tourStatusMap[tourId]
        if (status === 'completed') {
          const { data: tour } = await supabase.from('tours').select('guide_id, brand_id, price, guest_count').eq('id', tourId).single()
          if (tour) {
            const expectedCash = (tour.price || 100) * (tour.guest_count || 2) * 0.2 // 20% cash payments
            const actualCash = expectedCash + (Math.random() * 40 - 20) // ±$20 variance
            const hasDiscrepancy = Math.abs(expectedCash - actualCash) > 15
            
            await supabase.from('cash_confirmations').insert({
              tour_id: tourId,
              brand_id: tour.brand_id,
              guide_id: tour.guide_id,
              cash_expected: Math.round(expectedCash),
              cash_actual: Math.round(actualCash),
              ticket_count_expected: Math.floor(Math.random() * 10) + 5,
              ticket_count_actual: Math.floor(Math.random() * 10) + 5,
              guide_notes: hasDiscrepancy ? 'Minor cash discrepancy noted' : 'All cash accounted',
              discrepancy_notes: hasDiscrepancy ? 'Variance within acceptable range' : null,
              photo_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-cash.jpg',
              status: 'confirmed',
              has_discrepancy: hasDiscrepancy
            })
            cashCount++
          }
        }
      }
      setDemoProgress(`✅ Created ${cashCount} cash confirmations`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 10: Create incidents
      setDemoProgress('⚠️ Creating incidents...')
      const incidentTypes = [
        { type: 'vehicle_issue', severity: 'medium', desc: 'AC not cooling properly. Guests uncomfortable.', status: 'reported' },
        { type: 'delay', severity: 'low', desc: 'Highway 307 traffic. Running 15 min behind.', status: 'resolved' },
        { type: 'medical', severity: 'medium', desc: 'Guest felt dizzy. Rest and water provided.', status: 'resolved' }
      ]

      let incidentCount = 0
      for (const incident of incidentTypes) {
        const tourIdx = Math.floor(Math.random() * Math.min(createdTourIds.length, 5))
        const tourId = createdTourIds[tourIdx]
        const { data: tour } = await supabase.from('tours').select('guide_id, status').eq('id', tourId).single()
        if (tour && (tour.status === 'in_progress' || tour.status === 'completed')) {
          await supabase.from('incidents').insert({
            tour_id: tourId,
            reported_by: tour.guide_id,
            type: incident.type,
            severity: incident.severity,
            description: incident.desc,
            status: incident.status,
            guide_id: tour.guide_id,
            resolution_notes: incident.status === 'resolved' ? 'Issue resolved on site' : null,
            escalation_level: 1
          })
          incidentCount++
        }
      }
      setDemoProgress(`✅ Created ${incidentCount} incidents`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 11: Create expenses
      setDemoProgress('💵 Adding tour expenses...')
      let expenseCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 8))) {
        const { data: tour } = await supabase.from('tours').select('guide_id, status').eq('id', tourId).single()
        if (tour && (tour.status === 'in_progress' || tour.status === 'completed')) {
          const expenseCategories = [
            { category: 'fuel', amount: 45 + Math.floor(Math.random() * 30), desc: 'Fuel' },
            { category: 'parking', amount: 100 + Math.floor(Math.random() * 50), desc: 'Parking fees' },
            { category: 'tolls', amount: 140, desc: 'Highway tolls' }
          ]
          const expense = expenseCategories[Math.floor(Math.random() * expenseCategories.length)]
          
          await supabase.from('tour_expenses').insert({
            tour_id: tourId,
            guide_id: tour.guide_id,
            company_id: companyId,
            category: expense.category,
            description: expense.desc,
            amount: expense.amount,
            currency: 'MXN',
            receipt_url: Math.random() > 0.3 ? 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-receipt.jpg' : null,
            has_receipt: Math.random() > 0.3,
            status: 'pending',
            notes: 'Demo expense'
          })
          expenseCount++
        }
      }
      setDemoProgress(`✅ Added ${expenseCount} expenses`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 12: Create guest feedback
      setDemoProgress('⭐ Generating guest feedback...')
      let feedbackCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 5))) {
        if (tourStatusMap[tourId] === 'completed') {
          const { data: guests } = await supabase.from('guests').select('id, first_name, last_name').eq('tour_id', tourId).limit(1)
          const { data: tour } = await supabase.from('tours').select('guide_id, brand_id').eq('id', tourId).single()
          
          if (guests?.length && tour) {
            const ratings = [5, 5, 5, 4, 4]
            const rating = ratings[Math.floor(Math.random() * ratings.length)]
            
            await supabase.from('guest_feedback').insert({
              tour_id: tourId,
              brand_id: tour.brand_id,
              guide_id: tour.guide_id,
              guest_name: `${guests[0].first_name} ${guests[0].last_name}`,
              rating: rating,
              comments: rating === 5 ? 'Amazing experience!' : 'Great tour, highly recommend',
              review_title: rating === 5 ? 'Excellent!' : 'Very good',
              review_text: rating === 5 ? 'Best tour of our vacation!' : 'Enjoyed the experience',
              review_date: new Date().toISOString(),
              responded: false,
              guest_id: guests[0].id
            })
            feedbackCount++
          }
        }
      }
      setDemoProgress(`✅ Generated ${feedbackCount} reviews`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 13: Create activity feed
      setDemoProgress('📢 Creating activity feed...')
      let activityCount = 0
      for (const tourId of createdTourIds) {
        const status = tourStatusMap[tourId]
        const { data: tour } = await supabase.from('tours').select('name, guide_id').eq('id', tourId).single()
        const { data: guide } = await supabase.from('profiles').select('first_name, last_name, role').eq('id', tour?.guide_id).single()
        
        if (tour && guide) {
          const activityType = status === 'completed' ? 'tour_completed' : status === 'in_progress' ? 'tour_started' : 'tour_created'
          
          await supabase.from('activity_feed').insert({
            company_id: companyId,
            actor_id: tour.guide_id,
            actor_name: `${guide.first_name} ${guide.last_name}`,
            actor_role: guide.role,
            activity_type: activityType,
            target_type: 'tour',
            target_id: tourId,
            target_name: tour.name,
            message: `${guide.first_name} ${guide.last_name} ${activityType.replace('tour_', '')} "${tour.name}"`,
            is_public: true
          })
          activityCount++
        }
      }
      setDemoProgress(`✅ Created ${activityCount} activity entries`)

      setDemoProgress('')
      setDemoMessage({ 
        type: 'success', 
        text: `✅ V3 Complete 24-Hour Demo Generated!\n\n` +
              `📅 ${createdTourIds.length} tours (06:00-23:00)\n` +
              `👥 ${guestCount} guests | 📋 ${manifestCount} reservations\n` +
              `🚌 ${stopCount} stops (pickup/activity/dropoff)\n` +
              `☑️ ${checklistCount} checklist completions\n` +
              `📍 ${checkinCount} checkins (full workflow)\n` +
              `🚗 ${driverCheckinCount} driver inspections\n` +
              `💵 ${cashCount} cash confirmations\n` +
              `⚠️ ${incidentCount} incidents\n` +
              `💰 ${expenseCount} expenses\n` +
              `⭐ ${feedbackCount} reviews\n` +
              `📢 ${activityCount} activities\n` +
              `🚐 ${vehicleIds.length} vehicles`
      })
      setTimeout(() => loadDemoStats(), 2000)

    } catch (err) {
      setDemoMessage({ type: 'error', text: '❌ V3 Error: ' + (err as Error).message })
      console.error('V3 Demo generation error:', err)
    } finally {
      setDemoLoading(false)
    }
  }

  async function handleGenerateDemoDataV2() {
    if (!confirm('📦 V2: Generate PERFECT Live Demo Data?\n\nThis creates a REALISTIC 24-hour live operation:\n- Tours spread across the day with correct statuses\n- Vehicles ASSIGNED to tours (with in_use status)\n- Drivers ASSIGNED to tours\n- Guests with realistic counts\n- Guide & Driver check-ins\n- Incidents, expenses, feedback\n- Cash confirmations, payments, checklist completions\n- Reservation manifest entries\n\n⏰ Times are calculated from CURRENT TIME for realistic live demo.\n\nContinue?')) {
      return
    }

    setDemoLoading(true)
    setDemoMessage(null)
    setDemoLog([])
    setShowLog(true)

    try {
      const today = getLocalDate()
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeMinutes = currentHour * 60 + currentMinute

      setDemoProgress('🔍 Fetching guides, drivers, companies...')
      
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

      // Step 0: Setup drivers
      setDemoProgress('🚗 Setting up test drivers...')
      const testDrivers = [
        { email: 'felipe@lifeoperations.com', type: 'freelance', license: 'LIC-FEL-001', expiry: '2027-12-31', first_name: 'Felipe', last_name: 'Driver' },
        { email: 'driver1@lifeoperations.com', type: 'employee', license: 'LIC-DRV1-001', expiry: '2027-06-30', first_name: 'Carlos', last_name: 'Driver One' },
        { email: 'driver2@lifeoperations.com', type: 'employee', license: 'LIC-DRV2-001', expiry: '2027-08-15', first_name: 'Miguel', last_name: 'Driver Two' },
        { email: 'driver3@lifeoperations.com', type: 'employee', license: 'LIC-DRV3-001', expiry: '2027-09-20', first_name: 'Jose', last_name: 'Driver Three' }
      ]

      let driverSetupCount = 0
      for (const driver of testDrivers) {
        await supabase.from('profiles').update({ role: 'driver', first_name: driver.first_name, last_name: driver.last_name }).eq('email', driver.email)
        const { data: profile } = await supabase.from('profiles').select('id').eq('email', driver.email).single()
        if (profile) {
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
      setDemoProgress(`✅ Set up ${driverSetupCount} drivers`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 1: Create vehicles
      setDemoProgress('🚌 Creating vehicle fleet...')
      const vehicleFleet = [
        { make: 'Toyota', model: 'Hiace 2020', capacity: 13 },
        { make: 'Mercedes', model: 'Sprinter 2021', capacity: 19 },
        { make: 'Ford', model: 'Transit 2019', capacity: 15 },
        { make: 'Chevrolet', model: 'Express 2018', capacity: 12 },
        { make: 'Nissan', model: 'Urvan 2020', capacity: 15 },
        { make: 'Hyundai', model: 'H350 2021', capacity: 16 }
      ]

      const vehicleIds: string[] = []
      for (let i = 0; i < vehicleFleet.length; i++) {
        const v = vehicleFleet[i]
        const { data } = await supabase.from('vehicles').insert({
          company_id: companyId,
          plate_number: `DEM-${randomSuffix}-${i}`,
          make: v.make,
          model: v.model,
          year: parseInt(v.model.split(' ').pop() || '2020'),
          capacity: v.capacity,
          status: 'available'
        }).select('id').single()
        if (data) vehicleIds.push(data.id)
      }
      setDemoProgress(`✅ Created ${vehicleIds.length} vehicles`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 2: Create tours with REALISTIC timing based on current time
      setDemoProgress('📍 Creating tours with live timing...')
      
      // Tour schedule: start times in minutes from midnight
      const tourSchedule = [
        { name: 'Chichen Itza Sunrise', startMin: 360, duration: 720, type: 'shared', price: 129 },  // 06:00
        { name: 'Valladolid Cultural', startMin: 390, duration: 660, type: 'shared', price: 119 },   // 06:30
        { name: 'Coba + Cenote Early', startMin: 420, duration: 600, type: 'shared', price: 109 },   // 07:00
        { name: 'Tulum Ruins Sunrise', startMin: 450, duration: 420, type: 'shared', price: 95 },    // 07:30
        { name: 'Tulum Express', startMin: 480, duration: 360, type: 'private', price: 89 },         // 08:00
        { name: 'Coba Adventure', startMin: 480, duration: 540, type: 'shared', price: 109 },        // 08:00
        { name: 'Akumal Snorkeling', startMin: 510, duration: 480, type: 'shared', price: 95 },      // 08:30
        { name: 'Xcaret Park', startMin: 510, duration: 540, type: 'shared', price: 139 },           // 08:30
        { name: 'Isla Mujeres', startMin: 540, duration: 600, type: 'shared', price: 119 },          // 09:00
        { name: 'Cenote Private', startMin: 540, duration: 420, type: 'private', price: 99 },        // 09:00
        { name: 'Playa del Carmen', startMin: 570, duration: 420, type: 'shared', price: 89 },       // 09:30
        { name: 'Gran Cenote', startMin: 600, duration: 300, type: 'private', price: 79 },           // 10:00
        { name: 'Tulum + Akumal', startMin: 720, duration: 480, type: 'shared', price: 105 },        // 12:00
        { name: 'Coba Afternoon', startMin: 780, duration: 420, type: 'private', price: 99 },        // 13:00
        { name: 'Sunset Tulum', startMin: 900, duration: 360, type: 'private', price: 89 },          // 15:00
        { name: 'Puerto Morelos', startMin: 1020, duration: 300, type: 'shared', price: 95 },        // 17:00
        { name: 'Cancun Night', startMin: 1080, duration: 240, type: 'private', price: 79 },         // 18:00
        { name: 'Playa Evening', startMin: 1140, duration: 300, type: 'shared', price: 69 },         // 19:00
        { name: 'Cenote Night', startMin: 1200, duration: 240, type: 'private', price: 85 },         // 20:00
        { name: 'Tulum Moonlight', startMin: 1260, duration: 180, type: 'private', price: 75 }       // 21:00
      ]

      const createdTourIds: string[] = []
      const tourVehicleMap: Record<string, string> = {} // tour_id -> vehicle_id
      
      for (let i = 0; i < Math.min(guides.length, tourSchedule.length); i++) {
        const guide = guides[i]
        const tour = tourSchedule[i]
        const brandId = brandIds.length > 0 ? brandIds[i % brandIds.length] : null
        const vehicleId = vehicleIds[i % vehicleIds.length]
        
        // Calculate start time string
        const startHour = Math.floor(tour.startMin / 60)
        const startMinute = tour.startMin % 60
        const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
        
        // Determine status based on current time
        const endMin = tour.startMin + tour.duration
        let status = 'scheduled'
        if (endMin < currentTimeMinutes - 30) {
          status = 'completed'  // Ended >30 min ago
        } else if (tour.startMin < currentTimeMinutes) {
          status = 'in_progress'  // Started but not ended
        }
        
        // Calculate guest count based on tour type
        const guestCount = tour.type === 'private' 
          ? Math.floor(Math.random() * 4) + 2  // 2-5 guests
          : Math.floor(Math.random() * 8) + 5  // 5-12 guests
        
        const { data } = await supabase.from('tours').insert({
          company_id: companyId,
          brand_id: brandId,
          guide_id: guide.id,
          driver_id: null,  // Will assign after
          vehicle_id: null,  // Will assign after
          name: tour.name,
          description: `Live demo: ${tour.name}`,
          tour_date: today,
          start_time: startTime,
          duration_minutes: tour.duration,
          capacity: tour.type === 'private' ? 8 : 20,
          pickup_location: 'Hotel pickup included',
          dropoff_location: 'Hotel dropoff',
          price: tour.price,
          status: status,
          guest_count: guestCount,  // REAL guest count
          tour_type: tour.type,
          created_by: null
        }).select('id').single()

        if (data) {
          createdTourIds.push(data.id)
          tourVehicleMap[data.id] = vehicleId
        }
      }

      setDemoProgress(`✅ Created ${createdTourIds.length} tours with live statuses`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 2b: Assign vehicles and drivers to tours
      setDemoProgress('🔗 Assigning vehicles and drivers...')
      const { data: allDrivers } = await supabase.from('driver_profiles').select('profile_id').eq('status', 'active')
      const driverIds = allDrivers?.map(d => d.profile_id) || []
      
      for (let i = 0; i < createdTourIds.length; i++) {
        const tourId = createdTourIds[i]
        const vehicleId = tourVehicleMap[tourId]
        const driverId = driverIds.length > 0 ? driverIds[i % driverIds.length] : null
        
        await supabase.from('tours').update({
          vehicle_id: vehicleId,
          driver_id: driverId
        }).eq('id', tourId)
        
        // Update vehicle status to in_use if tour is in_progress or scheduled
        const { data: tour } = await supabase.from('tours').select('status').eq('id', tourId).single()
        if (tour && (tour.status === 'in_progress' || tour.status === 'scheduled')) {
          await supabase.from('vehicles').update({ status: 'in_use' }).eq('id', vehicleId)
        }
      }
      setDemoProgress(`✅ Assigned vehicles & drivers to ${createdTourIds.length} tours`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 3: Create guests with realistic data
      setDemoProgress('👥 Adding guests to tours...')
      let guestCount = 0
      const guestNames = [
        ['John', 'Smith'], ['Sarah', 'Johnson'], ['Michael', 'Brown'], ['Lisa', 'Garcia'],
        ['David', 'Martinez'], ['Jennifer', 'Lopez'], ['Robert', 'Wilson'], ['Amanda', 'Taylor'],
        ['Christopher', 'Anderson'], ['Jessica', 'Thomas'], ['William', 'Jackson'], ['Elizabeth', 'White'],
        ['Daniel', 'Harris'], ['Michelle', 'Clark'], ['Matthew', 'Lewis'], ['Ashley', 'Robinson'],
        ['Joseph', 'Walker'], ['Nancy', 'Hall'], ['Karen', 'Allen'], ['Betty', 'Young'],
        ['Edward', 'King'], ['Sandra', 'Wright'], ['George', 'Scott'], ['Dorothy', 'Green'],
        ['Kenneth', 'Baker'], ['Carol', 'Adams'], ['Steven', 'Nelson'], ['Ruth', 'Carter']
      ]

      const hotels = [
        'Grand Velas Riviera Maya', 'Beloved Playa Mujeres', 'Secrets Maroma Beach',
        'Finest Playa Mujeres', 'Hyatt Ziva Cap Cana', 'Excellence Playa Mujeres',
        'TRS Coral Hotel', 'Hard Rock Hotel Cancun', 'Iberostar Selection',
        'Live Aqua Beach', 'Grand Sunset Resort', 'Vidanta Riviera Maya'
      ]

      for (const tourId of createdTourIds) {
        const { data: tour } = await supabase.from('tours').select('guest_count').eq('id', tourId).single()
        const numGuests = tour?.guest_count || Math.floor(Math.random() * 4) + 2
        
        for (let g = 0; g < numGuests; g++) {
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
            notes: 'Demo guest',
            checked_in: false,
            no_show: false
          })
          guestCount++
        }
      }
      setDemoProgress(`✅ Added ${guestCount} guests`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 4: Create pickup stops
      setDemoProgress('🚌 Creating pickup stops...')
      let stopCount = 0
      const pickupLocations = [
        { name: 'Grand Sunset Resort', lat: 20.6897, lng: -87.0739 },
        { name: 'Vidanta Riviera Maya', lat: 20.6234, lng: -87.0812 },
        { name: 'Playa del Carmen', lat: 20.6296, lng: -87.0739 },
        { name: 'Maroma Beach', lat: 20.7234, lng: -86.9812 },
        { name: 'Cancun Airport T3', lat: 21.0365, lng: -86.8770 },
        { name: 'Hotel Zone Km 9', lat: 21.1333, lng: -86.7667 }
      ]

      for (const tourId of createdTourIds) {
        const { data: tour } = await supabase.from('tours').select('tour_type, start_time').eq('id', tourId).single()
        if (tour?.tour_type === 'shared') {
          const stopsCount = Math.floor(Math.random() * 3) + 2
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
              scheduled_time: tour.start_time || '08:00',
              guest_count: Math.floor(Math.random() * 4) + 1,
              notes: 'Demo pickup'
            })
            stopCount++
          }
        }
      }
      setDemoProgress(`✅ Created ${stopCount} pickup stops`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 5: Create guide check-ins (for tours that have started)
      setDemoProgress('📍 Creating guide check-ins...')
      let checkinCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 8))) {
        const { data: tour } = await supabase.from('tours').select('guide_id, brand_id, start_time, status').eq('id', tourId).single()
        if (tour && (tour.status === 'in_progress' || tour.status === 'completed')) {
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
            notes: minutesEarly >= 0 ? 'On time' : 'Slight delay',
            selfie_url: 'https://cloudinary.com/dorhbpsxy/tour-ops/demo-selfie.jpg'
          })
          checkinCount++
        }
      }
      setDemoProgress(`✅ Created ${checkinCount} guide check-ins`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 6: Create driver check-ins (vehicle inspections)
      setDemoProgress('🚗 Creating driver inspections...')
      let driverCheckinCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 8))) {
        const { data: tour } = await supabase.from('tours').select('driver_id, vehicle_id, start_time, status').eq('id', tourId).single()
        if (tour?.driver_id && (tour.status === 'in_progress' || tour.status === 'completed')) {
          const startTime = tour.start_time || '08:00'
          const [hours, minutes] = startTime.split(':').map(Number)
          const checkinTime = new Date()
          checkinTime.setHours(hours, minutes - 45, 0)
          
          const mileageBase = 45000 + Math.floor(Math.random() * 5000)
          
          await supabase.from('driver_checkins').insert({
            tour_id: tourId,
            driver_id: tour.driver_id,
            vehicle_id: tour.vehicle_id,
            checked_in_at: checkinTime.toISOString(),
            mileage_start: mileageBase,
            mileage_end: null,
            fuel_level_before: ['full', '3/4', '1/2'][Math.floor(Math.random() * 3)],
            fuel_level_after: null,
            vehicle_condition: 'good',
            issues: null,
            inspection_data: {
              tires: 'ok', brakes: 'ok', lights: 'ok', ac: 'ok', cleanliness: 'good'
            }
          })
          driverCheckinCount++
        }
      }
      setDemoProgress(`✅ Created ${driverCheckinCount} driver inspections`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 7: Create incidents (2-3 active incidents)
      setDemoProgress('⚠️ Creating incidents...')
      const incidentTypes = [
        { type: 'vehicle_issue', severity: 'medium', desc: 'AC blowing warm air. Guests uncomfortable.', status: 'reported' },
        { type: 'delay', severity: 'low', desc: 'Traffic on highway 307. Running 20 min behind.', status: 'reported' },
        { type: 'medical', severity: 'medium', desc: 'Guest felt dizzy. Gave water and rest.', status: 'resolved' }
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
              status: incident.status,
              guide_id: tour.guide_id,
              resolution_notes: incident.status === 'resolved' ? 'Issue resolved on site' : null,
              escalation_level: 1
            })
            incidentCount++
          }
        }
      }
      setDemoProgress(`✅ Created ${incidentCount} incidents`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 8: Create expenses
      setDemoProgress('💵 Adding tour expenses...')
      const expenseCategories = [
        { category: 'fuel', amount: 45, desc: 'Fuel' },
        { category: 'parking', amount: 150, desc: 'Parking' },
        { category: 'meals', amount: 180, desc: 'Guide meal' },
        { category: 'tolls', amount: 140, desc: 'Highway tolls' }
      ]

      let expenseCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 6))) {
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
            status: 'pending',
            notes: 'Demo expense'
          })
          expenseCount++
        }
      }
      setDemoProgress(`✅ Added ${expenseCount} expenses`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 9: Create payments (verified working)
      setDemoProgress('💳 Creating payments...')
      let paymentCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 5))) {
        const { data: tour } = await supabase.from('tours').select('guide_id, price, guest_count').eq('id', tourId).single()
        if (tour) {
          const amount = (tour.price || 100) * (tour.guest_count || 1)
          await supabase.from('payments').insert({
            tour_id: tourId,
            company_id: companyId,
            amount: amount,
            currency: 'MXN',
            payment_type: 'tour_payment',
            payment_method: 'cash',
            status: 'completed',
            notes: 'Demo payment'
          })
          paymentCount++
        }
      }
      setDemoProgress(`✅ Created ${paymentCount} payments`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 13: Create guest feedback
      setDemoProgress('⭐ Generating guest feedback...')
      let feedbackCount = 0
      const feedbackRatings = [
        { rating: 5, title: 'Amazing!', text: 'Best tour ever!' },
        { rating: 5, title: 'Excellent', text: 'Highly recommend!' },
        { rating: 4, title: 'Great', text: 'Very good experience.' }
      ]
      
      for (let i = 0; i < Math.min(createdTourIds.length, 4); i++) {
        const tourId = createdTourIds[i]
        const { data: guests } = await supabase.from('guests').select('id, first_name, last_name').eq('tour_id', tourId).limit(1)
        const { data: tour } = await supabase.from('tours').select('guide_id, brand_id').eq('id', tourId).single()
        
        if (guests?.length && tour) {
          const feedback = feedbackRatings[i % feedbackRatings.length]
          await supabase.from('guest_feedback').insert({
            tour_id: tourId,
            brand_id: tour.brand_id,
            guide_id: tour.guide_id,
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
        }
      }
      setDemoProgress(`✅ Generated ${feedbackCount} reviews`)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 14: Create activity feed
      setDemoProgress('📢 Creating activity feed...')
      let activityCount = 0
      for (const tourId of createdTourIds.slice(0, Math.min(createdTourIds.length, 8))) {
        const { data: tour } = await supabase.from('tours').select('name, guide_id, status').eq('id', tourId).single()
        const { data: guide } = await supabase.from('profiles').select('first_name, last_name, role').eq('id', tour?.guide_id).single()
        
        if (tour && guide) {
          const activityType = tour.status === 'completed' ? 'tour_completed' : 'tour_started'
          await supabase.from('activity_feed').insert({
            company_id: companyId,
            actor_id: tour.guide_id,
            actor_name: `${guide.first_name} ${guide.last_name}`,
            actor_role: guide.role,
            activity_type: activityType,
            target_type: 'tour',
            target_id: tourId,
            target_name: tour.name,
            message: `${guide.first_name} ${guide.last_name} ${activityType === 'tour_completed' ? 'completed' : 'started'} "${tour.name}"`,
            is_public: true
          })
          activityCount++
        }
      }
      setDemoProgress(`✅ Created ${activityCount} activity entries`)
      await new Promise(resolve => setTimeout(resolve, 300))

      setDemoProgress('')
      setDemoMessage({ 
        type: 'success', 
        text: `✅ V2 Live Demo generated!\n\n${createdTourIds.length} tours, ${guestCount} guests, ${stopCount} pickups, ${checkinCount} check-ins, ${driverCheckinCount} driver inspections, ${incidentCount} incidents, ${expenseCount} expenses, ${paymentCount} payments, ${feedbackCount} reviews, ${activityCount} activities, ${vehicleIds.length} vehicles`
      })
      setTimeout(() => loadDemoStats(), 2000)

    } catch (err) {
      setDemoMessage({ type: 'error', text: '❌ V2 Error: ' + (err as Error).message })
      console.error('V2 Demo generation error:', err)
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

            {/* Generate V2 Demo Data */}
            <div className="bg-white rounded-xl border border-purple-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🚀</div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">V2: Perfect Live Demo</h3>
                  <p className="text-sm text-gray-500">Complete 24hr live operation</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Creates PERFECT live demo: vehicles assigned, drivers assigned, realistic guest counts, cash confirmations, payments, checklists, manifest entries. Times match current time.
              </p>
              <button
                onClick={handleGenerateDemoDataV2}
                disabled={demoLoading}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {demoLoading ? 'Generating...' : '🚀 Generate V2 Live Demo'}
              </button>
            </div>

            {/* Generate V3 Demo Data */}
            <div className="bg-white rounded-xl border border-indigo-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🌟</div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">V3: Complete 24-Hour Demo</h3>
                  <p className="text-sm text-gray-500">Full workflow + night tours</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Complete demo: tours 06:00-23:00 (night tours), full checkin workflow (pre-departure → pickup → activity → dropoff → office return), cash confirmations, checklist completions, reservation manifest, realistic timestamps.
              </p>
              <button
                onClick={handleGenerateDemoDataV3}
                disabled={demoLoading}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {demoLoading ? 'Generating...' : '🌟 Generate V3 Complete Demo'}
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
