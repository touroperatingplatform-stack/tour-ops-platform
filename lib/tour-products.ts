// Tour Products Utilities
// Helper functions for working with tour_products (renamed from tour_templates)

import { supabase } from '@/lib/supabase/client'

export interface TourProduct {
  id: string
  company_id: string
  service_code: string | null
  name: string
  description: string | null
  duration_minutes: number
  capacity: number
  activity_ids: string[]
  pre_tour_checklist_id: string | null
  requires_guide: boolean
  requires_driver: boolean
  max_guests: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Normalize service code to uppercase, no spaces
 * Example: "TCA IN" → "TCAIN"
 */
export function normalizeServiceCode(code: string): string {
  return code.toUpperCase().replace(/\s/g, '')
}

/**
 * Get all tour products for a company
 */
export async function getTourProducts(companyId: string): Promise<TourProduct[]> {
  const { data, error } = await supabase
    .from('tour_products')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching tour products:', error)
    return []
  }

  return data || []
}

/**
 * Get a single tour product by ID
 */
export async function getTourProduct(productId: string): Promise<TourProduct | null> {
  const { data, error } = await supabase
    .from('tour_products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Error fetching tour product:', error)
    return null
  }

  return data
}

/**
 * Get tour product by service code
 */
export async function getTourProductByServiceCode(
  companyId: string,
  serviceCode: string
): Promise<TourProduct | null> {
  const normalizedCode = normalizeServiceCode(serviceCode)
  
  const { data, error } = await supabase
    .from('tour_products')
    .select('*')
    .eq('company_id', companyId)
    .eq('service_code', normalizedCode)
    .maybeSingle()

  if (error) {
    console.error('Error fetching tour product by service code:', error)
    return null
  }

  return data
}

/**
 * Create a new tour product
 */
export async function createTourProduct(
  product: Omit<TourProduct, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; product?: TourProduct; error?: string }> {
  const normalizedCode = product.service_code 
    ? normalizeServiceCode(product.service_code)
    : null

  const { data, error } = await supabase
    .from('tour_products')
    .insert({
      ...product,
      service_code: normalizedCode,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating tour product:', error)
    return { success: false, error: error.message }
  }

  return { success: true, product: data }
}

/**
 * Update a tour product
 */
export async function updateTourProduct(
  productId: string,
  updates: Partial<Omit<TourProduct, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  // Normalize service_code if provided
  if (updates.service_code) {
    updates.service_code = normalizeServiceCode(updates.service_code)
  }

  const { error } = await supabase
    .from('tour_products')
    .update(updates)
    .eq('id', productId)

  if (error) {
    console.error('Error updating tour product:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Deactivate a tour product (soft delete)
 */
export async function deactivateTourProduct(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('tour_products')
    .update({ is_active: false })
    .eq('id', productId)

  if (error) {
    console.error('Error deactivating tour product:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get activities for a tour product
 */
export async function getProductActivities(product: TourProduct): Promise<any[]> {
  if (!product.activity_ids || product.activity_ids.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .in('id', product.activity_ids)

  if (error) {
    console.error('Error fetching product activities:', error)
    return []
  }

  return data || []
}

/**
 * Check if service code already exists for company
 */
export async function serviceCodeExists(
  companyId: string,
  serviceCode: string
): Promise<boolean> {
  const normalizedCode = normalizeServiceCode(serviceCode)
  
  const { data, error } = await supabase
    .from('tour_products')
    .select('id')
    .eq('company_id', companyId)
    .eq('service_code', normalizedCode)
    .maybeSingle()

  if (error) {
    console.error('Error checking service code:', error)
    return false
  }

  return !!data
}

/**
 * Get or create product from service code (for import)
 * Uses database function for atomicity
 */
export async function getOrCreateTourProduct(
  companyId: string,
  serviceCode: string,
  name?: string,
  activities?: string[]
): Promise<{ success: boolean; productId?: string; error?: string }> {
  const { data, error } = await supabase.rpc('get_or_create_tour_product', {
    p_company_id: companyId,
    p_service_code: serviceCode,
    p_name: name || serviceCode,
    p_activities: activities || []
  })

  if (error) {
    console.error('Error in get_or_create_tour_product:', error)
    return { success: false, error: error.message }
  }

  return { success: true, productId: data }
}
