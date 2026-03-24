'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface PhotoUploaderProps {
  onUpload: (url: string, provider: string) => void
  existingUrl?: string
  label?: string
}

export default function PhotoUploader({ onUpload, existingUrl, label = 'Upload Photo' }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(existingUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploading(true)

    try {
      // Get user's company
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        alert('Not logged in')
        setUploading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single()

      if (!profile?.company_id) {
        alert('Company not found')
        setUploading(false)
        return
      }

      // Upload to Google Drive
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', profile.company_id)

      const response = await fetch('/api/upload/drive', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setPreview(result.url)
      onUpload(result.url, 'google_drive')
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={() => {
              setPreview('')
              onUpload('', '')
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          {uploading ? (
            <div className="text-gray-500">
              <p>📤 Uploading...</p>
            </div>
          ) : (
            <div className="text-gray-500">
              <p className="text-4xl mb-2">📷</p>
              <p className="text-sm">Click to take photo or upload</p>
              <p className="text-xs text-gray-400 mt-1">Stored in Google Drive</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
}
