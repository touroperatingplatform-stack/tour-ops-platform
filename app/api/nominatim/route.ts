import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  
  if (!q) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })
  }
  
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}+Mexico&format=json&limit=5&addressdetails=1`
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TourOpsPlatform/1.0'
      }
    })
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Nominatim request failed' }, { status: res.status })
    }
    
    const data = await res.json()
    
    const results = data.map((item: any) => ({
      name: item.display_name,
      shortName: item.address?.amenity || item.address?.building || item.address?.tourism || item.address?.hotel || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      address: [
        item.address?.road,
        item.address?.neighbourhood,
        item.address?.suburb,
        item.address?.city || item.address?.town || item.address?.village,
        item.address?.state
      ].filter(Boolean).join(', ')
    }))
    
    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
