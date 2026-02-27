import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import clsx from 'clsx'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/client'

export default function Layout() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { user, setUser, logout } = useAuthStore()
    const location = useLocation()

    // Fetch profile if missing or on mount to ensure permissions are fresh
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/v1/users/me')
                setUser(response.data)
            } catch (error) {
                console.error('Error fetching profile:', error)
                // If it's a 401, logout
                if ((error as any).response?.status === 401) {
                    logout()
                }
            }
        }
        
        // Refresh profile on mount or if user data is incomplete
        if (!user?.role_obj) {
            fetchProfile()
        }
    }, [user?.role_obj, setUser, logout])

    // Cerrar menú móvil cuando cambia la ruta
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [location.pathname])

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Backdrop para móvil */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileMenuOpen} />
            
            <div className={clsx(
                "flex-1 flex flex-col transition-all duration-400 ease-in-out min-w-0",
                isCollapsed ? "lg:pl-20" : "lg:pl-64"
            )}>
                <Header onToggleSidebar={() => {
                    if (window.innerWidth < 1024) {
                        setIsMobileMenuOpen(!isMobileMenuOpen)
                    } else {
                        setIsCollapsed(!isCollapsed)
                    }
                }} />
                <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
