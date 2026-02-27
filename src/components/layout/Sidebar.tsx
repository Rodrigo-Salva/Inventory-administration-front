import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, FolderTree, Building2, TrendingUp, LogOut, Users, Shield, Settings, ShoppingCart, History } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import type { Tenant } from '@/types'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard:view' },
    { name: 'Productos', href: '/products', icon: Package, permission: 'products:view' },
    { name: 'Categorías', href: '/categories', icon: FolderTree, permission: 'categories:view' },
    { name: 'Proveedores', href: '/suppliers', icon: Building2, permission: 'suppliers:view' },
    { name: 'Inventario', href: '/inventory', icon: TrendingUp, permission: 'inventory:view' },
    { name: 'Ventas (POS)', href: '/sales', icon: ShoppingCart, permission: 'sales:create' },
    { name: 'Historial Ventas', href: '/sales-history', icon: History, permission: 'sales:view' },
    { name: 'Usuarios', href: '/users', icon: Users, permission: 'users:view' },
    { name: 'Roles y Permisos', href: '/roles', icon: Shield, permission: 'roles:manage' },
    { name: 'Configuración', href: '/settings', icon: Settings, permission: 'settings:manage' },
]

export interface SidebarProps {
    isCollapsed: boolean
    isMobileOpen?: boolean
}

export default function Sidebar({ isCollapsed, isMobileOpen }: SidebarProps) {
    const logout = useAuthStore((state) => state.logout)
    
    const { data: tenant } = useQuery<Tenant>({
        queryKey: ['tenant-me'],
        queryFn: async () => {
            const response = await api.get('/api/v1/tenant/me')
            return response.data
        },
        staleTime: 1000 * 60 * 5,
    })

    const { hasPermission } = usePermissions();

    const filteredNavigation = navigation.filter(item => hasPermission(item.permission));

    return (
        <div className={clsx(
            "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out bg-slate-900 border-r border-white/5",
            // Desktop behavior
            isCollapsed ? "lg:w-20" : "lg:w-64",
            // Mobile behavior
            isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0",
            !isMobileOpen && !isCollapsed && "lg:w-64",
            !isMobileOpen && isCollapsed && "lg:w-20"
        )}>
            <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    {tenant?.logo_url ? (
                        <img src={tenant.logo_url} alt={tenant.name} className={clsx("h-8 object-contain transition-all", isCollapsed ? "lg:w-8" : "w-auto")} />
                    ) : (
                        <>
                            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-primary-600/20">I</div>
                            {(!isCollapsed || isMobileOpen) && <h1 className="text-lg font-bold text-white tracking-tight">Inventory PRO</h1>}
                        </>
                    )}
                </div>
            </div>

            <nav className="flex flex-1 flex-col p-4">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="space-y-1">
                            {filteredNavigation.map((item) => (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.href}
                                        end={item.href === '/'}
                                        className={({ isActive }) =>
                                            clsx(
                                                isActive
                                                    ? 'bg-primary-600/10 text-primary-400 border-l-4 border-primary-600 rounded-none'
                                                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                                                'group flex items-center gap-x-3 p-3 text-sm leading-6 font-semibold transition-all overflow-hidden'
                                            )
                                        }
                                        title={isCollapsed ? item.name : ''}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <button
                            onClick={logout}
                            className="flex items-center gap-x-3 p-3 text-sm font-semibold leading-6 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg w-full transition-all overflow-hidden"
                            title={isCollapsed ? 'Cerrar Sesión' : ''}
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            {!isCollapsed && <span>Cerrar Sesión</span>}
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
