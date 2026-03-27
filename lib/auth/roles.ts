// Role hierarchy - higher roles include lower role permissions
export const ROLE_HIERARCHY = {
  super_admin: 100,
  company_admin: 90,
  manager: 80,
  supervisor: 70,
  operations: 60,
  guide: 50,
} as const

export type Role = keyof typeof ROLE_HIERARCHY

export const ROLES = Object.keys(ROLE_HIERARCHY) as Role[]

// Check if user has required role or higher
export function hasRole(userRole: Role | null | undefined, requiredRole: Role): boolean {
  if (!userRole) return false
  
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
  
  return userLevel >= requiredLevel
}

// Get all roles that have access to a page
export function getAuthorizedRoles(requiredRole: Role): Role[] {
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
  return ROLES.filter(role => ROLE_HIERARCHY[role] >= requiredLevel)
}

// Page role requirements - central configuration
export const PAGE_ROLES = {
  '/super-admin': 'super_admin' as Role,
  '/operations': 'operations' as Role,
  '/supervisor': 'supervisor' as Role,
  '/guide': 'guide' as Role,
  '/reports': 'manager' as Role,
  '/vehicles': 'operations' as Role,
  '/schedule': 'operations' as Role,
} as const

export type PagePath = keyof typeof PAGE_ROLES
