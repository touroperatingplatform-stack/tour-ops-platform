'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Tour } from '../schedule/page'

interface TourDetailsModalProps {
  tour: Tour
  onClose: () => void
  onSave: () => void
}

export default function TourDetailsModal({ tour, onClose, onSave }: TourDetailsModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  async function handleContact(type: 'guide' | 'driver') {
    const phone = type === 'guide' ? tour.guide_phone : tour.driver_phone
    if (phone) {
      window.open(`tel:${phone}`, '_blank')
    }
  }

  async function handleWhatsApp(type: 'guide' | 'driver') {
    const phone = type === 'guide' ? tour.guide_phone : tour.driver_phone
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      window.open(`https://wa.me/52${cleanPhone}`, '_blank')
    }
  }

  async function handleStatusChange(newStatus: string) {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('tours')
        .update({ status: newStatus })
        .eq('id', tour.id)

      if (error) throw error
      onSave()
    } catch (error: any) {
      alert('Error updating status: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{tour.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">{t('schedule.date')}</p>
              <p className="font-medium">{new Date(tour.tour_date).toLocaleDateString('es-MX')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('schedule.time')}</p>
              <p className="font-mono font-medium">{tour.start_time}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('common.status')}</p>
              <select
                value={tour.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={loading}
                className="mt-1 text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="scheduled">{t('tour.scheduled') || 'Programado'}</option>
                <option value="in_progress">{t('tour.in_progress') || 'En Curso'}</option>
                <option value="completed">{t('tour.completed') || 'Completado'}</option>
                <option value="delayed">{t('tour.delayed') || 'Retrasado'}</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('schedule.guests')}</p>
              <p className="font-medium">{tour.guest_count || 0} / {tour.capacity}</p>
            </div>
          </div>

          {/* Guide Info */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">{t('schedule.guide')}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{tour.guide_name}</p>
                {tour.guide_checked_in && <p className="text-xs text-green-600">✓ Check-in completado</p>}
              </div>
              <div className="flex gap-2">
                {tour.guide_phone && (
                  <>
                    <button
                      onClick={() => handleContact('guide')}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      📞 Llamar
                    </button>
                    <button
                      onClick={() => handleWhatsApp('guide')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      💬 WhatsApp
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">{t('schedule.driver')}</p>
            {tour.driver_name ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{tour.driver_name}</p>
                </div>
                {tour.driver_phone && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleContact('driver')}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      📞 Llamar
                    </button>
                    <button
                      onClick={() => handleWhatsApp('driver')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No asignado</p>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">{t('schedule.vehicle')}</p>
            {tour.vehicle_plate ? (
              <div>
                <p className="font-mono font-medium">{tour.vehicle_plate}</p>
                <p className="text-xs text-gray-500">Capacidad: {tour.capacity} pasajeros</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No asignado</p>
            )}
          </div>

          {/* Locations */}
          {(tour.pickup_location || tour.dropoff_location) && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Ubicaciones</p>
              {tour.pickup_location && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500">Pickup:</p>
                  <p className="text-sm">{tour.pickup_location}</p>
                </div>
              )}
              {tour.dropoff_location && (
                <div>
                  <p className="text-xs text-gray-500">Dropoff:</p>
                  <p className="text-sm">{tour.dropoff_location}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {tour.notes && (
            <div className="border rounded-lg p-3 bg-yellow-50">
              <p className="text-xs text-gray-500 mb-2">Notas</p>
              <p className="text-sm">{tour.notes}</p>
            </div>
          )}

          {/* Payment Status */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Estado de Pago</p>
            <p className={`text-sm font-medium ${tour.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
              {tour.payment_status === 'paid' ? '✓ Pagado' : '⏳ Pendiente'}
            </p>
          </div>

          {/* Alerts */}
          {!tour.driver_id && (
            <div className="border border-red-200 rounded-lg p-3 bg-red-50">
              <p className="text-sm text-red-700 font-medium">⚠️ {t('schedule.needsDriver') || 'Falta asignar chofer'}</p>
            </div>
          )}
          {!tour.vehicle_id && (
            <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
              <p className="text-sm text-orange-700 font-medium">⚠️ {t('schedule.needsVehicle') || 'Falta asignar vehículo'}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {t('common.close') || 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
