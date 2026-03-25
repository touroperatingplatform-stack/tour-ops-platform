# Google Maps API Setup

## Free Tier
- **$200 monthly credit** = ~28,000 map loads
- Most small-medium operations will never hit this

## Get API Key
1. Go to: https://console.cloud.google.com/google/maps-apis
2. Create project
3. Enable **Maps JavaScript API**
4. Create API key
5. Restrict key to your domain (recommended)

## Add to Project
Create `.env.local`:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

## Install Package
```bash
npm install @react-google-maps/api
```

## Update LiveMap
Replace the placeholder with real Google Maps component.

**Current**: Static placeholder
**Future**: Real interactive map with guide pins
