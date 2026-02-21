import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, FolderTree, Building2, TrendingUp, LogOut, Users, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import type { Tenant } from '@/types'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Productos', href: '/products', icon: Package },
    { name: 'Categorías', href: '/categories', icon: FolderTree },
    { name: 'Proveedores', href: '/suppliers', icon: Building2 },
    { name: 'Inventario', href: '/inventory', icon: TrendingUp },
    { name: 'Usuarios', href: '/users', icon: Users },
    { name: 'Configuración', href: '/settings', icon: Settings },
]

export default function Sidebar() {
    const logout = useAuthStore((state) => state.logout)
    const { data: tenant } = useQuery<Tenant>({
        queryKey: ['tenant-me'],
        queryFn: async () => {
            const response = await api.get('/api/v1/tenant/me')
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutos de cache
    })

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                    {tenant?.logo_url ? (
                        <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-auto object-contain" />
                    ) : (
                        <h1 className="text-xl font-bold text-primary-600">Inventory SaaS</h1>
                    )}
                </div>
                <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                            <ul role="list" className="-mx-2 space-y-1">
                                {navigation.map((item) => (
                                    <li key={item.name}>
                                        <NavLink
                                            to={item.href}
                                            end={item.href === '/'}
                                            className={({ isActive }) =>
                                                clsx(
                                                    isActive
                                                        ? 'bg-primary-50 text-primary-600'
                                                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )
                                            }
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <item.icon
                                                        className={clsx(
                                                            isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                                                            'h-6 w-6 shrink-0'
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                </>
                                            )}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </li>
                        <li className="mt-auto">
                            <button
                                onClick={logout}
                                className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-red-600"
                            >
                                <LogOut className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-red-600" aria-hidden="true" />
                                Cerrar Sesión
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    )
}
