'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/auth'

export default function OperationsPage() {
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const p = await getProfile()
      if (!p) { router.push('/login'); return }
      const allowed = ['operations', 'supervisor', 'manager', 'company_admin', 'super_admin']
      if (!allowed.includes(p.role)) { router.push('/login'); return }
    }
    load()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400 text-sm">Operations dashboard coming soon</p>
    </div>
  )
}