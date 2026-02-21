import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import clsx from 'clsx'

export default function Layout() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const location = useLocation()

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
