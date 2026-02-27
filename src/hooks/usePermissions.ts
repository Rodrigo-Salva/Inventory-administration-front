import { useAuthStore } from '../store/authStore'

export function usePermissions() {
    const { user } = useAuthStore()

    const hasPermission = (codename: string) => {
        if (!user || user.is_active === false) return false
        
        // Super admins have all permissions
        if (user.role === 'SUPERADMIN') return true

        // Fallback for Tenant Owners (is_admin but no custom role assigned)
        if (user.is_admin && !user.role_obj) return true

        // Check if user has the specific permission in their role
        return user.role_obj?.permissions?.some((p: any) => p.codename === codename) || false
    }

    return { hasPermission }
}
