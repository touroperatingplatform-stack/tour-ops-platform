'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function TourTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const { data } = await supabase
      .from('tour_templates')
      .select(`
        *,
        brand:brands(name),
        default_guide:profiles(first_name, last_name),
        default_vehicle:vehicles(plate_number)
      `)
      .order('name')

    setTemplates(data || [])
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase
      .from('tour_templates')
      .update({ is_active: !current })
      .eq('id', id)
    loadTemplates()
  }

  if (loading) return <div className="p-4 text-center">Loading...</div>

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Tour Templates</h1>
        <Link
          href="/admin/templates/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          + New Template
        </Link>
      </div>

      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No templates yet</p>
            <p className="text-sm">Create templates for recurring tours</p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-lg p-4 border ${
                template.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {!template.is_active && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                    <span>⏱️ {template.duration_minutes} min</span>
                    <span>👥 {template.capacity} guests</span>
                    {template.price && <span>💰 ${template.price}</span>}
                    {template.brand && <span>🏷️ {template.brand.name}</span>}
                  </div>
                  
                  {template.default_guide && (
                    <p className="text-sm text-gray-500">
                      👤 Default Guide: {template.default_guide.first_name} {template.default_guide.last_name}
                    </p>
                  )}
                  
                  {template.default_vehicle && (
                    <p className="text-sm text-gray-500">
                      🚐 Default Vehicle: {template.default_vehicle.plate_number}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/admin/templates/${template.id}`}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => toggleActive(template.id, template.is_active)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      template.is_active
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {template.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link
                    href={`/admin/templates/${template.id}/create-tour`}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg"
                  >
                    Create Tour
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
