import { supabase } from './supabase/client'

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile() {
  const session = await getSession()
  if (!session) return null
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  if (error) return null
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export function getRoleRedirect(role: string): string {
  switch (role) {
    case 'super_admin': return '/admin'
    case 'company_admin': return '/admin'
    case 'supervisor': return '/supervisor'
    case 'manager': return '/supervisor'
    case 'operations': return '/operations'
    case 'guide': return '/guide'
    default: return '/login'
  }
}