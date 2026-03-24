import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyId = formData.get('companyId') as string

    if (!file || !companyId) {
      return NextResponse.json({ error: 'Missing file or companyId' }, { status: 400 })
    }

    // Get Google Drive config from database
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    const { data: config } = await supabaseAdmin
      .from('company_configs')
      .select('config_value')
      .eq('company_id', companyId)
      .eq('config_key', 'google_drive')
      .single()

    if (!config) {
      return NextResponse.json({ 
        error: 'Google Drive not configured for this company. Please configure in Admin Settings.' 
      }, { status: 400 })
    }

    const driveConfig = config.config_value
    const { client_id, client_secret, refresh_token, folder_id } = driveConfig

    // Set up Google OAuth
    const oauth2Client = new OAuth2Client(client_id, client_secret, 'urn:ietf:wg:oauth:2.0:oob')
    oauth2Client.setCredentials({ refresh_token })

    // Upload to Google Drive
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    
    const buffer = Buffer.from(await file.arrayBuffer())
    
    const response = await drive.files.create({
      requestBody: {
        name: `${Date.now()}-${file.name}`,
        parents: [folder_id],
      },
      media: {
        mimeType: file.type,
        body: buffer,
      },
    })

    // Make file publicly viewable (for displaying in app)
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Get webContentLink for direct access
    const fileInfo = await drive.files.get({
      fileId: response.data.id!,
      fields: 'webContentLink, webViewLink',
    })

    return NextResponse.json({
      success: true,
      fileId: response.data.id,
      url: fileInfo.data.webContentLink,
      viewUrl: fileInfo.data.webViewLink,
    })
  } catch (error: any) {
    console.error('Google Drive upload error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to upload to Google Drive' 
    }, { status: 500 })
  }
}
